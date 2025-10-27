/**
 * Tests for validation utilities
 */

import {
  validateData,
  ValidationError,
  ValidationResult
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('should validate data against a simple schema', () => {
      const data = { name: 'John', age: 30 };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };

      const result = validateData(data, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
      const data = { name: '', age: 'not-a-number' };
      const schema = {
        name: { type: 'string', required: true, minLength: 1 },
        age: { type: 'number', required: true }
      };

      const result = validateData(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', () => {
      const data = { name: 'John' };
      const schema = {
        name: { type: 'string', required: true },
        email: { type: 'string', required: true }
      };

      const result = validateData(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.message.includes('email'))).toBe(true);
    });

    it('should handle optional fields', () => {
      const data = { name: 'John' };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: false }
      };

      const result = validateData(data, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate nested objects', () => {
      const data = {
        user: {
          name: 'John',
          contact: {
            email: 'john@example.com'
          }
        }
      };
      const schema = {
        user: {
          type: 'object',
          required: true,
          properties: {
            name: { type: 'string', required: true },
            contact: {
              type: 'object',
              required: true,
              properties: {
                email: { type: 'string', required: true }
              }
            }
          }
        }
      };

      const result = validateData(data, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message and field', () => {
      const error = new ValidationError('Invalid email format', 'email');
      expect(error.message).toBe('Invalid email format');
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error without field', () => {
      const error = new ValidationError('General validation error');
      expect(error.message).toBe('General validation error');
      expect(error.field).toBeUndefined();
    });

    it('should be an instance of Error', () => {
      const error = new ValidationError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('ValidationResult', () => {
    it('should have the correct structure for valid results', () => {
      const result: ValidationResult = {
        valid: true,
        errors: []
      };

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have the correct structure for invalid results', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          new ValidationError('Field is required', 'field1'),
          new ValidationError('Invalid format', 'field2')
        ]
      };

      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toBe('Field is required');
      expect(result.errors[1].message).toBe('Invalid format');
    });
  });
});