/**
 * @file pipeline.ts
 * @description Orchestrates the deterministic compiling pipeline for Ver.
 * Wires together pure extractor stages, integrity builders, scorers, and assemblers.
 *
 * Adheres to:
 * - ADR-013: Compiler Stages Are Pure. Operates as a pure orchestrator, collecting
 *   deterministic facts without network requests, LLM interactions, or mutating shared state.
 */

import { 
    CompilerInput, 
    CompilerDiagnostics, 
    RoleResult, 
    EventResult, 
    FunctionResult, 
    DependencyResult 
} from "./interfaces";
import { RoleExtractor } from "./extractors/role.extractor";
import { EventExtractor } from "./extractors/event.extractor";
import { FunctionExtractor } from "./extractors/function.extractor";
import { DependencyExtractor } from "./extractors/dependency.extractor";
import { IntegrityBuilder, IntegrityScorer } from "./integrity.scorer";
import { GraphAssembler } from "./graph.assembler";
import { VerSchema } from "../../types/schema";
import crypto from "crypto";
import { getActiveNetwork } from "../../chain/networks";
import { canonicalJson } from "../abi";


export class CompilerPipeline {
    private roleExtractor = new RoleExtractor();
    private eventExtractor = new EventExtractor();
    private functionExtractor = new FunctionExtractor();
    private dependencyExtractor = new DependencyExtractor();
    
    private integrityBuilder = new IntegrityBuilder();
    private integrityScorer = new IntegrityScorer();
    private assembler = new GraphAssembler();

    private static compileCounter = 0;

    public async compile(input: CompilerInput): Promise<{ graph: VerSchema, diagnostics: CompilerDiagnostics }> {
        CompilerPipeline.compileCounter++;
        const compileId = CompilerPipeline.compileCounter;
        
        const diagnostics: CompilerDiagnostics = {
            warnings: [],
            skipped: [],
            unsupported: [],
            extraction_time_ms: 0,
            stage_times: {},
            parser_version: "2.0.0",
            trace: ""
        };
        
        const totalStart = performance.now();

        // 1. Role Extraction
        const roleStart = performance.now();
        const roles: RoleResult = await this.roleExtractor.extract(input);
        diagnostics.stage_times[this.roleExtractor.name] = performance.now() - roleStart;

        // 2. Event Extraction
        const eventStart = performance.now();
        const events: EventResult = await this.eventExtractor.extract(input);
        diagnostics.stage_times[this.eventExtractor.name] = performance.now() - eventStart;

        // 3. Function Extraction
        const funcStart = performance.now();
        const functions: FunctionResult = await this.functionExtractor.extract(input);
        diagnostics.stage_times[this.functionExtractor.name] = performance.now() - funcStart;

        // 4. Dependency Extraction
        const depStart = performance.now();
        const deps: DependencyResult = await this.dependencyExtractor.extract(input);
        diagnostics.stage_times[this.dependencyExtractor.name] = performance.now() - depStart;

        // 5. Integrity Scoring
        const evidenceStart = performance.now();
        const evidence = this.integrityBuilder.build(input, deps.dependencies.length, events.events.length);
        const score = this.integrityScorer.score(evidence);
        diagnostics.stage_times['IntegrityScorer'] = performance.now() - evidenceStart;

        const extractionTimeMs = performance.now() - totalStart;
        diagnostics.extraction_time_ms = extractionTimeMs;

        // 6. Graph Assembly
        const assembleStart = performance.now();
        const graph = this.assembler.assemble(input, roles, events, functions, deps, score, extractionTimeMs);
        diagnostics.stage_times['GraphAssembler'] = performance.now() - assembleStart;

        // 7. Hash Generation (Off-chain)
        const registryStart = performance.now();
        // Versioned domain: old attestations intentionally do not verify new graphs.
        const sorted = (items: any[]) => items.map(canonicalJson).sort();
        const hashInput = canonicalJson({
            domain: "ver.protocol-graph/v2",
            chainId: input.chainId ?? null,
            address: input.address.toLowerCase(),
            implementation: input.implementation?.toLowerCase() ?? null,
            isProxy: input.isProxy,
            facets: sorted((input.facets ?? []).map(f => ({ address: f.address.toLowerCase(), selectors: f.selectors.map(s => s.toLowerCase()).sort() }))),
            abi: sorted(input.abi),
            source: input.source?.replace(/\r\n/g, "\n") ?? null,
            sourceVerified: input.sourceVerified === true,
            compilerVersion: input.metadata.compilerVersion,
            roles: sorted(graph.structural.roles),
            events: sorted(graph.structural.events),
            dependencies: sorted(graph.structural.dependencies),
            functions: sorted([...functions.privileged_functions, ...functions.public_functions])
        });
        const graphHash = "0x" + crypto.createHash("sha256").update(hashInput).digest("hex");
        
        graph.registry = {
            registered: false,
            verified: false,
            graphHash: graphHash,
            hashVersion: "2.0.0",
            metadataURI: "",
            registryAddress: "0x0000000000000000000000000000000000000000",
            deploymentNetwork: input.deploymentNetwork ?? (getActiveNetwork() === "botTestnet" ? "BOT Chain Testnet" : "X Layer Mainnet")
        };
        diagnostics.stage_times['RegistryLookup'] = performance.now() - registryStart;

        // Trace Generation
        diagnostics.trace = this.generateTrace(compileId, evidence, score, extractionTimeMs);

        if (input.source && input.source.includes("assembly {")) {
            diagnostics.unsupported.push("Inline Assembly detected - structural graph may be incomplete");
        }

        return { graph, diagnostics };
    }

    private generateTrace(id: number, evidence: any, score: number, timeMs: number): string {
        const check = (condition: boolean) => condition ? "✓" : "✗";
        
        return [
            `Compile #${id}`,
            "",
            `ABI Loaded ${check(evidence.verifiedABI)}`,
            `Source Verified ${check(evidence.verifiedSource)}`,
            `Proxy Resolved ${check(evidence.proxyResolved)}`,
            `Role Extraction ✓`,
            `Event Extraction ✓`,
            `Dependency Extraction ✓`,
            "",
            `Integrity Score ${score}`,
            "",
            `Completed in ${Math.round(timeMs)} ms`
        ].join("\\n");
    }
}
