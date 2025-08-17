// import { generateAmplifyClientWrapper } from '../../amplify/functions/utils/amplifyUtils'
// import outputs from '@/../amplify_outputs.json';
// // import { convertPdfToImages } from '../../amplify/functions/graphql/queries'

// // import { AppSyncClient } from '@aws-sdk/client-appsync';

// // import AWS from 'aws-sdk';

// // console.log('AWS Region: ', AWS.config.region)
// // const credentials = new AWS.EnvironmentCredentials('AWS');


// // console.log('amplifyClient: ', amplifyClientWrapper)

// const main = async function () {
//     const creds = await credentials.getPromise();
//     console.log('creds: ', creds)
//     const env = {
//         AMPLIFY_DATA_GRAPHQL_ENDPOINT: outputs.data.url,
//         AWS_REGION: outputs.data.aws_region
//     }

//     console.log('env: ', env)

//     const amplifyClientWrapper = generateAmplifyClientWrapper(env)

//     const messages = await amplifyClientWrapper.getChatMessageHistory({
//         chatSessionId: "133dfbbb-359c-460a-989e-5d94b300da30",
//         latestHumanMessageText: "Hello World"
//     })

//     console.log("messages: ", messages)


//     // const convertPdfToImagesResponse = await amplifyClientWrapper.amplifyClient.graphql({
//     //     query: convertPdfToImages,
//     //     variables: {
//     //         s3Key: "production-agent/well-files/field=SanJuanEast/uwi=30-039-07715/30-039-07715_00131.pdf"
//     //     }
//     // })
//     // console.log('convertPdfToImagesResponse: ', convertPdfToImagesResponse)

// }

// main()   