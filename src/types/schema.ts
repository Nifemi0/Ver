import { z } from "zod";

export const MetadataSchema = z.object({
  protocol_name: z.string(),
  contract_address: z.string(),
  is_proxy: z.boolean(),
  source_verified: z.boolean().optional(),
  chain_id: z.number().optional(),
  implementation_address: z.string().optional(),
  compiler_version: z.string(),
  schema_version: z.string(),
  enrichment_version: z.string(),
  cache_status: z.enum(["HIT", "MISS"]),
});

export const StatisticsSchema = z.object({
  contracts: z.number(),
  functions: z.number(),
  events: z.number(),
  dependencies: z.number(),
  roles: z.number(),
  proxy: z.boolean(),
  compile_time_ms: z.number()
});

export const RoleItemSchema = z.object({
  name: z.string(),
  source: z.string(),
  confidence: z.number(),
  evidence: z.string()
});

export const DependencyItemSchema = z.object({
  target: z.string(),
  detected_from: z.string(),
  evidence: z.string()
});

export const EventItemSchema = z.object({
  name: z.string(),
  source: z.string()
});

export const FunctionItemSchema = z.object({
  name: z.string(),
  signature: z.string().optional(),
  classification: z.string(),
  reason: z.string(),
  visibility: z.string()
});

export const StructuralSchema = z.object({
  roles: z.array(RoleItemSchema),
  dependencies: z.array(DependencyItemSchema),
  events: z.array(EventItemSchema),
});

export const DerivedStringSchema = z.object({
  value: z.string(),
  derived_from: z.array(z.string())
});

export const DerivedArraySchema = z.array(DerivedStringSchema);

export const SemanticSchema = z.object({
  intent: DerivedStringSchema.nullable(),
  user_goal: DerivedStringSchema.nullable(),
  semantic_status: z.enum(["PENDING", "RUNNING", "COMPLETE", "FAILED", "SKIPPED"]).default("PENDING"),
  prompt_version: z.string().optional(),
  model: z.string().optional(),
  generated_at: z.string().optional(),
  enrichment_time_ms: z.number().optional(),
  structural_integrity_score: z.number(),
  verified: z.boolean(),
});

export const SecuritySchema = z.object({
  guardrails: DerivedArraySchema,
  privileged_functions: z.array(FunctionItemSchema),
  structural_integrity_score: z.number(),
  verified: z.boolean(),
});

export const DeveloperSchema = z.object({
  integration_notes: DerivedArraySchema,
  structural_integrity_score: z.number(),
  verified: z.boolean(),
});

export const RegistrySchema = z.object({
  registered: z.boolean(),
  verified: z.boolean(),
  graphHash: z.string(),
  hashVersion: z.string().optional(),
  checkedAt: z.string().optional(),
  lookupStatus: z.enum(["checked", "unavailable", "disabled"]).optional(),
  metadataURI: z.string(),
  registryAddress: z.string(),
  deploymentNetwork: z.enum(["X Layer Mainnet", "BOT Chain Testnet", "Off-Chain Only"]),
}).optional();

export const VerZodSchema = z.object({
  metadata: MetadataSchema,
  statistics: StatisticsSchema,
  structural: StructuralSchema,
  semantic: SemanticSchema,
  security: SecuritySchema,
  developer: DeveloperSchema,
  registry: RegistrySchema,
});

export type VerSchema = z.infer<typeof VerZodSchema>;
