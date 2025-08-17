import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { bedrock as cdkLabsBedrock } from '@cdklabs/generative-ai-cdk-constructs';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

interface BedrockAgentBuilderProps {
    description?: string;
    modelId?: string;
    environment?: string;
    instruction?: string;
    vpc: aws_ec2.Vpc;
    s3Bucket: s3.IBucket;
    s3Deployment: cdk.aws_s3_deployment.BucketDeployment;
    regulatoryAgentId?: string;
    regulatoryAgentAliasId?: string;
}

export function regulatoryAgentBuilder(scope: Construct, props: BedrockAgentBuilderProps) {
    const resourcePrefix = scope.node.tryGetContext('resourcePrefix') || 'regulatory';
    const environment = props.environment || scope.node.tryGetContext('environment') || 'dev';

    // Declare a UUID to append to resources to avoid naming collisions in Amplify
    const stackUUID = cdk.Names.uniqueResourceName(scope, { maxLength: 3 }).toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(-3)
    

    // Create IAM role for the Bedrock Agent
    const regulatoryAgentRole = new iam.Role(scope, 'RegulatoryAgentRole', {
        assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
        roleName: `BedrockAgentRole-${stackUUID}`,
        path: '/service-role/',
        description: 'Execution role for Bedrock Regulatory Agent'
    });

    // Add required permissions instead of using the non-existent managed policy
    regulatoryAgentRole.addToPolicy(
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:Retrieve',
                'bedrock:ListFoundationModels',
                'bedrock:ListCustomModels',
                'bedrock:InvokeAgent',
                'bedrock:RetrieveAgent'
            ],
            resources: [
                `arn:aws:bedrock:${cdk.Stack.of(scope).region}::foundation-model/*`,
                `arn:aws:bedrock:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:agent/*`,
                `arn:aws:bedrock:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:knowledge-base/*`
            ]
        })
    );

    // Add CloudWatch Logs permissions
    regulatoryAgentRole.addToPolicy(
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            resources: [
                `arn:aws:logs:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:log-group:/aws/bedrock/*`
            ]
        })
    );

    // Add S3 access permissions
    props.s3Bucket.grantRead(regulatoryAgentRole);
    
    // Default instruction for the regulatory agent
    const defaultInstruction = `You are a helpful regulatory assistant that uses your knowledge base to answer user questions. 
    Always answer the question as factually correct as possible and cite your sources from your knowledge base. 
    When providing regulatory guidance:
    1. Always reference specific regulations or documents from the knowledge base
    2. Indicate if any information might be outdated
    3. Suggest related regulatory requirements the user should consider
    4. If uncertain, recommend consulting official regulatory bodies
    5. Provide context for why specific regulations exist when relevant`;

    // Create regulatory knowledge base and s3 data source for the KB
    const regulatoryKnowledgeBase = new cdkLabsBedrock.KnowledgeBase(scope, `KB-regulatory`, {
        embeddingsModel: cdkLabsBedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
        instruction: `You are a helpful question answering assistant. You answer user questions factually and honestly related to regulatory requirements in oil and gas facilities globally`,
        description: 'Regulatory Knowledge Base',
    });
    const s3docsDataSource = regulatoryKnowledgeBase.addS3DataSource({
        bucket: props.s3Bucket,
        dataSourceName: "a4e-kb-ds-s3-regulatory",
        inclusionPrefixes: ['regulatory-agent/'],
    })

    // Create the Bedrock agent with the role
    const cfnAgentProps: bedrock.CfnAgentProps = {
        agentName: `${resourcePrefix}-agent-${stackUUID}`,
        description: props.description || 'This agent is designed to help with regulatory compliance.',
        instruction: props.instruction || defaultInstruction,
        foundationModel: props.modelId || 'anthropic.claude-3-haiku-20240307-v1:0',
        agentResourceRoleArn: regulatoryAgentRole.roleArn,
        autoPrepare: true,
        knowledgeBases: [{
                knowledgeBaseId: regulatoryKnowledgeBase.knowledgeBaseId,
                description: 'Knowledge Base for regulatory requirements',
                knowledgeBaseState: 'ENABLED'
            }],
    
    };

    // Create the Bedrock agent
    const regulatoryAgent = new bedrock.CfnAgent(
        scope,
        'RegulatoryAgent',
        cfnAgentProps
    );

    // Create an alias for the agent
    const regulatoryAgentAlias = new bedrock.CfnAgentAlias(
        scope,
        'RegulatoryAgentAlias',
        {
            agentId: regulatoryAgent.attrAgentId,
            agentAliasName: `${resourcePrefix}-agent-alias-${stackUUID}`
        }
    );

    regulatoryAgentAlias.addDependency(regulatoryAgent);

    // Apply removal policies
    regulatoryAgent.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
    regulatoryAgentAlias.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // Create CloudWatch metrics
    const metric = new cdk.aws_cloudwatch.Metric({
        namespace: 'RegulatoryAgent',
        metricName: 'Invocations',
        dimensionsMap: {
            AgentId: regulatoryAgent.attrAgentId,
            Environment: environment
        }
    });

    // Create CloudWatch alarm
    new cdk.aws_cloudwatch.Alarm(scope, 'RegulatoryAgentErrorAlarm', {
        metric: metric,
        threshold: 5,
        evaluationPeriods: 1,
        alarmDescription: 'Alert when regulatory agent encounters multiple errors',
        comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });

    // Add trust policy conditions
    const cfnRole = regulatoryAgentRole.node.defaultChild as iam.CfnRole;
    cfnRole.addPropertyOverride('AssumeRolePolicyDocument.Statement.0.Condition', {
    StringEquals: {
        'aws:SourceAccount': cdk.Stack.of(scope).account
    }
});
    return {
        regulatoryAgent,
        regulatoryAgentAlias,
        regulatoryAgentRole,
        metric
    };
}
