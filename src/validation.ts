/**
 * Zod validation schemas for MCP tool inputs
 * Provides runtime type safety and input validation
 */

import { z } from 'zod';

// ========== VALIDATION SCHEMAS ==========

export const SearchDataflowsSchema = z.object({
  query: z.string()
    .min(1, 'Search query must not be empty')
    .max(100, 'Search query must not exceed 100 characters'),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

export const ListDataflowsSchema = z.object({
  category: z.enum([
    'ECO', 'HEA', 'EDU', 'ENV', 'TRD', 'JOB', 'NRG', 'AGR',
    'GOV', 'SOC', 'DEV', 'STI', 'TAX', 'FIN', 'TRA', 'IND', 'REG',
    'HOU', 'MIG'
  ]).optional(),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
});

export const GetDataStructureSchema = z.object({
  dataflow_id: z.string()
    .min(1, 'Dataflow ID must not be empty')
    .max(50, 'Dataflow ID must not exceed 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Dataflow ID must contain only uppercase letters, numbers, and underscores'),
});

export const QueryDataSchema = z.object({
  dataflow_id: z.string()
    .min(1, 'Dataflow ID must not be empty')
    .max(50, 'Dataflow ID must not exceed 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Dataflow ID must contain only uppercase letters, numbers, and underscores'),
  filter: z.string()
    .max(200, 'Filter must not exceed 200 characters')
    .optional(),
  start_period: z.string()
    .regex(/^\d{4}(-Q[1-4]|-(0[1-9]|1[0-2]))?$/, 'Invalid period format. Use YYYY, YYYY-QN, or YYYY-MM')
    .optional(),
  end_period: z.string()
    .regex(/^\d{4}(-Q[1-4]|-(0[1-9]|1[0-2]))?$/, 'Invalid period format. Use YYYY, YYYY-QN, or YYYY-MM')
    .optional(),
  last_n_observations: z.number()
    .int('Observations limit must be an integer')
    .min(1, 'Observations limit must be at least 1')
    .max(1000, 'Observations limit cannot exceed 1000 (context protection)')
    .optional(),
});

export const SearchIndicatorsSchema = z.object({
  indicator: z.string()
    .min(1, 'Indicator search term must not be empty')
    .max(100, 'Indicator search term must not exceed 100 characters'),
  category: z.enum([
    'ECO', 'HEA', 'EDU', 'ENV', 'TRD', 'JOB', 'NRG', 'AGR',
    'GOV', 'SOC', 'DEV', 'STI', 'TAX', 'FIN', 'TRA', 'IND', 'REG',
    'HOU', 'MIG'
  ]).optional(),
});

export const GetDataflowUrlSchema = z.object({
  dataflow_id: z.string()
    .min(1, 'Dataflow ID must not be empty')
    .max(50, 'Dataflow ID must not exceed 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Dataflow ID must contain only uppercase letters, numbers, and underscores'),
  filter: z.string()
    .max(200, 'Filter must not exceed 200 characters')
    .optional(),
});

// Empty schemas for tools without parameters
export const GetCategoriesSchema = z.object({});
export const GetPopularDatasetsSchema = z.object({});
export const ListCategoriesDetailedSchema = z.object({});

// ========== TYPE EXPORTS ==========

export type SearchDataflowsInput = z.infer<typeof SearchDataflowsSchema>;
export type ListDataflowsInput = z.infer<typeof ListDataflowsSchema>;
export type GetDataStructureInput = z.infer<typeof GetDataStructureSchema>;
export type QueryDataInput = z.infer<typeof QueryDataSchema>;
export type SearchIndicatorsInput = z.infer<typeof SearchIndicatorsSchema>;
export type GetDataflowUrlInput = z.infer<typeof GetDataflowUrlSchema>;

// ========== VALIDATION HELPER ==========

/**
 * Validate input data against a Zod schema
 * Returns validated data or throws descriptive error
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  toolName: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');

      throw new Error(
        `Invalid input for tool "${toolName}": ${errors}`
      );
    }
    throw error;
  }
}
