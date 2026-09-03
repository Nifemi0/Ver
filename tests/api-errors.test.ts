import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/index";
describe("stable API error contract", () => {
  it("rejects malformed JSON as JSON with signable false", async () => {
    const r = await request(app).post("/api/wallet/prepare").set("Content-Type", "application/json").send("{bad");
    expect(r.status).toBe(400); expect(r.headers["content-type"]).toContain("application/json");
    expect(r.body.signable).toBe(false); expect(r.body.blockingReasons).toContain("INVALID_JSON");
  });
  it("rejects oversized bodies with a JSON error", async () => {
    const r = await request(app).post("/api/wallet/prepare").send({ intent: "a".repeat(1024 * 1024 + 1) });
    expect(r.status).toBe(413); expect(r.body.signable).toBe(false);
  });
  it("treats unsupported graph chains as client errors", async () => {
    const r = await request(app).get("/api/compile?chainId=1&address=0x1111111111111111111111111111111111111111");
    expect(r.status).toBe(400); expect(r.body.signable).toBe(false);
  });
  it("rejects array-shaped chain IDs", async () => {
    const r = await request(app).post("/api/compile").send({ chainId: [968], address: "0x1111111111111111111111111111111111111111" });
    expect(r.status).toBe(400);
  });
  it("returns JSON for an unknown endpoint", async () => {
    const r = await request(app).get("/api/nonexistent"); expect(r.status).toBe(404); expect(r.body.signable).toBe(false);
  });
});
