// // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// // SPDX-License-Identifier: MIT-0
// import * as z from 'zod';

// import { PropertyFilterQuery } from '@cloudscape-design/collection-hooks';

// const PropertyFilterOperation = z.enum(['and', 'or']);

// const propertyFilterTokenSchema = z.object({
//   // There's no other way to enforce this value as required. Using z.any() allows it to be optional, which breaks our types
//   value: z.object({}).passthrough().or(z.array(z.any())).or(z.string()).or(z.number()).or(z.boolean()),
//   propertyKey: z.string().optional(),
//   operator: z.string(),
// });

// const propertyFilterQueryBaseSchema = z.object({
//   tokens: z.array(propertyFilterTokenSchema),
//   operation: PropertyFilterOperation,
// });

// // workaround to validate recursive types: https://zod.dev/?id=recursive-types
// // fyi: same problem in yup and valibot
// type PropertyFilterQuerySchemaType = z.infer<typeof propertyFilterQueryBaseSchema> & {
//   tokenGroups?: PropertyFilterQuery['tokenGroups'];
// };

// const propertyFilterQuerySchema: z.ZodType<PropertyFilterQuerySchemaType> = propertyFilterQueryBaseSchema.extend({
//   tokenGroups: z.lazy(() => z.array(z.union([propertyFilterTokenSchema, propertyFilterQuerySchema])).optional()),
// });

// export const parsePropertyFilterQuery = (stringifiedPropertyFilter: string): PropertyFilterQuery => {
//   const defaultQuery = { operation: 'and', tokens: [] } as PropertyFilterQuery;

//   if (!stringifiedPropertyFilter) {
//     return defaultQuery;
//   }
//   try {
//     const json = JSON.parse(stringifiedPropertyFilter);
//     return propertyFilterQuerySchema.parse(json);
//   } catch (error) {
//     return defaultQuery;
//   }
// };
