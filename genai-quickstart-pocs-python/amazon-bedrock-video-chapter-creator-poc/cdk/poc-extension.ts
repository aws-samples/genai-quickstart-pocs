import { Stack } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3StaticWebsiteOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { OpenSearchServerlessVectorCollection } from './oss-collection-construct';
import { POCExtender, POCExtenderProps } from '../../poc-deployment';


export class POCExtension extends POCExtender {
  public extensionForDeploymentOnly: boolean = false;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id, props);
    const collectionName = 'video-chapter-editor-collection';
    const collectionIndexName = 'chapters';
    const ossCollection = new OpenSearchServerlessVectorCollection(this.pocExtendedConstruct, 'VideoChapterEditorCollection', {
      collectionName,
      indexName: collectionIndexName,
      taskRoleArn: props.pocTaskDefinition?.taskRole.roleArn,
    });
    const staticBucket = new Bucket(this.pocExtendedConstruct, 'POCStaticContentBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    if (props.pocTaskDefinition) {
      staticBucket.grantReadWrite(props.pocTaskDefinition.taskRole);
    }

    const cloudfront = new Distribution(this.pocExtendedConstruct, 'VideoChapterEditorCloudfront', {
      defaultBehavior: {
        origin: new S3StaticWebsiteOrigin(staticBucket),
      },
    });


    this.pocExtendedConstruct.addEnvironmentVariables({
      S3_BUCKET: staticBucket.bucketName,
      CLOUDFRONT_HOSTNAME: cloudfront.distributionDomainName,
      OPENSEARCH_ENDPOINT: ossCollection.collection.attrCollectionEndpoint,
      OPENSEARCH_REGION: ossCollection.collection.stack.region,
      OPENSEARCH_INDEX: collectionIndexName,
      BEDROCK_REGION: Stack.of(this.pocExtendedConstruct).region,

    });
  }
  
}