import { z } from 'zod';

import { validateSchema } from '../utils/validation';

describe('validateSchema', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('should validate correct data', () => {
    const data = { name: 'John', age: 30 };
    const result = validateSchema(testSchema, data);
    expect(result).toEqual(data);
  });

  it('should throw error for invalid data', () => {
    const data = { name: 'John', age: 'thirty' };
    expect(() => validateSchema(testSchema, data)).toThrow();
  });
});