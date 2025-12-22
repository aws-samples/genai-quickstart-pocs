import { Logger, LOG_LEVELS } from '../logging/logger';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  CloudWatchLogs: jest.fn().mockImplementation(() => ({
    createLogGroup: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    createLogStream: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    putLogEvents: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ nextSequenceToken: 'token123' })
    })
  }))
}));

describe('Logger', () => {
  let logger: Logger;
  let mockCloudWatchLogs: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new Logger('/test/log-group', 'test', '1.0.0');
    const { CloudWatchLogs } = require('aws-sdk');
    mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;
  });

  describe('log levels', () => {
    it('should have correct log levels defined', () => {
      expect(LOG_LEVELS.DEBUG).toBe('debug');
      expect(LOG_LEVELS.INFO).toBe('info');
      expect(LOG_LEVELS.WARN).toBe('warn');
      expect(LOG_LEVELS.ERROR).toBe('error');
      expect(LOG_LEVELS.CRITICAL).toBe('critical');
    });
  });

  describe('logging methods', () => {
    it('should log debug messages', async () => {
      await logger.debug('TestService', 'testOperation', 'Debug message', { key: 'value' });

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          logEvents: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('"level":"DEBUG"')
            })
          ])
        })
      );
    });

    it('should log info messages', async () => {
      await logger.info('TestService', 'testOperation', 'Info message', { key: 'value' });

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          logEvents: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('"level":"INFO"')
            })
          ])
        })
      );
    });

    it('should log error messages with error objects', async () => {
      const testError = new Error('Test error');
      await logger.error('TestService', 'testOperation', 'Error message', testError, { key: 'value' });

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          logEvents: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('"level":"ERROR"')
            })
          ])
        })
      );
    });
  });

  describe('structured logging', () => {
    it('should include all required fields in log entries', async () => {
      const context = {
        userId: 'user123',
        requestId: 'req123',
        sessionId: 'session123'
      };

      await logger.info('TestService', 'testOperation', 'Test message', { key: 'value' }, context);

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalled();
      const logEvent = mockCloudWatchLogs.putLogEvents.mock.calls[0][0].logEvents[0];
      const logEntry = JSON.parse(logEvent.message);

      expect(logEntry).toMatchObject({
        level: 'INFO',
        service: 'TestService',
        operation: 'testOperation',
        message: 'Test message',
        metadata: { key: 'value' },
        userId: 'user123',
        requestId: 'req123',
        sessionId: 'session123',
        environment: 'test',
        version: '1.0.0',
        source: 'investment-ai-agent'
      });

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.tags).toContain('level:INFO');
      expect(logEntry.tags).toContain('service:TestService');
      expect(logEntry.tags).toContain('user:user123');
    });
  });

  describe('error handling', () => {
    it('should handle CloudWatch errors gracefully', async () => {
      mockCloudWatchLogs.putLogEvents.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('CloudWatch error'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await logger.info('TestService', 'testOperation', 'Test message');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send logs to CloudWatch:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});