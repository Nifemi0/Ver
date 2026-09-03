import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import request from "supertest";
import app from "../api/index";
import { VERSION } from "../src/version";

describe("release contract", () => {
  it("keeps package, OpenAPI and health versions aligned", async () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const spec = JSON.parse(readFileSync("swagger.json", "utf8"));
    expect(pkg.version).toBe(VERSION);
    expect(spec.info.version).toBe(VERSION);
    const servedSpec = await request(app).get("/swagger.json");
    expect(servedSpec.status).toBe(200);
    expect(servedSpec.body.info.version).toBe(VERSION);
    expect((await request(app).get("/api/health")).body.version).toBe(VERSION);
    expect(spec.components.schemas.PreparedTransaction.required).toEqual(expect.arrayContaining(["signable", "sender", "expiresAt", "transaction"]));
  });
});
