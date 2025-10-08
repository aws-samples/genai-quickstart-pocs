import { stringify } from 'yaml'
import { z } from "zod";

import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { S3Client, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandInput } from "@aws-sdk/client-s3";

import { tool } from "@langchain/core/tools";
import { env } from '$amplify/env/production-agent-function';

import { AmplifyClientWrapper, FieldDefinition } from '../utils/amplifyUtils'
import { processWithConcurrency, startQueryExecution, waitForQueryToComplete, getQueryResults, transformResultSet } from '../utils/sdkUtils'

import { ToolMessageContentType } from '../../../src/utils/types'

import { invokeBedrockWithStructuredOutput } from '../graphql/queries'

import { getStructuredOutputResponse } from '../getStructuredOutputFromLangchain'
import { HumanMessage } from "@langchain/core/messages";

const s3Client = new S3Client();

export async function queryKnowledgeBase(props: { knowledgeBaseId: string, query: string }) {
    const bedrockRuntimeClient = new BedrockAgentRuntimeClient();

    const command = new RetrieveCommand({
        knowledgeBaseId: props.knowledgeBaseId,
        retrievalQuery: { text: props.query },
        retrievalConfiguration: {
            vectorSearchConfiguration: {
                numberOfResults: 5 // Adjust based on your needs
            }
        }
    });

    try {
        const response = await bedrockRuntimeClient.send(command);
        return response.retrievalResults;
    } catch (error) {
        console.error('Error querying knowledge base:', error);
        throw error;
    }
}

///////////////////////////////////////////////////////////////
////// Retrieve Petroleum Enginnering Knowledge Tool //////////
///////////////////////////////////////////////////////////////
const retrievePetroleumEngineeringKnowledgeSchema = z.object({
    concepts: z.string().describe(`Which concepts would you like to know about?`),
});

//https://js.langchain.com/docs/integrations/retrievers/bedrock-knowledge-bases/
export const retrievePetroleumEngineeringKnowledgeTool = tool(
    async ({ concepts }) => {

        const contextResponse = await queryKnowledgeBase({
            knowledgeBaseId: env.PETROLEUM_ENG_KNOWLEDGE_BASE_ID,
            query: concepts
        })

        if (!contextResponse) throw new Error(`No relevant tables found. Query: ${concepts}`)
        // console.log("Pet Eng KB response:\n", JSON.stringify(contextResponse, null, 2))

        return {
            messageContentType: 'tool_json',
            context: contextResponse
        } as ToolMessageContentType
    },
    {
        name: "retrievePetroleumEngineeringKnowledge",
        description: "Can retrieve information on many aspects of oil and gas extraction.",
        schema: retrievePetroleumEngineeringKnowledgeSchema,
    }
);

//////////////////////////////////////////
////// Get table definiton tool //////////
//////////////////////////////////////////
const getTableDefinitionsSchema = z.object({
    tableFeatures: z.string().describe(`
        Which features of the user's question should be looked for when picking which tables to query? 
        Include key words and likely SQL query column names.
        `),
});

//https://js.langchain.com/docs/integrations/retrievers/bedrock-knowledge-bases/
export const getTableDefinitionsTool = tool(
    async ({ tableFeatures }) => {
        // console.log('Getting relevant tables for table features:\n', tableFeatures)

        const relevantTables = await queryKnowledgeBase({
            knowledgeBaseId: env.AWS_KNOWLEDGE_BASE_ID,
            query: tableFeatures
        }
        )

        if (!relevantTables) throw new Error("No relevant tables found")
        // console.log("Text2Sql KB response:\n", JSON.stringify(relevantTables, null, 2))


        const tableDefinitions = relevantTables.map((result) =>
        ({
            ...JSON.parse(result?.content?.text || ""),
            score: result?.score
        }))

        // console.log('Table Definitions:\n', tableDefinitions)

        return {
            messageContentType: 'tool_json',
            tableDefinitions: tableDefinitions
        } as ToolMessageContentType
    },
    {
        name: "getTableDefinitionsTool",
        description: "Always call this tool before executing a SQL query. Can retrieve database table definitons available for SQL queries.",
        schema: getTableDefinitionsSchema,
    }
);

