#!/usr/bin/env node

/**
 * Script to set up monitoring and alerting infrastructure
 */

const { AlertingService } = require('../dist/services/monitoring/alerting-service');
const { SNS, CloudWatch } = require('aws-sdk');

async function setupMonitoring() {
  const environment = process.env.NODE_ENV || 'dev';
  const region = process.env.AWS_REGION || 'us-east-1';
  const namespace = process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI';
  
  console.log(`Setting up monitoring for environment: ${environment}`);
  console.log(`Region: ${region}`);
  console.log(`Namespace: ${namespace}`);

  try {
    // Create SNS topic for alerts if it doesn't exist
    const snsTopicArn = await createSNSTopic(region, environment);
    console.log(`SNS Topic ARN: ${snsTopicArn}`);

    // Create alerting service
    const alertingService = new AlertingService(region, namespace, environment, snsTopicArn);

    // Create standard alarms
    console.log('Creating standard CloudWatch alarms...');
    await alertingService.createStandardAlarms(snsTopicArn);
    console.log('Standard alarms created successfully');

    // Create custom dashboard
    console.log('Creating CloudWatch dashboard...');
    await createDashboard(region, namespace, environment);
    console.log('Dashboard created successfully');

    console.log('Monitoring setup completed successfully!');
    
    // Output configuration for environment variables
    console.log('\nAdd the following environment variables to your deployment:');
    console.log(`SNS_TOPIC_ARN=${snsTopicArn}`);
    console.log(`CLOUDWATCH_NAMESPACE=${namespace}`);
    console.log(`AWS_REGION=${region}`);

  } catch (error) {
    console.error('Failed to set up monitoring:', error);
    process.exit(1);
  }
}

async function createSNSTopic(region, environment) {
  const sns = new SNS({ region });
  const topicName = `investment-ai-alerts-${environment}`;

  try {
    // Try to create the topic (idempotent operation)
    const result = await sns.createTopic({
      Name: topicName,
      Tags: [
        { Key: 'Environment', Value: environment },
        { Key: 'Service', Value: 'InvestmentAI' },
        { Key: 'Purpose', Value: 'Monitoring Alerts' }
      ]
    }).promise();

    return result.TopicArn;
  } catch (error) {
    console.error('Failed to create SNS topic:', error);
    throw error;
  }
}

async function createDashboard(region, namespace, environment) {
  const cloudWatch = new CloudWatch({ region });
  const dashboardName = `InvestmentAI-${environment}`;

  const dashboardBody = {
    widgets: [
      {
        type: "metric",
        x: 0,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [namespace, "ApiRequestCount", "Environment", environment],
            [".", "ApiRequestError", ".", "."],
            [".", "ApiRequestSuccess", ".", "."]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "API Request Metrics",
          period: 300
        }
      },
      {
        type: "metric",
        x: 12,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [namespace, "ApiRequestDuration", "Environment", environment]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "API Response Time",
          period: 300,
          yAxis: {
            left: {
              min: 0
            }
          }
        }
      },
      {
        type: "metric",
        x: 0,
        y: 6,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            [namespace, "ModelUsageCount", "Environment", environment, "ModelName", "Claude-Sonnet-3.7"],
            [".", ".", ".", ".", ".", "Claude-Haiku-3.5"],
            [".", ".", ".", ".", ".", "Amazon-Nova-Pro"]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "Model Usage",
          period: 300
        }
      },
      {
        type: "metric",
        x: 8,
        y: 6,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            [namespace, "ModelUsageCost", "Environment", environment]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "Model Usage Cost",
          period: 300
        }
      },
      {
        type: "metric",
        x: 16,
        y: 6,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            [namespace, "ErrorCount", "Environment", environment, "Severity", "critical"],
            [".", ".", ".", ".", ".", "high"],
            [".", ".", ".", ".", ".", "medium"],
            [".", ".", ".", ".", ".", "low"]
          ],
          view: "timeSeries",
          stacked: true,
          region: region,
          title: "Error Count by Severity",
          period: 300
        }
      },
      {
        type: "metric",
        x: 0,
        y: 12,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [namespace, "UsageCount", "Environment", environment, "Action", "generate_investment_idea"],
            [".", ".", ".", ".", ".", "upload_proprietary_data"],
            [".", ".", ".", ".", ".", "submit_feedback"],
            [".", ".", ".", ".", ".", "query_market_data"]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "Feature Usage",
          period: 300
        }
      },
      {
        type: "metric",
        x: 12,
        y: 12,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [namespace, "SystemHealthCheck", "Environment", environment, "Service", "API"]
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "System Health",
          period: 300,
          yAxis: {
            left: {
              min: 0,
              max: 1
            }
          }
        }
      }
    ]
  };

  try {
    await cloudWatch.putDashboard({
      DashboardName: dashboardName,
      DashboardBody: JSON.stringify(dashboardBody)
    }).promise();

    console.log(`Dashboard created: https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboardName}`);
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    throw error;
  }
}

// Add email subscription helper
async function subscribeEmailToTopic(region, topicArn, email) {
  const sns = new SNS({ region });

  try {
    const result = await sns.subscribe({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: email
    }).promise();

    console.log(`Email subscription created: ${result.SubscriptionArn}`);
    console.log('Please check your email and confirm the subscription');
    
    return result.SubscriptionArn;
  } catch (error) {
    console.error('Failed to subscribe email to topic:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node setup-monitoring.js [options]

Options:
  --email <email>    Subscribe email address to alerts
  --help, -h         Show this help message

Environment Variables:
  NODE_ENV           Environment (dev, staging, prod)
  AWS_REGION         AWS region (default: us-east-1)
  CLOUDWATCH_NAMESPACE  CloudWatch namespace (default: InvestmentAI)

Examples:
  node setup-monitoring.js
  node setup-monitoring.js --email admin@company.com
  NODE_ENV=prod node setup-monitoring.js --email alerts@company.com
    `);
    process.exit(0);
  }

  setupMonitoring().then(async () => {
    const emailIndex = args.indexOf('--email');
    if (emailIndex !== -1 && emailIndex + 1 < args.length) {
      const email = args[emailIndex + 1];
      const environment = process.env.NODE_ENV || 'dev';
      const region = process.env.AWS_REGION || 'us-east-1';
      
      // Construct topic ARN (this is a simplified approach)
      const accountId = process.env.AWS_ACCOUNT_ID;
      if (accountId) {
        const topicArn = `arn:aws:sns:${region}:${accountId}:investment-ai-alerts-${environment}`;
        await subscribeEmailToTopic(region, topicArn, email);
      } else {
        console.log('AWS_ACCOUNT_ID environment variable not set. Please subscribe to SNS topic manually.');
      }
    }
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  setupMonitoring,
  createSNSTopic,
  createDashboard,
  subscribeEmailToTopic
};