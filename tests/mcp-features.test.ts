import { describe, it, expect, vi } from "vitest";
import { VerClient } from "../src/sdk/client";

describe("VerClient New MCP Features", () => {
  it("getTokenMetadata should return default values on failure or unknown", async () => {
    const client = new VerClient();
    const metadata = await client.getTokenMetadata("0x0000000000000000000000000000000000000000");
    expect(metadata).toHaveProperty("name");
    expect(metadata).toHaveProperty("symbol");
    expect(metadata).toHaveProperty("decimals");
    expect(metadata).toHaveProperty("isERC20");
    expect(metadata.isERC20).toBe(false);
  });

  it("getGasEstimate should return valid gas estimate values", async () => {
    const client = new VerClient();
    const estimate = await client.getGasEstimate(
      "0x0000000000000000000000000000000000000000",
      "0x"
    );
    expect(estimate).toHaveProperty("gasEstimate");
  });

  it("diffProtocolGraphs should fail if addresses are invalid", async () => {
    const client = new VerClient();
    await expect(
      client.diffProtocolGraphs("invalid-address-a", "invalid-address-b")
    ).rejects.toThrow();
  });

  it("compileAgentIntent should parse, resolve decimals, encode calldata, and simulate successfully", async () => {
    const mockLlm = {
      generate: vi.fn().mockResolvedValue(JSON.stringify({
        functionName: "transfer",
        args: {
          recipient: { value: "0x1111111111111111111111111111111111111111", isUnscaledTokenAmount: false },
          amount: { value: "1.5", isUnscaledTokenAmount: true }
        }
      }))
    };
    
    const client = new VerClient(mockLlm);
    const USDT = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d";
    const result = await client.compileAgentIntent(
      USDT,
      "Transfer 1.5 USDT to Alice"
    );
    
    expect(result.success).toBe(true);
    expect(result.functionName).toBe("transfer");
    expect(result.args[1]).toBe("1500000"); // 1.5 * 10^6
    expect(result.encodedCalldata).toBeDefined();
    expect(result.simulationStatus).toBeDefined();
  });
});
