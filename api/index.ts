import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { isAddress } from "viem";
import { VerClient } from "../src/sdk/client";
import { MermaidExporter } from "../src/engine/export/mermaid";

const app = express();
app.use(cors());

// Security size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// Security headers and Content Security Policy (CSP)
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

// Serve swagger.json OpenAPI Spec
app.get("/swagger.json", (req, res) => {
    try {
        const filePath = path.join(process.cwd(), "swagger.json");
        const fileContent = fs.readFileSync(filePath, "utf8");
        return res.setHeader("Content-Type", "application/json").send(fileContent);
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to load API spec: " + err.message });
    }
});

const client = new VerClient();

// Simple in-memory IP rate limiter for basic protection
const ipCache = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 30; // 30 requests per minute
const WINDOW = 60 * 1000;

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = req.headers["x-forwarded-for"];
    const ipStr = (Array.isArray(rawIp) ? rawIp[0] : rawIp) || req.socket.remoteAddress || "unknown";
    const ip = (ipStr || "unknown").split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const clientLimit = ipCache.get(ip);
    
    if (!clientLimit) {
        ipCache.set(ip, { count: 1, lastReset: now });
        return next();
    }
    
    if (now - clientLimit.lastReset > WINDOW) {
        ipCache.set(ip, { count: 1, lastReset: now });
        return next();
    }
    
    if (clientLimit.count >= LIMIT) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    
    clientLimit.count += 1;
    next();
};

const handler = async (req: express.Request, res: express.Response) => {
    try {
        const address = req.query.address as string;
        if (!address || !isAddress(address)) {
            return res.status(400).json({ 
                error: "Invalid contract address",
                expected: "0x-prefixed EVM address"
            });
        }
        const graph = await client.getProtocolGraph(address);
        const mermaid = MermaidExporter.generate(graph);
        
        const trace = [
            `Compiler Trace for ${address}`,
            `Compiled in ${graph.statistics.compile_time_ms}ms`,
            `Found ${graph.statistics.roles} roles`,
            `Found ${graph.statistics.events} events`,
            `Found ${graph.statistics.dependencies} dependencies`
        ].join("\\n");

        return res.json({
            graph,
            mermaid,
            trace
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
};

app.get("/api/compile", rateLimiter, handler);
app.get("/api/analyze", rateLimiter, handler);

// Vercel routes everything under /api to this file if named api/index.ts.
// But to be safe for root matching if we rewrite:
app.get("/api", (req, res) => {
    res.json({ status: "ok" });
});

// AIC Intent Compilation Endpoint
app.post("/api/compile-intent", rateLimiter, async (req, res) => {
    try {
        const { contractAddress, intent } = req.body;
        if (!contractAddress || !isAddress(contractAddress)) {
            return res.status(400).json({ error: "Invalid contract address", expected: "0x-prefixed EVM address" });
        }
        if (!intent || typeof intent !== "string") {
            return res.status(400).json({ error: "Missing or invalid intent parameter" });
        }
        
        const result = await client.compileAgentIntent(contractAddress, intent);
        return res.json(result);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

// Also support GET for simple testing if needed
app.get("/api/compile-intent", rateLimiter, async (req, res) => {
    try {
        const contractAddress = req.query.contractAddress as string;
        const intent = req.query.intent as string;
        
        if (!contractAddress || !isAddress(contractAddress)) {
            return res.status(400).json({ error: "Invalid contract address", expected: "0x-prefixed EVM address" });
        }
        if (!intent || typeof intent !== "string") {
            return res.status(400).json({ error: "Missing or invalid intent parameter" });
        }
        
        const result = await client.compileAgentIntent(contractAddress, intent);
        return res.json(result);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

export default app;
