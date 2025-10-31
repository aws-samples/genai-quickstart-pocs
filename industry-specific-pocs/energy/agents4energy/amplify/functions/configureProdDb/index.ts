import { RDSDataClient, ExecuteStatementCommand, ExecuteStatementCommandInput } from "@aws-sdk/client-rds-data";
import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
import { startQueryExecution, waitForQueryToComplete, getQueryResults, uploadStringToS3 } from '../utils/sdkUtils'

import sqlStatements from './sqlStatements'

const rdsDataClient = new RDSDataClient();
const bedrockAgentClient = new BedrockAgentClient();
// const athenaClient = new AthenaClient();

export const handler = async (event: any, context: any, callback: any): Promise<{ statusCode: number; body: string }> => {

  if (!process.env.CLUSTER_ARN) throw new Error('CLUSTER_ARN is not defined')
  if (!process.env.ATHENA_WORKGROUP_NAME) throw new Error('ATHENA_WORKGROUP_NAME is not defined')
  if (!process.env.DATABASE_NAME) throw new Error('DATABASE_NAME is not defined')
  if (!process.env.S3_BUCKET_NAME) throw new Error('S3_BUCKET_NAME is not defined')
  // if (!process.env.ATHENA_SAMPLE_DATA_SOURCE_NAME) throw new Error('ATHENA_SAMPLE_DATA_SOURCE_NAME is not defined')
  if (!process.env.TABLE_DEF_KB_ID) throw new Error('TABLE_DEF_KB_ID is not defined')
  if (!process.env.TABLE_DEF_KB_DS_ID) throw new Error('TABLE_DEF_KB_DS_ID is not defined')
    

  // if (!process.env.TABLE_DEF_KB_ID) throw new Error('TABLE_DEF_KB_ID is not defined')

  const workgroup = process.env.ATHENA_WORKGROUP_NAME
  // const knowledgeBaseId = process.env.TABLE_DEF_KB_ID || 'default'


  for (const sql of sqlStatements) {
    console.log('Executing SQL:', sql)


    const params: ExecuteStatementCommandInput = {
      resourceArn: process.env.CLUSTER_ARN,
      secretArn: process.env.SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: sql.trim(),
    };

    const command = new ExecuteStatementCommand(params);

    try {
      const result = await rdsDataClient.send(command);
      console.log('SQL execution successful:', result);
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }

  console.log('All SQL statements executed successfully')

  // const dataSoruce = process.env.ATHENA_SAMPLE_DATA_SOURCE_NAME
  // const tablesToExportDefinitionsOf: {tableName: string, database: string }[] = [
  //   {
  //     tableName: 'daily',
  //     database: 'production'
  //   },
  //   {
  //     tableName: 'businessunits',
  //     database: 'public'
  //   },
  //   {
  //     tableName: 'locations',
  //     database: 'public'
  //   },
  // ]

  // // Query to get all table definitions
  // const queryBuilder = (database: string, tableName: string) => (
  //   /* sql */`
  //   DESCRIBE ${dataSoruce}.${database}.${tableName}
  // `);

  // await Promise.all(
  //   tablesToExportDefinitionsOf.map(async ({ tableName, database }) => {
  //     const query = queryBuilder(database, tableName);
  //     console.log('Executing Athena Query:\n', query);
  //     const queryExecutionId = await startQueryExecution({
  //       query: query, 
  //       workgroup: workgroup, 
  //       // database: database, 
  //       // athenaCatalogaName: process.env.ATHENA_CATALOG_NAME!
  //     });
  //     await waitForQueryToComplete(queryExecutionId, workgroup);
  //     const results = await getQueryResults(queryExecutionId);
  //     console.log('Athena Query Result:\n', results);

  //     const describeTableResult = results.ResultSet?.Rows?.map((row) => {
  //       if (row.Data && row.Data[0] && row.Data[0].VarCharValue !== undefined) return row.Data[0].VarCharValue
  //     }
  //     ).join('\n')

  //     if (!describeTableResult) throw new Error(`No table definition found for table: ${tableName}`)

  //     const tableDefinitionString = JSON.stringify({
  //       dataSource: dataSoruce,
  //       database: database,
  //       tableName: tableName,
  //       tableDefinition: describeTableResult
  //     }, null, 2)

  //     console.log('Table Definition:\n', tableDefinitionString);
      
  //     //Upload the describeTableResult to S3
  //     await uploadStringToS3({
  //       key: `production-agent/table-definitions/dataSource=${dataSoruce}/database=${database}/table-name=${tableName}.txt`,
  //       content: tableDefinitionString,
  //       contentType: 'text/plain'
  //     })

  //     return describeTableResult; // Return the results if you need them
  //   })
  // );

  // //Now start the knowledge base sync
  // await bedrockAgentClient.send(new StartIngestionJobCommand({
  //   dataSourceId: process.env.TABLE_DEF_KB_DS_ID,
  //   knowledgeBaseId: process.env.TABLE_DEF_KB_ID,
  // }))

  return { statusCode: 200, body: 'All SQL statements executed.' };
};