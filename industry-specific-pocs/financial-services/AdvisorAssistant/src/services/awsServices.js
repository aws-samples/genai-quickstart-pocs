/**
 * AWS Services Integration Layer
 * 
 * Centralized AWS SDK wrapper providing unified access to all AWS services
 * used by the Advisor Assistant application. Handles authentication, error handling,
 * and provides consistent interfaces for:
 * 
 * - AWS Bedrock (Claude 3.5 Sonnet for AI analysis)
 * - DynamoDB (NoSQL database for all application data)
 * - S3 (Document and file storage)
 * - SNS (Push notifications and alerts)
 * - SQS (Asynchronous message processing)
 * - EventBridge (Event-driven architecture)
 * - CloudWatch (Logging and monitoring)
 * 
 * Features:
 * - LocalStack support for local development
 * - Automatic retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Environment-specific configuration
 * - KMS encryption for all data at rest
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

// AWS SDK v3 imports - using modular imports for smaller bundle size
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient, SendMessageCommand, ReceiveMessageCommand } = require('@aws-sdk/client-sqs');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

/**
 * AWS Services Integration Class
 * 
 * Provides a unified interface to all AWS services used by the application.
 * Automatically configures clients based on environment (production vs development)
 * and handles LocalStack integration for local testing.
 */
class AWSServices {
  /**
   * Initialize AWS service clients with environment-specific configuration
   * 
   * In production: Uses IAM roles and environment variables
   * In development: Supports LocalStack for local AWS service emulation
   */
  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // LocalStack configuration for local development and testing
    // Allows developers to test AWS integrations without incurring costs
    const isLocalDevelopment = process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT_URL;
    const localstackConfig = isLocalDevelopment ? {
      endpoint: process.env.AWS_ENDPOINT_URL,
      forcePathStyle: true, // Required for S3 with LocalStack
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    } : {};
    
