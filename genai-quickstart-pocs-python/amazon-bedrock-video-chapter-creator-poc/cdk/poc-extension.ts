import { Stack } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3StaticWebsiteOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { OpenSearchServerlessVectorCollection } from './oss-collection-construct';
import { POCExtensionConstruct, POCExtender, POCExtenderProps } from '../../poc-deployment';


export class POCExtension extends POCExtender {
  private pocExtendedConstruct: POCExtensionConstruct;
  private pocExtenderProps: POCExtenderProps;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id);
    this.pocExtenderProps = props;
    this.pocExtendedConstruct = new POCExtensionConstruct(scope, 'VideoChapterEditorPOCExtension', props);
  }
  public extendPOCInfrastructure(): void {
    const collectionName = 'video-chapter-editor-collection';
    const collectionIndexName = 'chapters';
    const ossCollection = new OpenSearchServerlessVectorCollection(this.pocExtendedConstruct, 'VideoChapterEditorCollection', {
      collectionName,
      indexName: collectionIndexName,
      taskRoleArn: this.pocExtenderProps.pocTaskDefinition?.taskRole.roleArn,
    });
    const staticBucket = new Bucket(this.pocExtendedConstruct, 'POCStaticContentBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    if (this.pocExtenderProps.pocTaskDefinition) {
      staticBucket.grantReadWrite(this.pocExtenderProps.pocTaskDefinition.taskRole);
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