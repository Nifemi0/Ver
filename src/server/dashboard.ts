import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { VerClient } from "../sdk/client";
import { MermaidExporter } from "../engine/export/mermaid";

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

app.use(express.static(path.join(process.cwd(), "src/dashboard")));

const client = new VerClient();

app.get("/api/compile", async (req, res) => {
    try {
        const address = req.query.address as string;
        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }
        const graph = await client.getProtocolGraph(address);
        const mermaid = MermaidExporter.generate(graph);
        
        // Compute compiler trace (mocking the trace format from Step 3)
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
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Ver Dashboard running on http://localhost:${PORT}`);
    });
}

export default app;
