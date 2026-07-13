const fs = require('fs');

// 1. Cleanup old standalone pages
const toDelete = ['schema.html', 'mcp.html', 'benchmarks.html', 'sdk.html'];
for (const file of toDelete) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
}

// 2. Build the unified docs.html
let docsBase = fs.readFileSync('docs.html', 'utf8');

// We are going to completely replace the main container in docs.html
const mainRegex = /<main[\s\S]*?<\/main>/;

const newDocsMain = `
<main class="pt-32 pb-24 max-w-7xl mx-auto px-6 min-h-[80vh] flex gap-12 relative">
    
    <!-- Sidebar Navigation -->
    <div class="hidden md:block w-64 shrink-0 border-r border-gray-100 pr-6 sticky top-24 self-start space-y-8 max-h-[80vh] overflow-y-auto pb-10">
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Getting Started</div>
            <div class="space-y-2">
                <a href="#intro" class="block text-sm text-gray-500 hover:text-gray-900">Introduction</a>
                <a href="#quickstart" class="block text-sm text-gray-500 hover:text-gray-900">Quick Start</a>
            </div>
        </div>
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Architecture</div>
            <div class="space-y-2">
                <a href="#pipeline" class="block text-sm text-gray-500 hover:text-gray-900">Pipeline</a>
                <a href="#compiler" class="block text-sm text-gray-500 hover:text-gray-900">Deterministic Compiler</a>
            </div>
        </div>
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Components</div>
            <div class="space-y-2">
                <a href="#schema" class="block text-sm text-gray-500 hover:text-gray-900">Schema</a>
                <a href="#sdk" class="block text-sm text-gray-500 hover:text-gray-900">SDK</a>
                <a href="#mcp" class="block text-sm text-gray-500 hover:text-gray-900">MCP Server</a>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 max-w-3xl space-y-24">
        
        <!-- INTRO -->
        <section id="intro" class="scroll-mt-32">
            <h1 class="text-5xl font-serif text-gray-900 mb-6">Documentation</h1>
            <p class="text-xl text-gray-600 leading-relaxed mb-6">
                HashGraph is the semantic layer for HashKey Chain. It compiles deterministic blockchain artifacts into an AI-readable Protocol Graph.
            </p>
            <p class="text-gray-600 leading-relaxed">
                It is not a wallet, a scanner, or an auditor. It is a semantic compiler that translates raw bytecode into highly structured knowledge that autonomous agents can understand.
            </p>
        </section>

        <!-- PIPELINE -->
        <section id="pipeline" class="scroll-mt-32">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">Compiler Pipeline</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The entire pipeline is built on pure functions. No extractor performs network requests inside the compiler stage, ensuring highly predictable and cacheable outputs.
            </p>
            <div class="bg-[#0A0A0A] p-8 rounded-3xl shadow-xl border border-gray-800">
                <div class="flex flex-col gap-3 font-mono text-sm text-gray-300">
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">1</span> Input Contract</div>
                    <div class="pl-4 text-gray-600">↓</div>
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">2</span> Blockscout Fetcher</div>
                    <div class="pl-4 text-gray-600">↓</div>
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">3</span> Normalizer</div>
                    <div class="pl-4 text-gray-600">↓</div>
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">4</span> Deterministic Compiler</div>
                    <div class="pl-4 text-gray-600">↓</div>
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800/50 text-green-400">5</span> HashGraph Schema</div>
                    <div class="pl-4 text-gray-600">↓</div>
                    <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-800/50 text-purple-400">6</span> Semantic Enrichment</div>
                </div>
            </div>
        </section>

        <!-- SCHEMA -->
        <section id="schema" class="scroll-mt-32 border-t border-gray-200 pt-16">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">HashGraph Schema</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The Protocol Graph is the canonical output produced by the deterministic compiler. It structurally isolates deterministic data from AI-generated semantic data.
            </p>
            <div class="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-8">
                <pre class="font-mono text-sm text-gray-700 leading-loose">
ProtocolGraph
├── metadata
├── structural
├── semantic
├── statistics
└── verification</pre>
            </div>
            
            <h3 class="text-xl font-bold text-gray-900 mt-10 mb-4">Structural Data (Deterministic)</h3>
            <p class="text-sm text-gray-600 mb-4">Contains roles, dependencies, events, and functions. This is guaranteed to be 100% mathematically accurate to the on-chain bytecode.</p>
            <div class="bg-[#0A0A0A] p-6 rounded-2xl shadow-lg border border-gray-800 overflow-x-auto">
<pre class="font-mono text-sm text-gray-300">
"structural": {
  "roles": ["Owner", "Guardian", "Operator"],
  "dependencies": ["Oracle", "Treasury", "USDC"],
  "events": ["Deposit", "Withdraw", "Liquidate"]
}
</pre>
            </div>

            <h3 class="text-xl font-bold text-gray-900 mt-10 mb-4">Semantic Data (AI Generated)</h3>
            <p class="text-sm text-gray-600 mb-4">Contains the underlying intent and security guardrails. The LLM never computes confidence—it is deterministically derived from verified ABIs and standard detection.</p>
            <div class="bg-[#0A0A0A] p-6 rounded-2xl shadow-lg border border-gray-800 overflow-x-auto">
<pre class="font-mono text-sm text-gray-300">
"semantic": {
  "intent": "Accepts collateral deposits in USDC...",
  "confidence": 96,
  "derived_from": ["deposit()", "Deposit Event"]
}
</pre>
            </div>
        </section>

        <!-- SDK -->
        <section id="sdk" class="scroll-mt-32 border-t border-gray-200 pt-16">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">SDK</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                Integrate HashGraph directly into your node applications to fetch protocol graphs programmatically.
            </p>

            <h3 class="text-lg font-bold text-gray-900 mb-3">Install</h3>
            <div class="bg-[#0A0A0A] p-4 rounded-xl shadow-lg border border-gray-800 mb-8">
                <pre class="font-mono text-sm text-green-400">npm install @hashgraph/sdk</pre>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-3">Create Client</h3>
            <div class="bg-[#0A0A0A] p-6 rounded-xl shadow-lg border border-gray-800 mb-8">
<pre class="font-mono text-sm text-gray-300">
<span class="text-purple-400">import</span> { HashGraphClient } <span class="text-purple-400">from</span> <span class="text-green-300">"@hashgraph/sdk"</span>;

<span class="text-purple-400">const</span> client = <span class="text-purple-400">new</span> HashGraphClient({
  rpcUrl: process.env.RPC_URL
});
</pre>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-3">Get Protocol Graph</h3>
            <div class="bg-[#0A0A0A] p-6 rounded-xl shadow-lg border border-gray-800 mb-8">
<pre class="font-mono text-sm text-gray-300">
<span class="text-purple-400">const</span> graph = <span class="text-purple-400">await</span> client.<span class="text-blue-300">getProtocolGraph</span>(
  <span class="text-green-300">"0x4200000000000000000000000000000000000015"</span>
);
</pre>
            </div>
        </section>

        <!-- MCP -->
        <section id="mcp" class="scroll-mt-32 border-t border-gray-200 pt-16">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">MCP Server</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The Model Context Protocol (MCP) server allows AI agents like Claude Desktop or Cursor to directly interact with the deterministic HashGraph compiler.
            </p>

            <h3 class="text-lg font-bold text-gray-900 mb-3">Claude Configuration</h3>
            <p class="text-sm text-gray-500 font-mono mb-2">~/Library/Application Support/Claude/claude_desktop_config.json</p>
            <div class="bg-[#0A0A0A] p-6 rounded-xl shadow-lg border border-gray-800 mb-8">
<pre class="font-mono text-sm text-gray-300">
{
  <span class="text-blue-300">"mcpServers"</span>: {
    <span class="text-blue-300">"hashgraph"</span>: {
      <span class="text-blue-300">"command"</span>: <span class="text-green-300">"npx"</span>,
      <span class="text-blue-300">"args"</span>: [<span class="text-green-300">"-y"</span>, <span class="text-green-300">"@hashgraph/mcp-server"</span>]
    }
  }
}
</pre>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-4">Available Tools</h3>
            <div class="space-y-4">
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">get_protocol_graph()</div>
                    <div class="text-sm text-gray-600">Compiles a smart contract address into a structured JSON graph containing roles, dependencies, events, and intent.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">explain_transaction()</div>
                    <div class="text-sm text-gray-600">Decodes transaction calldata and evaluates its safety based on the compiled deterministic graph.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <div class="font-mono font-bold text-gray-900 mb-2">search_protocol()</div>
                    <div class="text-sm text-gray-600">Searches the protocol graph for specific privileges, variables, or functions.</div>
                </div>
            </div>
        </section>

    </div>
</main>
`;
docsBase = docsBase.replace(mainRegex, newDocsMain);
fs.writeFileSync('docs.html', docsBase);

// 3. Update the Top Navbars across remaining files (interactive_graph.html, docs.html, explorer.html)
const activeFiles = ['interactive_graph.html', 'docs.html', 'explorer.html'];
for (const file of activeFiles) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    
    const oldNavRegex = /<div id="navLinks" class="([^"]+)">[\s\S]*?<\/div>/;
    const newNavLinks = `<div id="navLinks" class="$1">
                <a href="docs.html" class="hover:text-gray-900 transition-colors">Documentation</a>
                <a href="https://github.com/HashKey/HashGraph" class="hover:text-gray-900 transition-colors">GitHub</a>
            </div>`;
    html = html.replace(oldNavRegex, newNavLinks);

    // Also update "Launch App" to always point to explorer.html
    const launchAppRegex = /<a href="[^"]*" class="bg-black text-white px-5 py-2\.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">\s*Launch App/g;
    html = html.replace(launchAppRegex, `<a href="explorer.html" class="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">\n                Launch App`);

    fs.writeFileSync(file, html);
}

