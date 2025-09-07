/**
 * Tests for file utility functions
 */

import {
  getFileExtension,
  getMimeType,
  isValidFileType,
  getFileSize,
  formatFileSize,
  validateFileSize,
  validateFileName,
  sanitizeFileName,
  generateUniqueFileName,
  parseCSV,
  parseJSON,
  parseXML,
  readFileAsText,
  readFileAsBuffer,
  readFileAsDataURL,
  writeFile,
  deleteFile,
  copyFile,
  moveFile,
  createDirectory,
  listDirectory,
  getFileStats,
  isDirectory,
  isFile,
  exists,
  FileValidationError,
  FileOperationError
} from '../file-utils';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn()
  },
  constants: {
    F_OK: 0
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('File Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpeg')).toBe('jpeg');
      expect(getFileExtension('data.csv')).toBe('csv');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file')).toBe('');
    });

    it('should handle hidden files', () => {
      expect(getFileExtension('.gitignore')).toBe('');
      expect(getFileExtension('.env.local')).toBe('local');
    });

    it('should handle paths with directories', () => {
      expect(getFileExtension('/path/to/file.txt')).toBe('txt');
      expect(getFileExtension('../../data/report.xlsx')).toBe('xlsx');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for common extensions', () => {
      expect(getMimeType('pdf')).toBe('application/pdf');
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(getMimeType('unknown')).toBe('application/octet-stream');
      expect(getMimeType('')).toBe('application/octet-stream');
    });
  });

  describe('isValidFileType', () => {
    it('should validate allowed file types', () => {
      const allowedTypes = ['pdf', 'csv', 'xlsx', 'json'];
      
      expect(isValidFileType('document.pdf', allowedTypes)).toBe(true);
      expect(isValidFileType('data.csv', allowedTypes)).toBe(true);
      expect(isValidFileType('report.xlsx', allowedTypes)).toBe(true);
      expect(isValidFileType('config.json', allowedTypes)).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const allowedTypes = ['pdf', 'csv'];
      
      expect(isValidFileType('image.jpg', allowedTypes)).toBe(false);
      expect(isValidFileType('script.js', allowedTypes)).toBe(false);
      expect(isValidFileType('document.docx', allowedTypes)).toBe(false);
    });

    it('should handle case insensitive validation', () => {
      const allowedTypes = ['PDF', 'CSV'];
      
      expect(isValidFileType('document.pdf', allowedTypes)).toBe(true);
      expect(isValidFileType('data.CSV', allowedTypes)).toBe(true);
    });
  });

  describe('getFileSize', () => {
    it('should calculate file size from buffer', () => {
      const buffer = Buffer.from('Hello World');
      expect(getFileSize(buffer)).toBe(11);
    });

    it('should calculate file size from string', () => {
      expect(getFileSize('Hello World')).toBe(11);
      expect(getFileSize('')).toBe(0);
    });

    it('should handle File objects', () => {
      const mockFile = {
        size: 1024
      } as File;
      
      expect(getFileSize(mockFile)).toBe(1024);
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536, 2)).toBe('1.50 KB');
      expect(formatFileSize(1048576, 0)).toBe('1 MB');
    });
  });

  describe('validateFileSize', () => {
    it('should validate files within size limits', () => {
      expect(validateFileSize(1024, 0, 2048)).toBe(true);
      expect(validateFileSize(0, 0, 1024)).toBe(true); // Min boundary
      expect(validateFileSize(1024, 0, 1024)).toBe(true); // Max boundary
    });

    it('should reject files outside size limits', () => {
      expect(validateFileSize(2048, 0, 1024)).toBe(false);
      expect(validateFileSize(0, 1, 1024)).toBe(false);
    });
  });

  describe('validateFileName', () => {
    it('should validate safe file names', () => {
      expect(validateFileName('document.pdf')).toBe(true);
      expect(validateFileName('my-file_v2.csv')).toBe(true);
      expect(validateFileName('Report 2023.xlsx')).toBe(true);
    });

    it('should reject unsafe file names', () => {
      expect(validateFileName('../../../etc/passwd')).toBe(false);
      expect(validateFileName('file<script>.txt')).toBe(false);
      expect(validateFileName('con.txt')).toBe(false); // Windows reserved name
      expect(validateFileName('')).toBe(false);
      expect(validateFileName('a'.repeat(256))).toBe(false); // Too long
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize unsafe characters', () => {
      expect(sanitizeFileName('file<>name.txt')).toBe('filename.txt');
      expect(sanitizeFileName('my|file?.pdf')).toBe('myfile.pdf');
      expect(sanitizeFileName('file:name*test.csv')).toBe('filenametest.csv');
    });

    it('should preserve safe characters', () => {
      expect(sanitizeFileName('my-file_v2.pdf')).toBe('my-file_v2.pdf');
      expect(sanitizeFileName('Report 2023.xlsx')).toBe('Report 2023.xlsx');
    });

    it('should handle Windows reserved names', () => {
      expect(sanitizeFileName('con.txt')).toBe('_con.txt');
      expect(sanitizeFileName('aux.pdf')).toBe('_aux.pdf');
    });
  });

  describe('generateUniqueFileName', () => {
    it('should generate unique file names', () => {
      const name1 = generateUniqueFileName('document.pdf');
      const name2 = generateUniqueFileName('document.pdf');
      
      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/^document_[a-f0-9]+\.pdf$/);
      expect(name2).toMatch(/^document_[a-f0-9]+\.pdf$/);
    });

    it('should preserve file extension', () => {
      const uniqueName = generateUniqueFileName('test.csv');
      expect(uniqueName).toMatch(/\.csv$/);
    });

    it('should handle files without extension', () => {
      const uniqueName = generateUniqueFileName('README');
      expect(uniqueName).toMatch(/^README_[a-f0-9]+$/);
    });
  });

  describe('parseCSV', () => {
    it('should parse valid CSV content', async () => {
      const csvContent = 'name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com';
      const result = await parseCSV(csvContent);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'John', age: '30', email: 'john@example.com' });
      expect(result[1]).toEqual({ name: 'Jane', age: '25', email: 'jane@example.com' });
    });

    it('should handle CSV with custom delimiter', async () => {
      const csvContent = 'name;age;email\nJohn;30;john@example.com';
      const result = await parseCSV(csvContent, { delimiter: ';' });
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'John', age: '30', email: 'john@example.com' });
    });

    it('should handle empty CSV', async () => {
      const result = await parseCSV('');
      expect(result).toHaveLength(0);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON content', () => {
      const jsonContent = '{"name": "John", "age": 30}';
      const result = parseJSON(jsonContent);
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should throw error for invalid JSON', () => {
      expect(() => parseJSON('{invalid json}')).toThrow();
    });
  });

  describe('File operations', () => {
    describe('readFileAsText', () => {
      it('should read file as text', async () => {
        mockFs.promises.readFile.mockResolvedValue(Buffer.from('Hello World'));
        
        const content = await readFileAsText('/path/to/file.txt');
        expect(content).toBe('Hello World');
        expect(mockFs.promises.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8');
      });

      it('should handle file read errors', async () => {
        mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));
        
        await expect(readFileAsText('/nonexistent/file.txt'))
          .rejects.toThrow(FileOperationError);
      });
    });

    describe('writeFile', () => {
      it('should write content to file', async () => {
        mockFs.promises.writeFile.mockResolvedValue(undefined);
        
        await writeFile('/path/to/file.txt', 'Hello World');
        expect(mockFs.promises.writeFile).toHaveBeenCalledWith('/path/to/file.txt', 'Hello World', 'utf8');
      });

      it('should handle write errors', async () => {
        mockFs.promises.writeFile.mockRejectedValue(new Error('Permission denied'));
        
        await expect(writeFile('/readonly/file.txt', 'content'))
          .rejects.toThrow(FileOperationError);
      });
    });

    describe('deleteFile', () => {
      it('should delete file', async () => {
        mockFs.promises.unlink.mockResolvedValue(undefined);
        
        await deleteFile('/path/to/file.txt');
        expect(mockFs.promises.unlink).toHaveBeenCalledWith('/path/to/file.txt');
      });

      it('should handle delete errors', async () => {
        mockFs.promises.unlink.mockRejectedValue(new Error('File not found'));
        
        await expect(deleteFile('/nonexistent/file.txt'))
          .rejects.toThrow(FileOperationError);
      });
    });

    describe('exists', () => {
      it('should return true for existing files', async () => {
        mockFs.promises.access.mockResolvedValue(undefined);
        
        const result = await exists('/path/to/file.txt');
        expect(result).toBe(true);
        expect(mockFs.promises.access).toHaveBeenCalledWith('/path/to/file.txt', fs.constants.F_OK);
      });

      it('should return false for non-existing files', async () => {
        mockFs.promises.access.mockRejectedValue(new Error('File not found'));
        
        const result = await exists('/nonexistent/file.txt');
        expect(result).toBe(false);
      });
    });

    describe('getFileStats', () => {
      it('should return file statistics', async () => {
        const mockStats = {
          size: 1024,
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date('2023-06-01'),
          ctime: new Date('2023-05-01')
        };
        
        mockFs.promises.stat.mockResolvedValue(mockStats as any);
        
        const stats = await getFileStats('/path/to/file.txt');
        expect(stats.size).toBe(1024);
        expect(stats.isFile()).toBe(true);
        expect(stats.isDirectory()).toBe(false);
      });
    });
  });

  describe('Error classes', () => {
    describe('FileValidationError', () => {
      it('should create file validation error', () => {
        const error = new FileValidationError('Invalid file type', 'document.exe');
        expect(error.message).toBe('Invalid file type');
        expect(error.fileName).toBe('document.exe');
        expect(error.name).toBe('FileValidationError');
      });
    });

    describe('FileOperationError', () => {
      it('should create file operation error', () => {
        const error = new FileOperationError('Failed to read file', 'read', '/path/to/file.txt');
        expect(error.message).toBe('Failed to read file');
        expect(error.operation).toBe('read');
        expect(error.filePath).toBe('/path/to/file.txt');
        expect(error.name).toBe('FileOperationError');
      });
    });
  });
});