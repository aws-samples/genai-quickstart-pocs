import {
    AthenaClient,
    StartQueryExecutionInput,
    StartQueryExecutionCommand,
    GetQueryExecutionCommand,
    GetQueryExecutionInput,
    GetQueryResultsCommand,
    GetQueryResultsOutput,
    ResultSet
} from "@aws-sdk/client-athena"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const athenaClient = new AthenaClient();

export async function processWithConcurrency<T, R>(
    props: {
        items: T[],
        concurrency: number,
        fn: (item: T) => Promise<R>
    }
  ): Promise<R[]> {
    const {items, concurrency, fn } = props
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      chunks.push(items.slice(i, i + concurrency));
    }
  
    const results: R[] = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(fn));
      results.push(...chunkResults);
    }
  
    return results;
  }

export async function startQueryExecution(props: { query: string, workgroup: string }): Promise<string> {
    const params: StartQueryExecutionInput = {
        QueryString: props.query,
        WorkGroup: props.workgroup,
    };

    const result = await athenaClient.send(new StartQueryExecutionCommand(params))

    // const result = await athenaClient.startQueryExecution(params).promise();
    return result.QueryExecutionId!;
}

export async function waitForQueryToComplete(queryExecutionId: string, workgroup: string): Promise<void> {
    while (true) {

        const result = await athenaClient.send(new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId }));
        const state = result.QueryExecution!.Status!.State;
        if (state === 'SUCCEEDED') return;
        if (state === 'FAILED' || state === 'CANCELLED') {
            throw new Error(`Query execution failed: ${JSON.stringify(result.QueryExecution!.Status)}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export async function getQueryResults(queryExecutionId: string): Promise<GetQueryResultsOutput> {
    return athenaClient.send(new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
    }));
}

export async function executeAthenaQueryGetResult(props: { query: string, workgroup: string }): Promise<GetQueryResultsOutput> {
    console.log('Executing Athena Query:\n', props.query);
    const queryExecutionId = await startQueryExecution({
        query: props.query,
        workgroup: props.workgroup,
    });
    await waitForQueryToComplete(queryExecutionId, props.workgroup);
    return getQueryResults(queryExecutionId);
}

export function transformColumnOfAthenaQueryToList(props: {queryResult: GetQueryResultsOutput, columnIndex?: number | undefined}): (string | undefined)[] {

    const columnIndex = props.columnIndex || 0

    const result = props.queryResult.ResultSet?.Rows?.slice(1).map((row) => {
        if (row.Data && row.Data[columnIndex] && row.Data[columnIndex].VarCharValue !== undefined) return row.Data[columnIndex].VarCharValue
    })

    if (!result) throw new Error(`Column ${columnIndex} not found in query result: ${props.queryResult}`)

    return result
}


export async function uploadStringToS3(props: {
    bucket?: string,
    key: string,
    content: string,
    contentType?: string
}
): Promise<void> {
    const s3Client = new S3Client();

    try {
        const command = new PutObjectCommand({
            Bucket: props.bucket || process.env.S3_BUCKET_NAME,
            Key: props.key,
            Body: props.content,
            ContentType: props.contentType || "text/plain",
        });

        await s3Client.send(command);
        console.log(`Successfully uploaded string to ${process.env.S3_BUCKET_NAME}/${props.key}`);
    } catch (error) {
        console.error("Error uploading string to S3:", error);
        throw error;
    }
}

export function transformResultSet(resultSet: ResultSet) {
    if (!resultSet.Rows || !resultSet.ResultSetMetadata?.ColumnInfo) {
        return {};
    }

    // Get column names from metadata
    const columnNames = resultSet.ResultSetMetadata.ColumnInfo.map(col =>
        col.Name || ''
    );

    // Initialize result object with empty arrays for each column
    // const result: { [key: string]: (string | number)[] } = {};
    const queryResult: { [key: string]: (string | number) }[] = [];
    
    // columnNames.forEach(name => {
    //     result[name] = [];
    // });

    // Skip the header row (first row) and process data rows
    const dataRows = resultSet.Rows.slice(1);

    dataRows.forEach(row => {
        if (!row.Data) return;
        const rowObject = Object.fromEntries(
            row.Data
            .map((cell, columnIndex) => [columnNames[columnIndex], cell.VarCharValue || ""])
        );

        queryResult.push(rowObject)

        // row.Data.forEach((cell, columnIndex) => {
        //     const columnName = columnNames[columnIndex];
        //     const rowObject = Object.fromEntries(
        //         tableColumns
        //         .filter(column => column.columnName !== removeSpaceAndLowerCase(column.columnName))
        //         .map(column => [removeSpaceAndLowerCase(column.columnName), column.columnName])
        //     );

        //     if (columnName) {
        //         result[columnName].push(cell.VarCharValue || "");
        //     }
        // });
    });

    return queryResult;
}