///////////////////////////////////////////////////
///// Execute SQL Statement Tool //////////////////
///////////////////////////////////////////////////

const executeSQLQuerySchema = z.object({
    query: z.string().describe(`
        The Trino SQL query to be executed.
        Include the dataSource, database, and tableName in the FROM element (ex: FROM <dataSourceName>.production.daily)
        Use "" arond all column names.
        To use date functions on a column with varchar type, cast the column to a date first.
        The DATE_SUB function is not available. Use the DATE_ADD(unit, value, timestamp) function any time you're adding an interval value to a timestamp. Never use DATE_SUB.
        <unavailableSqlFunctions> DATE_SUB ILIKE </unavailableSqlFunctions> 
        Here's an example of how to use the DATE_TRUNC function: DATE_TRUNC('month', CAST("firstDayOfMonth" AS DATE))
        In the WHERE or GROUP BY causes, do not use column aliases defined in the SELECT clause.
        Column aliases defined in the SELECT clause cannot be referenced in the WHERE or GROUP BY clauses because they are evaluated before the SELECT clause during query processing.
        The first column in the returned result will be used as the x axis column. If the query contains a date, set it as the first column.
        
        Here's an example sql query for total daily oil, gas and water production
        <exampleSqlQuery>
        SELECT
            DATE_TRUNC('day', CAST("firstDayOfMonth" AS DATE)) AS day,
            SUM("oil(bbls)") AS total_oil_production,
            SUM("gas(mcf)") AS total_gas_production,
            SUM("water(bbls)") AS total_water_production
        FROM "AwsDataCatalog"."<database_name>"."crawler_monthly_production"
        WHERE "well api" = '<example_well_api>'
            AND CAST("firstDayOfMonth" AS DATE) >= CAST('1990-01-01' AS DATE)
        GROUP BY DATE_TRUNC('day', CAST("firstDayOfMonth" AS DATE))
        ORDER BY day
        </exampleSqlQuery>
        `.replace(/^\s+/gm, '')),
});

function doesFromLineContainOneDot(sqlQuery: string): boolean {
    // Split the query into lines
    const lines = sqlQuery.split('\n');

    // Find the line that starts with "FROM" (case-insensitive)
    const fromLine = lines.find(line => line.trim().toUpperCase().startsWith('FROM'));

    // If there's no FROM line, return false
    if (!fromLine) {
        return false;
    }

    // Extract the part after "FROM"
    const afterFrom = fromLine.trim().substring(4).trim();

    // Count the number of dots
    const dotCount = (afterFrom.match(/\./g) || []).length;

    // Return true if there's exactly one dot
    return dotCount === 1;
}

