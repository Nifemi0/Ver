const fs = require('fs');

const detailedMain = `
<main class="pt-32 pb-24 max-w-7xl mx-auto px-6 min-h-[80vh] flex gap-12 relative">
    
    <!-- Sidebar Navigation -->
    <div class="hidden md:block w-64 shrink-0 border-r border-gray-100 pr-6 sticky top-24 self-start space-y-8 max-h-[80vh] overflow-y-auto pb-10">
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Getting Started</div>
            <div class="space-y-2">
                <a href="#intro" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Introduction</a>
                <a href="#quickstart" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Quick Start</a>
            </div>
        </div>
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Architecture</div>
            <div class="space-y-2">
                <a href="#pipeline" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pipeline</a>
                <a href="#compiler" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Deterministic Compiler</a>
                <a href="#semantic" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Semantic Engine</a>
            </div>
        </div>
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Components</div>
            <div class="space-y-2">
                <a href="#schema" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Schema</a>
                <a href="#sdk" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">SDK</a>
                <a href="#mcp" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">MCP Server</a>
            </div>
        </div>
        <div>
            <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Examples</div>
            <div class="space-y-2">
                <a href="#examples" class="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Analyze & Search</a>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 max-w-3xl space-y-28">
        
        <!-- INTRO -->
        <section id="intro" class="scroll-mt-32">
            <div class="text-xs font-bold text-hashkey uppercase tracking-widest mb-3">Overview</div>
            <h1 class="text-5xl font-serif text-gray-900 mb-6 tracking-tight">Documentation</h1>
            <p class="text-xl text-gray-600 leading-relaxed mb-6">
                HashGraph is the semantic infrastructure layer for HashKey Chain. It transforms raw, unreadable blockchain bytecode into highly structured, AI-readable Protocol Graphs.
            </p>
            <p class="text-gray-600 leading-relaxed mb-6">
                Most blockchain tools stop at the ABI. They tell computers <em>how</em> to call a contract, but not <em>what</em> the contract actually does. HashGraph bridges this gap by deterministically compiling a contract's relationships, roles, dependencies, and metadata into a singular Protocol Graph, and then mapping a semantic intent layer on top of it.
            </p>
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-900">
                <strong>Important:</strong> HashGraph is strictly read-only infrastructure. It does not execute transactions, hold private keys, or perform audits. It is a semantic data provider for downstream agents and developer tools.
            </div>
        </section>

        <!-- QUICKSTART -->
        <section id="quickstart" class="scroll-mt-32">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Quick Start</h2>
            <p class="text-gray-600 mb-6 leading-relaxed">
                You can interact with HashGraph in three ways: via the SDK in your node apps, via the CLI for immediate terminal feedback, or via the MCP Server for AI agents.
            </p>
            
            <h3 class="font-bold text-gray-900 mb-3">1. CLI (Zero Config)</h3>
            <p class="text-sm text-gray-600 mb-3">Analyze any contract on HashKey Chain instantly from your terminal without installing dependencies.</p>
            <div class="bg-[#0A0A0A] p-4 rounded-xl shadow-lg border border-gray-800 mb-8 font-mono text-sm">
                <span class="text-gray-500">$</span> <span class="text-green-400">npx</span> @hashgraph/cli analyze 0x4200000000000000000000000000000000000015
            </div>

            <h3 class="font-bold text-gray-900 mb-3">2. Node.js SDK</h3>
            <div class="bg-[#0A0A0A] p-4 rounded-xl shadow-lg border border-gray-800 mb-8 font-mono text-sm text-gray-300">
                <span class="text-gray-500">$</span> npm install @hashgraph/sdk
            </div>
        </section>

        <!-- PIPELINE -->
        <section id="pipeline" class="scroll-mt-32">
            <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Architecture</div>
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Compiler Pipeline</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                HashGraph is built on a strict deterministic pipeline. The pipeline operates as a series of pure functions. Data flows strictly downwards.
            </p>
            
            <div class="bg-[#0A0A0A] p-8 rounded-3xl shadow-xl border border-gray-800 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <span class="material-symbols-outlined text-9xl text-white">account_tree</span>
                </div>
                <div class="relative z-10 flex flex-col gap-5 font-mono text-sm text-gray-300">
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 shrink-0 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">1</span> 
                        <div>
                            <div class="font-bold text-white">Input Contract</div>
                            <div class="text-[11px] text-gray-500 mt-1">Accepts a raw 0x address from HashKey Chain.</div>
                        </div>
                    </div>
                    <div class="pl-4 text-gray-600 border-l border-gray-800 ml-[15px] h-4"></div>
                    
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 shrink-0 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">2</span> 
                        <div>
                            <div class="font-bold text-white">Blockscout Fetcher</div>
                            <div class="text-[11px] text-gray-500 mt-1">Retrieves verified ABI, source code, and creation transactions.</div>
                        </div>
                    </div>
                    <div class="pl-4 text-gray-600 border-l border-gray-800 ml-[15px] h-4"></div>
                    
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 shrink-0 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">3</span> 
                        <div>
                            <div class="font-bold text-blue-100">Normalizer (Proxy Resolution)</div>
                            <div class="text-[11px] text-blue-300/60 mt-1">Detects EIP-1967, EIP-1167, and Diamond Proxies. Deflattens ABI.</div>
                        </div>
                    </div>
                    <div class="pl-4 text-gray-600 border-l border-blue-900/30 ml-[15px] h-4"></div>
                    
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 shrink-0 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">4</span> 
                        <div>
                            <div class="font-bold text-blue-100">Deterministic Compiler</div>
                            <div class="text-[11px] text-blue-300/60 mt-1">Extracts roles, dependencies, events. Generates 100% factual structural graph.</div>
                        </div>
                    </div>
                    <div class="pl-4 text-gray-600 border-l border-blue-900/30 ml-[15px] h-4"></div>
                    
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-8 shrink-0 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-800/50 text-purple-400">5</span> 
                        <div>
                            <div class="font-bold text-purple-100">Semantic Enrichment</div>
                            <div class="text-[11px] text-purple-300/60 mt-1">LLM infers intent and developer context based ONLY on the structural graph.</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- COMPILER -->
        <section id="compiler" class="scroll-mt-32">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">The Deterministic Compiler</h2>
            <p class="text-gray-600 mb-6 leading-relaxed">
                The core innovation of HashGraph is the absolute separation of <strong>Fact</strong> and <strong>Inference</strong>. 
                The Deterministic Compiler handles the Facts.
            </p>
            <ul class="space-y-4 text-sm text-gray-700 mb-8 list-disc pl-5">
                <li><strong class="text-gray-900">ABI is Truth:</strong> The compiler prioritizes verified ABIs above all other data sources.</li>
                <li><strong class="text-gray-900">Dependency Tracing:</strong> It scans constructors and immutable public variables to determine what other contracts this protocol relies on.</li>
                <li><strong class="text-gray-900">Role Identification:</strong> It statically analyzes <code>onlyOwner</code>, <code>hasRole</code>, and standard modifiers to build an authorization map.</li>
            </ul>
        </section>

        <!-- SEMANTIC ENGINE -->
        <section id="semantic" class="scroll-mt-32">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">The Semantic Engine</h2>
            <p class="text-gray-600 mb-6 leading-relaxed">
                While structural data is perfect for computers, AI agents and humans need context. The Semantic Engine provides this layer while adhering to strict safety rules.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-red-50 border border-red-100 rounded-xl p-6">
                    <div class="flex items-center gap-2 text-red-700 font-bold mb-3"><span class="material-symbols-outlined text-[20px]">cancel</span> What it Cannot Do</div>
                    <ul class="text-sm text-red-900/80 space-y-2">
                        <li>Cannot invent blockchain facts</li>
                        <li>Cannot guess a variable type</li>
                        <li>Cannot perform security audits</li>
                        <li>Cannot calculate confidence scores</li>
                    </ul>
                </div>
                <div class="bg-green-50 border border-green-100 rounded-xl p-6">
                    <div class="flex items-center gap-2 text-green-700 font-bold mb-3"><span class="material-symbols-outlined text-[20px]">check_circle</span> What it Can Do</div>
                    <ul class="text-sm text-green-900/80 space-y-2">
                        <li>Summarize the protocol's goal</li>
                        <li>Group related functions (e.g. "Liquidation")</li>
                        <li>Explain what a transaction calldata intends</li>
                        <li>Provide integration notes for developers</li>
                    </ul>
                </div>
            </div>
            
            <p class="text-sm text-gray-500 italic">
                * Note on Confidence: Confidence scores are computed deterministically. The LLM is forbidden from assigning its own confidence levels.
            </p>
        </section>

        <!-- SCHEMA -->
        <section id="schema" class="scroll-mt-32 pt-12 border-t border-gray-200">
            <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Components</div>
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">The Protocol Graph Schema</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The final output of the pipeline is a standardized JSON schema representing the <code>ProtocolGraph</code>. 
            </p>

            <div class="space-y-8">
                <!-- Metadata -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-gray-400 text-lg">data_object</span> Metadata
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Core identification strings, proxy configurations, and compilation states.</p>
                    <div class="bg-[#0A0A0A] p-5 rounded-xl shadow-lg border border-gray-800 font-mono text-[13px] text-gray-300 overflow-x-auto">
<pre>"metadata": {
  "protocol_name": "Lending Vault",
  "contract_address": "0x42...",
  "compiler_version": "1.0",
  "is_proxy": true,
  "implementation": "0xc0d3..."
}</pre>
                    </div>
                </div>

                <!-- Structural -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-blue-400 text-lg">account_tree</span> Structural (Deterministic)
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">The absolute truth extracted from the ABI. Guaranteed to match the on-chain bytecode.</p>
                    <div class="bg-[#0A0A0A] p-5 rounded-xl shadow-lg border border-blue-900/30 font-mono text-[13px] text-gray-300 overflow-x-auto">
<pre>"structural": {
  "roles": ["Owner", "Guardian", "Operator"],
  "dependencies": [
    { "target": "0xabc...", "type": "Oracle" }
  ],
  "events": ["Deposit", "Withdraw", "Liquidate"],
  "functions": 24
}</pre>
                    </div>
                </div>

                <!-- Semantic -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-400 text-lg">psychology</span> Semantic & Security (AI Layer)
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Inferred human-readable context layered safely on top of the structure.</p>
                    <div class="bg-[#0A0A0A] p-5 rounded-xl shadow-lg border border-purple-900/30 font-mono text-[13px] text-gray-300 overflow-x-auto">
<pre>"semantic": {
  "intent": "Manages collateralized debt positions...",
  "user_goal": "Deposit USDC to borrow synthetic assets."
},
"security": {
  "guardrails": ["Requires Oracle heartbeat within 1hr"],
  "privileged_functions": ["pause()", "upgradeTo()"]
}</pre>
                    </div>
                </div>
            </div>
        </section>

        <!-- SDK -->
        <section id="sdk" class="scroll-mt-32 pt-12 border-t border-gray-200">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">SDK Integration</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                Integrate HashGraph directly into your node applications to fetch protocol graphs programmatically. The SDK handles proxy resolution, caching, and retries automatically.
            </p>

            <div class="bg-[#0A0A0A] p-6 rounded-xl shadow-lg border border-gray-800 mb-8 overflow-x-auto">
<pre class="font-mono text-sm text-gray-300">
<span class="text-purple-400">import</span> { HashGraphClient } <span class="text-purple-400">from</span> <span class="text-green-300">"@hashgraph/sdk"</span>;

<span class="text-gray-500">// Initialize client</span>
<span class="text-purple-400">const</span> client = <span class="text-purple-400">new</span> HashGraphClient({
  rpcUrl: process.env.RPC_URL,
  cacheMode: <span class="text-green-300">"HIT_OR_COMPILE"</span>
});

<span class="text-gray-500">// Fetch the full compiled graph</span>
<span class="text-purple-400">const</span> graph = <span class="text-purple-400">await</span> client.<span class="text-blue-300">getProtocolGraph</span>(
  <span class="text-green-300">"0x4200000000000000000000000000000000000015"</span>
);

console.<span class="text-blue-300">log</span>(<span class="text-green-300">"Roles detected:"</span>, graph.structural.roles);
console.<span class="text-blue-300">log</span>(<span class="text-green-300">"AI Summary:"</span>, graph.semantic.intent);
</pre>
            </div>
        </section>

        <!-- MCP -->
        <section id="mcp" class="scroll-mt-32 pt-12 border-t border-gray-200">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">MCP Server (For AI Agents)</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The Model Context Protocol (MCP) server allows AI agents like Claude Desktop or Cursor to directly interact with the deterministic HashGraph compiler without you having to write any code.
            </p>

            <h3 class="text-lg font-bold text-gray-900 mb-3">Claude Desktop Setup</h3>
            <p class="text-sm text-gray-500 mb-3">Add this to your <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:</p>
            <div class="bg-[#0A0A0A] p-6 rounded-xl shadow-lg border border-gray-800 mb-8 overflow-x-auto">
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
            
            <p class="text-sm text-gray-500 mb-6">Restart Claude, and you can now ask Claude questions like: <em>"Analyze contract 0x... and tell me what dependencies it has."</em></p>

            <h3 class="text-lg font-bold text-gray-900 mb-4">Available Tools (Exposed via MCP)</h3>
            <div class="space-y-4">
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                    <div class="bg-gray-100 rounded text-gray-900 font-mono font-bold px-3 py-1 text-sm border border-gray-200">get_protocol_graph()</div>
                    <div class="text-sm text-gray-600 mt-1">Compiles a smart contract address into a structured JSON graph containing roles, dependencies, events, and intent.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                    <div class="bg-gray-100 rounded text-gray-900 font-mono font-bold px-3 py-1 text-sm border border-gray-200">explain_transaction()</div>
                    <div class="text-sm text-gray-600 mt-1">Decodes raw transaction calldata and evaluates its safety based on the compiled deterministic graph.</div>
                </div>
                <div class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                    <div class="bg-gray-100 rounded text-gray-900 font-mono font-bold px-3 py-1 text-sm border border-gray-200">search_protocol()</div>
                    <div class="text-sm text-gray-600 mt-1">Searches the cached protocol graphs for specific privileges, standard interfaces, or variables.</div>
                </div>
            </div>
        </section>

        <!-- EXAMPLES -->
        <section id="examples" class="scroll-mt-32 pt-12 border-t border-gray-200">
            <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Interactive Examples</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
                The best way to understand the Protocol Graph is to compile one yourself.
            </p>
            <div class="bg-black text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-800">
                <div>
                    <h4 class="font-bold text-lg mb-2">HashGraph Explorer</h4>
                    <p class="text-gray-400 text-sm">Paste any HashKey Chain contract address into the Explorer to watch the Deterministic Compiler pipeline in real time.</p>
                </div>
                <a href="explorer.html" class="shrink-0 bg-white text-black px-6 py-3 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
                    Open Explorer <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
            </div>
        </section>

    </div>
</main>
`;

let html = fs.readFileSync('docs.html', 'utf8');
const mainRegex = /<main[\s\S]*?<\/main>/;
html = html.replace(mainRegex, detailedMain);

fs.writeFileSync('docs.html', html);
