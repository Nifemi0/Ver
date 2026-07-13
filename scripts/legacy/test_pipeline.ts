import { config } from "dotenv";
config();
import { HashGraphClient } from "./src/sdk/client";

class MockLLM {
    async generate(system: string, user: string) {
        if (user.includes("intent")) return JSON.stringify({ intent: { value: "mock", derived_from: [] }, user_goal: { value: "mock", derived_from: [] } });
        if (user.includes("security")) return JSON.stringify({ guardrails: [] });
        if (user.includes("developer")) return JSON.stringify({ integration_notes: [] });
        return "{}";
    }
}

async function main() {
    const address = "0xB210D2120d57b758EE163cFfb43e73728c471Cf1"; // WHSK on HashKey Mainnet
    console.log(`Testing full HashGraph pipeline for ${address}...`);
    
    const client = new HashGraphClient(new MockLLM());
    try {
        const graph = await client.getProtocolGraph(address);
        console.log("\n=== COMPILATION SUCCESS ===");
        console.log("Protocol Name:", graph.metadata.protocol_name);
        console.log("Roles:", graph.structural.roles.length);
        console.log("Events:", graph.structural.events.length);
        console.log("Dependencies:", graph.structural.dependencies.length);
        console.log("Graph Hash:", graph.registry?.hash || "Not present");
        console.log("Registry Status:", graph.registry?.verified ? "VERIFIED" : "NOT REGISTERED");
        console.log("Semantic Intent:", graph.semantic.intent ? "Present" : "Missing");
    } catch (e) {
        console.error("Pipeline failed:", e);
    }
}

main();