export const executeSQLQueryTool = tool(
    async ({ query }) => {
        // console.log('Executing SQL Query:\n', query, '\nUsing workgroup: ', env.ATHENA_WORKGROUP_NAME)
        try {

            // See if the string date_sub is in the query sting
            if (query.toLowerCase().includes("date_sub")) {
                return {
                    messageContentType: 'tool_json',
                    error: `
                    DATE_SUB is not allowed in the SQL query. 
                    Re-write the query and use the DATE_ADD(unit, value, timestamp) function any time you're adding an interval value to a timestamp. Ex: DATE_ADD('year', -5, CURRENT_DATE)
                    `.replace(/^\s+/gm, '')
                } as ToolMessageContentType
            }

            //Check if the datasource is included in the query
            if (doesFromLineContainOneDot(query)) {
                return {
                    messageContentType: 'tool_json',
                    error: `
                    The FROM line in the SQL query does not the data source.
                    Include the dataSource, database, and tableName in the FROM element (ex: FROM <dataSource>.production.daily)
                    `.replace(/^\s+/gm, '')
                } as ToolMessageContentType
            }

            const queryExecutionId = await startQueryExecution({
                query: query,
                workgroup: env.ATHENA_WORKGROUP_NAME,
            });
            await waitForQueryToComplete(queryExecutionId, env.ATHENA_WORKGROUP_NAME);
            const results = await getQueryResults(queryExecutionId);
            // console.log('Athena Query Result:\n', results);

            if (!results.ResultSet?.Rows) throw new Error("No results returned from Athena")

            const queryResponseData = transformResultSet(results.ResultSet)

            return {
                messageContentType: 'tool_table_trend',
                queryResponseData: queryResponseData,
            } as ToolMessageContentType

        } catch (error) {
            console.error('Error executing sql query:', error);
            return {
                messageContentType: 'tool_json',
                error: error instanceof Error ? error.message : `Error:\n ${JSON.stringify(error)}`
            } as ToolMessageContentType
        }
    },
    {
        name: "executeSQLQuery",
        description: `
        Use this tool to retireve structured data, like production rate numbers.
        Always call the getTableDefinitionsTool before calling this tool. 
        This tool can execute a Trino SQL query and returns the results as a table.
        `.replace(/^\s+/gm, ''),
        schema: executeSQLQuerySchema,
    }
);

///////////////////////////////////////////////////
////////// Plot Table Tool ////////////////////////
///////////////////////////////////////////////////

const plotTableFromToolResponseSchema = z.object({
    chartTitle: z.string().describe("The title of the plot."),
    includePreviousDataTable: z.boolean().optional().describe("If true, the last table in the plot will be the data table. If false, the last table in the plot will be the event data table. Default is true."),
    includePreviousEventTable: z.boolean().optional().describe("If true, the last table in the plot will be the event data table. If false, the last table in the plot will be the data table. Default is true.")
    // numberOfPreviousTablesToInclude: z.number().int().optional().describe("The number of previous tables to include in the plot. Use at least 2 to include produciton and event data tables."),
});


export const plotTableFromToolResponseTool = tool(
    async ({ chartTitle, includePreviousDataTable = true, includePreviousEventTable = true }) => {

        return {
            messageContentType: 'tool_plot',
            // columnNameFromQueryForXAxis: columnNameFromQueryForXAxis,
            chartTitle: chartTitle,
            // numberOfPreviousTablesToInclude: numberOfPreviousTablesToInclude,
            includePreviousDataTable: includePreviousDataTable,
            includePreviousEventTable: includePreviousEventTable
            // chartData: queryResponseData
        } as ToolMessageContentType

    },
    {
        name: "plotTableFromToolResponseToolBuilder",
        description: "Plots tabular data returned from previous tool messages",
        schema: plotTableFromToolResponseSchema,
    }
);


//////////////////////////////////////////
/////// Get Well File Info Tool //////////
//////////////////////////////////////////

const getS3KeyConentsSchema = z.object({
    s3Key: z.string().describe("The S3 key to get the contents of.")
});

export const getS3KeyConentsTool = tool(
    async ({ s3Key }) => {
        const getObjectResponse = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.DATA_BUCKET_NAME,
            Key: s3Key
        }))

        const objectContent = await getObjectResponse.Body?.transformToString()

        if (!objectContent) {
            return {
                messageContentType: 'tool_json',
                error: `
                The S3 Key was not found. S3 Key: ${s3Key}
                `
            } as ToolMessageContentType
        }

        // return objectContent
        return {
            messageContentType: 'tool_json',
            objectContent: objectContent
        } as ToolMessageContentType
    },
    {
        name: "getS3ObjectContents",
        description: `
        Can return the contents of an individual S3 Key. 
        Only use this tool to learn about a source file for a row from the wellTableTool. 
        The wellTableTool should always be called before this tool.`.replace(/^\s+/gm, ''),
        schema: getS3KeyConentsSchema,
    }
);


