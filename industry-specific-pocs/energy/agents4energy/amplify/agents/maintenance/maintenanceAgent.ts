// Agents4Energy - Maintenance Agent
import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';
import { Stack, Fn, Aws, Token } from 'aws-cdk-lib';
import {
    aws_bedrock as bedrock,
    aws_iam as iam,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
    aws_rds as rds,
    aws_lambda as lambda,
    aws_ec2 as ec2,
    custom_resources as cr
} from 'aws-cdk-lib';
import { bedrock as cdkLabsBedrock } from '@cdklabs/generative-ai-cdk-constructs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addLlmAgentPolicies } from '../../functions/utils/cdkUtils'

interface AgentProps {
    vpc: ec2.Vpc,
    s3Bucket: s3.IBucket,
    s3Deployment: cdk.aws_s3_deployment.BucketDeployment
}

export function maintenanceAgentBuilder(scope: Construct, props: AgentProps) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const stackName = cdk.Stack.of(scope).stackName;
    const stackUUID = cdk.Names.uniqueResourceName(scope, { maxLength: 3 }).toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(-3);
    const defaultDatabaseName = 'maintdb';
    const foundationModel = 'anthropic.claude-3-sonnet-20240229-v1:0';
    // const foundationModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    const agentName = `A4E-Maintenance-${stackUUID}`;
    const agentRoleName = `AmazonBedrockExecutionRole_A4E_Maintenance-${stackUUID}`;
    const agentDescription = 'Agent for energy industry maintenance workflows';
    const knowledgeBaseName = `A4E-KB-Maintenance-${stackUUID}`;
    const postgresPort = 5432;
    const maxLength = 4096;

    console.log("Maintenance Stack UUID: ", stackUUID)

    const rootStack = cdk.Stack.of(scope).nestedStackParent
    if (!rootStack) throw new Error('Root stack not found')

    // Agent-specific tags
    const maintTags = {
        Agent: 'Maintenance',
        Model: foundationModel
    }

    const bedrockAgentRole = new iam.Role(scope, 'BedrockAgentRole', {
        roleName: agentRoleName,
        assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
        description: 'IAM role for Maintenance Agent to access KBs and query CMMS',
    });


    // ===== CMMS Database =====
    // Create Aurora PostgreSQL DB for CMMS - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.DatabaseCluster.html
    const maintDb = new rds.DatabaseCluster(scope, 'MaintDB', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
            version: rds.AuroraPostgresEngineVersion.VER_16_4,
        }),
        defaultDatabaseName: defaultDatabaseName,
        enableDataApi: true,
        iamAuthentication: true,
        storageEncrypted: true,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: props.vpc,
        port: postgresPort,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        
    });
    maintDb.secret?.addRotationSchedule('RotationSchedule', {
        hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser({
            functionName: `SecretRotationMaintDb-${stackUUID}`
          }),
        automaticallyAfter: cdk.Duration.days(30)
    });
    const writerNode = maintDb.node.findChild('writer').node.defaultChild as rds.CfnDBInstance // Set this as a dependency to cause a resource to wait until the database is queriable

    //Allow inbound traffic from the default SG in the VPC
    maintDb.connections.securityGroups[0].addIngressRule(
        ec2.Peer.securityGroupId(props.vpc.vpcDefaultSecurityGroup),
        ec2.Port.tcp(postgresPort),
        'Allow inbound traffic from default SG'
    );
    
    // Create a Lambda function that runs SQL statements to prepare the postgres cluster with sample data
    const prepDbFunction = new lambda.Function(scope, `PrepDbFunction`, {
        description: 'Agents4Energy CMMS data population function - will reset data with each run',
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: 'index.handler',
        timeout: cdk.Duration.minutes(15),
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        environment: {
            MAINT_DB_CLUSTER_ARN: maintDb.clusterArn,
            MAINT_DB_SECRET_ARN: maintDb.secret!.secretArn,
            DEFAULT_DATABASE_NAME: defaultDatabaseName
            
        }
    });

    prepDbFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        actions: ['rds-data:ExecuteStatement'],
        resources: [maintDb.clusterArn],
    }))
    prepDbFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [maintDb.secret!.secretArn],
    }))
    // Create a Custom Resource that invokes the lambda function to populate sample data into CMMS database
    const prepDb = new cr.AwsCustomResource(scope, `PrepDatabase`, {
        onCreate: {
            service: 'Lambda',
            action: 'invoke',
            parameters: {
                FunctionName: prepDbFunction.functionName,
                Payload: JSON.stringify({}), // No need to pass an event
            },
            physicalResourceId: cr.PhysicalResourceId.of('SqlExecutionResource'),
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
            new iam.PolicyStatement({
                actions: ['lambda:InvokeFunction'],
                resources: [prepDbFunction.functionArn],
            }),
        ]),
    });
    prepDb.node.addDependency(writerNode)// Now the prepDb resource will wait until the database is available before running the setup script.


    // ===== MAINTENANCE KNOWLEDGE BASE =====
    // Bedrock KB with OpenSearchServerless (OSS) vector backend
    const maintenanceKnowledgeBase = new cdkLabsBedrock.KnowledgeBase(scope, `KB-Maintenance`, {//${stackName.slice(-5)}
        embeddingsModel: cdkLabsBedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
        // name: knowledgeBaseName, //Note: The knowledge base name will contain the id of this construct "MaintKB" even without this key being set
        instruction: `You are a helpful question answering assistant. You answer user questions factually and honestly related to industrial facility maintenance and operations`,
        description: 'Maintenance Knowledge Base',
    });
    const s3docsDataSource = maintenanceKnowledgeBase.addS3DataSource({
        bucket: props.s3Bucket,
        dataSourceName: "a4e-kb-ds-s3-maint",
        inclusionPrefixes: ['maintenance-agent/'],
        //chunkingStrategy: cdkLabsBedrock.ChunkingStrategy.NONE
    })
    const oilfieldServiceDataSource = maintenanceKnowledgeBase.addWebCrawlerDataSource({
        dataSourceName: "a4e-kb-ds-web",
        sourceUrls: ['https://novaoilfieldservices.com/learn/'],
        dataDeletionPolicy: cdkLabsBedrock.DataDeletionPolicy.RETAIN,
        chunkingStrategy: cdkLabsBedrock.ChunkingStrategy.HIERARCHICAL_TITAN
    })

    // ===== ACTION GROUP =====
    // Lambda Function
    const lambdaFunction = new lambda.Function(scope, 'QueryCMMS', {
        //functionName: 'Query-CMMS',
        description: 'Agents4Energy tools to query CMMS database',
        runtime: lambda.Runtime.PYTHON_3_12,
        code: lambda.Code.fromAsset('amplify/functions/text2SQL/'),
        handler: 'maintenanceAgentAG.lambda_handler',
        timeout: cdk.Duration.seconds(90),
        environment: {
            database_name: defaultDatabaseName,
            db_resource_arn: maintDb.clusterArn,
            db_credentials_secrets_arn: maintDb.secret!.secretArn,
        }
    });
    lambdaFunction.node.addDependency(maintDb);
    // Add DB query permissions to the Lambda function's role
    const policyRDS = new iam.PolicyStatement({
        actions: ["rds-data:ExecuteStatement", "rds-data:ExecuteSql",],
        resources: [maintDb.clusterArn]
    });
    // Add Secret permissions to the Lambda function's role
    const policySecret = new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue",],
        resources: [maintDb.secret!.secretArn]
    });
    // Add the policies to the Lambda function's role
    if (lambdaFunction.role) {
        lambdaFunction.role.addToPrincipalPolicy(policyRDS);
        lambdaFunction.role.addToPrincipalPolicy(policySecret);
    } else {
        console.warn("Lambda function role is undefined, cannot add policy.");
    }


    // ===== BEDROCK AGENT =====
    //const agentMaint = new BedrockAgent(scope, 'MaintenanceAgent', {
    const agentMaint = new bedrock.CfnAgent(scope, 'MaintenanceAgent', {
        agentName: agentName,
        description: agentDescription,
        instruction: `You are an industrial maintenance specialist who has access to files and data about internal company operations.  
        Shift handover reports, maintenance logs, work permits, safety inspections and other data should be used to provide insights on the efficiency and 
        safety of operations for the facility or operations manager.  To find information from the Computerized Maintenance Management System (CMMS), first 
        try to use the action group tool to query the SQL database as it is is the definitive system of record for information.  
        
        The kb-maintenance Bedrock Knowledge base may also have information in documents.  Alert the user if you find discrepancies between the relational 
        database and documents in the KB.  For each request, check both data sources and compare the data to see if it matches.  When running SQL statements, 
        verify that the syntax is correct and results are returned from the CMMS database.  If you do not get results, rewrite the query and try again.`,
        foundationModel: foundationModel,
        autoPrepare: true,
        knowledgeBases: [{
            description: 'Maintenance Knowledge Base',
            knowledgeBaseId: maintenanceKnowledgeBase.knowledgeBaseId,
            // the properties below are optional
            knowledgeBaseState: 'ENABLED',
        }],
        actionGroups: [{
            actionGroupName: 'Query-CMMS-AG',
            actionGroupExecutor: {
                lambda: lambdaFunction.functionArn,
            },
            actionGroupState: 'ENABLED',
            description: 'Action group to perform SQL queries against CMMS database',
            functionSchema: {
                functions: [{
                    name: 'get_tables',
                    description: 'get a list of usable tables from the database',
                }, {
                    name: 'get_tables_information',
                    description: 'get the column level details of a list of tables',
                    parameters: {
                        'tables_list': {
                            type: 'array',
                            description: 'list of tables',
                            required: true,
                        },
                    },
                }, {
                    name: 'execute_statement',
                    description: 'Execute a SQL query against the CMMS databases',
                    parameters: {
                        'sql_statement': {
                            type: 'string',
                            description: 'the SQL query to execute',
                            required: true,
                        },
                    },
                }
                ],
            },
        }],
        agentResourceRoleArn: bedrockAgentRole.roleArn,
        promptOverrideConfiguration: {
            promptConfigurations: [{
                basePromptTemplate: `{
        "anthropic_version": "bedrock-2023-05-31",
        "system": "
            $instruction$
            You have been provided with a set of functions to answer the user's question.
            You must call the functions in the format below:
            <function_calls>
            <invoke>
                <tool_name>$TOOL_NAME</tool_name>
                <parameters>
                <$PARAMETER_NAME>$PARAMETER_VALUE</$PARAMETER_NAME>
                ...
                </parameters>
            </invoke>
            </function_calls>
            Here are the functions available:
            <functions>
            $tools$
            </functions>
            You will ALWAYS follow the below guidelines when you are answering a question:
            <guidelines>
            - Think through the user's question, extract all data from the question and the previous conversations before creating a plan.
            - The CMMS database is the system of record.  Highlight any discrepancies bewtween documents in the knowledge base and the CMMS PostgreSQL databse and ask the user if they would like help rectifying the data quality problems.
            - ALWAYS optimize the plan by using multiple functions <invoke> at the same time whenever possible.
            - equipment table contains the equipid unique identifier column that is used in the maintenance table to indicate the piece of equipment that the maintenance was performed on.
            - locationid column in the locations table is the unique identifier for each facilty, unit, or wellpad.
            - Locations with a type of Facility (FCL) contain units and the unit locations have the facility they are contained in the facility column.  For example, the Biodiesel Unit is at the Sandy Point Refilery (Location 928)
            - NEVER attempt to join equipid ON locationid or installlocationid as these fields are different values and data types.
            - ALWAYS preface the table name with the schema when writing SQL.
            - Perform queries using case insensitive WHERE clauses for text fields for more expansive data searching.
            - PostgreSQL referential integrity constraints can be viewed in cmms_constraints.  Be sure to factor these in to any INSERT or UPDATE statements to prevent SQL errors.
            - ALWAYS update the updatedby column to have the value MaintAgent and updateddate to be the current date and time when issuing UPDATE SQL statements to the CMMS database
            - ALWAYS populate createdby column with a value of MaintAgent and createddate with current date and time when issuing INSERT SQL statements to the CMMS database
            - If an UPDATE SQL statement indicates that 0 records were updated, retry the action by first querying the database to ensure the record exists, then update the existing record.  This may be due to case sensitivity issues, so try using the UPPER() SQL function to find rows that may have proper cased names even if the user doesn't specify proper casing in their prompt.
            - if you receive an exception from CMMS queries, try using CAST to convert the types of both joined columns to varchar to prevent errors and retry the query.
            - Never assume any parameter values while invoking a function.
            $ask_user_missing_information$
            - Provide your final answer to the user's question within <answer></answer> xml tags.
            - Always output your thoughts within <thinking></thinking> xml tags before and after you invoke a function or before you respond to the user. 
            $knowledge_base_guideline$
            $code_interpreter_guideline$
            </guidelines>
            $code_interpreter_files$
            $memory_guideline$
            $memory_content$
            $memory_action_guideline$
            $prompt_session_attributes$
            ",
                    "messages": [
                        {
                            "role" : "user",
                            "content" : "$question$"
                        },
                        {
                            "role" : "assistant",
                            "content" : "$agent_scratchpad$"
                        }
                    ]
            }`,
                inferenceConfiguration: {
                    maximumLength: maxLength,
                    stopSequences: ['</function_calls>', '</answer>', '</error>'],
                    temperature: 1,
                    topK: 250,
                    topP: 0.9,
                },
                promptCreationMode: 'OVERRIDDEN',
                promptState: 'ENABLED',
                promptType: 'ORCHESTRATION',
            }]
        }
    });

    // Add dependency on the KB so it gets created first
    agentMaint.node.addDependency(maintenanceKnowledgeBase);

    // Grant invoke permission to the Bedrock Agent
    const bedrockAgentArn = agentMaint.attrAgentArn;
    lambdaFunction.addPermission('BedrockInvokePermission', {
        principal: new iam.ServicePrincipal('bedrock.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: bedrockAgentArn,
    });

    // Create a custom inline policy for Agent permissions
    const customAgentPolicy = new iam.Policy(scope, 'A4E-MaintAgentPolicy', {
        //policyName: 'A4E-MaintAgentPolicy', // Custom policy name
        statements: [
            new iam.PolicyStatement({
                actions: ['bedrock:InvokeModel'],
                resources: [
                    `arn:aws:bedrock:${rootStack.region}:${rootStack.account}:inference-profile/*`,
                    // "arn:aws:bedrock:${rootStack.region}::foundation-model/amazon.nova-lite-v1:0",
                    // "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                    // "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                    // "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0",
                    // "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0",
                    `arn:aws:bedrock:us-*::foundation-model/*`,
                ]
            }),
            new iam.PolicyStatement({
                actions: ['bedrock:Retrieve'],
                resources: [
                    maintenanceKnowledgeBase.knowledgeBaseArn
                ]
            }),
        ]
    });
    // Add custom policy to the Agent role
    bedrockAgentRole.attachInlinePolicy(customAgentPolicy);

    // Add tags to all resources in this scope
    cdk.Tags.of(scope).add('Agent', maintTags.Agent);
    cdk.Tags.of(scope).add('Model', maintTags.Model);

    //Add an agent alias to make the agent callable
    const maintenanceAgentAlias = new bedrock.CfnAgentAlias(scope, 'maintenance-agent-alias', {
        agentId: agentMaint.attrAgentId,
        agentAliasName: `agent-alias`
    });

    return {
        defaultDatabaseName: defaultDatabaseName,
        maintenanceAgent: agentMaint,
        maintenanceAgentAlias: maintenanceAgentAlias
    };
}
