import { CloudWatchLogs } from 'aws-sdk';

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  CRITICAL: 'critical';
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

export interface LogEntry {
  timestamp: Date;
  level: keyof LogLevel;
  service: string;
  operation: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  traceId?: string;
}

export interface StructuredLogEntry extends LogEntry {
  environment: string;
  version: string;
  source: string;
  tags: string[];
}

export class Logger {
  private cloudWatchLogs: CloudWatchLogs;
  private logGroupName: string;
  private logStreamName: string;
  private environment: string;
  private version: string;
  private sequenceToken?: string;

  constructor(
    logGroupName: string = '/aws/lambda/investment-ai-agent',
    environment: string = process.env.NODE_ENV || 'development',
    version: string = process.env.APP_VERSION || '1.0.0'
  ) {
    this.cloudWatchLogs = new CloudWatchLogs({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.logGroupName = logGroupName;
    this.logStreamName = `${environment}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.environment = environment;
    this.version = version;
    
    this.initializeLogStream();
  }

  private async initializeLogStream(): Promise<void> {
    try {
      // Create log group if it doesn't exist
      await this.cloudWatchLogs.createLogGroup({
        logGroupName: this.logGroupName
      }).promise().catch(err => {
        if (err.code !== 'ResourceAlreadyExistsException') {
          throw err;
        }
      });

      // Create log stream
      await this.cloudWatchLogs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }).promise().catch(err => {
        if (err.code !== 'ResourceAlreadyExistsException') {
          throw err;
        }
      });
    } catch (error) {
      console.error('Failed to initialize CloudWatch log stream:', error);
    }
  }

  private createStructuredLogEntry(entry: LogEntry): StructuredLogEntry {
    return {
      ...entry,
      environment: this.environment,
      version: this.version,
      source: 'investment-ai-agent',
      tags: this.generateTags(entry)
    };
  }

  private generateTags(entry: LogEntry): string[] {
    const tags: string[] = [
      `level:${entry.level}`,
      `service:${entry.service}`,
      `environment:${this.environment}`
    ];

    if (entry.userId) {
      tags.push(`user:${entry.userId}`);
    }

    if (entry.operation) {
      tags.push(`operation:${entry.operation}`);
    }

    return tags;
  }

  private async sendToCloudWatch(entries: StructuredLogEntry[]): Promise<void> {
    try {
      const logEvents = entries.map(entry => ({
        timestamp: entry.timestamp.getTime(),
        message: JSON.stringify(entry)
      }));

      const params: CloudWatchLogs.PutLogEventsRequest = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents,
        sequenceToken: this.sequenceToken
      };

      const result = await this.cloudWatchLogs.putLogEvents(params).promise();
      this.sequenceToken = result.nextSequenceToken;
    } catch (error) {
      console.error('Failed to send logs to CloudWatch:', error);
      // Fallback to console logging
      entries.forEach(entry => {
        console.log(JSON.stringify(entry));
      });
    }
  }

  async log(entry: LogEntry): Promise<void> {
    const structuredEntry = this.createStructuredLogEntry(entry);
    
    // Console output for development
    if (this.environment === 'development') {
      console.log(`[${structuredEntry.timestamp.toISOString()}] ${structuredEntry.level.toUpperCase()} [${structuredEntry.service}:${structuredEntry.operation}] ${structuredEntry.message}`, structuredEntry.metadata || '');
    }

    // Send to CloudWatch
    await this.sendToCloudWatch([structuredEntry]);
  }

  async debug(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: 'DEBUG',
      service,
      operation,
      message,
      metadata,
      ...context
    });
  }

  async info(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: 'INFO',
      service,
      operation,
      message,
      metadata,
      ...context
    });
  }

  async warn(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: 'WARN',
      service,
      operation,
      message,
      metadata,
      ...context
    });
  }

  async error(service: string, operation: string, message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void> {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    await this.log({
      timestamp: new Date(),
      level: 'ERROR',
      service,
      operation,
      message,
      metadata: errorMetadata,
      ...context
    });
  }

  async critical(service: string, operation: string, message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void> {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    await this.log({
      timestamp: new Date(),
      level: 'CRITICAL',
      service,
      operation,
      message,
      metadata: errorMetadata,
      ...context
    });
  }

  async batch(entries: LogEntry[]): Promise<void> {
    const structuredEntries = entries.map(entry => this.createStructuredLogEntry(entry));
    await this.sendToCloudWatch(structuredEntries);
  }
}

// Singleton instance
export const logger = new Logger();