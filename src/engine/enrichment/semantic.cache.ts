import { CACHE_CONFIG } from "../../config/cache";
import path from "path";
import fs from "fs";

export interface SemanticCacheData {
  semantic: any;
  security: any;
  developer: any;
}

type Stmt = {
  get: (...args: any[]) => any;
  run: (...args: any[]) => any;
};

type DbLike = {
  exec: (sql: string) => void;
  prepare: (sql: string) => Stmt;
};

class MemoryDb implements DbLike {
  private rows = new Map<string, any>();

  exec(_sql: string) {}

  prepare(sql: string): Stmt {
    const s = sql.replace(/\s+/g, " ").trim().toLowerCase();
    if (s.startsWith("select") && s.includes("from semantic_annotations")) {
      return {
        get: (contractAddress: string) => this.rows.get(String(contractAddress).toLowerCase()),
        run: () => {},
      };
    }
    if (s.startsWith("insert") && s.includes("into semantic_annotations")) {
      return {
        get: () => undefined,
        run: (
          contractAddress: string,
          prompt_version: string,
          data: string,
          created_at: number
        ) => {
          this.rows.set(String(contractAddress).toLowerCase(), {
            data,
            prompt_version,
            created_at,
          });
        },
      };
    }
    if (s.startsWith("delete")) {
      return {
        get: () => undefined,
        run: (contractAddress: string) => {
          this.rows.delete(String(contractAddress).toLowerCase());
        },
      };
    }
    return { get: () => undefined, run: () => {} };
  }
}

function openDatabase(dbPath: string): DbLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    return new Database(dbPath) as DbLike;
  } catch (err: any) {
    console.error(
      "[SemanticCache] better-sqlite3 unavailable — using in-memory cache.",
      err?.message || err
    );
    return new MemoryDb();
  }
}

export class SemanticCache {
  private db: DbLike;

  constructor(dbDir: string = CACHE_CONFIG.DB_DIR, dbName: string = "semantic_ver.db") {
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
      CREATE TABLE IF NOT EXISTS semantic_annotations (
        contract_address TEXT PRIMARY KEY,
        prompt_version TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }

  public get(contractAddress: string, requiredPromptVersion: string): SemanticCacheData | null {
    const stmt = this.db.prepare(`
      SELECT data, prompt_version
      FROM semantic_annotations
      WHERE contract_address = ?
    `);

    const row = stmt.get(contractAddress) as { data: string; prompt_version: string } | undefined;

    if (!row) return null;

    if (row.prompt_version !== requiredPromptVersion) {
      this.delete(contractAddress);
      return null;
    }

    try {
      return JSON.parse(row.data) as SemanticCacheData;
    } catch {
      this.delete(contractAddress);
      return null;
    }
  }

  public set(contractAddress: string, promptVersion: string, data: SemanticCacheData): void {
    const stmt = this.db.prepare(`
      INSERT INTO semantic_annotations (
        contract_address,
        prompt_version,
        data,
        created_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(contract_address) DO UPDATE SET
        prompt_version = excluded.prompt_version,
        data = excluded.data,
        created_at = excluded.created_at
    `);

    stmt.run(contractAddress, promptVersion, JSON.stringify(data), Date.now());
  }

  public delete(contractAddress: string): void {
    this.db.prepare("DELETE FROM semantic_annotations WHERE contract_address = ?").run(contractAddress);
  }
}
