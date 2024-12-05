import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

import { POCExtender, POCExtenderProps } from "../../poc-deployment";

export class POCExtension extends POCExtender {
  public extensionForDeploymentOnly = true;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id, props);

    const technicalImageGenerationTemplatesTable = new Table(
      this.pocExtendedConstruct,
      "TechnicalImageGenerationTemplatesTable",
      {
        partitionKey: { name: "id", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
      }
    );

    const technicalImageGenerationFunctionsTable = new Table(
      this.pocExtendedConstruct,
      "TechnicalImageGenerationFunctionsTable",
      {
        partitionKey: { name: "id", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
      }
    );
    if (props.pocTaskDefinition) {
      technicalImageGenerationFunctionsTable.grantReadWriteData(
        props.pocTaskDefinition.taskRole
      );
      technicalImageGenerationTemplatesTable.grantReadWriteData(
        props.pocTaskDefinition.taskRole
      );
    }
    this.pocExtendedConstruct.addEnvironmentVariables({
      TEMPLATES_TABLE: technicalImageGenerationTemplatesTable.tableName,
      FUNCTIONS_TABLE: technicalImageGenerationFunctionsTable.tableName,
    });
    this.pocExtendedConstruct.addPermissions([
      new Policy(this.pocExtendedConstruct, "TranscribePolicy", {
        policyName: "TranscribePolicy",
        statements: [
          new PolicyStatement({
            actions: ["transcribe:*"],
            resources: ["*"],
          }),
        ],
      }),
    ]);
    this.pocExtendedConstruct.addPermissions([
      new Policy(this.pocExtendedConstruct, "PollyPolicy", {
        policyName: "PollyPolicy",
        statements: [
          new PolicyStatement({
            actions: ["polly:*"],
            resources: ["*"],
          }),
        ],
      }),
    ]);
  }
}
