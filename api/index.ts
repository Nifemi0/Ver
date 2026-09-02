import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { isAddress } from "viem";
import { VerClient } from "../src/sdk/client";
import { MermaidExporter } from "../src/engine/export/mermaid";
import { getChainById } from "../src/chain/networks";
import { z } from "zod";

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map(x => x.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));

// Security size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// Security headers and Content Security Policy (CSP)
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://rpc.xlayer.tech https://rpc.bohr.life https://scan.bohr.life https://web3.okx.com; frame-ancestors 'none';"
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

const clients = new Map<number, VerClient>();
const WalletPrepareSchema = z.object({
    chainId: z.union([z.literal(196), z.literal(968)]),
    contractAddress: z.string().refine(isAddress, "Invalid contractAddress"),
    intent: z.string().trim().min(1).max(1000),
    sender: z.string().refine(isAddress, "Invalid sender"),
    value: z.string().regex(/^\d+$/, "value must be a base-10 wei integer").optional(),
}).strict();
function getClient(req: express.Request, requestedChainId?: number): VerClient {
    const rawChainId = requestedChainId ?? req.query?.chainId ?? req.body?.chainId ?? req.body?.arguments?.chainId ?? req.body?.params?.chainId;
    const chainId = rawChainId === undefined ? 968 : Number(rawChainId);
    if (!Number.isInteger(chainId)) throw new Error("chainId must be an integer");
    getChainById(chainId);
    let client = clients.get(chainId);
    if (!client) {
        client = new VerClient(undefined, chainId);
        clients.set(chainId, client);
    }
    return client;
}

// Health check (static + API)
app.get(["/health", "/api/health"], (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "ver-protocol",
        package: "aic-mcp",
        primaryChainId: 968,
        supportedChains: [968, 196],
        time: new Date().toISOString(),
    });
});

// Bounded per-instance limiter. Production deployments should back this with a shared store.
const ipCache = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 30; // 30 requests per minute
const WINDOW = 60 * 1000;
const MAX_TRACKED_IPS = 10_000;

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const clientLimit = ipCache.get(ip);
    
    if (!clientLimit) {
        if (ipCache.size >= MAX_TRACKED_IPS) {
            const oldest = ipCache.keys().next().value;
            if (oldest) ipCache.delete(oldest);
        }
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
        let address = (req.query.address || req.body?.address || req.body?.arguments?.address || req.body?.params?.address) as string;
        if (!address || !isAddress(address)) {
            return res.status(400).json({ error: "A valid contract address is required" });
        }
        const graph = await getClient(req).getProtocolGraph(address);
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
        console.error("[API] compile failed", e);
        return res.status(500).json({ error: "Protocol compilation failed" });
    }
};

app.get("/api/compile", rateLimiter, handler);
app.post("/api/compile", rateLimiter, handler);
app.get("/api/analyze", rateLimiter, handler);
app.post("/api/analyze", rateLimiter, handler);

// Vercel routes everything under /api to this file if named api/index.ts.
// But to be safe for root matching if we rewrite:
app.get("/api", (req, res) => {
    res.json({ status: "ok" });
});

// AIC Intent Compilation Endpoint
app.post("/api/compile-intent", rateLimiter, async (req, res) => {
    try {
        let contractAddress = (req.body?.contractAddress || req.body?.arguments?.contractAddress || req.body?.params?.contractAddress || req.query.contractAddress) as string;
        let intent = (req.body?.intent || req.body?.arguments?.intent || req.body?.params?.intent || req.query.intent) as string;
        let sender = (req.body?.sender || req.body?.arguments?.sender || req.body?.params?.sender || req.query.sender) as string | undefined;
        if (!contractAddress || !isAddress(contractAddress)) {
            return res.status(400).json({ error: "A valid contractAddress is required" });
        }
        if (!intent || typeof intent !== "string") {
            return res.status(400).json({ error: "A non-empty intent is required" });
        }
        if (intent.trim().length > 1000) {
            return res.status(400).json({ error: "Intent must be 1000 characters or fewer" });
        }
        if (sender && !isAddress(sender)) {
            return res.status(400).json({ error: "A valid sender is required" });
        }
        
        const result = await getClient(req).compileAgentIntent(contractAddress, intent, sender);
        return res.status(result.signable === false ? 422 : 200).json(result);
    } catch (e: any) {
        console.error("[API] intent compilation failed", e);
        return res.status(500).json({ error: "Intent compilation failed" });
    }
});

app.post("/api/wallet/prepare", rateLimiter, async (req, res) => {
    const parsed = WalletPrepareSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid wallet request", details: parsed.error.flatten() });
    try {
        const { chainId, contractAddress, intent, sender, value } = parsed.data;
        const result = await getClient(req, chainId)
            .compileAgentIntent(contractAddress, intent, sender, value);
        return res.status(result.signable ? 200 : 422).json(result);
    } catch (e: any) {
        console.error("[API] wallet preparation failed", e);
        return res.status(422).json({ error: "Wallet preparation failed" });
    }
});

// Also support GET for simple testing if needed
app.get("/api/compile-intent", rateLimiter, async (req, res) => {
    try {
        let contractAddress = req.query.contractAddress as string;
        let intent = req.query.intent as string;
        let sender = req.query.sender as string | undefined;
        
        if (!contractAddress || !isAddress(contractAddress)) {
            return res.status(400).json({ error: "A valid contractAddress is required" });
        }
        if (!intent || typeof intent !== "string") {
            return res.status(400).json({ error: "A non-empty intent is required" });
        }
        if (intent.trim().length > 1000) {
            return res.status(400).json({ error: "Intent must be 1000 characters or fewer" });
        }
        if (sender && !isAddress(sender)) {
            return res.status(400).json({ error: "A valid sender is required" });
        }
        
        const result = await getClient(req).compileAgentIntent(contractAddress, intent, sender);
        return res.status(result.signable === false ? 422 : 200).json(result);
    } catch (e: any) {
        console.error("[API] intent compilation failed", e);
        return res.status(500).json({ error: "Intent compilation failed" });
    }
});

export default app;
