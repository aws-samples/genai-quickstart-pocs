// Agents4Energy - Petrophysics Agent
import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';
import { Stack, Fn, Aws, Token } from 'aws-cdk-lib';
import {
    aws_bedrock as bedrock,
    aws_iam as iam,
    aws_s3 as s3,
    aws_ec2 as ec2,
    custom_resources as cr
} from 'aws-cdk-lib';
import { bedrock as cdkLabsBedrock } from '@cdklabs/generative-ai-cdk-constructs';
import path from 'path';
import { fileURLToPath } from 'url';


interface AgentProps {
    vpc: ec2.Vpc,
    s3Bucket: s3.IBucket,
    s3Deployment: cdk.aws_s3_deployment.BucketDeployment
}

export function petrophysicsAgentBuilder(scope: Construct, props: AgentProps) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const stackName = cdk.Stack.of(scope).stackName;
    const stackUUID = cdk.Names.uniqueResourceName(scope, { maxLength: 3 }).toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(-3);
    // list of models can be found here https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
    const foundationModel = 'anthropic.claude-3-haiku-20240307-v1:0';
    const agentName = `A4E-Petrophysics-${stackUUID}`;
    const agentRoleName = `AmazonBedrockExecutionRole_A4E_Petrophysics-${stackUUID}`;
    const agentDescription = 'Agent for energy industry subsurface workflows';

    console.log("Petrophysics Stack UUID: ", stackUUID)

    const rootStack = cdk.Stack.of(scope).nestedStackParent
    if (!rootStack) throw new Error('Root stack not found')

    // Agent-specific tags
    const agentTags = {
        Agent: 'Petrophysics',
        Model: foundationModel
    }

    // ===== IAM ROLE =====
    // IAM Role for Agent
    const agentRole = new iam.Role(scope, 'PetrophysicsAgentRole', {
        roleName: agentRoleName,
        assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
        description: 'IAM role for Petrophysics Agent to access KBs with petrophyics, rock physics and other geoscientific documents',
    });

    // ===== KNOWLEDGE BASE =====
    // Bedrock KB with OpenSearchServerless (OSS) vector backend
    const knowledgeBase = new cdkLabsBedrock.KnowledgeBase(scope, `PetrophysicsKB`, {
        embeddingsModel: cdkLabsBedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
        instruction: `You are a helpful question answering assistant. When asked to perform a mathematical calculation use the relationship and equations that are available in the knowledgebase.`,
        description: 'The knowledge base contains published scientific literature on seismic petrophysics and rock physics',
    });
    
    // Add S3 data source to the knowledge base
    const s3docsDataSource = knowledgeBase.addS3DataSource({
        bucket: props.s3Bucket,
        dataSourceName: "a4e-kb-ds-s3-petrophysics",
        inclusionPrefixes: ['petrophysics-agent/'],
    });

    // ===== AGENT POLICY =====
    // Create a custom inline policy for Agent permissions
    const agentPolicy = new iam.Policy(scope, 'PetrophysicsAgentPolicy', {
        statements: [
            new iam.PolicyStatement({
                actions: ['bedrock:InvokeModel'],
                resources: [
                    `arn:aws:bedrock:${rootStack.region}:${rootStack.account}:inference-profile/*`,
                    `arn:aws:bedrock:us-*::foundation-model/*`,
                ]
            }),
            new iam.PolicyStatement({
                actions: ['bedrock:Retrieve'],
                resources: [
                    knowledgeBase.knowledgeBaseArn
                ]
            }),
        ]
    });
    
    // Attach policy to the agent role
    agentRole.attachInlinePolicy(agentPolicy);

    // ===== BEDROCK AGENT =====
    const agent = new bedrock.CfnAgent(scope, 'PetrophysicsAgent', {
        agentName: agentName,
        description: agentDescription,
        instruction: `You are a petrophysics agent who can answer questions on seismic petrophysics and perform calculations using Gassmann's equation; Batzle-Wang's equations and other related equations provided in the knowledgebase. You will prompt the user to provide inputs that you are missing while running those calculations. You will provide answers that are based on your calculations and the information provided to you by the user and available to you in the knowledgebase. Show all intermediate calculations.
        
        <context>
        Example 1:
        User : Give me the expected seismic velocities and density of a gas saturated reservoir, if the brine saturated Vp = 3.5 km/s, Vs = 1.95 km/s and Rhob = 2.23 gm/s

        Agent's task: 
        1) Evaluate bulk modulus and density of matrix
        2) Estimate bulk modulus and density of brine 
        3) Estimate bulk modulus and density of the initial hydrocarbon (oil or gas)
        4) Evaluate bulk modulus and density of initial fluid (using bulk moduli and densities of brine and initial hydrocarbon)
        5). Initial fluid is defined by initial water saturation and the type of initial hydrocarbon. If it is oil, it contains some dissolved gas defined by the GOR value RG.
        6) Evaluate initial saturated bulk modulus and shear modulus 
        7) Estimate frame bulk modulus using inverse Gassmann's equation
        8) Estimate bulk modulus and density of the desired hydrocarbon (oil or gas).
        9) Evaluate bulk modulus and density of desired fluid (use bulk moduli and densities of brine and desired hydrocarbon)
        10) Desired fluid is defined by the target water saturation and the type of desired hydrocarbon. 
        11) Estimate density of desired saturated rock after fluid substitution 
        12) Estimate bulk modulus of the desired saturated rock after fluid substitution using Gassmann's equation
        13) Shear modulus of the desired saturated rock remains same as that of initial saturated rock
        14) Estimate final saturated rock seismic velocities (km/s) 

        Return final saturated seismic velocities and bulk density

        Example 2:
        User : Give me the expected AVO Class for a gas saturated sandstone with 25% porosity that is overlain by a shale whose Vp = 2.5 km/s and bulk density = 2.67 gm/cc

        Agent's task:
        1) Evaluate seismic velocities and bulk density of overburden shale.
        2) Evaluate seismic velocities and bulk density of the medium for the desired fluid saturation
        3) Evaluate intercept and gradient 
        4) Use intercept and gradient interpretation guidelines to determine AVO Class
        </context>
        `,
        foundationModel: foundationModel,
        autoPrepare: true,
        knowledgeBases: [{
            description: 'Petrophysics Knowledge Base',
            knowledgeBaseId: knowledgeBase.knowledgeBaseId,
            knowledgeBaseState: 'ENABLED',
        }],
        agentResourceRoleArn: agentRole.roleArn,
    });
    
    // Add dependency on the KB so it gets created first
    agent.node.addDependency(knowledgeBase);

    // ===== AGENT ALIAS =====
    // Add an agent alias to make the agent callable
    const agentAlias = new bedrock.CfnAgentAlias(scope, 'petrophysics-agent-alias', {
        agentId: agent.attrAgentId,
        agentAliasName: `agent-alias`
    });

    // ===== TAGS =====
    // Add tags to all resources in this scope
    cdk.Tags.of(scope).add('Agent', agentTags.Agent);
    cdk.Tags.of(scope).add('Model', agentTags.Model);

    // ===== OUTPUTS =====
    // Add CloudFormation outputs
    new cdk.CfnOutput(scope, 'PetrophysicsAgentId', {
        value: agent.attrAgentId,
        description: 'Petrophysics Agent ID',
    });

    new cdk.CfnOutput(scope, 'PetrophysicsAgentAliasId', {
        value: agentAlias.attrAgentAliasId,
        description: 'Petrophysics Agent Alias ID',
    });

    new cdk.CfnOutput(scope, 'PetrophysicsKnowledgeBaseId', {
        value: knowledgeBase.knowledgeBaseId,
        description: 'Petrophysics Knowledge Base ID',
    });

    return {
        agent,
        agentAlias
    };
}