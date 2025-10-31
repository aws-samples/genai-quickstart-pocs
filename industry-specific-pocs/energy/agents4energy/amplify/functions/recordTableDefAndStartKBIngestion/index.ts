import { stringify } from 'yaml'
import { EventBridgeEvent, Context } from 'aws-lambda';

import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";

import { executeAthenaQueryGetResult, transformColumnOfAthenaQueryToList, uploadStringToS3 } from '../utils/sdkUtils'

const bedrockAgentClient = new BedrockAgentClient();

export interface AthenaDataCatalogDetail {
  eventVersion: string;
  userIdentity: {
    type: string;
    principalId: string;
    arn: string;
    accountId: string;
    userName?: string;
  };
  eventTime: string;
  eventSource: string;
  eventName: string;
  awsRegion: string;
  sourceIPAddress: string;
  userAgent: string;
  requestParameters: {
    name: string;
    type: string;
    description?: string;
    parameters?: Record<string, string>;
    tags: {
      AgentsForEnergy: string;
      [key: string]: string;
    };
  };
  responseElements: {
    dataCatalog: {
      name: string;
      type: string;
      description?: string;
      parameters?: Record<string, string>;
      tags: Record<string, string>;
    };
  };
  requestID: string;
  eventID: string;
  readOnly: boolean;
  eventType: string;
  managementEvent: boolean;
  recipientAccountId: string;
  eventCategory: string;
}


