import { describe, it, expect } from 'vitest';
import { CompilerPipeline } from '../../src/engine/compiler/pipeline';
import { CompilerInput } from '../../src/engine/compiler/interfaces';

describe('CompilerPipeline', () => {
    it('executes all stages and returns immutable graph and diagnostics', async () => {
        const pipeline = new CompilerPipeline();
        const input: CompilerInput = {
            address: "0xabc",
            abi: [
                { type: "function", name: "owner", stateMutability: "view" },
                { type: "event", name: "Upgraded" }
            ],
            source: "contract A { assembly { } }", 
            isProxy: true,
            implementation: "0xdef",
            metadata: { protocolName: "TestApp", compilerVersion: "0.8.0" },
            depth: 0,
            maxDepth: 5,
            visited: new Set()
        };

        const { graph, diagnostics } = await pipeline.compile(input);

        expect(graph.structural.roles.map(r => r.name)).toContain("Owner");
        expect(graph.structural.events.map(e => e.name)).toContain("Upgraded");
        expect(graph.metadata.implementation_address).toBe("0xdef");
        expect(graph.statistics.events).toBe(1);
        expect(graph.statistics.roles).toBe(1);

        expect(diagnostics.extraction_time_ms).toBeGreaterThanOrEqual(0);
        expect(Object.keys(diagnostics.stage_times).length).toBeGreaterThan(0);
        expect(diagnostics.unsupported.length).toBe(1);
        expect(diagnostics.trace).toContain("Compile #");

        expect(graph.semantic.structural_integrity_score).toBe(80);
        expect(graph.security.structural_integrity_score).toBe(80);
    });
});
