import { handler } from "@/../amplify/functions/convertPdfToYaml/index"
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
  process.env.AWS_DEFAULT_REGION = outputs.auth.aws_region

  await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'ConvertPdfToYamlFunction'))

  const testEvent = {
    "Records": [
        {
            "messageId": "7a984573-ccec-4e46-abea-1dd5ade5afbe",
            "receiptHandle": "AQEBQ9HJozlopJCagqLu17ajzLPgjB2+/BABuR1rSfzVQXvbYOPmZY5yiVAQaz0pyQj6hTeulKchxPZJ6abw3DucuZoobrcoM3msppVmZ76qPn8kqTMUJssW8wCTSJLwx97l+10k2qz/z1zDc3OH6m9W2Pea974Z2T50STtWHQY5KsSt+gGHKZjzoZflOldyh/6Qvh4gWXYpYMug8SJeNb6KzG0NQTUOAA+sUL6ckfYAEj8m/cgZ5i6lzU/hb4y7xEymL73GQWJLRWUDU8BsvllvX/EYboitrzIBTtURTG9gTh25chshV2nwjb0maTW5FDkY1wS/k/fxUcFnI5waOaaJC72gREnUMC9EnvZi22rSDG4ouWTY+Qqv8fjrdjJ6KAHt0oC2OBetvVZTsQYxHK4Ui49fxgayejnGeVijKcd96xNHMJ+YIZmwO+U9dMtm8Nict/Eb8npX/dIn5xKp+sEhXvkxALJ65PDtH6MQIG9mm4s=",
            "body": "{\"Records\":[{\"eventVersion\":\"2.1\",\"eventSource\":\"aws:s3\",\"awsRegion\":\"us-east-1\",\"eventTime\":\"2024-12-02T17:57:19.819Z\",\"eventName\":\"ObjectCreated:Copy\",\"userIdentity\":{\"principalId\":\"AWS:AROARQKFKHN2LJQXD5K3B:waltmayf+management@amazon.com\"},\"requestParameters\":{\"sourceIPAddress\":\"136.62.253.122\"},\"responseElements\":{\"x-amz-request-id\":\"Q1WGRGKKD9Q9SEHC\",\"x-amz-id-2\":\"ypCkHbztqIi4uVe+JRsxiOQKpDVHm7UyS5h/6S0IiEeU6p/467TmgLSMb7JgSvra1gUGUa3V5XncLs6KFOwemYpGH7CraNp3\"},\"s3\":{\"s3SchemaVersion\":\"1.0\",\"configurationId\":\"arn:aws:cloudformation:us-east-1:103761460084:stack/amplify-agentsforenergy-pw-sandbox-8d46451425-prodAgentStack8401ED6B-1X1UK0L60C7PU/68a16910-aced-11ef-b780-1263c9eff61d--6305615801843184238\",\"bucket\":{\"name\":\"amplify-agentsforenergy-pw-filedrivebucket01be03e1-oxivxspzy85y\",\"ownerIdentity\":{\"principalId\":\"A32XJER8F2MVSC\"},\"arn\":\"arn:aws:s3:::amplify-agentsforenergy-pw-filedrivebucket01be03e1-oxivxspzy85y\"},\"object\":{\"key\":\"production-agent/well-files/field%3DSanJuanEast/api%3D30-045-29202/30045292020000_12_wf.pdf\",\"size\":1103171,\"eTag\":\"58100e5bee694a518797e94c80f07559\",\"sequencer\":\"00674DF4FFA0F6ADFB\"}}}]}",
            "attributes": {
                "ApproximateReceiveCount": "3",
                "SentTimestamp": "1733162240572",
                "SenderId": "AROA4R74ZO52XAB5OD7T4:S3-PROD-END",
                "ApproximateFirstReceiveTimestamp": "1733162252325"
            },
            "messageAttributes": {},
            "md5OfBody": "d539ffe576e9720aa5147345a813c4ce",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:103761460084:amplify-agentsforenergy-pw-sandbox-8d4645142-PdfToYamlQueue4E2C37F2-MIsiQmYJE4vw",
            "awsRegion": "us-east-1"
        }
    ]
}

  const response = await handler(testEvent, dummyContext, () => null)

  console.log('Handler response: ', response)
}

main()