export const handler = async (
  event: EventBridgeEvent<'AWS API Call via CloudTrail', AthenaDataCatalogDetail>,// | EventBridgeEvent<'AWS API Call via CloudTrail', GlueTableEvent>,
  context: Context
): Promise<{ statusCode: number; body: string }> => {

  if (!process.env.ATHENA_WORKGROUP_NAME) throw new Error('ATHENA_WORKGROUP_NAME is not defined')
  if (!process.env.S3_BUCKET_NAME) throw new Error('S3_BUCKET_NAME is not defined')
  if (!process.env.TABLE_DEF_KB_ID) throw new Error('TABLE_DEF_KB_ID is not defined')
  if (!process.env.TABLE_DEF_KB_DS_ID) throw new Error('TABLE_DEF_KB_DS_ID is not defined')
  if (!process.env.PROD_GLUE_DB_NAME) throw new Error('PROD_GLUE_DB_NAME is not defined')


  console.log('event:\n', event)

  // const { detail: {eventName, requestParameters} } = event ;

  //If no event is provided (like if a test event is used) run the function on the AwsDataCatalog
  const { detail: { eventName, requestParameters } } = ('detail' in event) ?
    event
    :
    { detail: { eventName: 'DummyEvent', requestParameters: { name: 'AwsDataCatalog' } } };

  // const { detail } = event;


  // const {
  //   eventName,
  //   requestParameters,
  //   // responseElements
  // } = detail;


  // Extract relevant information
  const dataCatalogName = requestParameters.name;
  // const dataCatalogType = requestParameters.type;
  // const tags = requestParameters.tags;

  console.log(`Processing ${eventName} event for data catalog: ${dataCatalogName}`);
  // console.log('Data Catalog Type:', dataCatalogType);
  // console.log('Tags:', tags);


  const dataCatalogPrefix = dataCatalogName.split("_").slice(0)[0]

  const createQueryFunctions: {
    [dataCatalogType: string]: {
      listDatabases: () => string,
      listTables: (database: string) => string,
      describeTable: (database: string, table: string) => string,
      databasesToExclude?: string[]
    }
  } = {
    postgres: {
      listDatabases: () => (/* sql */`
        SELECT schema_name 
        FROM ${dataCatalogName}.information_schema.schemata;
      `),
      listTables: (database: string) => (/* sql */`
        SELECT table_name
        FROM ${dataCatalogName}.information_schema.tables
        WHERE table_schema = '${database}'
        `),
      describeTable: (database: string, table: string) => ( /* sql */`
        DESCRIBE ${dataCatalogName}.${database}.${table}
      `),
      databasesToExclude: ['pg_catalog', 'information_schema']
    },
    AwsDataCatalog: {
      listDatabases: () => (/* sql */`
        SELECT '${process.env.PROD_GLUE_DB_NAME}' as sample_glue_db 
      `),
      listTables: (database: string) => (/* sql */`
        SELECT table_name
        FROM ${dataCatalogName}.information_schema.tables
        WHERE table_schema = '${database}'
        `),
      describeTable: (database: string, table: string) => ( /* sql */`
        SELECT 
            CONCAT('"', column_name, '"\t', data_type) as column_definition
        FROM ${dataCatalogName}.information_schema.columns
        WHERE table_schema = '${database}'
            AND table_name = '${table}'
        ORDER BY ordinal_position;
      `),
      databasesToExclude: ['information_schema', 'default']
    },
  }

  if (!(dataCatalogPrefix in createQueryFunctions)) throw new Error(`Data Catalog Type: ${dataCatalogPrefix} is not supported.`)

  const dbSchemasResults = await executeAthenaQueryGetResult({
    query: createQueryFunctions[dataCatalogPrefix].listDatabases(),
    workgroup: process.env.ATHENA_WORKGROUP_NAME,
  });

  const dbSchemas = transformColumnOfAthenaQueryToList({ queryResult: dbSchemasResults })

  console.log("DB Schemas: ", dbSchemas)

  if (!dbSchemas) throw new Error('No DB Schemas found')

  for (const schema of dbSchemas) {
    // Don't present the these shemas for query.
    if (createQueryFunctions[dataCatalogPrefix].databasesToExclude && createQueryFunctions[dataCatalogPrefix].databasesToExclude.includes(schema!)) continue

    const listTablesReult = await executeAthenaQueryGetResult({
      query: createQueryFunctions[dataCatalogPrefix].listTables(schema!),
      workgroup: process.env.ATHENA_WORKGROUP_NAME!,
    });

    const dbSchemaTables = transformColumnOfAthenaQueryToList({ queryResult: listTablesReult })

    console.log('Tables: ', dbSchemaTables)

    for (const tableName of dbSchemaTables) {
      const describeTableResult = await executeAthenaQueryGetResult({
        query: createQueryFunctions[dataCatalogPrefix].describeTable(schema!, tableName!),
        workgroup: process.env.ATHENA_WORKGROUP_NAME!,
      });

      const tableDefinition = transformColumnOfAthenaQueryToList({ queryResult: describeTableResult }).join('\n')

      if (!tableDefinition) continue //If there is no schema, don't include the table.

      const tableDefinitionString = JSON.stringify({
        dataSource: dataCatalogName,
        database: schema,
        tableName: tableName,
        tableDefinition: tableDefinition
      }, null, 2)

      console.log('Table Definition:\n', tableDefinitionString);

      //Upload the describeTableResult to S3
      await uploadStringToS3({
        key: `production-agent/table-definitions/dataSource=${dataCatalogName}/database=${schema}/table-name=${tableName}.json`,
        content: tableDefinitionString,
        contentType: 'text/json'
      })
    }
  }

  switch (dataCatalogPrefix) {
    case 'postgres':
      const dbSchemasResults = await executeAthenaQueryGetResult({
        query: /* sql */`
        SELECT schema_name 
        FROM ${dataCatalogName}.information_schema.schemata;
        `,
        workgroup: process.env.ATHENA_WORKGROUP_NAME,
      });

      const dbSchemas = transformColumnOfAthenaQueryToList({ queryResult: dbSchemasResults })

      console.log("DB Schemas: ", dbSchemas)

      if (!dbSchemas) throw new Error('No DB Schemas found')

      for (const schema of dbSchemas) {
        // Don't present the these shemas for query.
        if (['pg_catalog', 'information_schema'].includes(schema!)) continue

        const listTablesReult = await executeAthenaQueryGetResult({
          query: /* sql */`
          SELECT table_name
          FROM ${dataCatalogName}.information_schema.tables
          WHERE table_schema = '${schema}'
          ORDER BY table_name;
          `,
          workgroup: process.env.ATHENA_WORKGROUP_NAME!,
        });

        const dbSchemaTables = transformColumnOfAthenaQueryToList({ queryResult: listTablesReult })

        for (const tableName of dbSchemaTables) {
          const describeTableResult = await executeAthenaQueryGetResult({
            query: /* sql */`
            DESCRIBE ${dataCatalogName}.${schema}.${tableName}
            `,
            workgroup: process.env.ATHENA_WORKGROUP_NAME!,
          });

          const tableDefinition = transformColumnOfAthenaQueryToList({ queryResult: describeTableResult }).join('\n')

          const tableDefinitionString = JSON.stringify({
            dataSource: dataCatalogName,
            database: schema,
            tableName: tableName,
            tableDefinition: tableDefinition
          }, null, 2)

          console.log('Table Definition:\n', tableDefinitionString);

          //Upload the describeTableResult to S3
          await uploadStringToS3({
            key: `production-agent/table-definitions/dataSource=${dataCatalogName}/database=${schema}/table-name=${tableName}.json`,
            content: tableDefinitionString,
            contentType: 'text/json'
          })
        }
      }

    default:
      break;
  }

  //Now start the knowledge base sync
  const startIngestionJobResponse = await bedrockAgentClient.send(new StartIngestionJobCommand({
    dataSourceId: process.env.TABLE_DEF_KB_DS_ID,
    knowledgeBaseId: process.env.TABLE_DEF_KB_ID,
  }))

  console.log("Start ingestion job resposne:\n", stringify(startIngestionJobResponse))

  return { statusCode: 200, body: 'All SQL statements executed and table definitions exported successfully.' };
};