//////////////////////////////////////////
//////// PDF Reports to Table Tool ///////
//////////////////////////////////////////

const jsonSchemaTypes = z.enum(['string', 'integer', 'date', 'number', 'boolean', 'null'])

export const wellTableSchema = z.object({
    dataToExclude: z.string().optional().describe("List of criteria to exclude data from the table"),
    dataToInclude: z.string().optional().describe("List of criteria to include data in the table"),
    tableColumns: z.array(z.object({
        columnName: z.string().describe('The name of a column'),
        columnDescription: z.string().describe('A description of the information which this column contains.'),
        columnDataDefinition: z.object({
            type: z.union([
                jsonSchemaTypes,
                z.array(jsonSchemaTypes)
            ]),
            format: z.string().describe('The format of the column.').optional(),
            enum: z.array(z.string()).optional(),
            pattern: z.string().describe('The regex pattern for the column.').optional(),
            minimum: z.number().optional(),
            maximum: z.number().optional(),
        })//.optional()
    })).describe(`The column name and description for each column of the table. 
        Choose the column best suited for a chart label as the first element.
        Here's a JSON formatted example table column argument:
        <exampleTableColumns>
        {
            "tableColumns": [
                {
                    "columnName": "event",    
                    "columnDescription": "The type of well event that occurred",
                    "columnDataDefinition": {
                        "type": "string",
                        "enum": [
                            "Drilling",
                            "Stimulation",
                            "Workover",
                            "Plugging",
                            "Legal",
                            "Inspection",
                            "Other"
                        ]
                    }
                },
                {
                    "columnName": "description",
                    "columnDescription": "A description of the well event",
                    "columnDataDefinition": {
                        "type": "string"
                    }
                }
            ]
        }
        </exampleTableColumns>
        `.replace(/^\s+/gm, '')),
    wellApiNumber: z.string().describe('The API number of the well to find information about')
});

