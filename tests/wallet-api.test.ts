import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../api/index";
import { VerClient } from "../src/sdk/client";

afterEach(() => vi.restoreAllMocks());

describe("wallet preparation API validation", () => {
  it("advertises BOT Chain as the primary wallet network", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.primaryChainId).toBe(968);
    expect(response.body.supportedChains[0]).toBe(968);
  });

  it("rejects missing fields without substituting demo values", async () => {
    const response = await request(app).post("/api/wallet/prepare").send({ chainId: 968 });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid wallet request");
  });

  it("routes a valid request to the requested BOT Chain client", async () => {
    const compileAgentIntent = vi.spyOn(VerClient.prototype, "compileAgentIntent").mockResolvedValue({
      signable: true,
      simulationStatus: "success",
      transaction: { chainId: 968, to: "0x922835859623d6F3b99a2742D585E093bBA0a740", data: "0x095e7ba0", value: "0" },
    });

    const response = await request(app).post("/api/wallet/prepare").send({
      chainId: 968,
      contractAddress: "0x922835859623d6F3b99a2742D585E093bBA0a740",
      intent: "approve 1 PRWA to 0x1111111111111111111111111111111111111111",
      sender: "0x5A1fCB4d642f3d3C3BaD7705eA643aDCc1805b9A",
      value: "0",
    });

    expect(response.status).toBe(200);
    expect(response.body.signable).toBe(true);
    expect(compileAgentIntent).toHaveBeenCalledWith(
      "0x922835859623d6F3b99a2742D585E093bBA0a740",
      "approve 1 PRWA to 0x1111111111111111111111111111111111111111",
      "0x5A1fCB4d642f3d3C3BaD7705eA643aDCc1805b9A",
      "0",
    );
  });

  it("rejects unsupported chains and invalid addresses", async () => {
    const response = await request(app).post("/api/wallet/prepare").send({
      chainId: 1,
      contractAddress: "invalid",
      intent: "transfer 1 token",
      sender: "invalid",
    });
    expect(response.status).toBe(400);
  });

  it("rejects unknown fields to keep the signing contract stable", async () => {
    const response = await request(app).post("/api/wallet/prepare").send({
      chainId: 968,
      contractAddress: "0x922835859623d6F3b99a2742D585E093bBA0a740",
      intent: "approve 1 PRWA for 0x1111111111111111111111111111111111111111",
      sender: "0x5A1fCB4d642f3d3C3BaD7705eA643aDCc1805b9A",
      unexpected: true,
    });
    expect(response.status).toBe(400);
  });
});
