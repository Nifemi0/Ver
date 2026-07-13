import { VerSchema } from "../../types/schema";
import { 
  CompilerInput, 
  RoleResult, 
  EventResult, 
  FunctionResult, 
  DependencyResult 
} from "./interfaces";

export class GraphAssembler {
    public assemble(
        input: CompilerInput,
        roles: RoleResult,
        events: EventResult,
        functions: FunctionResult,
        deps: DependencyResult,
        integrityScore: number,
        extractionTimeMs: number
    ): VerSchema {
        
        const isVerified = integrityScore >= 85;

        return {
            metadata: {
                protocol_name: input.metadata.protocolName,
                contract_address: input.address,
                is_proxy: input.isProxy,
                implementation_address: input.implementation || undefined,
                compiler_version: input.metadata.compilerVersion,
                schema_version: "1.0.0",
                enrichment_version: "1.0.0",
                cache_status: "MISS"
            },
            statistics: {
                contracts: 1 + (input.isProxy && input.implementation ? 1 : 0),
                functions: functions.privileged_functions.length + functions.public_functions.length,
                events: events.events.length,
                dependencies: deps.dependencies.length,
                roles: roles.roles.length,
                proxy: input.isProxy,
                compile_time_ms: Math.round(extractionTimeMs)
            },
            structural: {
                roles: roles.roles,
                dependencies: deps.dependencies,
                events: events.events
            },
            semantic: {
                intent: null,
                user_goal: null,
                semantic_status: "PENDING",
                structural_integrity_score: integrityScore,
                verified: isVerified
            },
            security: {
                guardrails: [],
                privileged_functions: functions.privileged_functions,
                structural_integrity_score: integrityScore,
                verified: isVerified
            },
            developer: {
                integration_notes: [],
                structural_integrity_score: integrityScore,
                verified: isVerified
            }
        };
    }
}
