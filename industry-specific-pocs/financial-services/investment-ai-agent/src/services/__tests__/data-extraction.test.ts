/**
 * Tests for data extraction utilities
 */

import { 
  extractFromCSV, 
  extractFromJSON, 
  generateSchemaFromData, 
  determineFieldType 
} from '../../utils/data-extraction';

describe('Data Extraction Utilities', () => {
  describe('extractFromCSV', () => {
    it('should extract data from CSV content', () => {
      const csvContent = 'id,name,value\n1,test,100\n2,test2,200';
      
      const result = extractFromCSV(csvContent);
      
      expect(result.success).toBe(true);
      expect(result.dataType).toBe('tabular');
      expect(result.extractedData).toHaveLength(2);
      expect(result.extractedData[0]).toEqual({
        id: 1,
        name: 'test',
        value: 100
      });
      expect(result.extractedData[1]).toEqual({
        id: 2,
        name: 'test2',
        value: 200
      });
      expect(result.schema).toBeDefined();
    });
    
    it('should handle empty CSV content', () => {
      const csvContent = '';
      
      const result = extractFromCSV(csvContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty CSV file');
    });
    
    it('should handle CSV without headers', () => {
      const csvContent = '1,test,100\n2,test2,200';
      
      const result = extractFromCSV(csvContent);
      
      expect(result.success).toBe(true);
      expect(result.extractedData).toHaveLength(2);
      expect(result.extractedData[0]).toHaveProperty('1', 1);
    });
  });
  
  describe('extractFromJSON', () => {
    it('should extract tabular data from JSON array', () => {
      const jsonContent = JSON.stringify([
        { id: 1, name: 'test', value: 100 },
        { id: 2, name: 'test2', value: 200 }
      ]);
      
      const result = extractFromJSON(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.dataType).toBe('tabular');
      expect(result.extractedData).toHaveLength(2);
      expect(result.schema).toBeDefined();
    });
    
    it('should extract mixed data from JSON object', () => {
      const jsonContent = JSON.stringify({
        id: 1,
        name: 'test',
        nested: {
          key: 'value'
        }
      });
      
      const result = extractFromJSON(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.dataType).toBe('mixed');
      expect(result.extractedData).toHaveProperty('id', 1);
      expect(result.extractedData).toHaveProperty('nested.key', 'value');
    });
    
    it('should handle invalid JSON', () => {
      const jsonContent = '{ invalid: json }';
      
      const result = extractFromJSON(jsonContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('generateSchemaFromData', () => {
    it('should generate schema from tabular data', () => {
      const data = [
        { id: 1, name: 'test', active: true, created: '2023-01-01' },
        { id: 2, name: 'test2', active: false, created: '2023-01-02' }
      ];
      
      const schema = generateSchemaFromData(data);
      
      expect(schema.fields).toHaveLength(4);
      expect(schema.dataTypes).toEqual({
        id: 'number',
        name: 'string',
        active: 'boolean',
        created: 'date'
      });
      expect(schema.rowCount).toBe(2);
    });
    
    it('should handle empty data', () => {
      const data: any[] = [];
      
      const schema = generateSchemaFromData(data);
      
      expect(schema.fields).toHaveLength(0);
      expect(schema.rowCount).toBe(0);
    });
  });
  
  describe('determineFieldType', () => {
    it('should determine string type', () => {
      const values = ['test', 'test2', 'test3'];
      
      const type = determineFieldType(values);
      
      expect(type).toBe('string');
    });
    
    it('should determine number type', () => {
      const values = [1, 2, 3];
      
      const type = determineFieldType(values);
      
      expect(type).toBe('number');
    });
    
    it('should determine boolean type', () => {
      const values = [true, false, true];
      
      const type = determineFieldType(values);
      
      expect(type).toBe('boolean');
    });
    
    it('should handle mixed types', () => {
      const values = ['test', 123, true];
      
      const type = determineFieldType(values);
      
      expect(type).toBe('unknown');
    });
    
    it('should handle null values', () => {
      const values = [null, null, null];
      
      const type = determineFieldType(values);
      
      expect(type).toBe('unknown');
    });
  });
});