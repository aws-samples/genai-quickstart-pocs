import path from 'path';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Policy } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import importSync from 'import-sync';


export interface POCExtenderProps {
  logsBucket: Bucket;
  pocTaskDefinition?: TaskDefinition;
  vpc?: Vpc;
  pocName: string;
  pocPackageName: string;
  pocDescription?: string;
  extensionOnly?: boolean;
}

export abstract class POCExtender extends Construct {
  private extendedPOCConstruct: POCExtensionConstruct | undefined;
  abstract extendPOCInfrastructure(scope: Construct): void

  public get extendedInfrastructure() {
    if (!this.extendedPOCConstruct) {
      throw new Error('Extended POC Infrastructure could not be returned!');
    }
    return this.extendPOCInfrastructure;
  }
}

// Type guard to ensure the imported module has the correct class
function isPOCExtensionConstructor(obj: any): obj is { new(): POCExtender } {
  if (!obj || typeof obj !== 'function') {
    return false;
  }

  // Check if it's a constructor function
  try {
    const instance = new obj();
    // Check if the instance has the required abstract method
    return (
      instance instanceof POCExtender &&
      typeof instance.extendPOCInfrastructure === 'function'
    );
  } catch (error) {
    console.error('Error creating instance:', error);
    return false;
  }
}

// Check if a POC has an extension implementation
export function pocIsExtended(packageName: string): boolean {
  try {
    const filePath = path.join(__dirname, '..', packageName, 'cdk', 'poc-extension.ts');
    console.log(`Checking for extension at path: ${filePath}`);

    // Import the module
    const module = importSync(filePath);

    if (!module) {
      console.log(`No module exported from ${filePath}`);
      return false;
    }

    if (!module.POCExtension) {
      console.log('No POCExtension export found in module');
      return false;
    }

    const isValid = isPOCExtensionConstructor(module.POCExtension);
    console.log(`Extension validation result: ${isValid}`);

    return isValid;
  } catch (error) {
    return false;
  }
}

export function loadPOCExtension(packageName: string, scope: Construct, props: POCExtenderProps): POCExtender {
  try {
    const filePath = path.join(__dirname, '..', `${packageName}/cdk/poc-extension.ts`);

    // First check if the POC is extended
    const isExtended = pocIsExtended(packageName);
    if (!isExtended) {
      throw new Error(`No valid extension found for POC: ${packageName}`);
    }

    const module = importSync(filePath);

    if (!module.POCExtension) {
      throw new Error(`Module ${filePath} does not export POCExtension class`);
    }

    if (!isPOCExtensionConstructor(module.POCExtension)) {
      throw new Error('Exported POCExtension does not extend POCExtender');
    }

    return new module.POCExtension(scope, `${packageName}-ext`, props);
  } catch (error: any) {
    throw new Error(`Failed to load POC extension for ${packageName}: ${error.message}`);
  }
}


export class POCExtensionConstruct extends Construct {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly props: POCExtenderProps;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id);
    this.props = props;
  }

  /**
   * Adds the necessary permissions to the ECS Task that are necessary to allow the POC to function.
   */
  addPermissions(policies: Array<Policy>): void {
    for (const policy of policies) {
      this.props.pocTaskDefinition?.taskRole.attachInlinePolicy(policy);
    }
  }

  addEnvironmentVariables(varaibles: Record<string, string>): void {
    for (const [key, value] of Object.entries(varaibles)) {
      this.props.pocTaskDefinition?.findContainer('POCContainer')
        ?.addEnvironment(key, value);
    }
  }
}