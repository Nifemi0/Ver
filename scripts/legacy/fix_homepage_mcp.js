const fs = require('fs');
const files = ['interactive_graph.html', 'docs.html', 'schema.html', 'mcp.html', 'explorer.html', 'benchmarks.html'];

// 1. Remove sdk.html
if (fs.existsSync('sdk.html')) {
    fs.unlinkSync('sdk.html');
}

// 2. Remove SDK links from all files
for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    
    html = html.replace(/<a href="sdk.html" class="hover:text-gray-900 transition-colors">SDK<\/a>/g, '');
    html = html.replace(/<a href="sdk.html" class="hover:text-gray-900">SDK<\/a>/g, '');
    
    fs.writeFileSync(file, html);
}

// 3. Add CTA to interactive_graph.html
let homeHtml = fs.readFileSync('interactive_graph.html', 'utf8');
const analyzeBarRegex = /(<div class="flex flex-col sm:flex-row gap-0 rounded-full shadow-sm border border-gray-300 w-full max-w-md mx-auto bg-white overflow-hidden pointer-events-auto">[\s\S]*?<\/div>)/;
const ctaInjection = `$1
        <div class="mt-8 flex items-center justify-center pointer-events-auto">
            <div class="flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-700 font-mono shadow-sm group hover:border-gray-300 transition-all cursor-copy" onclick="navigator.clipboard.writeText('npm install @hashgraph/sdk'); const i=this.querySelector('i'); i.innerText='check'; setTimeout(()=>i.innerText='content_copy', 2000);">
                <span class="text-gray-400">$</span> npm install @hashgraph/sdk
                <i class="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-gray-900 transition-colors">content_copy</i>
            </div>
        </div>`;
homeHtml = homeHtml.replace(analyzeBarRegex, ctaInjection);
fs.writeFileSync('interactive_graph.html', homeHtml);

// 4. Redesign MCP page into a Guide
let mcpHtml = fs.readFileSync('mcp.html', 'utf8');

const oldMainRegex = /<main[\s\S]*?<\/main>/;
const newMcpMain = `
<main class="pt-32 pb-24 max-w-4xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-12">
        <h1 class="text-4xl font-serif text-gray-900 mb-4 border-b border-gray-200 pb-4">HashGraph MCP Server</h1>
        <p class="text-lg text-gray-600">The Model Context Protocol (MCP) server allows AI agents like Claude Desktop or Cursor to directly interact with the deterministic HashGraph compiler.</p>
    </div>

    <div class="prose prose-lg text-gray-600 max-w-none space-y-8">
        
        <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">1</span> Installation</h3>
            <p>Ensure you have Node.js installed, then add the HashGraph server to your Claude Desktop configuration file.</p>
            <p class="text-sm font-mono bg-gray-100 p-2 rounded text-gray-500 mt-2">~/Library/Application Support/Claude/claude_desktop_config.json</p>
            <div class="bg-[#0A0A0A] rounded-xl p-6 mt-4 shadow-lg border border-gray-800 font-mono text-sm text-gray-300 overflow-x-auto">
<pre>{
  <span class="text-blue-300">"mcpServers"</span>: {
    <span class="text-blue-300">"hashgraph"</span>: {
      <span class="text-blue-300">"command"</span>: <span class="text-green-300">"npx"</span>,
      <span class="text-blue-300">"args"</span>: [<span class="text-green-300">"-y"</span>, <span class="text-green-300">"@hashgraph/mcp-server"</span>]
    }
  }
}</pre>
            </div>
        </div>

        <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span> Available Tools</h3>
            <p>Once connected, Claude will automatically have access to the following deterministic tools:</p>
            <div class="grid grid-cols-1 gap-4 mt-6">
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">get_protocol_graph</div>
                    <div class="text-sm">Compiles a smart contract address into a structured JSON graph containing roles, dependencies, events, and intent.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">explain_transaction</div>
                    <div class="text-sm">Decodes transaction calldata and evaluates its safety based on the compiled deterministic graph.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">search_protocol</div>
                    <div class="text-sm">Searches the protocol graph for specific privileges, variables, or functions.</div>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">3</span> Usage</h3>
            <p>Restart Claude Desktop. You will see a small plug icon indicating the HashGraph MCP is connected. Simply ask Claude:</p>
            <blockquote class="border-l-4 border-gray-300 pl-4 py-1 italic bg-gray-50 text-gray-700 rounded-r">
                "Can you use the HashGraph tool to check if the Lending Vault contract at 0x... has a pause function?"
            </blockquote>
        </div>

    </div>
</main>
`;
mcpHtml = mcpHtml.replace(oldMainRegex, newMcpMain);
fs.writeFileSync('mcp.html', mcpHtml);
