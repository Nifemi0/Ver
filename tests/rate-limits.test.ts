import { it, expect } from "vitest";
import request from "supertest";
import app from "../api/index";
it("does not let callers bypass the direct-server limiter with forged XFF", async () => {
  for (let i = 0; i < 30; i++) expect((await request(app).post("/api/wallet/prepare").set("X-Forwarded-For", `10.0.0.${i}`).send({})).status).toBe(400);
  const r = await request(app).post("/api/wallet/prepare").set("X-Forwarded-For", "11.0.0.1").send({});
  expect(r.status).toBe(429); expect(r.headers["retry-after"]).toBeDefined(); expect(r.body.signable).toBe(false);
});
