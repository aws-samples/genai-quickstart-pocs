import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { POC } from './types';

export class POCManager {
  private readonly pocsDirectory: string;
  private readonly excludedDirectories = new Set(['poc-deployment', 'cli']);

  constructor(pocsDirectory: string) {
    this.pocsDirectory = pocsDirectory;
  }

  public async listPOCs(): Promise<POC[]> {
    const pocDirs = fs
      .readdirSync(this.pocsDirectory)
      .filter(
        (dir) =>
          fs.statSync(path.join(this.pocsDirectory, dir)).isDirectory() &&
          !this.excludedDirectories.has(dir),
      );

    return pocDirs.map((dir) => {
      const hasExtension = fs.existsSync(
        path.join(this.pocsDirectory, dir, 'cdk', 'poc-extension.ts'),
      );
      return {
        name: dir,
        hasExtension,
        path: path.join(this.pocsDirectory, dir),
        stackName: `${dir}`,
        requiredEnvVars: this.getRequiredEnvVars(dir),
      };
    });
  }

  private getRequiredEnvVars(pocName: string): string[] {
    const envFilePath = path.join(this.pocsDirectory, pocName, '.env.example');
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf-8');
      return envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => line.split('=')[0]);
    }
    return [];
  }

  public isStackDeployed(stackName: string): boolean {
    try {
      execSync(`aws cloudformation describe-stacks --stack-name ${stackName}`, {
        stdio: 'pipe',
      });
      // console.log(chalk.green(`Stack ${stackName} exists`));
      return true;
    } catch {
      return false;
    }
  }

  public async getStackOutputs(
    stackName: string,
  ): Promise<Record<string, string>> {
    try {
      const output = execSync(
        `aws cloudformation describe-stacks --stack-name ${stackName}`,
        { encoding: 'utf-8' },
      );
      const stack = JSON.parse(output).Stacks[0];
      return (stack.Outputs || []).reduce(
        (acc: Record<string, string>, outputReturn: any) => {
          acc[outputReturn.OutputKey] = outputReturn.OutputValue;
          return acc;
        },
        {},
      );
    } catch {
      return {};
    }
  }

  public runPOC(pocPackageName: string): void {
    const pocPath = path.join(this.pocsDirectory, pocPackageName);

    // Validate the POC directory exists
    if (!fs.existsSync(pocPath)) {
      console.error(chalk.red(`POC directory not found: ${pocPath}`));
      process.exit(1);
    }

    // Validate requirements.txt exists
    const requirementsPath = path.join(pocPath, 'requirements.txt');
    if (!fs.existsSync(requirementsPath)) {
      console.error(chalk.red(`requirements.txt not found in POC directory: ${pocPath}`));
      process.exit(1);
    }

    // Create a virtual environment if it doesn't exist
    const venvPath = path.join(pocPath, '.env');
    if (!fs.existsSync(venvPath)) {
      console.log(chalk.blue('Creating virtual environment...'));
      execSync('python3 -m venv venv', { cwd: pocPath, stdio: 'inherit' });
    }

    // Activate the virtual environment and install requirements
    console.log(chalk.blue('Installing requirements...'));
    execSync(`${path.join(venvPath, 'bin', 'pip')} install -r requirements.txt`, {
      cwd: pocPath,
      stdio: 'inherit',
    });

    // Execute projen start
    console.log(chalk.blue('\nStarting POC...\n'));

    const projenProcess = spawn('npx', ['projen', 'start'], {
      cwd: pocPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, VIRTUAL_ENV: venvPath, PATH: `${path.join(venvPath, 'bin')}:${process.env.PATH}` },
    });

    projenProcess.on('error', (error) => {
      console.error(chalk.red(`Failed to start POC: ${error.message}`));
      process.exit(1);
    });
  }
}
