import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VerCache, CURRENT_SCHEMA_VERSION, CURRENT_ENRICHMENT_VERSION } from '../src/engine/cache';
import { VerSchema } from '../src/types/schema';
import fs from 'fs';
import path from 'path';

const TEST_DB_DIR = 'data_test';
const TEST_DB_NAME = 'test_ver.db';

const getMockGraph = (evidence_score = 0.9): VerSchema => ({
  metadata: {
    protocol_name: "Test",
    contract_address: "0x123",
    is_proxy: false,
    compiler_version: "0.8.20",
    schema_version: CURRENT_SCHEMA_VERSION,
    enrichment_version: CURRENT_ENRICHMENT_VERSION,
    cache_status: "MISS"
  },
  statistics: {
    contracts: 1,
    functions: 0,
    events: 0,
    dependencies: 0,
    roles: 0,
    proxy: false,
    compile_time_ms: 10
  },
  structural: {
    roles: [],
    dependencies: [],
    events: []
  },
  semantic: {
    intent: null,
    user_goal: null,
    semantic_status: "PENDING",
    structural_integrity_score: evidence_score,
    verified: true
  },
  security: {
    guardrails: [],
    privileged_functions: [],
    structural_integrity_score: evidence_score,
    verified: true
  },
  developer: {
    integration_notes: [],
    structural_integrity_score: evidence_score,
    verified: true
  }
});

describe('VerCache', () => {
  let cache: VerCache;

  beforeEach(() => {
    if (fs.existsSync(path.join(TEST_DB_DIR, TEST_DB_NAME))) {
      fs.unlinkSync(path.join(TEST_DB_DIR, TEST_DB_NAME));
    }
    cache = new VerCache(TEST_DB_DIR, TEST_DB_NAME);
  });

  afterEach(() => {
    if (fs.existsSync(path.join(TEST_DB_DIR, TEST_DB_NAME))) {
      fs.unlinkSync(path.join(TEST_DB_DIR, TEST_DB_NAME));
    }
  });

  it('should handle cache hit and miss', () => {
    const graph = getMockGraph();
    
    expect(cache.get("0x123")).toBeNull();
    expect(cache.getMetrics().misses).toBe(1);

    cache.set("0x123", graph);
    expect(cache.getMetrics().writes).toBe(1);

    const hit = cache.get("0x123");
    expect(hit).not.toBeNull();
    expect(hit?.metadata.cache_status).toBe("HIT");
    expect(cache.getMetrics().hits).toBe(1);
  });

  it('should handle expired records (low evidence TTL)', async () => {
    const graph = getMockGraph(0.1);
    cache.set("0x123", graph);

    const db = cache._getDbForTesting();
    db.prepare("UPDATE protocol_graphs SET expires_at = ?").run(Date.now() - 1000);

    expect(cache.get("0x123")).toBeNull();
    expect(cache.getMetrics().expired).toBe(1);
  });

  it('should handle corrupted records', () => {
    const graph = getMockGraph();
    cache.set("0x123", graph);

    const db = cache._getDbForTesting();
    db.prepare("UPDATE protocol_graphs SET data = ?").run("invalid json");

    expect(cache.get("0x123")).toBeNull();
    expect(cache.getMetrics().corrupted).toBe(1);
  });

  it('should reject version mismatch', () => {
    const graph = getMockGraph();
    cache.set("0x123", graph);

    const db = cache._getDbForTesting();
    db.prepare("UPDATE protocol_graphs SET schema_version = ?").run("0.9.0");

    expect(cache.get("0x123")).toBeNull();
    expect(cache.getMetrics().expired).toBe(1); // Treated as expired
  });

  it('should cleanup expired entries', () => {
    const graph = getMockGraph(0.1);
    cache.set("0x123", graph);

    const db = cache._getDbForTesting();
    db.prepare("UPDATE protocol_graphs SET expires_at = ?").run(Date.now() - 1000);

    cache.cleanupExpiredEntries();
    const row = db.prepare("SELECT * FROM protocol_graphs WHERE contract_address = ?").get("0x123");
    expect(row).toBeUndefined();
  });
});
