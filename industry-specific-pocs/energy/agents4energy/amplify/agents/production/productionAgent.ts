
import { stringify } from "yaml"
import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib'
import {
    aws_bedrock as bedrock,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_lambda_event_sources as lambdaEvent,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as sfnTasks,
    aws_athena as athena,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_sqs as sqs,
    aws_glue as glue,
    aws_events as events,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_events_targets as eventsTargets,
    custom_resources as cr
} from 'aws-cdk-lib';

import { bedrock as cdkLabsBedrock } from '@cdklabs/generative-ai-cdk-constructs';

import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';

import path from 'path';
import { fileURLToPath } from 'url';

import { AuroraBedrockKnowledgeBase } from "../../constructs/bedrockKnowledgeBase";

import { addLlmAgentPolicies } from '../../functions/utils/cdkUtils'

const defaultProdDatabaseName = 'proddb'

interface ProductionAgentProps {
    vpc: ec2.Vpc,
    s3Bucket: s3.IBucket,
    s3Deployment: cdk.aws_s3_deployment.BucketDeployment
}

export function productionAgentBuilder(scope: Construct, props: ProductionAgentProps) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const stackName = cdk.Stack.of(scope).stackName
    const stackUUID = cdk.Names.uniqueResourceName(scope, { maxLength: 3 }).toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(-3)

    // console.log("Produciton Stack UUID Long: ", stackUUIDLong)
    console.log("Production Stack UUID: ", stackUUID)

    const rootStack = cdk.Stack.of(scope).nestedStackParent
    if (!rootStack) throw new Error('Root stack not found')

    // Lambda function to apply a promp to a pdf file
    const lambdaLlmAgentRole = new iam.Role(scope, 'LambdaExecutionRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
        inlinePolicies: {
            'BedrockInvocationPolicy': new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ["bedrock:InvokeModel*"],
                        resources: [
                            `arn:aws:bedrock:${rootStack.region}:${rootStack.account}:inference-profile/*`,
                            `arn:aws:bedrock:us-*::foundation-model/*`,
                        ],
                    }),
                    new iam.PolicyStatement({
                        actions: ["s3:GetObject"],
                        resources: [
                            `arn:aws:s3:::${props.s3Bucket.bucketName}/*`
                        ],
                    }),
                    new iam.PolicyStatement({
                        actions: ["s3:ListBucket"],
                        resources: [
                            `arn:aws:s3:::${props.s3Bucket.bucketName}`
                        ],
                    }),
                ]
            })
        }
    });


    const convertPdfToYamlFunction = new NodejsFunction(scope, 'ConvertPdfToYamlFunction', {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '..', '..', 'functions', 'convertPdfToYaml', 'index.ts'),
        bundling: {
            format: OutputFormat.CJS,
            loader: {
                '.node': 'file',
            },
            bundleAwsSDK: true,
            minify: true,
            sourceMap: true,
        },
        timeout: cdk.Duration.minutes(15),
        memorySize: 3000,
        role: lambdaLlmAgentRole,
        environment: {
            DATA_BUCKET_NAME: props.s3Bucket.bucketName,
            // MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'
            // MODEL_ID: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
            // 'MODEL_ID': 'us.anthropic.claude-3-sonnet-20240229-v1:0',
            // 'MODEL_ID': 'us.anthropic.claude-3-haiku-20240307-v1:0',
        },
        // layers: [imageMagickLayer, ghostScriptLayer]
    });

    convertPdfToYamlFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: ["textract:StartDocumentAnalysis", "textract:GetDocumentAnalysis"],
        resources: [
            `*`// textract:StartDocumentAnalysis does not support resource-level permissions: https://docs.aws.amazon.com/textract/latest/dg/security_iam_service-with-iam.html
        ],
    }))

    // This is a way to prevent a circular dependency error when interacting with the well fiel drive bucket

    const pdfDlQueue = new sqs.Queue(scope, 'PdfToYamlDLQ', {
        retentionPeriod: cdk.Duration.days(14), // Keep failed messages for 14 days
    });

    // Create the main queue for processing
    const pdfProcessingQueue = new sqs.Queue(scope, 'PdfToYamlQueue', {
        visibilityTimeout: cdk.Duration.minutes(16), // Should match or exceed lambda timeout
        deadLetterQueue: {
            queue: pdfDlQueue,
            maxReceiveCount: 3 // Number of retries before sending to DLQ
        },
    });

    // Add a queue policy to enforce HTTPS
    for (const queue of [pdfDlQueue, pdfProcessingQueue]) {
        queue.addToResourcePolicy(
            new iam.PolicyStatement({
                sid: 'DenyUnsecureTransport',
                effect: iam.Effect.DENY,
                principals: [new iam.AnyPrincipal()],
                actions: [
                    'sqs:*'
                ],
                resources: [queue.queueArn],
                conditions: {
                    'Bool': {
                        'aws:SecureTransport': 'false'
                    }
                }
            })
        )
    }


    // Grant the Lambda permission to read from the queue
    pdfProcessingQueue.grantConsumeMessages(convertPdfToYamlFunction);

    // Add SQS as trigger for Lambda
    convertPdfToYamlFunction.addEventSource(new lambdaEvent.SqsEventSource(pdfProcessingQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(10),
        maxConcurrency: 90,
    }));

    const wellFileDriveBucket = s3.Bucket.fromBucketName(scope, 'ExistingBucket', props.s3Bucket.bucketName);

    // Now update the S3 notification to send to SQS instead of directly to Lambda
    wellFileDriveBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.SqsDestination(pdfProcessingQueue),
        {
            prefix: 'production-agent/well-files/',
            suffix: '.pdf'
        }
    );

    // Now update the S3 notification to send to SQS instead of directly to Lambda
    wellFileDriveBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.SqsDestination(pdfProcessingQueue),
        {
            prefix: 'production-agent/well-files/',
            suffix: '.PDF'
        }
    );

    // //When a new pdf is uploaded to the well file drive, transform it into YAML and save it back to the well file drive
    // // Add S3 event notification
    // wellFileDriveBucket.addEventNotification(
    //     s3.EventType.OBJECT_CREATED, // Triggers on file upload
    //     new s3n.LambdaDestination(convertPdfToYamlFunction),
    //     {
    //         prefix: 'production-agent/well-files/', // Only trigger for files in this prefix
    //         suffix: '.pdf' // Only trigger for files with this extension
    //     }
    // );

    //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.DatabaseCluster.html
    const hydrocarbonProductionDb = new rds.DatabaseCluster(scope, 'A4E-HydrocarbonProdDb', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
            version: rds.AuroraPostgresEngineVersion.VER_16_4,
        }),
        defaultDatabaseName: defaultProdDatabaseName,
        enableDataApi: true,
        iamAuthentication: true,
        storageEncrypted: true,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: props.vpc,
        port: 5432,
        removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    hydrocarbonProductionDb.secret?.addRotationSchedule('RotationSchedule', {
        hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser({
            functionName: `SecretRotationProdDb-${stackUUID}`
          }),
        automaticallyAfter: cdk.Duration.days(30)
    });
    const writerNode = hydrocarbonProductionDb.node.findChild('writer').node.defaultChild as rds.CfnDBInstance

    //Allow inbound traffic from the default SG in the VPC
    hydrocarbonProductionDb.connections.securityGroups[0].addIngressRule(
        ec2.Peer.securityGroupId(props.vpc.vpcDefaultSecurityGroup),
        ec2.Port.tcp(5432),
        'Allow inbound traffic from default SG'
    );

    const athenaWorkgroup = new athena.CfnWorkGroup(scope, 'FedQueryWorkgroup', {
        name: `${stackName}-fed_query_workgroup`.slice(-64),
        description: 'Workgroup for querying federated data sources',
        recursiveDeleteOption: true,
        workGroupConfiguration: {
            resultConfiguration: {
                outputLocation: `s3://${props.s3Bucket.bucketName}/athena_query_results/`,
            },
        },
    });

    //Add policies to call the work gorup in the lambdaLlmAgentRole
    addLlmAgentPolicies({
        role: lambdaLlmAgentRole,
        rootStack: rootStack,
        athenaWorkgroup: athenaWorkgroup,
        s3Bucket: props.s3Bucket
    })

    // Create the Postgres JDBC connector for Amazon Athena Federated Queries
    const jdbcConnectionString = `postgres://jdbc:postgresql://${hydrocarbonProductionDb.clusterEndpoint.socketAddress}/${defaultProdDatabaseName}?MetadataRetrievalMethod=ProxyAPI&\${${hydrocarbonProductionDb.secret?.secretName}}`

    const postgressConnectorLambdaFunctionName = `query-postgres-${stackUUID}`
    new cdk.CfnOutput(scope, "ProdDbPostgresConnectorInputs", {
        value: stringify({
            DefaultConnectionString: jdbcConnectionString,
            LambdaFunctionName: postgressConnectorLambdaFunctionName,
            SecretNamePrefix: `A4E`,
            SpillBucket: props.s3Bucket.bucketName,
            SpillPrefix: `athena-spill/${rootStack.stackName}`,
            SecurityGroupIds: props.vpc.vpcDefaultSecurityGroup,
            SubnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId).join(',')
        })
    })

    // console.log("postgressConnectorLambdaFunctionName: ", postgressConnectorLambdaFunctionName)
    // const prodDbPostgresConnector = new CfnApplication(scope, 'ProdDbPostgresConnector', {
    //     location: {
    //         applicationId: `arn:aws:serverlessrepo:us-east-1:292517598671:applications/AthenaPostgreSQLConnector`,
    //         semanticVersion: `2024.39.1`
    //     },
    //     parameters: {
    //         DefaultConnectionString: jdbcConnectionString,
    //         LambdaFunctionName: postgressConnectorLambdaFunctionName,
    //         SecretNamePrefix: `A4E`,
    //         SpillBucket: props.s3Bucket.bucketName,
    //         SpillPrefix: `athena-spill/${rootStack.stackName}`,
    //         SecurityGroupIds: props.vpc.vpcDefaultSecurityGroup,
    //         SubnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId).join(',')
    //     }
    // });

    // //Create an athena datasource for postgres databases
    // const athenaPostgresCatalog = new athena.CfnDataCatalog(scope, 'PostgresAthenaDataSource', {
    //     name: `postgres_sample_${stackUUID}`.toLowerCase(),
    //     type: 'LAMBDA',
    //     description: 'Athena data source for postgres',
    //     parameters: {
    //         'function': `arn:aws:lambda:${rootStack.region}:${rootStack.account}:function:${postgressConnectorLambdaFunctionName}`
    //         // 'function': `arn:aws:lambda:${rootStack.region}:${rootStack.account}:function:${jdbcConnectorConfig.functionName}`
    //     },
    // });

    const sqlTableDefBedrockKnowledgeBase = new AuroraBedrockKnowledgeBase(scope, "TableDefinition", {
        vpc: props.vpc,
        bucket: props.s3Bucket,
        schemaName: 'bedrock_integration'
    })

    const productionAgentTableDefDataSource = new bedrock.CfnDataSource(scope, 'sqlTableDefinitions', {
        name: "sqlTableDefinition",
        dataSourceConfiguration: {
            type: 'S3',
            s3Configuration: {
                bucketArn: props.s3Bucket.bucketArn,
                inclusionPrefixes: ['production-agent/table-definitions/']
            },
        },
        vectorIngestionConfiguration: {
            chunkingConfiguration: {
                chunkingStrategy: 'NONE' // This sets the whole file as a single chunk
            }
        },
        knowledgeBaseId: sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseId
    })

    // const petroleumEngineeringKnowledgeBase = new AuroraBedrockKnowledgeBase(scope, "PetrolumEngineeringKB", {
    //     vpc: props.vpc,
    //     bucket: props.s3Bucket,
    //     schemaName: 'petroleum_kb',
    //     vectorStorePostgresCluster: sqlTableDefBedrockKnowledgeBase.vectorStorePostgresCluster
    // })

    // const PetroWikiKnowledgeBase = new BedrockKnowledgeBaseOSS(scope, 'PetroWikiKnowledgeBase', {
    //     knowledgeBaseName: "petrowiki"
    // })

    const petroleumEngineeringKnowledgeBase = new cdkLabsBedrock.KnowledgeBase(scope, `PetroleumKB`, {//${stackName.slice(-5)}
        embeddingsModel: cdkLabsBedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
        instruction: `You are a helpful question answering assistant. You answer
        user questions factually and honestly related to petroleum engineering data`,
        description: 'Petroleum Engineering Knowledge Base',
    });

    const petroleumEngineeringDataSource = petroleumEngineeringKnowledgeBase.addWebCrawlerDataSource({
        sourceUrls: ['https://petrowiki.spe.org/'],
        filters: {
            excludePatterns: ['https://petrowiki\.spe\.org/.+?/.+']//Exclude pages with additional path segments
        },
        dataDeletionPolicy: cdkLabsBedrock.DataDeletionPolicy.RETAIN,
        chunkingStrategy: cdkLabsBedrock.ChunkingStrategy.HIERARCHICAL_TITAN
    })

    new cr.AwsCustomResource(scope, 'StartIngestionPetroleumEngineeringDataSource', {
        onCreate: {
            service: '@aws-sdk/client-bedrock-agent',
            action: 'startIngestionJob',
            parameters: {
                dataSourceId: petroleumEngineeringDataSource.dataSourceId,
                knowledgeBaseId: petroleumEngineeringKnowledgeBase.knowledgeBaseId
            },
            physicalResourceId: cr.PhysicalResourceId.fromResponse('ingestionJob.ingestionJobId')
        },
        onDelete: {
            service: '@aws-sdk/client-bedrock-agent',
            action: 'stopIngestionJob',
            parameters: {
                dataSourceId: petroleumEngineeringDataSource.dataSourceId,
                knowledgeBaseId: petroleumEngineeringKnowledgeBase.knowledgeBaseId,
                ingestionJobId: new cr.PhysicalResourceIdReference()
            },
            ignoreErrorCodesMatching: ".*" //The delete operation should always succeed. If ingestion job is already complete, stopping it will throw an error. That error will be ignored.
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
            new iam.PolicyStatement({
                actions: ['bedrock:startIngestionJob', 'bedrock:stopIngestionJob'],
                resources: [petroleumEngineeringKnowledgeBase.knowledgeBaseArn]
            })
        ])
    })

    lambdaLlmAgentRole.addToPrincipalPolicy(new iam.PolicyStatement({
        actions: ["bedrock:StartIngestionJob"],
        resources: [sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseArn]
    }))

    // Create a Glue Database
    const productionGlueDatabase = new glue.CfnDatabase(scope, 'ProdGlueDb', {
        catalogId: rootStack.account,
        databaseName: `production_db_${stackUUID}`,
        databaseInput: {
            name: `production_db_${stackUUID}`,
            description: 'Database for storing additional information for the production agent'
        }
    });

    // Create IAM role for the Glue crawler
    const crawlerRole = new iam.Role(scope, 'GlueCrawlerRole', {
        assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
        ],
        inlinePolicies: {
            'GetListS3': new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ['s3:GetObject', 's3:ListBucket'],
                        resources: [
                            props.s3Bucket.bucketArn,
                            props.s3Bucket.arnForObjects("*")
                        ],
                    })
                ]
            })
        }
    });

    // Create a Glue crawler
    const crawler = new glue.CfnCrawler(scope, 'GlueCrawler', {
        role: crawlerRole.roleArn,
        databaseName: productionGlueDatabase.ref,
        targets: {
            s3Targets: [
                {
                    path: `s3://${props.s3Bucket.bucketName}/production-agent/structured-data-files/`,
                    exclusions: ['**DS_Store']
                },
            ],
        },
        tablePrefix: 'crawler_',
    });



    ////////////////////////////////////////////////////////////
    /////////////////// Configuration Assets ///////////////////
    ////////////////////////////////////////////////////////////
    const configureProdDbFunction = new NodejsFunction(scope, 'configureProdDbFunction', {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: path.join(__dirname, '..', '..', 'functions', 'configureProdDb', 'index.ts'),
        timeout: cdk.Duration.seconds(300),
        environment: {
            CLUSTER_ARN: hydrocarbonProductionDb.clusterArn,
            SECRET_ARN: hydrocarbonProductionDb.secret!.secretArn,
            DATABASE_NAME: defaultProdDatabaseName,
            ATHENA_WORKGROUP_NAME: athenaWorkgroup.name,
            S3_BUCKET_NAME: props.s3Bucket.bucketName,
            // ATHENA_SAMPLE_DATA_SOURCE_NAME: athenaPostgresCatalog.name,
            TABLE_DEF_KB_ID: sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseId,
            TABLE_DEF_KB_DS_ID: productionAgentTableDefDataSource.attrDataSourceId,
        },
    });

    configureProdDbFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        actions: [
            'rds-data:ExecuteStatement',
        ],
        resources: [`arn:aws:rds:${rootStack.region}:${rootStack.account}:*`],
        conditions: { //This only allows the configurator function to modify resources which are part of the app being deployed.
            'StringEquals': {
                'aws:ResourceTag/rootStackName': rootStack.stackName
            }
        }
    }))

    configureProdDbFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        actions: [
            'secretsmanager:GetSecretValue',
        ],
        resources: [`arn:aws:secretsmanager:${rootStack.region}:${rootStack.account}:secret:*`],
        conditions: { //This only allows the configurator function to modify resources which are part of the app being deployed.
            'StringEquals': {
                'aws:ResourceTag/rootStackName': rootStack.stackName
            }
        }
    }))

    addLlmAgentPolicies({
        role: configureProdDbFunction.role!,
        rootStack: rootStack,
        athenaWorkgroup: athenaWorkgroup,
        s3Bucket: props.s3Bucket
    })

    configureProdDbFunction.addToRolePolicy(
        new iam.PolicyStatement({
            actions: ['bedrock:startIngestionJob'],
            resources: [sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseArn],
        })
    )

    // Create a Custom Resource that invokes only if the dependencies change
    const invokeConfigureProdDbFunctionServiceCall: cr.AwsSdkCall = {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
            FunctionName: configureProdDbFunction.functionName,
            Payload: JSON.stringify({}), // No need to pass an event
            InvocationType: 'Event', // Call the lambda funciton asynchronously
        },
        physicalResourceId: cr.PhysicalResourceId.of('SqlExecutionResource'),
    }

    const prodDbConfigurator = new cr.AwsCustomResource(scope, `configureProdDbAndExportTableInfo-${props.s3Deployment.node.id}`, {
        onCreate: invokeConfigureProdDbFunctionServiceCall,
        onUpdate: invokeConfigureProdDbFunctionServiceCall,
        policy: cr.AwsCustomResourcePolicy.fromStatements([
            new iam.PolicyStatement({
                actions: ['lambda:InvokeFunction'],
                resources: [configureProdDbFunction.functionArn],
            }),
        ]),
    });
    prodDbConfigurator.node.addDependency(writerNode)
    prodDbConfigurator.node.addDependency(props.s3Deployment.deployedBucket) //Make sure the bucket deployment is finished before writing to the bucket

    // Start the knowledge base ingestion job
    //// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/BedrockAgent.html#startIngestionJob-property
    const startIngestionJobResourceCall: cr.AwsSdkCall = {
        service: '@aws-sdk/client-bedrock-agent',
        action: 'startIngestionJob',
        parameters: {
            dataSourceId: productionAgentTableDefDataSource.attrDataSourceId,
            knowledgeBaseId: sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseId,
        },
        physicalResourceId: cr.PhysicalResourceId.of('startKbIngestion'),
    }

    const prodTableKbIngestionJobTrigger = new cr.AwsCustomResource(scope, `startKbIngestion1`, {
        onCreate: startIngestionJobResourceCall,
        // onUpdate: startIngestionJobResourceCall,
        policy: cr.AwsCustomResourcePolicy.fromStatements([
            new iam.PolicyStatement({
                actions: ['bedrock:startIngestionJob'],
                resources: [sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseArn],
            }),
        ]),
    });
    // prodTableKbIngestionJobTrigger.node.addDependency(productionAgentTableDefDataSource)
    prodTableKbIngestionJobTrigger.node.addDependency(prodDbConfigurator)

    //This function will get table definitions from any athena data source with the AgentsForEnergy tag, upload them to s3, and start a knoledge base ingestion job to present them to an agent 
    const recordTableDefAndStarkKBIngestionJob = new NodejsFunction(scope, 'RecordTableDefAndStartKbIngestionJob', {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '..', '..', 'functions', 'recordTableDefAndStartKBIngestion', 'index.ts'),
        bundling: {
            format: OutputFormat.CJS,
            loader: {
                '.node': 'file',
            },
            bundleAwsSDK: true,
            minify: true,
            sourceMap: true,
        },
        timeout: cdk.Duration.minutes(15),
        role: lambdaLlmAgentRole,
        environment: {
            ATHENA_WORKGROUP_NAME: athenaWorkgroup.name,
            S3_BUCKET_NAME: props.s3Bucket.bucketName,
            TABLE_DEF_KB_ID: sqlTableDefBedrockKnowledgeBase.knowledgeBase.attrKnowledgeBaseId,
            TABLE_DEF_KB_DS_ID: productionAgentTableDefDataSource.attrDataSourceId,
            PROD_GLUE_DB_NAME: productionGlueDatabase.ref
        }
    });

    // recordTableDefAndStarkKBIngestionJob.addTest



    // // Trigger the recordTableDefAndStarkKBIngestionJob on the sample data source
    // new cr.AwsCustomResource(scope, `RecordAndIngestSampleData`, {
    //   onCreate: {
    //     service: 'Lambda',
    //     action: 'invoke',
    //     parameters: {
    //       FunctionName: recordTableDefAndStarkKBIngestionJob.functionName,
    //       Payload: JSON.stringify({}), // No need to pass SQL here
    //     },
    //     physicalResourceId: cr.PhysicalResourceId.of('SqlExecutionResource'),
    //   },
    //   policy: cr.AwsCustomResourcePolicy.fromStatements([
    //     new iam.PolicyStatement({
    //       actions: ['lambda:InvokeFunction'],
    //       resources: [recordTableDefAndStarkKBIngestionJob.functionArn],
    //     }),
    //   ]),
    // });

    // // Add dependency to ensure database is created before crawler
    // crawler.addDependency(productionGlueDatabase);

    // // Create the EventBridge rule
    // const newGlueTableRule = new events.Rule(scope, 'GlueTableCreationRule', {
    //     eventPattern: {
    //         source: ['aws.glue'],
    //         detailType: ['AWS API Call via CloudTrail'],
    //         detail: {
    //             eventSource: ['glue.amazonaws.com'],
    //             eventName: ['CreateTable'],
    //             requestParameters: {
    //                 databaseName: [productionGlueDatabase.ref], // Replace with your Glue database name
    //             },
    //         },
    //     },
    // });

    // Now we'll create assets which update the table definition knoledge base when an athena data source is updated
    const athenaDataSourceRule = new events.Rule(scope, 'AthenaDataSourceRule', {
        eventPattern: {
            source: ['aws.athena'],
            detailType: ['AWS API Call via CloudTrail'],
            detail: {
                eventSource: ['athena.amazonaws.com'],
                eventName: [
                    'CreateDataCatalog',
                    'UpdateDataCatalog',
                    'TagResource',
                    'UntagResource',
                ],
                // You can add additional filters in the detail section if needed
                requestParameters: {
                    tags: {
                        'AgentsForEnergy': ['true']
                    }
                }
            }
        }
    });

    recordTableDefAndStarkKBIngestionJob.addPermission('EventBridgeInvoke', {
        principal: new iam.ServicePrincipal('events.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: athenaDataSourceRule.ruleArn,
    });

    // Add targets for both the new athena data source rule, and the new glue table rule
    athenaDataSourceRule.addTarget(new eventsTargets.LambdaFunction(recordTableDefAndStarkKBIngestionJob));
    // newGlueTableRule.addTarget(new eventsTargets.LambdaFunction(recordTableDefAndStarkKBIngestionJob));

    // This step function will invoke the glue crawler, wait until in completes, and then call the recordTableDefAndStarkKBIngestionJob function to load the table defs into the kb
    // Create Step Function tasks
    const startCrawler = new sfnTasks.GlueStartCrawlerRun(scope, 'Start Crawler', {
        crawlerName: crawler.ref,
        integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE
    });

    const checkCrawlerStatus = new sfnTasks.CallAwsService(scope, 'Get Crawler Status', {
        service: 'glue',
        action: 'getCrawler',
        parameters: {
            Name: crawler.ref
        },
        iamResources: [`arn:aws:glue:${rootStack.region}:${rootStack.account}:crawler/${crawler.ref}`]
    });

    const waitX = new sfn.Wait(scope, 'Wait 10 Seconds', {
        time: sfn.WaitTime.duration(cdk.Duration.seconds(10)),
    });

    const invokeLambda = new sfnTasks.LambdaInvoke(scope, 'Invoke Lambda', {
        lambdaFunction: recordTableDefAndStarkKBIngestionJob,
        outputPath: '$.Payload',
    });

    // Create a Choice state to check crawler status
    const isCrawlerComplete = new sfn.Choice(scope, 'Is Crawler Complete?')
        .when(sfn.Condition.stringEquals('$.Crawler.State', 'READY'), invokeLambda)
        .otherwise(waitX);

    // Create the state machine
    const definition = startCrawler
        .next(checkCrawlerStatus)
        .next(isCrawlerComplete);

    waitX.next(checkCrawlerStatus);

    const runCrawlerRecordTableDefintionStateMachine = new sfn.StateMachine(scope, 'CrawlerStateMachine', {
        definition,
        timeout: cdk.Duration.minutes(30),
        tracingEnabled: true,
        logs: {
            destination: new logs.LogGroup(scope, 'CrawlerStateMachineLogs', {
                logGroupName: `/aws/vendedlogs/states/${rootStack.stackName}-CrawlerStateMachineLogs-${stackUUID}`,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                retention: logs.RetentionDays.ONE_MONTH,
            }),
            level: sfn.LogLevel.ALL,
        },
    });

    recordTableDefAndStarkKBIngestionJob.grantInvoke(runCrawlerRecordTableDefintionStateMachine);

    const invokeStepFunctionSDKCall: cr.AwsSdkCall = {
        service: 'StepFunctions',
        action: 'startExecution',
        parameters: {
            stateMachineArn: runCrawlerRecordTableDefintionStateMachine.stateMachineArn,
            input: JSON.stringify({
                action: 'create',
                s3DeploymentBucket: props.s3Deployment.deployedBucket.bucketName
            }),
        },
        physicalResourceId: cr.PhysicalResourceId.of('StepFunctionExecution'),
    }

    // Create a Custom Resource that invokes the Step Function
    const crawlerTriggerCustomResource = new cr.AwsCustomResource(scope, `TriggerCrawler-${props.s3Deployment.node.id}`, {
        onCreate: invokeStepFunctionSDKCall,
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [runCrawlerRecordTableDefintionStateMachine.stateMachineArn],
        }),
    });

    //Make sure the bucket deployment finishs before 
    crawlerTriggerCustomResource.node.addDependency(props.s3Deployment.deployedBucket)

    // Create a Lambda function that will start the Step Function
    const triggerCrawlerSfnFunction = new lambda.Function(scope, `TriggerCrawlerSfnFunction`, {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
            const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

            const stepfunctions = new SFNClient(); // Specify the region

            exports.handler = async (event) => {
                const params = {
                    stateMachineArn: '${runCrawlerRecordTableDefintionStateMachine.stateMachineArn}',
                    input: JSON.stringify(event)
                };
                
                const command = new StartExecutionCommand(params);
                await stepfunctions.send(command);
            };
            
            `),
    });

    runCrawlerRecordTableDefintionStateMachine.grantStartExecution(triggerCrawlerSfnFunction)

    wellFileDriveBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED, // Triggers on file upload
        new s3n.LambdaDestination(triggerCrawlerSfnFunction),
        {
            prefix: 'production-agent/structured-data-files/', // Only trigger for files in this prefix
        }
    );


    return {
        convertPdfToYamlFunction: convertPdfToYamlFunction,
        triggerCrawlerSfnFunction: triggerCrawlerSfnFunction,
        pdfProcessingQueue: pdfProcessingQueue,
        wellFileDriveBucket: wellFileDriveBucket,
        defaultProdDatabaseName: defaultProdDatabaseName,
        hydrocarbonProductionDb: hydrocarbonProductionDb,
        sqlTableDefBedrockKnowledgeBase: sqlTableDefBedrockKnowledgeBase,
        petroleumEngineeringKnowledgeBase: petroleumEngineeringKnowledgeBase,
        athenaWorkgroup: athenaWorkgroup,
        // athenaPostgresCatalog: athenaPostgresCatalog
    };
}