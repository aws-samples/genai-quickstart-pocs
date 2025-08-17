import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_ec2 as ec2,
  aws_bedrock as bedrock,
  aws_rds as rds,
  aws_iam as iam,
  aws_secretsmanager as secretsmanager,
  aws_lambda as lambda,
  custom_resources as cr
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface KnowledgeBaseProps {
  vpc: ec2.Vpc;
  bucket: s3.IBucket;
  schemaName: string;
  vectorStorePostgresCluster?: rds.DatabaseCluster;
}

export class AuroraBedrockKnoledgeBase extends Construct {
  public readonly knowledgeBase: bedrock.CfnKnowledgeBase;
  public readonly embeddingModelArn: string
  public readonly vectorStorePostgresCluster: rds.DatabaseCluster
  public readonly vectorStoreWriterNode: rds.CfnDBInstance
  public readonly vectorStoreSchemaName: string

  constructor(scope: Construct, id: string, props: KnowledgeBaseProps) {
    super(scope, id);

    this.vectorStoreSchemaName = props.schemaName

    const defaultDatabaseName = 'bedrock_vector_db'
    const tableName = 'bedrock_kb'
    const primaryKeyField = 'id'
    const vectorField = 'embedding'
    const textField = 'chunks'
    const metadataField = 'metadata'
    const vectorDimensions = 1024

    const stackUUID = cdk.Names.uniqueResourceName(scope, { maxLength: 3 }).toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(-3)

    const rootStack = cdk.Stack.of(scope).nestedStackParent
    if (!rootStack) throw new Error('Root stack not found')

    // this.embeddingModelArn = `arn:aws:bedrock:${rootStack.region}::foundation-model/cohere.embed-multilingual-v3` //512 token window
    this.embeddingModelArn = `arn:aws:bedrock:${rootStack.region}::foundation-model/amazon.titan-embed-text-v2:0` //8k token window

    //If a database cluster is not supplied in the props, create one
    this.vectorStorePostgresCluster = props.vectorStorePostgresCluster ? props.vectorStorePostgresCluster :
      new rds.DatabaseCluster(scope, `VectorStore-${id}-${stackUUID}`, {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_16_4,
        }),
        enableDataApi: true,
        iamAuthentication: true,
        storageEncrypted: true,
        defaultDatabaseName: defaultDatabaseName,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: props.vpc,
        port: 2000,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
    this.vectorStorePostgresCluster.secret?.addRotationSchedule('RotationSchedule', {
      hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser({
        functionName: `SecretRotation-${id}-${stackUUID}`
      }),
      automaticallyAfter: cdk.Duration.days(30),
    });
    // Wait until this writer node is created before running sql queries against the db
    this.vectorStoreWriterNode = this.vectorStorePostgresCluster.node.findChild('writer').node.defaultChild as rds.CfnDBInstance

    // const sqlCommands = [
    //   /* sql */ `
    //   CREATE EXTENSION IF NOT EXISTS vector;
    //   `, /* sql */ `
    //   CREATE SCHEMA ${props.schemaName};
    //   `,/* sql */`
    //   CREATE TABLE ${props.schemaName}.${tableName} (
    //   ${primaryKeyField} uuid PRIMARY KEY,
    //   ${vectorField} vector(${vectorDimensions}),
    //   ${textField} text, 
    //   ${metadataField} json
    //   );
    //   `, /* sql */ `
    //   CREATE INDEX on ${props.schemaName}.${tableName}
    //   USING hnsw (${vectorField} vector_cosine_ops);
    //   `
    // ]

    // Create a Lambda function that runs SQL statements to prepare the postgres cluster to be a vector store
    const prepVectorStoreFunction = new lambda.Function(scope, `PrepVectorStoreFunction-${id}`, {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(10),
      code: lambda.Code.fromInline(`
          const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');

          const rdsDataClient = new RDSDataClient();

          exports.handler = async () => {

              const sqlCommands = [
                /* sql */ \`
                CREATE EXTENSION IF NOT EXISTS vector;
                \`, /* sql */ \`
                CREATE SCHEMA ${props.schemaName};
                \`,/* sql */\`
                CREATE TABLE ${props.schemaName}.${tableName} (
                ${primaryKeyField} uuid PRIMARY KEY,
                ${vectorField} vector(${vectorDimensions}),
                ${textField} text, 
                ${metadataField} json
                );
                \`, /* sql */ \`
                CREATE INDEX on ${props.schemaName}.${tableName}
                USING hnsw (${vectorField} vector_cosine_ops);
                \`
              ]
              
              for (const sqlCommand of sqlCommands) {
                  const params = {
                      resourceArn: '${this.vectorStorePostgresCluster.clusterArn}',
                      secretArn: '${this.vectorStorePostgresCluster.secret?.secretArn}',
                      database: '${defaultDatabaseName}',
                      sql: sqlCommand
                  };

                  console.log('Executing SQL command:', sqlCommand)

                  const command = new ExecuteStatementCommand(params);
                  await rdsDataClient.send(command);
              }
          };
          `
      ),
    });

    prepVectorStoreFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['rds-data:ExecuteStatement'],
      resources: [this.vectorStorePostgresCluster.clusterArn],
    }))

    prepVectorStoreFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [this.vectorStorePostgresCluster.secret!.secretArn],
    }))


    // Create a Custom Resource that invokes the lambda function
    const prepVectorStore = new cr.AwsCustomResource(scope, `PrepVectorStoreCluster-${id}`, {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: prepVectorStoreFunction.functionName,
          Payload: JSON.stringify({}), // No need to pass an event
        },
        physicalResourceId: cr.PhysicalResourceId.of('SqlExecutionResource'),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [prepVectorStoreFunction.functionArn],
        }),
      ]),
    });


    prepVectorStore.node.addDependency(this.vectorStoreWriterNode)

    const knoledgeBaseRole = new iam.Role(this, `KbRole-${id}`, {//'sqlTableKbRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      inlinePolicies: {
        'KnowledgeBasePolicies': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'rds-data:ExecuteStatement',
                'rds-data:BatchExecuteStatement',
                'rds:DescribeDBClusters'
              ],
              resources: [this.vectorStorePostgresCluster.clusterArn],
            }),
            new iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [this.vectorStorePostgresCluster.secret!.secretArn],
            }),
            new iam.PolicyStatement({
              actions: ['bedrock:InvokeModel'],
              resources: [this.embeddingModelArn],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:ListBucket',
                's3:GetObject'
              ],
              resources: [
                props.bucket.bucketArn,
                props.bucket.bucketArn + `/*`
              ],
            }),
          ],
        })
      }
    })

    this.knowledgeBase = new bedrock.CfnKnowledgeBase(this, "KnowledgeBase", {
      name: `${id.slice(0, 60)}-${stackUUID}`,
      roleArn: knoledgeBaseRole.roleArn,
      description: 'This knowledge base stores sql table definitions',
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: this.embeddingModelArn
        }
      },
      storageConfiguration: {
        type: 'RDS',
        rdsConfiguration: {
          credentialsSecretArn: this.vectorStorePostgresCluster.secret!.secretArn,
          databaseName: defaultDatabaseName,
          fieldMapping: {
            metadataField: metadataField,
            primaryKeyField: primaryKeyField,
            textField: textField,
            vectorField: vectorField,
          },
          resourceArn: this.vectorStorePostgresCluster.clusterArn,
          tableName: `${props.schemaName}.${tableName}`,
        },
      }
    });
    this.knowledgeBase.node.addDependency(prepVectorStore);
  }
}




