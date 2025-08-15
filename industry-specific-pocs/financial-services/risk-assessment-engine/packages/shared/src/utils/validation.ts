// Validation utilities
import { z } from 'zod';

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};