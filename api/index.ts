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
function getClient(req: express.Request): VerClient {
    const rawChainId = req.query.chainId ?? req.body?.chainId ?? req.body?.arguments?.chainId ?? req.body?.params?.chainId;
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

const x402Middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // If request has payment signature (x402 verification)
    if (req.headers["x-payment"] || req.headers["authorization"] || req.headers["payment-signature"]) {
        return next();
    }
    
    const asset = process.env.X402_ASSET_ADDRESS;
    const payTo = process.env.X402_PAY_TO;
    if (!asset || !payTo || !isAddress(asset) || !isAddress(payTo)) {
        return res.status(503).json({ error: "BOT Chain payment configuration is unavailable" });
    }

    // Unpaid request -> return a BOT Chain 402 challenge
    const challenge = {
        x402Version: 2,
        resource: {
            url: `https://${req.get("host") || "verprotocol.vercel.app"}${req.originalUrl}`,
            description: "Semantic Protocol Graph Compilation service for AI Agents",
            mimeType: "application/json"
        },
        accepts: [
            {
                scheme: "exact",
                network: "eip155:968",
                asset,
                amount: "10000",
                payTo,
                maxTimeoutSeconds: 300,
                extra: { name: "USD₮0", version: "1" }
            }
        ]
    };
    
    const base64Challenge = Buffer.from(JSON.stringify(challenge)).toString("base64");
    res.setHeader("PAYMENT-REQUIRED", base64Challenge);
    return res.status(402).json({ 
        error: "Payment Required", 
        message: "This endpoint requires x402 payment protocol." 
    });
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
        return res.status(500).json({ error: e.message });
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
        
        const result = await getClient(req).compileAgentIntent(contractAddress, intent, sender);
        return res.json(result);
    } catch (e: any) {
        return res.status(500).json({ error: e.message || "Failed to compile intent due to server configuration." });
    }
});

app.post("/api/wallet/prepare", rateLimiter, async (req, res) => {
    const parsed = WalletPrepareSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid wallet request", details: parsed.error.flatten() });
    try {
        const { chainId, contractAddress, intent, sender, value } = parsed.data;
        const result = await getClient({ ...req, body: { chainId } } as express.Request)
            .compileAgentIntent(contractAddress, intent, sender, value);
        return res.status(result.signable ? 200 : 422).json(result);
    } catch (e: any) {
        return res.status(422).json({ error: e.message || "Wallet preparation failed" });
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
        
        const result = await getClient(req).compileAgentIntent(contractAddress, intent, sender);
        return res.json(result);
    } catch (e: any) {
        return res.status(500).json({ error: e.message || "Failed to compile intent due to server configuration." });
    }
});

export default app;
