/**
 * Negative-case integration tests for the CompilerPipeline.
 *
 * Validates graceful handling of:
 *   - Empty ABI
 *   - Null source code
 *   - Already-visited addresses (cycle detection)
 *   - Malformed / invalid ABI entries
 *
 * Per ADR-010: fixture-driven testing.
 * Per ADR-013: compiler stages are pure.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CompilerPipeline } from "../../src/engine/compiler/pipeline";
import type { CompilerInput } from "../../src/engine/compiler/interfaces";
import type { VerSchema } from "../../src/types/schema";

/** Minimal helper to build a CompilerInput with sensible defaults. */
function makeInput(overrides: Partial<CompilerInput> = {}): CompilerInput {
  return {
    address: "0x0000000000000000000000000000000000000001",
    abi: [],
    source: null,
    isProxy: false,
    implementation: null,
    metadata: { protocolName: "NegativeTest", compilerVersion: "0.8.20" },
    depth: 0,
    maxDepth: 5,
    visited: new Set<string>(),
    ...overrides,
  };
}

describe("Negative cases — integration", () => {
  let pipeline: CompilerPipeline;

  beforeEach(() => {
    pipeline = new CompilerPipeline();
  });

  // -----------------------------------------------------------------------
  // Empty ABI
  // -----------------------------------------------------------------------

  describe("Empty ABI", () => {
    it("compiles without error and returns empty structural data", async () => {
      const { graph, diagnostics } = await pipeline.compile(makeInput({ abi: [] }));

      expect(graph.structural.roles).toHaveLength(0);
      expect(graph.structural.events).toHaveLength(0);
      expect(graph.structural.dependencies).toHaveLength(0);
      expect(graph.security.privileged_functions).toHaveLength(0);
      expect(graph.statistics.roles).toBe(0);
      expect(graph.statistics.events).toBe(0);
      expect(graph.statistics.functions).toBe(0);
      expect(diagnostics.extraction_time_ms).toBeGreaterThanOrEqual(0);
    });

    it("produces a low integrity score", async () => {
      const { graph } = await pipeline.compile(makeInput({ abi: [], source: null }));
      expect(graph.semantic.structural_integrity_score).toBeLessThanOrEqual(30);
    });

    it("verified is false with low integrity", async () => {
      const { graph } = await pipeline.compile(makeInput({ abi: [] }));
      expect(graph.semantic.verified).toBe(false);
      expect(graph.security.verified).toBe(false);
      expect(graph.developer.verified).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Null source code
  // -----------------------------------------------------------------------

  describe("Null source code", () => {
    it("compiles from ABI alone when source is null", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          source: null,
          abi: [
            { type: "function", name: "owner", stateMutability: "view" },
            { type: "event", name: "Transfer" },
          ],
        })
      );

      // Role extraction still works via ABI
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).toContain("Owner");

      // Event extraction still works via ABI
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Transfer");
    });

    it("has lower integrity score than with source", async () => {
      const withSource = await pipeline.compile(
        makeInput({
          source: "contract A {}",
          abi: [{ type: "event", name: "X" }],
        })
      );
      const withoutSource = await pipeline.compile(
        makeInput({
          source: null,
          abi: [{ type: "event", name: "X" }],
        })
      );

      expect(withoutSource.graph.semantic.structural_integrity_score).toBeLessThan(
        withSource.graph.semantic.structural_integrity_score
      );
    });
  });

  // -----------------------------------------------------------------------
  // Already-visited address (cycle detection)
  // -----------------------------------------------------------------------

  describe("Already-visited address (cycle detection)", () => {
    it("returns empty dependencies when address is already visited", async () => {
      const visited = new Set<string>();
      visited.add("0x0000000000000000000000000000000000000001");

      const { graph } = await pipeline.compile(
        makeInput({
          address: "0x0000000000000000000000000000000000000001",
          visited,
          abi: [
            {
              type: "constructor",
              inputs: [{ internalType: "contract IERC20", name: "token" }],
            },
          ],
        })
      );

      // Dependencies should be empty because the address was already visited
      expect(graph.structural.dependencies).toHaveLength(0);
      expect(graph.statistics.dependencies).toBe(0);
    });

    it("still extracts roles and events even if address is visited", async () => {
      const visited = new Set<string>();
      visited.add("0x0000000000000000000000000000000000000001");

      const { graph } = await pipeline.compile(
        makeInput({
          address: "0x0000000000000000000000000000000000000001",
          visited,
          abi: [
            { type: "function", name: "owner", stateMutability: "view" },
            { type: "event", name: "Transfer" },
          ],
        })
      );

      // Role + event extraction is independent of cycle detection
      expect(graph.structural.roles.map((r) => r.name)).toContain("Owner");
      expect(graph.structural.events.map((e) => e.name)).toContain("Transfer");
    });
  });

  // -----------------------------------------------------------------------
  // Depth limit reached
  // -----------------------------------------------------------------------

  describe("Depth limit reached", () => {
    it("returns empty dependencies when depth >= maxDepth", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          depth: 5,
          maxDepth: 5,
          abi: [
            {
              type: "constructor",
              inputs: [{ internalType: "contract IERC20", name: "token" }],
            },
          ],
        })
      );

      expect(graph.structural.dependencies).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Malformed / invalid ABI entries
  // -----------------------------------------------------------------------

  describe("Malformed ABI entries", () => {
    it("does not crash on entries missing type field", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            { name: "foo" },                 // missing type
            { type: "function", name: "bar", stateMutability: "view" },
          ],
        })
      );

      // Should still process the valid entry
      expect(graph.statistics.functions).toBeGreaterThanOrEqual(1);
    });

    it("does not crash on entries missing name field", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            { type: "function" },            // missing name
            { type: "event" },               // missing name
            { type: "function", name: "owner", stateMutability: "view" },
          ],
        })
      );

      expect(graph.structural.roles.map((r) => r.name)).toContain("Owner");
    });

    it("does not crash on null/undefined within the ABI array", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            null as any,
            undefined as any,
            { type: "event", name: "Transfer" },
          ],
        })
      );

      // At minimum, the valid event should be extracted
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Transfer");
    });

    it("does not crash on entries with unexpected types", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            { type: "fallback" },
            { type: "receive" },
            { type: "function", name: "owner", stateMutability: "view" },
          ],
        })
      );

      expect(graph.structural.roles.map((r) => r.name)).toContain("Owner");
    });

    it("handles an ABI with only constructors gracefully", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            {
              type: "constructor",
              stateMutability: "nonpayable",
              inputs: [],
            },
          ],
        })
      );

      expect(graph.statistics.functions).toBe(0);
      expect(graph.structural.roles).toHaveLength(0);
    });

    it("handles numeric/boolean values in unexpected fields", async () => {
      const { graph } = await pipeline.compile(
        makeInput({
          abi: [
            { type: "function", name: 123 as any, stateMutability: "view" },
            { type: "event", name: true as any },
          ],
        })
      );

      // Should not crash — malformed entries are simply not matched
      expect(graph).toBeDefined();
    });
  });
});
