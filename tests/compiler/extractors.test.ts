import { describe, it, expect } from 'vitest';
import { RoleExtractor } from '../../src/engine/compiler/extractors/role.extractor';
import { EventExtractor } from '../../src/engine/compiler/extractors/event.extractor';
import { FunctionExtractor } from '../../src/engine/compiler/extractors/function.extractor';
import { DependencyExtractor } from '../../src/engine/compiler/extractors/dependency.extractor';
import { IntegrityBuilder, IntegrityScorer } from '../../src/engine/compiler/integrity.scorer';
import { CompilerInput } from '../../src/engine/compiler/interfaces';

const getMockInput = (abi: any[], source: string = ""): CompilerInput => ({
    address: "0x123",
    abi,
    source,
    isProxy: false,
    implementation: null,
    metadata: { protocolName: "Test", compilerVersion: "0.8.20" },
    depth: 0,
    maxDepth: 5,
    visited: new Set()
});

describe('Compiler Extractors', () => {
    it('RoleExtractor: identifies owner and access_control with provenance', async () => {
        const extractor = new RoleExtractor();
        const input = getMockInput([
            { type: "function", name: "owner" },
            { type: "function", name: "hasRole" }
        ]);
        const result = await extractor.extract(input);
        const roles = result.roles.map(r => r.name);
        expect(roles).toContain("Owner");
        expect(roles).toContain("AccessControl");
        expect(result.roles[0].source).toBe("ABI");
    });

    it('EventExtractor: identifies events with provenance', async () => {
        const extractor = new EventExtractor();
        const input = getMockInput([
            { type: "event", name: "Transfer" },
            { type: "event", name: "Approval" }
        ]);
        const result = await extractor.extract(input);
        const events = result.events.map(e => e.name);
        expect(events).toContain("Transfer");
        expect(result.events[0].source).toBe("ABI");
    });

    it('FunctionExtractor: separates privileged and public with explainability', async () => {
        const extractor = new FunctionExtractor();
        const input = getMockInput([
            { type: "function", name: "mint", stateMutability: "nonpayable" },
            { type: "function", name: "balanceOf", stateMutability: "view" },
            { type: "function", name: "transfer", stateMutability: "nonpayable" }
        ]);
        const result = await extractor.extract(input);
        
        const priv = result.privileged_functions.map(f => f.name);
        const pub = result.public_functions.map(f => f.name);

        expect(priv).toContain("mint");
        expect(pub).toContain("transfer");
        expect(pub).toContain("balanceOf");

        expect(result.privileged_functions[0].classification).toBe("privileged");
    });

    it('DependencyExtractor: extracts interfaces and provenance', async () => {
        const extractor = new DependencyExtractor();
        const input = getMockInput([
            { type: "constructor", inputs: [{ internalType: "contract IERC20", name: "token" }] }
        ]);
        const result = await extractor.extract(input);
        expect(result.dependencies[0].target).toBe("IERC20");
        expect(result.dependencies[0].detected_from).toBe("constructor");
    });

    it('IntegrityScorer: computes deterministic score', () => {
        const builder = new IntegrityBuilder();
        const scorer = new IntegrityScorer();
        const input = getMockInput([{ type: "event", name: "A" }], "@openzeppelin/contracts");
        const evidence = builder.build(input, 1, 1);
        const score = scorer.score(evidence);
        expect(score).toBe(80);
    });
});
