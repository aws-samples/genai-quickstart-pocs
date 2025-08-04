export interface LogLevel {
    DEBUG: 'debug';
    INFO: 'info';
    WARN: 'warn';
    ERROR: 'error';
    CRITICAL: 'critical';
}
export declare const LOG_LEVELS: LogLevel;
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
export declare class Logger {
    private cloudWatchLogs;
    private logGroupName;
    private logStreamName;
    private environment;
    private version;
    private sequenceToken?;
    constructor(logGroupName?: string, environment?: string, version?: string);
    private initializeLogStream;
    private createStructuredLogEntry;
    private generateTags;
    private sendToCloudWatch;
    log(entry: LogEntry): Promise<void>;
    debug(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void>;
    info(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void>;
    warn(service: string, operation: string, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void>;
    error(service: string, operation: string, message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void>;
    critical(service: string, operation: string, message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>): Promise<void>;
    batch(entries: LogEntry[]): Promise<void>;
}
export declare const logger: Logger;
