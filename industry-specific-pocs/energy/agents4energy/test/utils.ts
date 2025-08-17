import {
    CloudFormationClient,
    ListStackResourcesCommand,
  } from "@aws-sdk/client-cloudformation"
  import {
    LambdaClient, 
    GetFunctionConfigurationCommand 
} from "@aws-sdk/client-lambda";

// export async function test() {
//     console.log('test')
// }

export async function getDeployedResourceArn(
    rootStackName: string,
    targetLogicalIdPrefix: string
  ): Promise<string> {
    const cloudformation = new CloudFormationClient();
  
    async function searchStack(stackName: string): Promise<string | undefined> {
      try {
        const resources = await cloudformation.send(new ListStackResourcesCommand({
          StackName: stackName,
        }))
  
        if (!resources || !resources.StackResourceSummaries) throw new Error(`No resources found in stack ${stackName}`);
  
        for (const resource of resources.StackResourceSummaries || []) {
          if (resource && resource.LogicalResourceId && 
            (
              resource.LogicalResourceId.slice(0,-8) === targetLogicalIdPrefix ||
              resource.LogicalResourceId === targetLogicalIdPrefix
            )
          ) {
            return resource.PhysicalResourceId;
          }
  
          if (resource.ResourceType === 'AWS::CloudFormation::Stack') {
            const nestedStackArn = resource.PhysicalResourceId;
            if (nestedStackArn) {
              const result = await searchStack(nestedStackArn);
              if (result) return result;
            }
          }
        }
  
        // If we've gone through all resources and haven't returned, check if there's a next token
        if (resources.NextToken) {
          const nextResources = await cloudformation.send(new ListStackResourcesCommand({
            StackName: stackName,
          }))
          resources.StackResourceSummaries?.push(...(nextResources.StackResourceSummaries || []));
        }
  
      } catch (error) {
        console.error(`Error searching stack ${stackName}:`, error);
      }
  
      return undefined;
    }
  
    const resourceId = await searchStack(rootStackName)
    if (!resourceId) throw new Error(`Could not find resource with logical ID: ${targetLogicalIdPrefix}`);
    
    console.log(`For logical id ${targetLogicalIdPrefix}, found PhysicalResourceId ${resourceId}`)
    return resourceId;
  }
  
  
  export async function getLambdaEnvironmentVariables(functionName: string): Promise<void> {
    try {
        // Initialize the Lambda client
        const client = new LambdaClient();
        
        // Create the command to get function configuration
        const command = new GetFunctionConfigurationCommand({
            FunctionName: functionName
        });
  
        // Get the function configuration
        const response = await client.send(command);
        
        // Check if environment variables exist
        if (response.Environment && response.Environment.Variables) {
            const envVars = response.Environment.Variables;
            
            // Set each environment variable locally
            for (const [key, value] of Object.entries(envVars)) {
                if (value) {
                    process.env[key] = value;
                    console.log(`Set ${key} environment variable to ${value}`);
                }
            }
        } else {
            console.log('No environment variables found for the specified Lambda function');
        }
        
    } catch (error) {
        console.error('Error retrieving Lambda environment variables:', error);
        throw error;
    }
  }