    // Initialize AWS clients with extended timeouts
    this.bedrock = new BedrockRuntimeClient({ 
      region,
      requestTimeout: 5 * 60 * 1000, // 5 minute timeout for individual requests
      maxAttempts: 1 // Disable SDK retries, we handle retries in the analyzer
    }); // Bedrock doesn't support LocalStack
    this.dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ 
      region,
      ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : localstackConfig)
    }));
    this.s3 = new S3Client({ 
      region,
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : localstackConfig)
    });
    this.sns = new SNSClient({ 
      region,
      ...(process.env.SNS_ENDPOINT ? { endpoint: process.env.SNS_ENDPOINT } : localstackConfig)
    });
    this.sqs = new SQSClient({ 
      region,
      ...(process.env.SQS_ENDPOINT ? { endpoint: process.env.SQS_ENDPOINT } : localstackConfig)
    });
    this.eventbridge = new EventBridgeClient({ 
      region,
      ...(process.env.EVENTBRIDGE_ENDPOINT ? { endpoint: process.env.EVENTBRIDGE_ENDPOINT } : localstackConfig)
    });
    this.cloudwatch = new CloudWatchLogsClient({ 
      region,
      ...(process.env.CLOUDWATCH_ENDPOINT ? { endpoint: process.env.CLOUDWATCH_ENDPOINT } : localstackConfig)
    });
    
    // Configuration
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'advisor-assistant';
    this.s3Bucket = process.env.S3_BUCKET_NAME;
    this.snsTopicArn = process.env.SNS_TOPIC_ARN;
    this.sqsQueueUrl = process.env.SQS_QUEUE_URL;
    this.eventBusName = process.env.EVENTBRIDGE_BUS_NAME || 'advisor-assistant-events';
    this.logGroup = process.env.CLOUDWATCH_LOG_GROUP || '/aws/advisor-assistant';
  }

  // Bedrock Claude 3.5 Sonnet Integration with extended timeout
  async invokeClaude(prompt, systemPrompt = null, maxTokens = 4000) {
    // Use current environment variable for model ID (allows runtime switching)
    const currentModelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    
    try {
      // Log the current model being used
      console.log(`🤖 Invoking Claude AI with model: ${currentModelId}`);
      console.log(`📊 Request details: maxTokens=${maxTokens}, hasSystemPrompt=${!!systemPrompt}`);
      
      const messages = [{ role: 'user', content: prompt }];
      
      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        messages: messages,
        temperature: 0.1,
        top_p: 0.9
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const command = new InvokeModelCommand({
        modelId: currentModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      });

      // Set extended timeout for Bedrock calls (5 minutes per individual call)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Bedrock call timeout after 5 minutes')), 5 * 60 * 1000);
      });

      const response = await Promise.race([
        this.bedrock.send(command),
        timeoutPromise
      ]);
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Log successful response
      const responseText = responseBody.content[0].text;
      console.log(`✅ Claude AI response received from ${currentModelId} (${responseText.length} characters)`);
      
      return responseText;
    } catch (error) {
      console.error(`❌ Bedrock invocation error with model ${currentModelId}:`, error);
      
      // Enhanced error handling for specific Bedrock errors
      if (error.name === 'ThrottlingException' || error.message.includes('throttl')) {
        const throttleError = new Error(`Bedrock throttling: ${error.message}`);
        throttleError.name = 'ThrottlingException';
        throw throttleError;
      }
      
      if (error.name === 'ValidationException' && error.message.includes('on-demand throughput')) {
        const validationError = new Error(`Model ${currentModelId} requires inference profile - not supported for on-demand use. Please switch to a supported model like Claude 3.5 Sonnet.`);
        validationError.name = 'ModelNotSupportedError';
        throw validationError;
      }
      
      throw error;
    }
  }

  // Helper method to get the actual table name
  getActualTableName(tableName) {
    if (tableName === 'financials' && process.env.FINANCIALS_TABLE_NAME) {
      return process.env.FINANCIALS_TABLE_NAME;
    } else if (tableName === 'user-config') {
      return `${this.tablePrefix}-user-config`;
    } else {
      return `${this.tablePrefix}-${tableName}`;
    }
  }

  // DynamoDB Operations
  async putItem(tableName, item) {
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new PutCommand({
      TableName: actualTableName,
      Item: {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    return await this.dynamodb.send(command);
  }

  async updateItem(tableName, key, updateData) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach((field, index) => {
      const fieldName = `#field${index}`;
      const fieldValue = `:value${index}`;
      updateExpression.push(`${fieldName} = ${fieldValue}`);
      expressionAttributeNames[fieldName] = field;
      expressionAttributeValues[fieldValue] = updateData[field];
    });
    
    // Always update the updatedAt timestamp
    const timestampName = `#updatedAt`;
    const timestampValue = `:updatedAt`;
    updateExpression.push(`${timestampName} = ${timestampValue}`);
    expressionAttributeNames[timestampName] = 'updatedAt';
    expressionAttributeValues[timestampValue] = new Date().toISOString();
    
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new UpdateCommand({
      TableName: actualTableName,
      Key: key,
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    return await this.dynamodb.send(command);
  }

  async getItem(tableName, key) {
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new GetCommand({
      TableName: actualTableName,
      Key: key
    });
    const response = await this.dynamodb.send(command);
    return response.Item;
  }

  async queryItems(tableName, keyCondition, indexName = null) {
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new QueryCommand({
      TableName: actualTableName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values,
      IndexName: indexName
    });
    const response = await this.dynamodb.send(command);
    return response.Items;
  }

  async scanTable(tableName, filterExpression = null) {
    const actualTableName = this.getActualTableName(tableName);
    
    const params = {
      TableName: actualTableName
    };
    
    if (filterExpression) {
      params.FilterExpression = filterExpression.expression;
      params.ExpressionAttributeValues = filterExpression.values;
    }

    const command = new ScanCommand(params);
    const response = await this.dynamodb.send(command);
    return response.Items;
  }

  async updateItem(tableName, key, updateExpression, attributeValues) {
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new UpdateCommand({
      TableName: actualTableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: {
        ...attributeValues,
        ':updatedAt': new Date().toISOString()
      }
    });
    return await this.dynamodb.send(command);
  }

  async deleteItem(tableName, key) {
    const actualTableName = this.getActualTableName(tableName);
    
    const command = new DeleteCommand({
      TableName: actualTableName,
      Key: key
    });
    return await this.dynamodb.send(command);
  }

  // S3 Operations
  async putObject(key, body, contentType = 'application/json') {
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: typeof body === 'string' ? body : JSON.stringify(body),
      ContentType: contentType
    });
    return await this.s3.send(command);
  }

  async getObject(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key
      });
      const response = await this.s3.send(command);
      const body = await response.Body.transformToString();
      return JSON.parse(body);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async listObjects(prefix) {
    const command = new ListObjectsV2Command({
      Bucket: this.s3Bucket,
      Prefix: prefix
    });
    const response = await this.s3.send(command);
    return response.Contents || [];
  }

  // SNS Notifications
  async publishAlert(message, subject = 'Financial Alert') {
    if (!this.snsTopicArn) return null;
    
    const command = new PublishCommand({
      TopicArn: this.snsTopicArn,
      Message: JSON.stringify(message),
      Subject: subject
    });
    return await this.sns.send(command);
  }

  // SQS Queue Operations
  async sendMessage(messageBody, delaySeconds = 0) {
    if (!this.sqsQueueUrl) return null;
    
    const command = new SendMessageCommand({
      QueueUrl: this.sqsQueueUrl,
      MessageBody: JSON.stringify(messageBody),
      DelaySeconds: delaySeconds
    });
    return await this.sqs.send(command);
  }

  async receiveMessages(maxMessages = 10, waitTimeSeconds = 20) {
    if (!this.sqsQueueUrl) return [];
    
    const command = new ReceiveMessageCommand({
      QueueUrl: this.sqsQueueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds
    });
    const response = await this.sqs.send(command);
    return response.Messages || [];
  }

  // EventBridge Events
  async publishEvent(eventType, detail, source = 'advisor-assistant') {
    const command = new PutEventsCommand({
      Entries: [{
        Source: source,
        DetailType: eventType,
        Detail: JSON.stringify(detail),
        EventBusName: this.eventBusName,
        Time: new Date()
      }]
    });
    return await this.eventbridge.send(command);
  }

  // CloudWatch Logging
  async logEvent(message, level = 'INFO') {
    try {
      const logStreamName = `advisor-assistant-${new Date().toISOString().split('T')[0]}`;
      
      // Try to create log stream if it doesn't exist
      try {
        await this.cloudwatch.send(new CreateLogStreamCommand({
          logGroupName: this.logGroup,
          logStreamName: logStreamName
        }));
      } catch (createError) {
        // Log stream might already exist, ignore ResourceAlreadyExistsException
        if (createError.name !== 'ResourceAlreadyExistsException') {

        }
      }
      
      const command = new PutLogEventsCommand({
        logGroupName: this.logGroup,
        logStreamName: logStreamName,
        logEvents: [{
          timestamp: Date.now(),
          message: `[${level}] ${JSON.stringify(message)}`
        }]
      });
      
      await this.cloudwatch.send(command);
    } catch (error) {
      // Silently fail CloudWatch logging to not interrupt the application

    }
  }

  // Helper method to store financial documents in S3
  async storeFinancialDocument(ticker, quarter, year, document, type = 'report') {
    const key = `financials/${ticker}/${year}/${quarter}/${type}.json`;
    return await this.putObject(key, {
      ticker,
      quarter,
      year,
      type,
      document,
      storedAt: new Date().toISOString()
    });
  }

  // Helper method to retrieve financial documents from S3
  async getFinancialDocument(ticker, quarter, year, type = 'report') {
    const key = `financials/${ticker}/${year}/${quarter}/${type}.json`;
    return await this.getObject(key);
  }
}

module.exports = AWSServices;