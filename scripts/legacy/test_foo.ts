export const HashGraphZodSchema = z.object({
  metadata: MetadataSchema,
  statistics: StatisticsSchema,
  structural: StructuralSchema,
  semantic: SemanticSchema,
  security: SecuritySchema,
  developer: DeveloperSchema,
});
