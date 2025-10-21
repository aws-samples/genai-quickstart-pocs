/**
 * Tests for the proprietary data service
 */

import { ProprietaryDataService } from '../proprietary-data-service';
import { AccessControl } from '../../models/proprietary-data';
import { DataMetadata } from '../../models/services';

// Create a mock File class for Node.js environment
class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string | ArrayBuffer;
  
  constructor(bits: Array<string | ArrayBuffer>, name: string, options?: { type?: string }) {
    this.name = name;
    this.content = bits[0] || '';
    
    // Calculate size based on content
    if (typeof this.content === 'string') {
      this.size = this.content.length;
    } else if (this.content instanceof ArrayBuffer) {
      this.size = this.content.byteLength;
    } else {
      this.size = 0;
    }
    
    this.type = options?.type || '';
    this.lastModified = Date.now();
  }
  
  // Mock methods that would be available on a File object
  text(): Promise<string> {
    if (typeof this.content === 'string') {
      return Promise.resolve(this.content);
    }
    return Promise.resolve('');
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    if (this.content instanceof ArrayBuffer) {
      return Promise.resolve(this.content);
    }
    // Convert string to ArrayBuffer if needed
    if (typeof this.content === 'string') {
      const encoder = new TextEncoder();
      return Promise.resolve(encoder.encode(this.content).buffer);
    }
    return Promise.resolve(new ArrayBuffer(0));
  }
}

describe('ProprietaryDataService', () => {
  let service: ProprietaryDataService;
  
  // Mock the internal methods of ProprietaryDataService
  beforeEach(() => {
    service = new ProprietaryDataService('test-bucket');
    
    // Mock the uploadToS3 method
    (service as any).uploadToS3 = jest.fn().mockResolvedValue(true);
    
    // Mock the storeMetadata method
    (service as any).storeMetadata = jest.fn().mockResolvedValue(true);
    
    // Mock the queueFileForProcessing method to avoid setTimeout
    (service as any).queueFileForProcessing = jest.fn();
  });
  
  describe('uploadFile', () => {
    it('should validate file type', async () => {
      // Create test file with unsupported extension
      const file = new MockFile(['test content'], 'test.xyz', { type: 'text/plain' }) as unknown as File;
      
      const metadata: DataMetadata = {
        source: 'test',
        type: 'proprietary',
        timestamp: new Date(),
        confidentiality: 'private',
        tags: ['test']
      };
      
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: ['user1']
      };
      
      const result = await service.uploadFile(
        file,
        metadata,
        'user1',
        'org1',
        accessControl
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
    
    it('should accept valid CSV file', async () => {
      // Create test CSV file
      const csvContent = 'id,name,value\n1,test,100\n2,test2,200';
      const file = new MockFile([csvContent], 'test.csv', { type: 'text/csv' }) as unknown as File;
      
      const metadata: DataMetadata = {
        source: 'test',
        type: 'proprietary',
        timestamp: new Date(),
        confidentiality: 'private',
        tags: ['test']
      };
      
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: ['user1']
      };
      
      const result = await service.uploadFile(
        file,
        metadata,
        'user1',
        'org1',
        accessControl
      );
      
      expect(result.success).toBe(true);
      expect(result.documentId).toBeDefined();
      expect(result.processingStatus).toBe('queued');
      expect((service as any).queueFileForProcessing).toHaveBeenCalled();
    });
  });
  
  describe('normalizeData', () => {
    it('should normalize tabular data', async () => {
      const data = [
        { name: ' John ', age: '30', active: 'true' },
        { name: ' Jane ', age: '25', active: 'false' }
      ];
      
      const options = {
        trimWhitespace: true,
        textCase: 'upper' as const
      };
      
      const result = await service.normalizeData(data, options);
      
      expect(result.success).toBe(true);
      expect(result.normalizedData).toEqual([
        { name: 'JOHN', age: '30', active: 'TRUE' },
        { name: 'JANE', age: '25', active: 'FALSE' }
      ]);
      expect(result.transformations.length).toBeGreaterThan(0);
    });
    
    it('should handle null values', async () => {
      const data = [
        { name: 'John', age: null, active: true },
        { name: 'Jane', age: 25, active: false }
      ];
      
      const options = {
        handleNulls: 'replace' as const,
        nullReplacement: 0
      };
      
      const result = await service.normalizeData(data, options);
      
      expect(result.success).toBe(true);
      expect(result.normalizedData).toEqual([
        { name: 'John', age: 0, active: true },
        { name: 'Jane', age: 25, active: false }
      ]);
    });
    
    it('should handle unsupported data format', async () => {
      const data = 'not an object or array';
      
      const options = {
        trimWhitespace: true
      };
      
      const result = await service.normalizeData(data, options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported data format');
    });
  });
  
  describe('processFile', () => {
    beforeEach(() => {
      // Mock the getFileMetadata method
      (service as any).getFileMetadata = jest.fn().mockResolvedValue({
        id: 'test-id',
        fileName: 'test.csv',
        fileType: 'csv',
        uploadDate: new Date(),
        userId: 'user1',
        organizationId: 'org1',
        metadata: {
          source: 'test',
          type: 'proprietary',
          timestamp: new Date(),
          confidentiality: 'private',
          tags: ['test']
        },
        status: 'uploaded',
        accessControl: {
          visibility: 'user',
          allowedUsers: ['user1']
        },
        storageLocation: 'org1/user1/test-id/test.csv'
      });
      
      // Mock the updateFileStatus method
      (service as any).updateFileStatus = jest.fn().mockResolvedValue(undefined);
      
      // Mock the extractData method
      (service as any).extractData = jest.fn().mockResolvedValue({
        success: true,
        dataType: 'tabular',
        extractedData: [{ id: 1, name: 'test', value: 100 }],
        processingTime: 100,
        extractionMethod: 'csv-parser'
      });
      
      // Mock the storeExtractedData method
      (service as any).storeExtractedData = jest.fn().mockResolvedValue(undefined);
    });
    
    it('should process a file successfully', async () => {
      const result = await service.processFile('test-id');
      
      expect(result.success).toBe(true);
      expect(result.processingStatus).toBe('completed');
      expect((service as any).updateFileStatus).toHaveBeenCalledWith('test-id', 'processing');
      expect((service as any).extractData).toHaveBeenCalled();
      expect((service as any).storeExtractedData).toHaveBeenCalled();
      expect((service as any).updateFileStatus).toHaveBeenCalledWith('test-id', 'processed');
    });
    
    it('should handle extraction failure', async () => {
      // Override the extractData mock to return failure
      (service as any).extractData = jest.fn().mockResolvedValue({
        success: false,
        dataType: 'unknown',
        error: 'Extraction failed',
        processingTime: 100,
        extractionMethod: 'failed'
      });
      
      const result = await service.processFile('test-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Extraction failed');
      expect(result.processingStatus).toBe('failed');
      expect((service as any).updateFileStatus).toHaveBeenCalledWith('test-id', 'failed', 'Extraction failed');
    });
  });
});