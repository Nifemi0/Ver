import { describe, it, expect, vi } from "vitest";
import { VerClient } from "../src/sdk/client";

describe("VerClient New MCP Features", () => {
  it("getTokenMetadata should return default values on failure or unknown", async () => {
    const client = new VerClient();
    (client as any).client = { readContract: vi.fn().mockRejectedValue(new Error("RPC unavailable")) };
    const metadata = await client.getTokenMetadata("0x0000000000000000000000000000000000000000");
    expect(metadata).toHaveProperty("name");
    expect(metadata).toHaveProperty("symbol");
    expect(metadata).toHaveProperty("decimals");
    expect(metadata).toHaveProperty("isERC20");
    expect(metadata.isERC20).toBe(false);
  });

  it("getGasEstimate should return valid gas estimate values", async () => {
    const client = new VerClient();
    (client as any).client = { estimateGas: vi.fn().mockResolvedValue(21000n), getGasPrice: vi.fn().mockResolvedValue(1000000000n) };
    const estimate = await client.getGasEstimate(
      "0x0000000000000000000000000000000000000000",
      "0x"
    );
    expect(estimate).toHaveProperty("gasEstimate");
    expect(estimate.estimatedCostWei).toBe("21000000000000");
  });

  it("diffProtocolGraphs should fail if addresses are invalid", async () => {
    const client = new VerClient();
    const normalize = vi.spyOn((client as any).normalizer, "normalize");
    await expect(
      client.diffProtocolGraphs("invalid-address-a", "invalid-address-b")
    ).rejects.toThrow();
    expect(normalize).not.toHaveBeenCalled();
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
    
    const abi = JSON.stringify([
      { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
      { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }
    ]);
    const mockRepo = {
      fetchContractAbi: vi.fn().mockResolvedValue(abi),
      fetchContractSource: vi.fn().mockResolvedValue("contract TestToken {}"),
      resolveProxyImplementation: vi.fn().mockResolvedValue(null),
      fetchContractName: vi.fn().mockResolvedValue("TestToken"),
      fetchCompilerVersion: vi.fn().mockResolvedValue("0.8.20")
    };
    const client = new VerClient(mockLlm, 968, mockRepo);
    vi.spyOn((client as any).normalizer, "normalize").mockResolvedValue({ abi, sourceCode: "contract TestToken {}", sourceVerified: true });
    (client as any).client = {
      getChainId: vi.fn().mockResolvedValue(968),
      getBytecode: vi.fn().mockResolvedValue("0x6000"),
      readContract: vi.fn().mockImplementation(({ functionName }) => Promise.resolve(functionName === "symbol" ? "PRWA" : 6)),
    };
    const USDT = "0x922835859623d6F3b99a2742D585E093bBA0a740";
    const result = await client.compileAgentIntent(
      USDT,
      "Transfer 1.5 PRWA to 0x1111111111111111111111111111111111111111"
    );
    
    expect(result.success).toBe(true);
    expect(result.functionName).toBe("transfer");
    expect(result.args[1]).toBe("1500000"); // 1.5 * 10^6
    expect(result.encodedCalldata).toBeDefined();
    expect(result.simulationStatus).toBeDefined();
    expect(result.signable).toBe(false);
    expect(mockLlm.generate).not.toHaveBeenCalled();
  });
});
