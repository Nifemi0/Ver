import { VerSchema, VerZodSchema } from "../types/schema";
import { CACHE_CONFIG } from "../config/cache";
import { EVIDENCE_THRESHOLD } from "../config/thresholds";
import fs from "fs";
import path from "path";
import semver from "semver";

export const CURRENT_SCHEMA_VERSION = "1.0.0";
export const CURRENT_ENRICHMENT_VERSION = "1.0.1";

export interface CacheMetrics {
  hits: number;
  misses: number;
  writes: number;
  expired: number;
  corrupted: number;
}

type Stmt = {
  get: (...args: any[]) => any;
  run: (...args: any[]) => any;
};

type DbLike = {
  exec: (sql: string) => void;
  prepare: (sql: string) => Stmt;
};

/** Minimal in-memory stand-in when better-sqlite3 native binding is unavailable. */
class MemoryDb implements DbLike {
  private graphs = new Map<string, any>();

  exec(_sql: string) {}

  prepare(sql: string): Stmt {
    const s = sql.replace(/\s+/g, " ").trim().toLowerCase();
    if (s.startsWith("select") && s.includes("from protocol_graphs")) {
      return {
        get: (contractAddress: string) => this.graphs.get(String(contractAddress).toLowerCase()),
        run: () => {},
      };
    }
    if (s.startsWith("insert") && s.includes("into protocol_graphs")) {
      return {
        get: () => undefined,
        run: (
          contractAddress: string,
          schema_version: string,
          enrichment_version: string,
          structural_integrity_score: number,
          data: string,
          created_at: number,
          expires_at: number | null
        ) => {
          this.graphs.set(String(contractAddress).toLowerCase(), {
            data,
            schema_version,
            enrichment_version,
            structural_integrity_score,
            created_at,
            expires_at,
          });
        },
      };
    }
    if (s.startsWith("delete") && s.includes("from protocol_graphs") && s.includes("where contract_address")) {
      return {
        get: () => undefined,
        run: (contractAddress: string) => {
          this.graphs.delete(String(contractAddress).toLowerCase());
        },
      };
    }
    if (s.startsWith("delete") && s.includes("expires_at")) {
      return {
        get: () => undefined,
        run: (now: number) => {
          for (const [k, v] of this.graphs) {
            if (v.expires_at !== null && v.expires_at < now) this.graphs.delete(k);
          }
        },
      };
    }
    return { get: () => undefined, run: () => {} };
  }
}

function openDatabase(dbPath: string): DbLike {
  try {
    // Lazy require so a missing native binding doesn't crash module load.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    return new Database(dbPath) as DbLike;
  } catch (err: any) {
    console.error(
      "[VerCache] better-sqlite3 unavailable — using in-memory cache.",
      err?.message || err
    );
    console.error(
      "[VerCache] Tip: run `npm rebuild better-sqlite3` if you want disk persistence."
    );
    return new MemoryDb();
  }
}

export class VerCache {
  private db: DbLike;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    expired: 0,
    corrupted: 0,
  };

  constructor(dbDir: string = CACHE_CONFIG.DB_DIR, dbName: string = CACHE_CONFIG.DB_NAME) {
    let resolvedDbDir = dbDir;
    if (process.env.VERCEL) {
      resolvedDbDir = "/tmp";
    }
    const fullDir = path.isAbsolute(resolvedDbDir) ? resolvedDbDir : path.resolve(process.cwd(), resolvedDbDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    const dbPath = path.join(fullDir, dbName);
    this.db = openDatabase(dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS protocol_graphs (
        contract_address TEXT PRIMARY KEY,
        schema_version TEXT NOT NULL,
        enrichment_version TEXT NOT NULL,
        structural_integrity_score REAL NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `);
  }

  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  public get(contractAddress: string): VerSchema | null {
    const stmt = this.db.prepare(`
      SELECT data, schema_version, enrichment_version, expires_at
      FROM protocol_graphs
      WHERE contract_address = ?
    `);

    const row = stmt.get(contractAddress) as {
      data: string;
      schema_version: string;
      enrichment_version: string;
      expires_at: number | null;
    } | undefined;

    if (!row) {
      this.metrics.misses++;
      return null;
    }

    // Schema version migration guard (exact major version match required)
    if (!semver.satisfies(row.schema_version, `^${semver.major(CURRENT_SCHEMA_VERSION)}.0.0`)) {
      this.metrics.expired++; // treat as expired/invalid
      this.delete(contractAddress);
      this.metrics.misses++;
      return null;
    }

    // Enrichment version exact match
    if (row.enrichment_version !== CURRENT_ENRICHMENT_VERSION) {
      this.metrics.expired++;
      this.delete(contractAddress);
      this.metrics.misses++;
      return null;
    }

    // TTL check
    if (row.expires_at !== null && Date.now() > row.expires_at) {
      this.metrics.expired++;
      this.delete(contractAddress);
      this.metrics.misses++;
      return null;
    }

    try {
      const parsedData = JSON.parse(row.data);
      const validGraph = VerZodSchema.parse(parsedData);

      validGraph.metadata.cache_status = "HIT";
      this.metrics.hits++;
      return validGraph;
    } catch (error) {
      this.metrics.corrupted++;
      this.delete(contractAddress);
      this.metrics.misses++;
      return null;
    }
  }

  public set(contractAddress: string, graph: VerSchema): void {
    const evidenceScore =
      (graph.semantic.structural_integrity_score +
        graph.security.structural_integrity_score +
        graph.developer.structural_integrity_score) /
      3;

    let ttlSeconds = CACHE_CONFIG.VERIFIED_TTL;
    if (evidenceScore < EVIDENCE_THRESHOLD.LOW) {
      ttlSeconds = CACHE_CONFIG.LOW_EVIDENCE_TTL;
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;

    const stmt = this.db.prepare(`
      INSERT INTO protocol_graphs (
        contract_address,
        schema_version,
        enrichment_version,
        structural_integrity_score,
        data,
        created_at,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(contract_address) DO UPDATE SET
        schema_version = excluded.schema_version,
        enrichment_version = excluded.enrichment_version,
        structural_integrity_score = excluded.structural_integrity_score,
        data = excluded.data,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at
    `);

    graph.metadata.schema_version = CURRENT_SCHEMA_VERSION;
    graph.metadata.enrichment_version = CURRENT_ENRICHMENT_VERSION;

    // Explicitly reset cache_status to MISS before saving so if fetched outside, it's correct
    graph.metadata.cache_status = "MISS";

    stmt.run(
      contractAddress,
      CURRENT_SCHEMA_VERSION,
      CURRENT_ENRICHMENT_VERSION,
      evidenceScore,
      JSON.stringify(graph),
      Date.now(),
      expiresAt
    );

    this.metrics.writes++;
  }

  public delete(contractAddress: string): void {
    this.db.prepare("DELETE FROM protocol_graphs WHERE contract_address = ?").run(contractAddress);
  }

  public cleanupExpiredEntries(): void {
    const stmt = this.db.prepare(
      "DELETE FROM protocol_graphs WHERE expires_at IS NOT NULL AND expires_at < ?"
    );
    stmt.run(Date.now());
  }

  public _getDbForTesting(): DbLike {
    return this.db;
  }
}
