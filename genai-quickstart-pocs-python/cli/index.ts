// index.ts
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { DeploymentManager } from './deploymentManager';
import { POCManager } from './pocManager';

const program = new Command();
const pocManager = new POCManager(path.join(__dirname, '../'));
const deploymentManager = new DeploymentManager();

async function main() {
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Run a POC on your Local Machine',
        'Deploy a POC',
        'Destroy Deployed POC',
      ],
    },
  ]);

  const pocs = await pocManager.listPOCs();

  switch (action.action) {
    case 'Run a POC on your Local Machine': {
      const { selectedPoc } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPoc',
          message: 'Select a POC to run:',
          choices: pocs.map(poc => ({
            name: `${poc.name}${poc.hasExtension ? ' (Has Extension)' : ''}`,
            value: poc,
          })),
        },
      ]);

      if (selectedPoc.hasExtension) {
        const extensionStack = `${selectedPoc.stackName}`;
        const isDeployed = pocManager.isStackDeployed(extensionStack);

        if (!isDeployed) {
          console.log(chalk.yellow('This POC requires additional infrastructure to run.'));
          const { shouldDeploy } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldDeploy',
              message: 'Would you like to deploy the required infrastructure?',
              default: false,
            },
          ]);

          if (shouldDeploy) {

            const { confirmDeploy } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirmDeploy',
                message: 'Do you want to proceed with deployment?',
                default: false,
              },
            ]);

            if (confirmDeploy) {
              await deploymentManager.deployStack(selectedPoc, true);
            } else {
              console.log(chalk.red('Deployment cancelled.'));
              return;
            }
          } else {
            console.log(chalk.red('Cannot run POC without required infrastructure.'));
            return;
          }
        }

        await deploymentManager.configureLocalEnv(selectedPoc);
      }

      console.log(chalk.green('\nPOC is ready to run!'));
      try {
        await pocManager.runPOC(selectedPoc.name);
      } catch (error) {
        console.error(chalk.red('Failed to run POC:'), error);
        process.exit(1);
      }

      break;
    }

    case 'Deploy a POC': {
      const { selectedPoc } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPoc',
          message: 'Select a POC to deploy:',
          choices: pocs.map(poc => ({
            name: `${poc.name}${poc.hasExtension ? ' (Has Extension)' : ''}`,
            value: poc,
          })),
        },
      ]);

      const { confirmDeploy } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDeploy',
          message: 'Do you want to proceed with deployment?',
          default: false,
        },
      ]);

      if (confirmDeploy) {
        await deploymentManager.deployStack(selectedPoc);
        console.log(chalk.green('Deployment complete!'));
      } else {
        console.log(chalk.red('Deployment cancelled.'));
      }
      break;
    }

    case 'Destroy Deployed POC': {
      const spinner = ora({
        text: 'Looking for deployed POCs. Please wait...',
        isEnabled: true,
      }).start();
      const choices = pocs
        .filter(poc => pocManager.isStackDeployed(poc.stackName))
        .map(poc => ({
          name: poc.name,
          value: poc,
        }));
      spinner.stop().clear();
      const { selectedPoc } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPoc',
          message: 'Select a POC to destroy:',
          choices: choices,
        },
      ]);

      console.log(chalk.red('\nWARNING: This action is permanent and cannot be undone!'));
      const { confirmDestroy } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDestroy',
          message: 'Are you sure you want to destroy this POC?',
          default: false,
        },
      ]);

      if (confirmDestroy) {
        await deploymentManager.destroyStack(selectedPoc);
        console.log(chalk.green('Stack destroyed successfully.'));
      } else {
        console.log(chalk.yellow('Destruction cancelled.'));
      }
      break;
    }
  }
}

program
  .name('poc-cli')
  .description('CLI tool for managing POC deployments')
  .version('1.0.0');

program.action(main);

program.parse();