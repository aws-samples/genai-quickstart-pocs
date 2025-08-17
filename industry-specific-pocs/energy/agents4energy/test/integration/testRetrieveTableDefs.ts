import { handler, AthenaDataCatalogDetail } from "@/../amplify/functions/recordTableDefAndStartKBIngestion/index"
import { EventBridgeEvent, Context } from 'aws-lambda';
import outputs from '@/../amplify_outputs.json';

import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";

const rootStackName = outputs.custom.root_stack_name


const dummyContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: '52fdfc07-2182-154f-163f-5f0f9a621d72',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2020/09/22/[$LATEST]abcdefghijklmnopqrstuvwxyz',
  // identity: null,
  // clientContext: null,
  getRemainingTimeInMillis: () => 3000,
  done: () => { },
  fail: () => { },
  succeed: () => { },
};

const main = async () => {
  process.env.ROOT_STACK_NAME = rootStackName
  // test()
  // getDeployedResourceArn(rootStackName, 'configureProdDbFunction')
  await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'RecordTableDefAndStartKbIngestionJob'))

  // const prodGlueDbName = await getDeployedResourceArn(rootStackName, 'ProdGlueDb')
  // const sampleRdsDataSource = await getDeployedResourceArn(rootStackName, 'PostgresAthenaDataSource')
  

  const testEvent = {
    "version": "0",
    "id": "12345678-1234-1234-1234-123456789012",
    "detail-type": "AWS API Call via CloudTrail",
    "source": "aws.athena",
    "account": "123456789012",
    "time": "2024-03-15T12:30:00Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
      "requestParameters": {
        // "name": sampleRdsDataSource,
        "name": "AwsDataCatalog", //This one is for all glue dbs in this account
        "type": "Data source connector",
        "description": "Updated test data catalog for energy data",
        "parameters": {
          "catalog-id": "123456789012",
          "new-parameter": "value"
        },
        "tags": {
          "AgentsForEnergy": "true",
          "Environment": "production",
          "Project": "EnergyAnalytics"
        }
      },
      "eventVersion": "1.08",
      "userIdentity": {
        "type": "IAMUser",
        "principalId": "AIDAXXXXXXXXXXXXXXXXX",
        "arn": "arn:aws:iam::123456789012:user/test-user",
        "accountId": "123456789012",
        "userName": "test-user"
      },
      "eventTime": "2024-03-15T12:30:00Z",
      "eventSource": "athena.amazonaws.com",
      "eventName": "UpdateDataCatalog",
      "awsRegion": "us-east-1",
      "sourceIPAddress": "203.0.113.1",
      "userAgent": "aws-cli/2.0.0",

      "responseElements": {
        "dataCatalog": {
          "name": "my-test-catalog",
          "type": "GLUE",
          "description": "Updated test data catalog for energy data",
          "parameters": {
            "catalog-id": "123456789012",
            "new-parameter": "value"
          },
          "tags": {
            "AgentsForEnergy": "true",
          }
        }
      },
      "requestID": "66666666-7777-8888-9999-000000000000",
      "eventID": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
      "readOnly": false,
      "eventType": "AwsApiCall",
      "managementEvent": true,
      "recipientAccountId": "123456789012",
      "eventCategory": "Management"
    }
  } as EventBridgeEvent<'AWS API Call via CloudTrail', AthenaDataCatalogDetail>

  // {
  //   "version": "0",
  //   "id": "12345678-1234-1234-1234-123456789012",
  //   "detail-type": "AWS API Call via CloudTrail",
  //   "source": "aws.glue",
  //   "account": "123456789012",
  //   "time": "2023-01-01T00:00:00Z",
  //   "region": "us-east-1",
  //   "resources": [],
  //   "detail": {
  //     "eventVersion": "1.08",
  //     "userIdentity": {
  //       // User identity information
  //     },
  //     "eventTime": "2023-01-01T00:00:00Z",
  //     "eventSource": "glue.amazonaws.com",
  //     "eventName": "CreateTable",
  //     "awsRegion": "us-east-1",
  //     "sourceIPAddress": "AWS Internal",
  //     "userAgent": "AWS Internal",
  //     "requestParameters": {
  //       "databaseName": "your-database-name",
  //       "tableInput": {
  //         "name": "your-table-name",
  //         // Other table parameters
  //       }
  //     },
  //     "responseElements": null,
  //     "requestID": "12345678-1234-1234-1234-123456789012",
  //     "eventID": "12345678-1234-1234-1234-123456789012",
  //     "readOnly": false,
  //     "eventType": "AwsApiCall",
  //     "managementEvent": true,
  //     "recipientAccountId": "123456789012"
  //   }
  // }

  const response = await handler(testEvent, dummyContext)

  console.log('Handler response: ', response)
}

main()