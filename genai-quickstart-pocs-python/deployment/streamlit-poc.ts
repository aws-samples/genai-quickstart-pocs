import { Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StreamlitPOCProps {
  pocPackageName: string;
}

/**
 * A Construct representing a StreamlitPOC
 *
 * @class StreamlitPOC
 * @extends {Construct}
 * @property {Object} props - The properties for the StreamlitPOC construct
 * @constructor
 * @public
 */

export class StreamlitPOC extends Construct {
  constructor(scope: Construct, id: string, props: StreamlitPOCProps) {
    super(scope, id);

    const vpc = new Vpc(this, 'StreamlitPocVpc', {
      maxAzs: 2,
    });

    const logsBucket = new Bucket(this, 'StrealitPOCLogsBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    const streamlitPocDockerAsset = new DockerImageAsset(this, 'StramlitPocDockerAsset', {
      platform: Platform.LINUX_ARM64,
      directory: '../',
      buildArgs: {
        POC_PATH: props.pocPackageName,
      },
    });

    const taskDefiniton = new FargateTaskDefinition(this, 'StreamlitPocTaskDefinition', {
      cpu: 2048,
      memoryLimitMiB: 8192,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
      },
    });

    taskDefiniton.addContainer('StreamlitPocContainer', {
      image: ContainerImage.fromEcrRepository(streamlitPocDockerAsset.repository, streamlitPocDockerAsset.imageTag),
      portMappings: [{ containerPort: 8501 }],
      logging: LogDriver.awsLogs({
        streamPrefix: `streamlit-poc/${props.pocPackageName}`,
      }),
    });

    const streamlitPocCluster = new Cluster(this, 'StreamlitPocCluster', {
      containerInsights: true,
      vpc: vpc,
    });

    const fargateService = new ApplicationLoadBalancedFargateService(this, 'StramlitPocFargateService', {
      cluster: streamlitPocCluster,
      taskDefinition: taskDefiniton,
      publicLoadBalancer: true,
      desiredCount: 1,
    });
    fargateService.loadBalancer.logAccessLogs(logsBucket);
    const bedrockAccessPolicy = new Policy(this, 'ChatbotAccessToBedrock', {
      statements: [
        new PolicyStatement({
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: [`arn:aws:bedrock:${Stack.of(this).region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`],
        }),
      ],
    });
    fargateService.taskDefinition.taskRole.attachInlinePolicy(bedrockAccessPolicy);
  }
}