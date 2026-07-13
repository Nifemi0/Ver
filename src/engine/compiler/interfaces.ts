import { VerSchema } from "../../types/schema";

export interface CompilerInput {
    address: string;
    abi: any[];
    source: string | null;
    isProxy: boolean;
    implementation: string | null;
    metadata: {
        protocolName: string;
        compilerVersion: string;
    };
    depth: number;
    maxDepth: number;
    visited: Set<string>;
}

export interface CompilerDiagnostics {
    warnings: string[];
    skipped: string[];
    unsupported: string[];
    extraction_time_ms: number;
    stage_times: Record<string, number>;
    parser_version: string;
    trace: string;
}

export interface IntegrityEvidence {
    verifiedABI: boolean;
    verifiedSource: boolean;
    openzeppelin: boolean;
    proxyResolved: boolean;
    dependencyCoverage: number;
    eventCoverage: number;
}

export interface RoleItem {
    name: string;
    source: string;
    confidence: number;
    evidence: string;
}

export interface DependencyItem {
    target: string;
    detected_from: string;
    evidence: string;
}

export interface EventItem {
    name: string;
    source: string;
}

export interface FunctionItem {
    name: string;
    classification: string;
    reason: string;
    visibility: string;
}

export interface RoleResult {
    roles: RoleItem[];
}

export interface EventResult {
    events: EventItem[];
}

export interface FunctionResult {
    privileged_functions: FunctionItem[];
    public_functions: FunctionItem[];
}

export interface DependencyResult {
    dependencies: DependencyItem[];
}

export interface GraphExtractor<T> {
    name: string;
    extract(input: CompilerInput): Promise<T>;
}
