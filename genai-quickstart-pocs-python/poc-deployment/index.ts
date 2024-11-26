import { CfnOutput, Stack } from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { POCConstruct } from './poc-construct';
import { loadPOCExtension, POCExtender, pocIsExtended } from './poc-extender';

export { POCExtensionConstruct, POCExtender, POCExtenderProps } from './poc-extender';

interface POCStackProps {
  pocName: string;
  pocPackageName: string;
  pocDescription?: string;
  /**
   * @default false
   */
  extensionOnly: boolean;
}

export class POCStack extends Stack {
  private readonly stackProps: POCStackProps;
  private pocMainConstruct: Construct;
  public pocExtension?: POCExtender;
  constructor(app: Construct, id: string, stackProps: POCStackProps) {
    super(app, id);
    // console.log(stackProps);
    this.stackProps = stackProps;
    this.stackProps.extensionOnly = stackProps.extensionOnly || false;
    /**
     * The S3 Bucket used to store HTTP access logs from the POC Load Balancer
     */
    const accessLogsBucket = new Bucket(this, 'POCLogsBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    new CfnOutput(this, 'POCName', {
      value: this.stackProps.pocName,
      key: 'POCName',
    });
    new CfnOutput(this, 'ExtensionOnly', {
      value: this.stackProps.extensionOnly.toString(),
      key: 'ExtensionOnly',
    });
    new CfnOutput(this, 'POCAccessLogsBucket', {
      value: accessLogsBucket.bucketName,
      key: 'POCAccessLogsBucket',
    });
    if (!this.stackProps.extensionOnly) {
      console.log(`Starting to synthesize POC Stack! - POC = ${stackProps.pocName}`);
      this.pocMainConstruct = new POCConstruct(this, 'POCConstruct', {
        pocName: this.stackProps.pocName,
        logsBucket: accessLogsBucket,
      });
      console.log('Main POC Construct Synthesized. Checking if POC has extended infrastructure');
    } else {
      this.pocMainConstruct = this;
    }

    // Here we check if the specific POC has additional infrastructure defined to support POC functionality
    if (pocIsExtended(this.stackProps.pocPackageName)) {
      //Now we load the extension in
      this.pocExtension = loadPOCExtension(this.stackProps.pocPackageName, this, {
        logsBucket: accessLogsBucket,
        pocName: this.stackProps.pocName,
        pocPackageName: this.stackProps.pocPackageName,
        pocTaskDefinition: this.pocMainConstruct instanceof(POCConstruct) ? this.pocMainConstruct.taskDefinion : undefined,
        vpc: this.pocMainConstruct instanceof(POCConstruct) ? this.pocMainConstruct.vpc : undefined,
        pocDescription: this.stackProps.pocDescription ?? '',
      });

    } else {
      console.log('POC does not have extended infrastructure');
    }

  }
}