async function listFilesUnderPrefix(
    props: {
        bucketName: string,
        prefix: string,
        suffix?: string
    }
): Promise<string[]> {
    const { bucketName, prefix, suffix } = props
    // Create S3 client
    const files: string[] = [];

    // Prepare the initial command input
    const input: ListObjectsV2CommandInput = {
        Bucket: bucketName,
        Prefix: prefix,
    };

    try {
        let isTruncated = true;

        while (isTruncated) {
            const command = new ListObjectsV2Command(input);
            const response = await s3Client.send(command);

            // Add only the files that match the suffix to our array
            response.Contents?.forEach((item) => {
                if (item.Key && item.Key.endsWith(suffix || "")) {
                    files.push(item.Key);
                }
            });

            // Check if there are more files to fetch
            isTruncated = response.IsTruncated || false;

            // If there are more files, set the continuation token
            if (isTruncated && response.NextContinuationToken) {
                input.ContinuationToken = response.NextContinuationToken;
            }
        }

        return files;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

function removeSpaceAndLowerCase(str: string): string {
    //return a string that matches regex pattern '^[a-zA-Z0-9_-]{1,64}$'
    let transformed = str.replaceAll(" ", "").toLowerCase()
    transformed = transformed.replaceAll(/[^a-zA-Z0-9_-]/g, '');
    transformed = transformed.slice(0, 64);

    return transformed;
}

async function listS3Folders(
    props: {
        bucketName: string,
        prefix: string
    },
): Promise<string[]> {
    const { bucketName, prefix } = props

    const s3Client = new S3Client({});

    // Add trailing slash if not present
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    const input: ListObjectsV2CommandInput = {
        Bucket: bucketName,
        Delimiter: '/',
        Prefix: normalizedPrefix,
    };

    try {
        const command = new ListObjectsV2Command(input);
        const response = await s3Client.send(command);

        // console.log('list folders s3 response:\n',response)

        // Get common prefixes (folders)
        const folders = response.CommonPrefixes?.map(prefix => prefix.Prefix!.slice(normalizedPrefix.length)) || [];

        // console.log('folders: ', folders)

        // Filter out the current prefix itself and just get the part of the prefix after the normalizedPrefix
        return folders
            .filter(folder => folder !== normalizedPrefix)

    } catch (error) {
        console.error('Error listing S3 folders:', error);
        throw error;
    }
}
// /(amplifyClientWrapper: AmplifyClientWrapper) => 
export const wellTableTool = tool(
    async ({ dataToInclude, tableColumns, wellApiNumber, dataToExclude }) => {
        console.log("Well Table Tool Invoked")
        try {
            if (!process.env.DATA_BUCKET_NAME) throw new Error("DATA_BUCKET_NAME environment variable is not set")

            //If tableColumns contains a column with columnName date, remove it. The user may ask for one, and one will automatically be added later.
            tableColumns = tableColumns.filter(column => !(column.columnName.toLowerCase().includes('date')))
            // Here add in the default table columns date and excludeRow 
            tableColumns.unshift({
                columnName: 'includeScore',
                columnDescription: `
                    If the JSON object contains information related to [${dataToExclude}], give a score of 1.
                    If not, give a score of 10 if JSON object contains information related to [${dataToInclude}].
                    Most scores should be around 5. Reserve 10 for exceptional cases.
                    `,
                columnDataDefinition: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 10
                }
            })

            tableColumns.unshift({
                columnName: 'includeScoreExplanation',
                columnDescription: `Why did you choose that score?`,
                columnDataDefinition: {
                    type: 'string',
                }
            })

            tableColumns.unshift({
                columnName: 'relevantPartOfJsonObject',
                columnDescription: `Which part of the object caused you to give that score?`,
                columnDataDefinition: {
                    type: 'string',
                }
            })

            tableColumns.unshift({
                columnName: 'date',
                columnDescription: `The date of the event in YYYY-MM-DD format. Can be null if no date is available.`,
                columnDataDefinition: {
                    type: ['string', 'null'],
                    format: 'date',
                    pattern: "^(?:\\d{4})-(?:(0[1-9]|1[0-2]))-(?:(0[1-9]|[12]\\d|3[01]))$"
                }
            })

            // console.log('Input Table Columns: ', tableColumns)

            // const correctedColumnNameMap = tableColumns.map(column => [removeSpaceAndLowerCase(column.columnName), column.columnName])
            const correctedColumnNameMap = Object.fromEntries(
                tableColumns
                    .filter(column => column.columnName !== removeSpaceAndLowerCase(column.columnName))
                    .map(column => [removeSpaceAndLowerCase(column.columnName), column.columnName])
            );

            const fieldDefinitions: Record<string, FieldDefinition> = {};
            for (const column of tableColumns) {
                const correctedColumnName = removeSpaceAndLowerCase(column.columnName)

                fieldDefinitions[correctedColumnName] = {
                    ...(column.columnDataDefinition ? column.columnDataDefinition : { type: 'string' }),
                    description: column.columnDescription
                };
            }
            const jsonSchema = {
                title: "getKeyInformation",
                description: "Fill out these arguments based on text extracted from a form",
                type: "object",
                properties: fieldDefinitions,
                required: Object.keys(fieldDefinitions).filter(key => key !== 'date'),
            };

            console.log('target json schema for row:\n', stringify(jsonSchema))

            let columnNames = tableColumns.map(column => column.columnName)
            //Add in the source and relevanceScore columns
            columnNames.push('s3Key')

            console.log('Generating column names: ', columnNames)

            const s3Prefix = `production-agent/well-files/field=SanJuanEast/api=${wellApiNumber}/`;
            const wellFiles = await listFilesUnderPrefix({
                bucketName: process.env.DATA_BUCKET_NAME,
                prefix: s3Prefix,
                suffix: '.yaml'
            })
            // console.log('Well Files: ', wellFiles)

            if (wellFiles.length === 0) {
                const oneLevelUpS3Prefix = s3Prefix.split('/').slice(0, -2).join('/')

                console.log('one level up s3 prefix: ', oneLevelUpS3Prefix)
                const s3Folders = await listS3Folders({
                    bucketName: process.env.DATA_BUCKET_NAME,
                    prefix: oneLevelUpS3Prefix
                })//await onFetchObjects(oneLevelUpS3Prefix)
                // const s3Folders = s3ObjectsOneLevelHigher.filter(s3Asset => s3Asset.IsFolder).map(s3Asset => s3Asset.Key)

                return {
                    messageContentType: 'tool_json',
                    error: `
                No files found for well API number: ${wellApiNumber}
                Available well APIs:\n${s3Folders.join('\n')}
                `
                } as ToolMessageContentType
            }

            const dataRows = await processWithConcurrency({
                items: wellFiles,
                concurrency: parseInt(env.FILE_PROCESSING_CONCURRENCY || '30', 10),
                fn: async (s3Key) => {
                    try {

                        const getObjectResponse = await s3Client.send(new GetObjectCommand({
                            Bucket: process.env.DATA_BUCKET_NAME,
                            Key: s3Key
                        }))

                        const objectContent = await getObjectResponse.Body?.transformToString()
                        if (!objectContent) throw new Error(`No object content for s3 key: ${s3Key}`)
                        if (objectContent.length < 25) {
                            console.log("Object Length too small. Not generating a response. Object:\n", objectContent)
                            return
                        } // If the file contents are empty, do not create a row for that file. The empty file has a length of 22

                        const messageText = `
                        The user is asking you to extract information from a YAML object.
                        The YAML object contains information about a well.
                        <YamlObject>
                        ${objectContent}
                        </YamlObject>
                        `

                        const fileDataResponse = await getStructuredOutputResponse({
                            messages: [new HumanMessage({ content: messageText })],
                            outputStructure: jsonSchema,
                            modelId: env.STRUCTURED_OUTPUT_MODEL_ID
                        })

                        //Replace the keys in file Data with those from correctedColumnNameMap
                        Object.keys(fileDataResponse).forEach(key => {
                            if (key in correctedColumnNameMap) {
                                const correctedKey = correctedColumnNameMap[key]
                                fileDataResponse[correctedKey] = fileDataResponse[key]
                                delete fileDataResponse[key]
                            }
                        })

                        //Preserve ordering of columns
                        const sortedFileDataResponse = Object.fromEntries(columnNames.map(colName => [colName, fileDataResponse[colName]]))

                        const fileResponseData: Record<string, any> = {
                            ...sortedFileDataResponse,
                            s3Key: s3Key
                        }

                        return fileResponseData
                    } catch (error) {
                        console.error('Error:', error);
                        throw new Error(`Error: ${JSON.stringify(error)}`)
                        // return {
                        //     messageContentType: 'tool_json',
                        //     error: `Error: ${error}`
                        // } as ToolMessageContentType
                    }
                }
            })


            // console.log('data Rows: ', dataRows)

            //Sort the data rows by date (first column)
            dataRows.sort((a, b) => {
                if (!a || !a.date) return 0
                if (!b || !b.date) return 1

                return a?.date.localeCompare(b?.date)
            });

            // console.log('data Rows: ', dataRows)

            return {
                messageContentType: 'tool_table_events',
                queryResponseData: dataRows
            } as ToolMessageContentType
        }
        catch (error) {
            console.error('Error in WellTableTool invocation:', error);
            return {
                messageContentType: 'tool_json',
                error: `Error: ${error}`
            } as ToolMessageContentType
        }
    },
    {
        name: "wellTableTool",
        description: `
        This tool searches the well files to extract specified information about a well. 
        Use this tool to retrieve knowledge from well files.
        Do not use this tool to query production rate numbers.
        This tool can not query structured data sources.
        `.replace(/^\s+/gm, ''),
        schema: wellTableSchema,
    }
);

