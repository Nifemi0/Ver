const fs = require('fs');

let html = fs.readFileSync('docs.html', 'utf8');
const mainRegex = /<main[\s\S]*?<\/main>/;

const newMain = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-16">
        <div class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Documentation</div>
        <h1 class="text-5xl font-serif text-gray-900 mb-6">How HashGraph Works</h1>
        <p class="text-xl text-gray-500 max-w-2xl leading-relaxed">
            HashGraph is the semantic layer for HashKey Chain. It compiles deterministic blockchain artifacts into an AI-readable Protocol Graph that IDEs, wallets, AI agents, and developer tools can consume natively.
        </p>
    </div>

    <div class="flex flex-col md:flex-row gap-12 relative">
        <!-- Sidebar Navigation -->
        <div class="hidden md:block w-64 shrink-0 border-r border-gray-100 pr-6 sticky top-24 self-start space-y-4">
            <a href="#mission" class="block text-sm font-medium text-gray-900">Mission & Principles</a>
            <a href="#architecture" class="block text-sm font-medium text-gray-500 hover:text-gray-900">Architecture</a>
            <a href="#compiler" class="block text-sm font-medium text-gray-500 hover:text-gray-900">Compiler Pipeline</a>
            <a href="#confidence" class="block text-sm font-medium text-gray-500 hover:text-gray-900">Confidence Engine</a>
            <a href="#mcp" class="block text-sm font-medium text-gray-500 hover:text-gray-900">MCP Integration</a>
        </div>

        <!-- Main Content -->
        <div class="flex-1 space-y-20">
            
            <!-- Section 1 -->
            <section id="mission">
                <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">Deterministic by design.<br>Explainable by AI.</h2>
                <p class="text-lg text-gray-600 mb-8 leading-relaxed">
                    HashGraph is not a wallet, a scanner, or an auditor. It is a semantic compiler. It translates raw bytecode and ABIs into highly structured knowledge that autonomous systems can actually understand.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div class="font-bold text-gray-900 mb-2">Deterministic First</div>
                        <div class="text-sm text-gray-600 leading-relaxed">AI augments, but never replaces deterministic facts extracted from the chain. The LLM is restricted exclusively to summarizing and explaining.</div>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div class="font-bold text-gray-900 mb-2">Read-Only Infrastructure</div>
                        <div class="text-sm text-gray-600 leading-relaxed">HashGraph never signs transactions or requests private keys. It is purely read-only intelligence.</div>
                    </div>
                </div>
            </section>

            <!-- Section 2 -->
            <section id="architecture">
                <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">Architecture</h2>
                <p class="text-lg text-gray-600 mb-8 leading-relaxed">
                    The entire pipeline is built on pure functions. No extractor performs network requests inside the compiler stage, ensuring highly predictable and cacheable outputs.
                </p>
                <div class="bg-[#0A0A0A] p-8 rounded-3xl shadow-xl border border-gray-800">
                    <div class="flex flex-col gap-3 font-mono text-sm text-gray-300">
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">1</span> Input Contract</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">2</span> Blockscout Fetcher</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">3</span> Data Normalizer (Diamond/Proxy Resolution)</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50 text-blue-400">4</span> Deterministic Compiler</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800/50 text-green-400">5</span> HashGraph Schema</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-800/50 text-purple-400">6</span> Semantic Enrichment (LLM)</div>
                        <div class="pl-4 text-gray-600">↓</div>
                        <div class="flex items-center gap-4"><span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400">7</span> MCP Server Interface</div>
                    </div>
                </div>
            </section>

            <!-- Section 3 -->
            <section id="compiler">
                <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">The Protocol Graph</h2>
                <p class="text-lg text-gray-600 mb-8 leading-relaxed">
                    The compiler isolates structural data from semantic data. Only structural data is deterministic, while semantic data acts as a human-readable overlay.
                </p>
                <div class="space-y-4">
                    <div class="border border-gray-200 rounded-xl p-6 bg-white">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-blue-500">account_tree</span>
                            <h3 class="font-bold text-gray-900">Structural Object (Deterministic)</h3>
                        </div>
                        <p class="text-gray-500 text-sm leading-relaxed">Contains roles, dependencies (target addresses/interfaces), events, and AST mappings. This data is guaranteed to be 100% mathematically accurate to the on-chain bytecode.</p>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl p-6 bg-white">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-purple-500">psychology</span>
                            <h3 class="font-bold text-gray-900">Semantic Object (AI Generated)</h3>
                        </div>
                        <p class="text-gray-500 text-sm leading-relaxed">Contains the underlying intent, the user goals, and security guardrails. This allows Cursor or Claude to understand <em>why</em> a contract exists, not just how to call it.</p>
                    </div>
                </div>
            </section>

            <!-- Section 4 -->
            <section id="confidence">
                <h2 class="text-3xl font-serif font-bold text-gray-900 mb-6">Confidence Rules</h2>
                <p class="text-lg text-gray-600 mb-6 leading-relaxed">
                    Explainability comes first. Every deterministic fact emitted by the compiler contains metadata allowing an engineer to independently verify how it was derived.
                </p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <h4 class="font-bold text-yellow-800 mb-2">Strict Rule: LLM Never Computes Confidence</h4>
                    <p class="text-sm text-yellow-700 leading-relaxed">Confidence scores are computed deterministically. The LLM is expressly forbidden from inventing or calculating confidence scores.</p>
                </div>
                <p class="text-gray-600 mb-4">Evidence vectors include:</p>
                <ul class="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Verified ABI and Verified Source presence.</li>
                    <li>ERC Standard detection (ERC20, ERC721, etc).</li>
                    <li>OpenZeppelin library detection (AccessControl, Ownable).</li>
                    <li>Constructor dependency resolution.</li>
                </ul>
            </section>
            
        </div>
    </div>
</main>
`;

html = html.replace(mainRegex, newMain);
fs.writeFileSync('docs.html', html);
