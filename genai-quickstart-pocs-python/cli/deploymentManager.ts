// deploymentManager.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { POC } from './types';

export class DeploymentManager {
  public async deployStack(poc: POC, deployExtension: boolean = false): Promise<void> {
    console.log(`Deploying ${deployExtension ? 'extension' : 'full stack'} for ${poc.name}...`);

    try {
      const command = `cdk deploy -c POC_NAME="${poc.name}" -c PACKAGE_NAME=${poc.name} -c POC_DESCRIPTION="TBD" -c EXTENSION_ONLY=${deployExtension && poc.hasExtension}`;
      console.log(`executing command ${command}`);
      execSync(command, {
        stdio: ['inherit', 'inherit', 'inherit'],
        cwd: path.join(__dirname, '..', '..'),
        env: {
          ...process.env,
        },
      });
    } catch (error) {
      throw new Error(`Failed to deploy stack: ${error}`);
    }
  }

  public async destroyStack(poc: POC): Promise<void> {
    console.log(`Destroying stack for ${poc.name}...`);

    try {
      // Check if extension stack exists and destroy it first
      if (poc.hasExtension) {
        const extensionStackName = poc.stackName;
        try {
          const stackOutput = execSync(
            `aws cloudformation describe-stacks --stack-name ${extensionStackName}`,
            {
              stdio: 'pipe',
              encoding: 'utf-8',
            },
          );

          const stackInfo = JSON.parse(stackOutput);
          const extensionOnly = stackInfo.Stacks[0].Tags?.find(
            (tag: { Key: string; Value: string }) => tag.Key === 'ExtensionOnly',
          )?.Value === 'true';

          // If we get here, the extension stack exists
          console.log('Destroying extension stack...');
          execSync(
            `cdk destroy -c PACKAGE_NAME=${extensionStackName} -c EXTENSION_ONLY=${extensionOnly}`,
            {
              stdio: ['inherit', 'inherit', 'inherit'],
              cwd: path.join(__dirname, '..', '..'),
              env: {
                ...process.env,
              },
            },
          );
        } catch (err) {
          console.error("POC DOESN'T EXIST");
        }
      }

      // Destroy the main stack
      execSync(
        `cdk destroy -c PACKAGE_NAME=${poc.stackName} -c EXTENSION_ONLY=false`,
        {
          stdio: ['inherit', 'inherit', 'inherit'],
          cwd: path.join(__dirname, '..', '..'),
          env: {
            ...process.env,
          },
        },
      );
    } catch (error) {
      throw new Error(`Failed to destroy stack: ${error}`);
    }
  }

  public async configureLocalEnv(poc: POC): Promise<void> {
    try {
      const envPath = `${poc.path}/.env`;
      const extensionStackName = `${poc.stackName}`;
      const outputs = execSync(
        `aws cloudformation describe-stacks --stack-name ${extensionStackName}`,
        { encoding: 'utf-8' },
      );
      const stackOutputs = JSON.parse(outputs).Stacks[0].Outputs;

      // Create .env file with stack outputs
      const envVars = stackOutputs.reduce((acc: string[], output: any) => {
        acc.push(`${output.OutputKey}=${output.OutputValue}`);
        return acc;
      }, []);

      // Write to .env file
      fs.writeFileSync(envPath, envVars.join('\n'));
      console.log(`Environment variables written to ${envPath}`);
    } catch (error) {
      throw new Error(`Failed to configure environment: ${error}`);
    }
  }
}