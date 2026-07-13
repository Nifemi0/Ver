import { spawn } from "child_process";

async function main() {
  console.log("Starting MCP server...");
  const server = spawn("npx", ["tsx", "src/server/mcp.ts"], { env: process.env });

  // Helper to send JSON-RPC and wait for response
  const callMCPTool = (name: string, args: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const payload = JSON.stringify({
        jsonrpc: "2.0",
        id: id,
        method: "tools/call",
        params: { name, arguments: args }
      }) + "\n";

      let buffer = "";
      const onData = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('{')) continue;
          try {
            const res = JSON.parse(trimmed);
            if (res.id === id) {
              server.stdout.removeListener('data', onData);
              if (res.error) resolve({ toolResult: { error: res.error } });
              else resolve(res.result);
            }
          } catch (e) {
            // keep looking
          }
        }
      };

      server.stdout.on('data', onData);
      server.stderr.on('data', (err) => console.log(`[MCP Error] ${err.toString().trim()}`));
      
      server.stdin.write(payload);
    });
  };

  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));

  // We need to send initialization first for MCP
  const initPayload = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  }) + "\n";
  server.stdin.write(initPayload);

  await new Promise(r => setTimeout(r, 1000));
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const tools = [
    { name: "get_protocol_graph",    args: { address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1" } },
    { name: "get_source_code",       args: { address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1" } },
    { name: "lookup_graph_attestation", args: { address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1" } },
  ];

  for (const tool of tools) {
    try {
      const response = await callMCPTool(tool.name, tool.args);
      // Ensure the response has the structure: { content: ... }
      if (!response || !response.content) {
        throw new Error(`Tool ${tool.name} returned invalid format`);
      }
      
      const parsed = response.content;
      console.log(`✅ ${tool.name} — returned ${typeof parsed === "object" ? Object.keys(parsed).join(", ") : typeof parsed}`);
    } catch (e: any) {
      console.error(`❌ ${tool.name} failed: ${e.message}`);
    }
  }

  server.kill();
  console.log("\n✅ All MCP tests completed");
  process.exit(0);
}

main().catch(console.error);
