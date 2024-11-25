import path from 'path';
import { CfnOutput, Stack } from 'aws-cdk-lib';
import { FlowLogDestination, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * The properties for the POCConstruct construct.
 */
interface POCConsructProps {
  /**
   * The name of the POC. This should be the POC's folder inside the `genai-quickstart-pocs-python`
   */
  pocName: string;
  logsBucket: Bucket;

}

/**
 * The CDK Stack used to deploy a Python POC to AWS.
 */
export class POCConstruct extends Construct {
  private readonly pocName: string;
  public readonly taskDefinion: TaskDefinition;
  public readonly vpc: Vpc;
  private readonly accessLogsBucket: Bucket;

  constructor(scope: Construct, id: string, props: POCConsructProps) {
    super(scope, id);
    this.pocName = props.pocName;
    this.accessLogsBucket = props.logsBucket;

    /**
     * The VPC to house the ECS Fargate Cluster
     */
    this.vpc = new Vpc(this, 'PocVpc', {
      maxAzs: 2,
      flowLogs: {
        default: {
          destination: FlowLogDestination.toS3(this.accessLogsBucket, 'vpc-flow-logs'),
        },
      },
    });


    /**
     * The Docker Image Asset used to build and deploy the POC's Docker Image to ECS
     */
    const pocDockerImage = new DockerImageAsset(this, 'POCDockerImage', {
      directory: path.join(__dirname, '..'),
      platform: Platform.LINUX_ARM64,
      buildArgs: {
        POC_PATH: this.pocName,
      },
    });

    const taskDefinition = new FargateTaskDefinition(this, 'POCTaskDefinition', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      ephemeralStorageGiB: 50,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
      },
    });

    taskDefinition.addContainer('POCContainer', {
      containerName: 'POCContainer',
      image: ContainerImage.fromEcrRepository(pocDockerImage.repository, pocDockerImage.imageTag),
      portMappings: [{ containerPort: 8501 }],
      logging: LogDriver.awsLogs({ streamPrefix: `genai-poc/${this.pocName}` }),
    });
    this.taskDefinion = taskDefinition;

    const pocCluster = new Cluster(this, 'POCCluster', {
      vpc: this.vpc,
      containerInsights: true,
    });

    const pocFargateService = new ApplicationLoadBalancedFargateService(this, 'POCFargateService', {
      cluster: pocCluster,
      taskDefinition,
      publicLoadBalancer: true,
      desiredCount: 1,
    });
    // pocFargateService.loadBalancer.logAccessLogs(this.accessLogsBucket, 'poc-alb-access-logs');

    // TODO - add ability to limit model to only necessary ones
    const pocBedrockAccessPolicy = new Policy(this, 'POCBedrockAccessPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: [`arn:aws:bedrock:${Stack.of(this).region}::foundation-model/*`],
        }),
      ],
    });
    pocFargateService.taskDefinition.taskRole.attachInlinePolicy(pocBedrockAccessPolicy);

    new CfnOutput(this, 'POCUrl', { value: pocFargateService.loadBalancer.loadBalancerDnsName, key: 'POCUrl' });
  }
}

