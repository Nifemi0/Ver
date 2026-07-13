/**
 * Integration tests — Protocol Graph compilation for all 7 GEMINI.md fixture types.
 *
 * These tests run the full CompilerPipeline.compile() path end-to-end
 * and assert structural properties of the resulting VerSchema.
 *
 * Per ADR-010: fixture-driven testing.
 * Per ADR-002: ABI is primary source of truth.
 * Per ADR-013: compiler stages are pure — no network / LLM.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CompilerPipeline } from "../../src/engine/compiler/pipeline";
import { FIXTURES, buildInput } from "./fixtures";
import type { VerSchema } from "../../src/types/schema";
import type { CompilerDiagnostics } from "../../src/engine/compiler/interfaces";

/** Lookup a fixture by name (throws if missing). */
function fixture(name: string) {
  const f = FIXTURES.find((f) => f.name === name);
  if (!f) throw new Error(`Unknown fixture: ${name}`);
  return f;
}

describe("Protocol Graph — integration", () => {
  let pipeline: CompilerPipeline;

  beforeEach(() => {
    pipeline = new CompilerPipeline();
  });

  // -----------------------------------------------------------------------
  // Shared structural invariants (run once per fixture)
  // -----------------------------------------------------------------------

  describe.each(FIXTURES)("$name — shared invariants", (fx) => {
    let graph: VerSchema;
    let diagnostics: CompilerDiagnostics;

    beforeEach(async () => {
      const result = await pipeline.compile(buildInput(fx));
      graph = result.graph;
      diagnostics = result.diagnostics;
    });

    it("returns a valid metadata block", () => {
      expect(graph.metadata.protocol_name).toBe(fx.name);
      expect(graph.metadata.compiler_version).toBe("0.8.20");
      expect(graph.metadata.schema_version).toBe("1.0.0");
      expect(graph.metadata.cache_status).toBe("MISS");
    });

    it("populates statistics", () => {
      expect(graph.statistics.events).toBeGreaterThanOrEqual(0);
      expect(graph.statistics.functions).toBeGreaterThanOrEqual(0);
      expect(graph.statistics.roles).toBeGreaterThanOrEqual(0);
    });

    it("produces diagnostics with timing data", () => {
      expect(diagnostics.extraction_time_ms).toBeGreaterThanOrEqual(0);
      expect(Object.keys(diagnostics.stage_times).length).toBeGreaterThan(0);
      expect(diagnostics.trace).toContain("Compile #");
    });

    it("semantic section starts as PENDING", () => {
      expect(graph.semantic.semantic_status).toBe("PENDING");
      expect(graph.semantic.intent).toBeNull();
      expect(graph.semantic.user_goal).toBeNull();
    });

    it("registry block is present", () => {
      expect(graph.registry).toBeDefined();
      expect(graph.registry!.deploymentNetwork).toBe("X Layer Mainnet");
    });
  });

  // -----------------------------------------------------------------------
  // 1. ERC20
  // -----------------------------------------------------------------------

  describe("ERC20", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("ERC20"))));
    });

    it("detects Transfer and Approval events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Transfer");
      expect(eventNames).toContain("Approval");
    });

    it("does not detect privileged owner/access-control roles", () => {
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).not.toContain("Owner");
      expect(roleNames).not.toContain("AccessControl");
    });

    it("classifies balanceOf and totalSupply as read-only", () => {
      const readOnly = graph.security.privileged_functions.map((f) => f.name);
      expect(readOnly).not.toContain("balanceOf");
      expect(readOnly).not.toContain("totalSupply");
    });

    it("has correct event count in statistics", () => {
      expect(graph.statistics.events).toBe(2);
    });

    it("detects IERC20 dependency from source imports", () => {
      const targets = graph.structural.dependencies.map((d) => d.target);
      expect(targets).toContain("IERC20");
    });
  });

  // -----------------------------------------------------------------------
  // 2. ERC721
  // -----------------------------------------------------------------------

  describe("ERC721", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("ERC721"))));
    });

    it("detects Transfer event", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Transfer");
    });

    it("detects Approval and ApprovalForAll events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Approval");
      expect(eventNames).toContain("ApprovalForAll");
    });

    it("includes approve as a public function (not privileged)", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).not.toContain("approve");
    });

    it("includes ownerOf as a read-only function", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).not.toContain("ownerOf");
    });

    it("detects IERC721 dependency from source imports", () => {
      const targets = graph.structural.dependencies.map((d) => d.target);
      expect(targets).toContain("IERC721");
    });
  });

  // -----------------------------------------------------------------------
  // 3. Ownable
  // -----------------------------------------------------------------------

  describe("Ownable", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("Ownable"))));
    });

    it("detects Owner role with confidence 1.0 from ABI", () => {
      const ownerRole = graph.structural.roles.find((r) => r.name === "Owner");
      expect(ownerRole).toBeDefined();
      expect(ownerRole!.confidence).toBe(1.0);
      expect(ownerRole!.source).toBe("ABI");
    });

    it("detects transferOwnership as privileged", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).toContain("transferOwnership");
    });

    it("detects OwnershipTransferred event", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("OwnershipTransferred");
    });

    it("has exactly 1 role", () => {
      expect(graph.statistics.roles).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // 4. AccessControl
  // -----------------------------------------------------------------------

  describe("AccessControl", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("AccessControl"))));
    });

    it("detects AccessControl role from hasRole function", () => {
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).toContain("AccessControl");
    });

    it("detects Minter role from MINTER_ROLE function", () => {
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).toContain("Minter");
    });

    it("detects RoleGranted and RoleRevoked events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("RoleGranted");
      expect(eventNames).toContain("RoleRevoked");
    });

    it("has at least 2 roles", () => {
      expect(graph.statistics.roles).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Proxy
  // -----------------------------------------------------------------------

  describe("Proxy", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("Proxy"))));
    });

    it("detects upgradeTo as a privileged function", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).toContain("upgradeTo");
    });

    it("sets is_proxy to true", () => {
      expect(graph.metadata.is_proxy).toBe(true);
    });

    it("records the implementation address", () => {
      expect(graph.metadata.implementation_address).toBe(
        "0x1234567890abcdef1234567890abcdef12345678"
      );
    });

    it("counts 2 contracts (proxy + implementation)", () => {
      expect(graph.statistics.contracts).toBe(2);
    });

    it("detects Upgraded and AdminChanged events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Upgraded");
      expect(eventNames).toContain("AdminChanged");
    });

    it("integrity score accounts for proxy resolution", () => {
      expect(graph.semantic.structural_integrity_score).toBeGreaterThanOrEqual(80);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Lending Vault
  // -----------------------------------------------------------------------

  describe("Lending Vault", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("LendingVault"))));
    });

    it("detects multiple roles (Owner, AccessControl, Minter)", () => {
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).toContain("Owner");
      expect(roleNames).toContain("AccessControl");
      expect(roleNames).toContain("Minter");
      expect(graph.statistics.roles).toBeGreaterThanOrEqual(3);
    });

    it("detects IERC20 and IPriceOracle dependencies from constructor", () => {
      const targets = graph.structural.dependencies.map((d) => d.target);
      expect(targets).toContain("IERC20");
      expect(targets).toContain("IPriceOracle");
    });

    it("dependency provenance points to constructor", () => {
      const oracleDep = graph.structural.dependencies.find((d) => d.target === "IPriceOracle");
      expect(oracleDep).toBeDefined();
      expect(oracleDep!.detected_from).toBe("constructor");
    });

    it("detects privileged functions (setInterestRate, pause)", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).toContain("setInterestRate");
      expect(privNames).toContain("pause");
    });

    it("detects Deposit, Withdraw, and Liquidation events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("Deposit");
      expect(eventNames).toContain("Withdraw");
      expect(eventNames).toContain("Liquidation");
    });

    it("has a high integrity score with source + openzeppelin + deps + events", () => {
      expect(graph.semantic.structural_integrity_score).toBeGreaterThanOrEqual(80);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Oracle
  // -----------------------------------------------------------------------

  describe("Oracle", () => {
    let graph: VerSchema;

    beforeEach(async () => {
      ({ graph } = await pipeline.compile(buildInput(fixture("Oracle"))));
    });

    it("detects setHeartbeat as privileged", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).toContain("setHeartbeat");
    });

    it("detects updatePrice as privileged", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).toContain("updatePrice");
    });

    it("detects Owner role from owner() function", () => {
      const roleNames = graph.structural.roles.map((r) => r.name);
      expect(roleNames).toContain("Owner");
    });

    it("detects PriceUpdated and HeartbeatChanged events", () => {
      const eventNames = graph.structural.events.map((e) => e.name);
      expect(eventNames).toContain("PriceUpdated");
      expect(eventNames).toContain("HeartbeatChanged");
    });

    it("classifies latestPrice and decimals as non-privileged", () => {
      const privNames = graph.security.privileged_functions.map((f) => f.name);
      expect(privNames).not.toContain("latestPrice");
      expect(privNames).not.toContain("decimals");
    });
  });
});
