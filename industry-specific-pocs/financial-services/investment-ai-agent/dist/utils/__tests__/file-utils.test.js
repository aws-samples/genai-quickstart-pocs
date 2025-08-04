"use strict";
/**
 * Tests for file utility functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_utils_1 = require("../file-utils");
const fs = __importStar(require("fs"));
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
const mockFs = fs;
describe('File Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getFileExtension', () => {
        it('should extract file extension correctly', () => {
            expect((0, file_utils_1.getFileExtension)('document.pdf')).toBe('pdf');
            expect((0, file_utils_1.getFileExtension)('image.jpeg')).toBe('jpeg');
            expect((0, file_utils_1.getFileExtension)('data.csv')).toBe('csv');
            expect((0, file_utils_1.getFileExtension)('archive.tar.gz')).toBe('gz');
        });
        it('should handle files without extension', () => {
            expect((0, file_utils_1.getFileExtension)('README')).toBe('');
            expect((0, file_utils_1.getFileExtension)('file')).toBe('');
        });
        it('should handle hidden files', () => {
            expect((0, file_utils_1.getFileExtension)('.gitignore')).toBe('');
            expect((0, file_utils_1.getFileExtension)('.env.local')).toBe('local');
        });
        it('should handle paths with directories', () => {
            expect((0, file_utils_1.getFileExtension)('/path/to/file.txt')).toBe('txt');
            expect((0, file_utils_1.getFileExtension)('../../data/report.xlsx')).toBe('xlsx');
        });
    });
    describe('getMimeType', () => {
        it('should return correct MIME types for common extensions', () => {
            expect((0, file_utils_1.getMimeType)('pdf')).toBe('application/pdf');
            expect((0, file_utils_1.getMimeType)('jpg')).toBe('image/jpeg');
            expect((0, file_utils_1.getMimeType)('jpeg')).toBe('image/jpeg');
            expect((0, file_utils_1.getMimeType)('png')).toBe('image/png');
            expect((0, file_utils_1.getMimeType)('csv')).toBe('text/csv');
            expect((0, file_utils_1.getMimeType)('json')).toBe('application/json');
            expect((0, file_utils_1.getMimeType)('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
        it('should return default MIME type for unknown extensions', () => {
            expect((0, file_utils_1.getMimeType)('unknown')).toBe('application/octet-stream');
            expect((0, file_utils_1.getMimeType)('')).toBe('application/octet-stream');
        });
    });
    describe('isValidFileType', () => {
        it('should validate allowed file types', () => {
            const allowedTypes = ['pdf', 'csv', 'xlsx', 'json'];
            expect((0, file_utils_1.isValidFileType)('document.pdf', allowedTypes)).toBe(true);
            expect((0, file_utils_1.isValidFileType)('data.csv', allowedTypes)).toBe(true);
            expect((0, file_utils_1.isValidFileType)('report.xlsx', allowedTypes)).toBe(true);
            expect((0, file_utils_1.isValidFileType)('config.json', allowedTypes)).toBe(true);
        });
        it('should reject disallowed file types', () => {
            const allowedTypes = ['pdf', 'csv'];
            expect((0, file_utils_1.isValidFileType)('image.jpg', allowedTypes)).toBe(false);
            expect((0, file_utils_1.isValidFileType)('script.js', allowedTypes)).toBe(false);
            expect((0, file_utils_1.isValidFileType)('document.docx', allowedTypes)).toBe(false);
        });
        it('should handle case insensitive validation', () => {
            const allowedTypes = ['PDF', 'CSV'];
            expect((0, file_utils_1.isValidFileType)('document.pdf', allowedTypes)).toBe(true);
            expect((0, file_utils_1.isValidFileType)('data.CSV', allowedTypes)).toBe(true);
        });
    });
    describe('getFileSize', () => {
        it('should calculate file size from buffer', () => {
            const buffer = Buffer.from('Hello World');
            expect((0, file_utils_1.getFileSize)(buffer)).toBe(11);
        });
        it('should calculate file size from string', () => {
            expect((0, file_utils_1.getFileSize)('Hello World')).toBe(11);
            expect((0, file_utils_1.getFileSize)('')).toBe(0);
        });
        it('should handle File objects', () => {
            const mockFile = {
                size: 1024
            };
            expect((0, file_utils_1.getFileSize)(mockFile)).toBe(1024);
        });
    });
    describe('formatFileSize', () => {
        it('should format file sizes correctly', () => {
            expect((0, file_utils_1.formatFileSize)(0)).toBe('0 B');
            expect((0, file_utils_1.formatFileSize)(512)).toBe('512 B');
            expect((0, file_utils_1.formatFileSize)(1024)).toBe('1.0 KB');
            expect((0, file_utils_1.formatFileSize)(1536)).toBe('1.5 KB');
            expect((0, file_utils_1.formatFileSize)(1048576)).toBe('1.0 MB');
            expect((0, file_utils_1.formatFileSize)(1073741824)).toBe('1.0 GB');
        });
        it('should handle decimal places', () => {
            expect((0, file_utils_1.formatFileSize)(1536, 2)).toBe('1.50 KB');
            expect((0, file_utils_1.formatFileSize)(1048576, 0)).toBe('1 MB');
        });
    });
    describe('validateFileSize', () => {
        it('should validate files within size limits', () => {
            expect((0, file_utils_1.validateFileSize)(1024, 0, 2048)).toBe(true);
            expect((0, file_utils_1.validateFileSize)(0, 0, 1024)).toBe(true); // Min boundary
            expect((0, file_utils_1.validateFileSize)(1024, 0, 1024)).toBe(true); // Max boundary
        });
        it('should reject files outside size limits', () => {
            expect((0, file_utils_1.validateFileSize)(2048, 0, 1024)).toBe(false);
            expect((0, file_utils_1.validateFileSize)(0, 1, 1024)).toBe(false);
        });
    });
    describe('validateFileName', () => {
        it('should validate safe file names', () => {
            expect((0, file_utils_1.validateFileName)('document.pdf')).toBe(true);
            expect((0, file_utils_1.validateFileName)('my-file_v2.csv')).toBe(true);
            expect((0, file_utils_1.validateFileName)('Report 2023.xlsx')).toBe(true);
        });
        it('should reject unsafe file names', () => {
            expect((0, file_utils_1.validateFileName)('../../../etc/passwd')).toBe(false);
            expect((0, file_utils_1.validateFileName)('file<script>.txt')).toBe(false);
            expect((0, file_utils_1.validateFileName)('con.txt')).toBe(false); // Windows reserved name
            expect((0, file_utils_1.validateFileName)('')).toBe(false);
            expect((0, file_utils_1.validateFileName)('a'.repeat(256))).toBe(false); // Too long
        });
    });
    describe('sanitizeFileName', () => {
        it('should sanitize unsafe characters', () => {
            expect((0, file_utils_1.sanitizeFileName)('file<>name.txt')).toBe('filename.txt');
            expect((0, file_utils_1.sanitizeFileName)('my|file?.pdf')).toBe('myfile.pdf');
            expect((0, file_utils_1.sanitizeFileName)('file:name*test.csv')).toBe('filenametest.csv');
        });
        it('should preserve safe characters', () => {
            expect((0, file_utils_1.sanitizeFileName)('my-file_v2.pdf')).toBe('my-file_v2.pdf');
            expect((0, file_utils_1.sanitizeFileName)('Report 2023.xlsx')).toBe('Report 2023.xlsx');
        });
        it('should handle Windows reserved names', () => {
            expect((0, file_utils_1.sanitizeFileName)('con.txt')).toBe('_con.txt');
            expect((0, file_utils_1.sanitizeFileName)('aux.pdf')).toBe('_aux.pdf');
        });
    });
    describe('generateUniqueFileName', () => {
        it('should generate unique file names', () => {
            const name1 = (0, file_utils_1.generateUniqueFileName)('document.pdf');
            const name2 = (0, file_utils_1.generateUniqueFileName)('document.pdf');
            expect(name1).not.toBe(name2);
            expect(name1).toMatch(/^document_[a-f0-9]+\.pdf$/);
            expect(name2).toMatch(/^document_[a-f0-9]+\.pdf$/);
        });
        it('should preserve file extension', () => {
            const uniqueName = (0, file_utils_1.generateUniqueFileName)('test.csv');
            expect(uniqueName).toMatch(/\.csv$/);
        });
        it('should handle files without extension', () => {
            const uniqueName = (0, file_utils_1.generateUniqueFileName)('README');
            expect(uniqueName).toMatch(/^README_[a-f0-9]+$/);
        });
    });
    describe('parseCSV', () => {
        it('should parse valid CSV content', async () => {
            const csvContent = 'name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com';
            const result = await (0, file_utils_1.parseCSV)(csvContent);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ name: 'John', age: '30', email: 'john@example.com' });
            expect(result[1]).toEqual({ name: 'Jane', age: '25', email: 'jane@example.com' });
        });
        it('should handle CSV with custom delimiter', async () => {
            const csvContent = 'name;age;email\nJohn;30;john@example.com';
            const result = await (0, file_utils_1.parseCSV)(csvContent, { delimiter: ';' });
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: 'John', age: '30', email: 'john@example.com' });
        });
        it('should handle empty CSV', async () => {
            const result = await (0, file_utils_1.parseCSV)('');
            expect(result).toHaveLength(0);
        });
    });
    describe('parseJSON', () => {
        it('should parse valid JSON content', () => {
            const jsonContent = '{"name": "John", "age": 30}';
            const result = (0, file_utils_1.parseJSON)(jsonContent);
            expect(result).toEqual({ name: 'John', age: 30 });
        });
        it('should throw error for invalid JSON', () => {
            expect(() => (0, file_utils_1.parseJSON)('{invalid json}')).toThrow();
        });
    });
    describe('File operations', () => {
        describe('readFileAsText', () => {
            it('should read file as text', async () => {
                mockFs.promises.readFile.mockResolvedValue(Buffer.from('Hello World'));
                const content = await (0, file_utils_1.readFileAsText)('/path/to/file.txt');
                expect(content).toBe('Hello World');
                expect(mockFs.promises.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8');
            });
            it('should handle file read errors', async () => {
                mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));
                await expect((0, file_utils_1.readFileAsText)('/nonexistent/file.txt'))
                    .rejects.toThrow(file_utils_1.FileOperationError);
            });
        });
        describe('writeFile', () => {
            it('should write content to file', async () => {
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                await (0, file_utils_1.writeFile)('/path/to/file.txt', 'Hello World');
                expect(mockFs.promises.writeFile).toHaveBeenCalledWith('/path/to/file.txt', 'Hello World', 'utf8');
            });
            it('should handle write errors', async () => {
                mockFs.promises.writeFile.mockRejectedValue(new Error('Permission denied'));
                await expect((0, file_utils_1.writeFile)('/readonly/file.txt', 'content'))
                    .rejects.toThrow(file_utils_1.FileOperationError);
            });
        });
        describe('deleteFile', () => {
            it('should delete file', async () => {
                mockFs.promises.unlink.mockResolvedValue(undefined);
                await (0, file_utils_1.deleteFile)('/path/to/file.txt');
                expect(mockFs.promises.unlink).toHaveBeenCalledWith('/path/to/file.txt');
            });
            it('should handle delete errors', async () => {
                mockFs.promises.unlink.mockRejectedValue(new Error('File not found'));
                await expect((0, file_utils_1.deleteFile)('/nonexistent/file.txt'))
                    .rejects.toThrow(file_utils_1.FileOperationError);
            });
        });
        describe('exists', () => {
            it('should return true for existing files', async () => {
                mockFs.promises.access.mockResolvedValue(undefined);
                const result = await (0, file_utils_1.exists)('/path/to/file.txt');
                expect(result).toBe(true);
                expect(mockFs.promises.access).toHaveBeenCalledWith('/path/to/file.txt', fs.constants.F_OK);
            });
            it('should return false for non-existing files', async () => {
                mockFs.promises.access.mockRejectedValue(new Error('File not found'));
                const result = await (0, file_utils_1.exists)('/nonexistent/file.txt');
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
                mockFs.promises.stat.mockResolvedValue(mockStats);
                const stats = await (0, file_utils_1.getFileStats)('/path/to/file.txt');
                expect(stats.size).toBe(1024);
                expect(stats.isFile()).toBe(true);
                expect(stats.isDirectory()).toBe(false);
            });
        });
    });
    describe('Error classes', () => {
        describe('FileValidationError', () => {
            it('should create file validation error', () => {
                const error = new file_utils_1.FileValidationError('Invalid file type', 'document.exe');
                expect(error.message).toBe('Invalid file type');
                expect(error.fileName).toBe('document.exe');
                expect(error.name).toBe('FileValidationError');
            });
        });
        describe('FileOperationError', () => {
            it('should create file operation error', () => {
                const error = new file_utils_1.FileOperationError('Failed to read file', 'read', '/path/to/file.txt');
                expect(error.message).toBe('Failed to read file');
                expect(error.operation).toBe('read');
                expect(error.filePath).toBe('/path/to/file.txt');
                expect(error.name).toBe('FileOperationError');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11dGlscy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL19fdGVzdHNfXy9maWxlLXV0aWxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsOENBNEJ1QjtBQUN2Qix1Q0FBeUI7QUFHekIsaUJBQWlCO0FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDckIsUUFBUSxFQUFFO1FBQ1IsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDbkIsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDcEIsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDakIsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDaEIsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtLQUNsQjtJQUNELFNBQVMsRUFBRTtRQUNULElBQUksRUFBRSxDQUFDO0tBQ1I7Q0FDRixDQUFDLENBQUMsQ0FBQztBQUVKLE1BQU0sTUFBTSxHQUFHLEVBQTRCLENBQUM7QUFFNUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxFQUFFLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lB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USxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUksK0JBQWtCLENBQUMscUJBQXFCLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ3pGLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgZmlsZSB1dGlsaXR5IGZ1bmN0aW9uc1xuICovXG5cbmltcG9ydCB7XG4gIGdldEZpbGVFeHRlbnNpb24sXG4gIGdldE1pbWVUeXBlLFxuICBpc1ZhbGlkRmlsZVR5cGUsXG4gIGdldEZpbGVTaXplLFxuICBmb3JtYXRGaWxlU2l6ZSxcbiAgdmFsaWRhdGVGaWxlU2l6ZSxcbiAgdmFsaWRhdGVGaWxlTmFtZSxcbiAgc2FuaXRpemVGaWxlTmFtZSxcbiAgZ2VuZXJhdGVVbmlxdWVGaWxlTmFtZSxcbiAgcGFyc2VDU1YsXG4gIHBhcnNlSlNPTixcbiAgcGFyc2VYTUwsXG4gIHJlYWRGaWxlQXNUZXh0LFxuICByZWFkRmlsZUFzQnVmZmVyLFxuICByZWFkRmlsZUFzRGF0YVVSTCxcbiAgd3JpdGVGaWxlLFxuICBkZWxldGVGaWxlLFxuICBjb3B5RmlsZSxcbiAgbW92ZUZpbGUsXG4gIGNyZWF0ZURpcmVjdG9yeSxcbiAgbGlzdERpcmVjdG9yeSxcbiAgZ2V0RmlsZVN0YXRzLFxuICBpc0RpcmVjdG9yeSxcbiAgaXNGaWxlLFxuICBleGlzdHMsXG4gIEZpbGVWYWxpZGF0aW9uRXJyb3IsXG4gIEZpbGVPcGVyYXRpb25FcnJvclxufSBmcm9tICcuLi9maWxlLXV0aWxzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIE1vY2sgZnMgbW9kdWxlXG5qZXN0Lm1vY2soJ2ZzJywgKCkgPT4gKHtcbiAgcHJvbWlzZXM6IHtcbiAgICByZWFkRmlsZTogamVzdC5mbigpLFxuICAgIHdyaXRlRmlsZTogamVzdC5mbigpLFxuICAgIHVubGluazogamVzdC5mbigpLFxuICAgIGNvcHlGaWxlOiBqZXN0LmZuKCksXG4gICAgcmVuYW1lOiBqZXN0LmZuKCksXG4gICAgbWtkaXI6IGplc3QuZm4oKSxcbiAgICByZWFkZGlyOiBqZXN0LmZuKCksXG4gICAgc3RhdDogamVzdC5mbigpLFxuICAgIGFjY2VzczogamVzdC5mbigpXG4gIH0sXG4gIGNvbnN0YW50czoge1xuICAgIEZfT0s6IDBcbiAgfVxufSkpO1xuXG5jb25zdCBtb2NrRnMgPSBmcyBhcyBqZXN0Lk1vY2tlZDx0eXBlb2YgZnM+O1xuXG5kZXNjcmliZSgnRmlsZSBVdGlsaXRpZXMnLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0RmlsZUV4dGVuc2lvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV4dHJhY3QgZmlsZSBleHRlbnNpb24gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldEZpbGVFeHRlbnNpb24oJ2RvY3VtZW50LnBkZicpKS50b0JlKCdwZGYnKTtcbiAgICAgIGV4cGVjdChnZXRGaWxlRXh0ZW5zaW9uKCdpbWFnZS5qcGVnJykpLnRvQmUoJ2pwZWcnKTtcbiAgICAgIGV4cGVjdChnZXRGaWxlRXh0ZW5zaW9uKCdkYXRhLmNzdicpKS50b0JlKCdjc3YnKTtcbiAgICAgIGV4cGVjdChnZXRGaWxlRXh0ZW5zaW9uKCdhcmNoaXZlLnRhci5neicpKS50b0JlKCdneicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZmlsZXMgd2l0aG91dCBleHRlbnNpb24nLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0RmlsZUV4dGVuc2lvbignUkVBRE1FJykpLnRvQmUoJycpO1xuICAgICAgZXhwZWN0KGdldEZpbGVFeHRlbnNpb24oJ2ZpbGUnKSkudG9CZSgnJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBoaWRkZW4gZmlsZXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0RmlsZUV4dGVuc2lvbignLmdpdGlnbm9yZScpKS50b0JlKCcnKTtcbiAgICAgIGV4cGVjdChnZXRGaWxlRXh0ZW5zaW9uKCcuZW52LmxvY2FsJykpLnRvQmUoJ2xvY2FsJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBwYXRocyB3aXRoIGRpcmVjdG9yaWVzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldEZpbGVFeHRlbnNpb24oJy9wYXRoL3RvL2ZpbGUudHh0JykpLnRvQmUoJ3R4dCcpO1xuICAgICAgZXhwZWN0KGdldEZpbGVFeHRlbnNpb24oJy4uLy4uL2RhdGEvcmVwb3J0Lnhsc3gnKSkudG9CZSgneGxzeCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0TWltZVR5cGUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY29ycmVjdCBNSU1FIHR5cGVzIGZvciBjb21tb24gZXh0ZW5zaW9ucycsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXRNaW1lVHlwZSgncGRmJykpLnRvQmUoJ2FwcGxpY2F0aW9uL3BkZicpO1xuICAgICAgZXhwZWN0KGdldE1pbWVUeXBlKCdqcGcnKSkudG9CZSgnaW1hZ2UvanBlZycpO1xuICAgICAgZXhwZWN0KGdldE1pbWVUeXBlKCdqcGVnJykpLnRvQmUoJ2ltYWdlL2pwZWcnKTtcbiAgICAgIGV4cGVjdChnZXRNaW1lVHlwZSgncG5nJykpLnRvQmUoJ2ltYWdlL3BuZycpO1xuICAgICAgZXhwZWN0KGdldE1pbWVUeXBlKCdjc3YnKSkudG9CZSgndGV4dC9jc3YnKTtcbiAgICAgIGV4cGVjdChnZXRNaW1lVHlwZSgnanNvbicpKS50b0JlKCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICBleHBlY3QoZ2V0TWltZVR5cGUoJ3hsc3gnKSkudG9CZSgnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGRlZmF1bHQgTUlNRSB0eXBlIGZvciB1bmtub3duIGV4dGVuc2lvbnMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0TWltZVR5cGUoJ3Vua25vd24nKSkudG9CZSgnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICBleHBlY3QoZ2V0TWltZVR5cGUoJycpKS50b0JlKCdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2lzVmFsaWRGaWxlVHlwZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGFsbG93ZWQgZmlsZSB0eXBlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFsbG93ZWRUeXBlcyA9IFsncGRmJywgJ2NzdicsICd4bHN4JywgJ2pzb24nXTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGlzVmFsaWRGaWxlVHlwZSgnZG9jdW1lbnQucGRmJywgYWxsb3dlZFR5cGVzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChpc1ZhbGlkRmlsZVR5cGUoJ2RhdGEuY3N2JywgYWxsb3dlZFR5cGVzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChpc1ZhbGlkRmlsZVR5cGUoJ3JlcG9ydC54bHN4JywgYWxsb3dlZFR5cGVzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChpc1ZhbGlkRmlsZVR5cGUoJ2NvbmZpZy5qc29uJywgYWxsb3dlZFR5cGVzKSkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVqZWN0IGRpc2FsbG93ZWQgZmlsZSB0eXBlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFsbG93ZWRUeXBlcyA9IFsncGRmJywgJ2NzdiddO1xuICAgICAgXG4gICAgICBleHBlY3QoaXNWYWxpZEZpbGVUeXBlKCdpbWFnZS5qcGcnLCBhbGxvd2VkVHlwZXMpKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChpc1ZhbGlkRmlsZVR5cGUoJ3NjcmlwdC5qcycsIGFsbG93ZWRUeXBlcykpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KGlzVmFsaWRGaWxlVHlwZSgnZG9jdW1lbnQuZG9jeCcsIGFsbG93ZWRUeXBlcykpLnRvQmUoZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY2FzZSBpbnNlbnNpdGl2ZSB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWxsb3dlZFR5cGVzID0gWydQREYnLCAnQ1NWJ107XG4gICAgICBcbiAgICAgIGV4cGVjdChpc1ZhbGlkRmlsZVR5cGUoJ2RvY3VtZW50LnBkZicsIGFsbG93ZWRUeXBlcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoaXNWYWxpZEZpbGVUeXBlKCdkYXRhLkNTVicsIGFsbG93ZWRUeXBlcykpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRGaWxlU2l6ZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBmaWxlIHNpemUgZnJvbSBidWZmZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbSgnSGVsbG8gV29ybGQnKTtcbiAgICAgIGV4cGVjdChnZXRGaWxlU2l6ZShidWZmZXIpKS50b0JlKDExKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGZpbGUgc2l6ZSBmcm9tIHN0cmluZycsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXRGaWxlU2l6ZSgnSGVsbG8gV29ybGQnKSkudG9CZSgxMSk7XG4gICAgICBleHBlY3QoZ2V0RmlsZVNpemUoJycpKS50b0JlKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgRmlsZSBvYmplY3RzJywgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0ZpbGUgPSB7XG4gICAgICAgIHNpemU6IDEwMjRcbiAgICAgIH0gYXMgRmlsZTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGdldEZpbGVTaXplKG1vY2tGaWxlKSkudG9CZSgxMDI0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2Zvcm1hdEZpbGVTaXplJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZm9ybWF0IGZpbGUgc2l6ZXMgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGZvcm1hdEZpbGVTaXplKDApKS50b0JlKCcwIEInKTtcbiAgICAgIGV4cGVjdChmb3JtYXRGaWxlU2l6ZSg1MTIpKS50b0JlKCc1MTIgQicpO1xuICAgICAgZXhwZWN0KGZvcm1hdEZpbGVTaXplKDEwMjQpKS50b0JlKCcxLjAgS0InKTtcbiAgICAgIGV4cGVjdChmb3JtYXRGaWxlU2l6ZSgxNTM2KSkudG9CZSgnMS41IEtCJyk7XG4gICAgICBleHBlY3QoZm9ybWF0RmlsZVNpemUoMTA0ODU3NikpLnRvQmUoJzEuMCBNQicpO1xuICAgICAgZXhwZWN0KGZvcm1hdEZpbGVTaXplKDEwNzM3NDE4MjQpKS50b0JlKCcxLjAgR0InKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGRlY2ltYWwgcGxhY2VzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGZvcm1hdEZpbGVTaXplKDE1MzYsIDIpKS50b0JlKCcxLjUwIEtCJyk7XG4gICAgICBleHBlY3QoZm9ybWF0RmlsZVNpemUoMTA0ODU3NiwgMCkpLnRvQmUoJzEgTUInKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZhbGlkYXRlRmlsZVNpemUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBmaWxlcyB3aXRoaW4gc2l6ZSBsaW1pdHMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QodmFsaWRhdGVGaWxlU2l6ZSgxMDI0LCAwLCAyMDQ4KSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdCh2YWxpZGF0ZUZpbGVTaXplKDAsIDAsIDEwMjQpKS50b0JlKHRydWUpOyAvLyBNaW4gYm91bmRhcnlcbiAgICAgIGV4cGVjdCh2YWxpZGF0ZUZpbGVTaXplKDEwMjQsIDAsIDEwMjQpKS50b0JlKHRydWUpOyAvLyBNYXggYm91bmRhcnlcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVqZWN0IGZpbGVzIG91dHNpZGUgc2l6ZSBsaW1pdHMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QodmFsaWRhdGVGaWxlU2l6ZSgyMDQ4LCAwLCAxMDI0KSkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QodmFsaWRhdGVGaWxlU2l6ZSgwLCAxLCAxMDI0KSkudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd2YWxpZGF0ZUZpbGVOYW1lJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgc2FmZSBmaWxlIG5hbWVzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHZhbGlkYXRlRmlsZU5hbWUoJ2RvY3VtZW50LnBkZicpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHZhbGlkYXRlRmlsZU5hbWUoJ215LWZpbGVfdjIuY3N2JykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QodmFsaWRhdGVGaWxlTmFtZSgnUmVwb3J0IDIwMjMueGxzeCcpKS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgdW5zYWZlIGZpbGUgbmFtZXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QodmFsaWRhdGVGaWxlTmFtZSgnLi4vLi4vLi4vZXRjL3Bhc3N3ZCcpKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdCh2YWxpZGF0ZUZpbGVOYW1lKCdmaWxlPHNjcmlwdD4udHh0JykpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHZhbGlkYXRlRmlsZU5hbWUoJ2Nvbi50eHQnKSkudG9CZShmYWxzZSk7IC8vIFdpbmRvd3MgcmVzZXJ2ZWQgbmFtZVxuICAgICAgZXhwZWN0KHZhbGlkYXRlRmlsZU5hbWUoJycpKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdCh2YWxpZGF0ZUZpbGVOYW1lKCdhJy5yZXBlYXQoMjU2KSkpLnRvQmUoZmFsc2UpOyAvLyBUb28gbG9uZ1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnc2FuaXRpemVGaWxlTmFtZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNhbml0aXplIHVuc2FmZSBjaGFyYWN0ZXJzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHNhbml0aXplRmlsZU5hbWUoJ2ZpbGU8Pm5hbWUudHh0JykpLnRvQmUoJ2ZpbGVuYW1lLnR4dCcpO1xuICAgICAgZXhwZWN0KHNhbml0aXplRmlsZU5hbWUoJ215fGZpbGU/LnBkZicpKS50b0JlKCdteWZpbGUucGRmJyk7XG4gICAgICBleHBlY3Qoc2FuaXRpemVGaWxlTmFtZSgnZmlsZTpuYW1lKnRlc3QuY3N2JykpLnRvQmUoJ2ZpbGVuYW1ldGVzdC5jc3YnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgc2FmZSBjaGFyYWN0ZXJzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHNhbml0aXplRmlsZU5hbWUoJ215LWZpbGVfdjIucGRmJykpLnRvQmUoJ215LWZpbGVfdjIucGRmJyk7XG4gICAgICBleHBlY3Qoc2FuaXRpemVGaWxlTmFtZSgnUmVwb3J0IDIwMjMueGxzeCcpKS50b0JlKCdSZXBvcnQgMjAyMy54bHN4Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBXaW5kb3dzIHJlc2VydmVkIG5hbWVzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHNhbml0aXplRmlsZU5hbWUoJ2Nvbi50eHQnKSkudG9CZSgnX2Nvbi50eHQnKTtcbiAgICAgIGV4cGVjdChzYW5pdGl6ZUZpbGVOYW1lKCdhdXgucGRmJykpLnRvQmUoJ19hdXgucGRmJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZW5lcmF0ZVVuaXF1ZUZpbGVOYW1lJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgdW5pcXVlIGZpbGUgbmFtZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBuYW1lMSA9IGdlbmVyYXRlVW5pcXVlRmlsZU5hbWUoJ2RvY3VtZW50LnBkZicpO1xuICAgICAgY29uc3QgbmFtZTIgPSBnZW5lcmF0ZVVuaXF1ZUZpbGVOYW1lKCdkb2N1bWVudC5wZGYnKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KG5hbWUxKS5ub3QudG9CZShuYW1lMik7XG4gICAgICBleHBlY3QobmFtZTEpLnRvTWF0Y2goL15kb2N1bWVudF9bYS1mMC05XStcXC5wZGYkLyk7XG4gICAgICBleHBlY3QobmFtZTIpLnRvTWF0Y2goL15kb2N1bWVudF9bYS1mMC05XStcXC5wZGYkLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIGZpbGUgZXh0ZW5zaW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgdW5pcXVlTmFtZSA9IGdlbmVyYXRlVW5pcXVlRmlsZU5hbWUoJ3Rlc3QuY3N2Jyk7XG4gICAgICBleHBlY3QodW5pcXVlTmFtZSkudG9NYXRjaCgvXFwuY3N2JC8pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZmlsZXMgd2l0aG91dCBleHRlbnNpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCB1bmlxdWVOYW1lID0gZ2VuZXJhdGVVbmlxdWVGaWxlTmFtZSgnUkVBRE1FJyk7XG4gICAgICBleHBlY3QodW5pcXVlTmFtZSkudG9NYXRjaCgvXlJFQURNRV9bYS1mMC05XSskLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwYXJzZUNTVicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBhcnNlIHZhbGlkIENTViBjb250ZW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY3N2Q29udGVudCA9ICduYW1lLGFnZSxlbWFpbFxcbkpvaG4sMzAsam9obkBleGFtcGxlLmNvbVxcbkphbmUsMjUsamFuZUBleGFtcGxlLmNvbSc7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwYXJzZUNTVihjc3ZDb250ZW50KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHJlc3VsdFswXSkudG9FcXVhbCh7IG5hbWU6ICdKb2huJywgYWdlOiAnMzAnLCBlbWFpbDogJ2pvaG5AZXhhbXBsZS5jb20nIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdFsxXSkudG9FcXVhbCh7IG5hbWU6ICdKYW5lJywgYWdlOiAnMjUnLCBlbWFpbDogJ2phbmVAZXhhbXBsZS5jb20nIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgQ1NWIHdpdGggY3VzdG9tIGRlbGltaXRlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNzdkNvbnRlbnQgPSAnbmFtZTthZ2U7ZW1haWxcXG5Kb2huOzMwO2pvaG5AZXhhbXBsZS5jb20nO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGFyc2VDU1YoY3N2Q29udGVudCwgeyBkZWxpbWl0ZXI6ICc7JyB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdFswXSkudG9FcXVhbCh7IG5hbWU6ICdKb2huJywgYWdlOiAnMzAnLCBlbWFpbDogJ2pvaG5AZXhhbXBsZS5jb20nIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgQ1NWJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGFyc2VDU1YoJycpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlTGVuZ3RoKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncGFyc2VKU09OJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcGFyc2UgdmFsaWQgSlNPTiBjb250ZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QganNvbkNvbnRlbnQgPSAne1wibmFtZVwiOiBcIkpvaG5cIiwgXCJhZ2VcIjogMzB9JztcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlSlNPTihqc29uQ29udGVudCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoeyBuYW1lOiAnSm9obicsIGFnZTogMzAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBpbnZhbGlkIEpTT04nLCAoKSA9PiB7XG4gICAgICBleHBlY3QoKCkgPT4gcGFyc2VKU09OKCd7aW52YWxpZCBqc29ufScpKS50b1Rocm93KCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdGaWxlIG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ3JlYWRGaWxlQXNUZXh0JywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCByZWFkIGZpbGUgYXMgdGV4dCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbW9ja0ZzLnByb21pc2VzLnJlYWRGaWxlLm1vY2tSZXNvbHZlZFZhbHVlKEJ1ZmZlci5mcm9tKCdIZWxsbyBXb3JsZCcpKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZUFzVGV4dCgnL3BhdGgvdG8vZmlsZS50eHQnKTtcbiAgICAgICAgZXhwZWN0KGNvbnRlbnQpLnRvQmUoJ0hlbGxvIFdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChtb2NrRnMucHJvbWlzZXMucmVhZEZpbGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcvcGF0aC90by9maWxlLnR4dCcsICd1dGY4Jyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgZmlsZSByZWFkIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbW9ja0ZzLnByb21pc2VzLnJlYWRGaWxlLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignRmlsZSBub3QgZm91bmQnKSk7XG4gICAgICAgIFxuICAgICAgICBhd2FpdCBleHBlY3QocmVhZEZpbGVBc1RleHQoJy9ub25leGlzdGVudC9maWxlLnR4dCcpKVxuICAgICAgICAgIC5yZWplY3RzLnRvVGhyb3coRmlsZU9wZXJhdGlvbkVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3dyaXRlRmlsZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgd3JpdGUgY29udGVudCB0byBmaWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBtb2NrRnMucHJvbWlzZXMud3JpdGVGaWxlLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICAgIFxuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoJy9wYXRoL3RvL2ZpbGUudHh0JywgJ0hlbGxvIFdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChtb2NrRnMucHJvbWlzZXMud3JpdGVGaWxlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnL3BhdGgvdG8vZmlsZS50eHQnLCAnSGVsbG8gV29ybGQnLCAndXRmOCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgaGFuZGxlIHdyaXRlIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbW9ja0ZzLnByb21pc2VzLndyaXRlRmlsZS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ1Blcm1pc3Npb24gZGVuaWVkJykpO1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgZXhwZWN0KHdyaXRlRmlsZSgnL3JlYWRvbmx5L2ZpbGUudHh0JywgJ2NvbnRlbnQnKSlcbiAgICAgICAgICAucmVqZWN0cy50b1Rocm93KEZpbGVPcGVyYXRpb25FcnJvcik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdkZWxldGVGaWxlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBkZWxldGUgZmlsZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbW9ja0ZzLnByb21pc2VzLnVubGluay5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgZGVsZXRlRmlsZSgnL3BhdGgvdG8vZmlsZS50eHQnKTtcbiAgICAgICAgZXhwZWN0KG1vY2tGcy5wcm9taXNlcy51bmxpbmspLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgaGFuZGxlIGRlbGV0ZSBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIG1vY2tGcy5wcm9taXNlcy51bmxpbmsubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdGaWxlIG5vdCBmb3VuZCcpKTtcbiAgICAgICAgXG4gICAgICAgIGF3YWl0IGV4cGVjdChkZWxldGVGaWxlKCcvbm9uZXhpc3RlbnQvZmlsZS50eHQnKSlcbiAgICAgICAgICAucmVqZWN0cy50b1Rocm93KEZpbGVPcGVyYXRpb25FcnJvcik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdleGlzdHMnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIGZvciBleGlzdGluZyBmaWxlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbW9ja0ZzLnByb21pc2VzLmFjY2Vzcy5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhpc3RzKCcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QobW9ja0ZzLnByb21pc2VzLmFjY2VzcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJy9wYXRoL3RvL2ZpbGUudHh0JywgZnMuY29uc3RhbnRzLkZfT0spO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGZvciBub24tZXhpc3RpbmcgZmlsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIG1vY2tGcy5wcm9taXNlcy5hY2Nlc3MubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdGaWxlIG5vdCBmb3VuZCcpKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4aXN0cygnL25vbmV4aXN0ZW50L2ZpbGUudHh0Jyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZ2V0RmlsZVN0YXRzJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmlsZSBzdGF0aXN0aWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtb2NrU3RhdHMgPSB7XG4gICAgICAgICAgc2l6ZTogMTAyNCxcbiAgICAgICAgICBpc0ZpbGU6ICgpID0+IHRydWUsXG4gICAgICAgICAgaXNEaXJlY3Rvcnk6ICgpID0+IGZhbHNlLFxuICAgICAgICAgIG10aW1lOiBuZXcgRGF0ZSgnMjAyMy0wNi0wMScpLFxuICAgICAgICAgIGN0aW1lOiBuZXcgRGF0ZSgnMjAyMy0wNS0wMScpXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBtb2NrRnMucHJvbWlzZXMuc3RhdC5tb2NrUmVzb2x2ZWRWYWx1ZShtb2NrU3RhdHMgYXMgYW55KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZ2V0RmlsZVN0YXRzKCcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgICBleHBlY3Qoc3RhdHMuc2l6ZSkudG9CZSgxMDI0KTtcbiAgICAgICAgZXhwZWN0KHN0YXRzLmlzRmlsZSgpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3Qoc3RhdHMuaXNEaXJlY3RvcnkoKSkudG9CZShmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Vycm9yIGNsYXNzZXMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ0ZpbGVWYWxpZGF0aW9uRXJyb3InLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGNyZWF0ZSBmaWxlIHZhbGlkYXRpb24gZXJyb3InLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEZpbGVWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgZmlsZSB0eXBlJywgJ2RvY3VtZW50LmV4ZScpO1xuICAgICAgICBleHBlY3QoZXJyb3IubWVzc2FnZSkudG9CZSgnSW52YWxpZCBmaWxlIHR5cGUnKTtcbiAgICAgICAgZXhwZWN0KGVycm9yLmZpbGVOYW1lKS50b0JlKCdkb2N1bWVudC5leGUnKTtcbiAgICAgICAgZXhwZWN0KGVycm9yLm5hbWUpLnRvQmUoJ0ZpbGVWYWxpZGF0aW9uRXJyb3InKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0ZpbGVPcGVyYXRpb25FcnJvcicsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgY3JlYXRlIGZpbGUgb3BlcmF0aW9uIGVycm9yJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBGaWxlT3BlcmF0aW9uRXJyb3IoJ0ZhaWxlZCB0byByZWFkIGZpbGUnLCAncmVhZCcsICcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgICBleHBlY3QoZXJyb3IubWVzc2FnZSkudG9CZSgnRmFpbGVkIHRvIHJlYWQgZmlsZScpO1xuICAgICAgICBleHBlY3QoZXJyb3Iub3BlcmF0aW9uKS50b0JlKCdyZWFkJyk7XG4gICAgICAgIGV4cGVjdChlcnJvci5maWxlUGF0aCkudG9CZSgnL3BhdGgvdG8vZmlsZS50eHQnKTtcbiAgICAgICAgZXhwZWN0KGVycm9yLm5hbWUpLnRvQmUoJ0ZpbGVPcGVyYXRpb25FcnJvcicpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19