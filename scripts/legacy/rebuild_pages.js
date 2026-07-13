const fs = require('fs');

const baseHtml = fs.readFileSync('interactive_graph.html', 'utf8');

// Extract nav and footer from the FIXED interactive_graph
const navRegex = /(<!-- Top Navigation -->[\s\S]*?<\/nav>)/;
const footerRegex = /(<!-- Final Footer -->[\s\S]*?<\/footer>)/;
const scriptRegex = /(<script>[\s\S]*?\/\/ Navbar Scroll Effect[\s\S]*?<\/script>)/;

const navMatch = baseHtml.match(navRegex);
const footerMatch = baseHtml.match(footerRegex);
const fullScriptMatch = baseHtml.match(scriptRegex);

const nav = navMatch ? navMatch[1] : '';
const footer = footerMatch ? footerMatch[1] : '';

// We only need the scroll listener for the navbar on the subpages, not the canvas logic
const scrollScript = `
<script>
    // Navbar Scroll Effect
    const navLinks = document.getElementById('navLinks');
    if(navLinks) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navLinks.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200');
                navLinks.classList.remove('border-transparent');
            } else {
                navLinks.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200');
                navLinks.classList.add('border-transparent');
            }
        });
    }
</script>
`;

const head = baseHtml.split('<!-- Top Navigation -->')[0];

function createPage(title, content) {
    return head + nav + `
    <main class="pt-32 pb-24 max-w-4xl mx-auto px-6 min-h-[70vh]">
        <h1 class="text-4xl font-serif text-gray-900 mb-8 border-b border-gray-200 pb-4">${title}</h1>
        <div class="prose prose-lg text-gray-600 max-w-none space-y-6">
            ${content}
        </div>
    </main>
    ` + footer + scrollScript + `\n</body>\n</html>`;
}

// 1. DOCS
const docsContent = `
<h2 class="text-2xl font-serif font-bold text-gray-900 mt-8 mb-4">The HashGraph Architecture</h2>
<p class="leading-relaxed">HashGraph compiles deterministic blockchain artifacts into an AI-readable Protocol Graph that IDEs, wallets, AI agents and developer tools can consume through MCP.</p>

<h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">Core Principles</h3>
<ul class="list-disc pl-6 space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
<li><strong class="text-gray-900">Deterministic first.</strong> AI augments, never replaces deterministic facts.</li>
<li><strong class="text-gray-900">Read-only infrastructure.</strong> Never signs transactions.</li>
<li><strong class="text-gray-900">Explainable by AI.</strong> Everything is cited and tracked back to the blockchain state.</li>
</ul>

<h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">Compiler Stages</h3>
<p class="leading-relaxed">Every compiler stage behaves as a pure function. No extractors may perform network requests, invoke an LLM, or mutate shared state.</p>
<div class="bg-gray-50 border border-gray-200 rounded-xl p-6 font-mono text-sm text-gray-600 mt-4">
    Input Contract &rarr; Blockscout Fetcher &rarr; Normalizer &rarr; Deterministic Compiler &rarr; HashGraph Schema &rarr; Semantic Enrichment
</div>
`;
fs.writeFileSync('docs.html', createPage('Documentation', docsContent));

// 2. SCHEMA
const schemaContent = `
<h2 class="text-2xl font-serif font-bold text-gray-900 mt-8 mb-4">Protocol Graph Schema</h2>
<p class="leading-relaxed">The standard JSON interface for AI agents interacting with HashKey Chain.</p>

<div class="bg-[#0A0A0A] rounded-xl p-6 mt-6 shadow-xl border border-gray-800">
    <div class="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <span class="w-3 h-3 rounded-full bg-red-500"></span>
        <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
        <span class="w-3 h-3 rounded-full bg-green-500"></span>
        <span class="ml-2 text-xs font-mono text-gray-500">HashGraphSchema.ts</span>
    </div>
<pre class="text-sm font-mono overflow-x-auto text-gray-300">
<span class="text-purple-400">export interface</span> <span class="text-yellow-300">HashGraphSchema</span> {
  <span class="text-blue-300">metadata</span>: {
    protocol_name: <span class="text-green-300">string</span>;
    contract_address: <span class="text-green-300">string</span>;
    compiler_version: <span class="text-green-300">string</span>;
    cache_status: <span class="text-orange-300">"HIT" | "MISS"</span>;
  };
  <span class="text-blue-300">structural</span>: {
    roles: <span class="text-green-300">string[]</span>;
    dependencies: { target: <span class="text-green-300">string</span>; type: <span class="text-green-300">string</span> }[];
    events: <span class="text-green-300">string[]</span>;
  };
  <span class="text-blue-300">semantic</span>: {
    intent: <span class="text-green-300">string</span>;
    user_goal: <span class="text-green-300">string</span>;
    confidence: <span class="text-green-300">number</span>;
    verified: <span class="text-green-300">boolean</span>;
  };
}
</pre>
</div>
`;
fs.writeFileSync('schema.html', createPage('Schema Reference', schemaContent));

// 3. SDK
const sdkContent = `
<h2 class="text-2xl font-serif font-bold text-gray-900 mt-8 mb-4">TypeScript SDK</h2>
<p class="leading-relaxed">Integrate HashGraph into your own node applications, wallets, or autonomous AI agents.</p>

<h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">Installation</h3>
<div class="bg-gray-100 p-4 rounded-lg font-mono text-sm text-gray-800 border border-gray-200 mt-4 flex items-center justify-between">
    <span>npm install @hashgraph/sdk</span>
    <span class="material-symbols-outlined text-gray-400 text-sm cursor-pointer hover:text-gray-900">content_copy</span>
</div>

<h3 class="text-xl font-bold text-gray-900 mt-10 mb-4">Basic Usage</h3>
<div class="bg-[#0A0A0A] rounded-xl p-6 mt-4 shadow-xl border border-gray-800">
<pre class="text-sm font-mono overflow-x-auto text-gray-300">
<span class="text-purple-400">import</span> { HashGraphClient } <span class="text-purple-400">from</span> <span class="text-green-300">'@hashgraph/sdk'</span>;

<span class="text-purple-400">const</span> client = <span class="text-purple-400">new</span> <span class="text-yellow-300">HashGraphClient</span>({
  rpcUrl: <span class="text-green-300">"https://testnet.hsk.xyz"</span>
});

<span class="text-gray-500">// Compile a smart contract into a protocol graph</span>
<span class="text-purple-400">const</span> graph = <span class="text-purple-400">await</span> client.<span class="text-blue-300">getProtocolGraph</span>(<span class="text-green-300">"0x4200000000000000000000000000000000000015"</span>);

<span class="text-blue-300">console</span>.<span class="text-blue-300">log</span>(graph.semantic.intent); 
<span class="text-gray-500">// Output: "Stores L1 block attributes for HashKey Chain bridging."</span>
</pre>
</div>
`;
fs.writeFileSync('sdk.html', createPage('SDK Implementation', sdkContent));

