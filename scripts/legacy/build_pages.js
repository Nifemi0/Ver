const fs = require('fs');

const baseHtml = fs.readFileSync('explorer.html', 'utf8');

const headMatch = baseHtml.match(/([\s\S]*?)<!-- Top Navigation -->/);
const navMatch = baseHtml.match(/(<!-- Top Navigation -->[\s\S]*?<\/nav>)/);
const footerMatch = baseHtml.match(/(<footer[\s\S]*?<\/footer>)/);
const scriptMatch = baseHtml.match(/(<script>\s*\/\/\s*Navbar Scroll Effect[\s\S]*?<\/script>)/);

const head = headMatch ? headMatch[1] : '';
const nav = navMatch ? navMatch[1] : '';
const footer = footerMatch ? footerMatch[1] : '';
const scrollScript = scriptMatch ? scriptMatch[1] : '';

function wrapPage(content) {
    return head + nav + content + footer + scrollScript + '\n</body>\n</html>';
}

// -------------------------------------------------------------
// 1. SCHEMA INSPECTOR
// -------------------------------------------------------------
const schemaContent = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-10 flex justify-between items-end">
        <div>
            <h1 class="text-4xl font-serif text-gray-900 mb-4">Schema Inspector</h1>
            <p class="text-gray-500">Interactive exploration of the deterministic Protocol Graph.</p>
        </div>
        <div class="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
            <button id="btnPretty" class="px-4 py-2 bg-white shadow-sm rounded-md text-gray-900 transition-all">Pretty View</button>
            <button id="btnJson" class="px-4 py-2 text-gray-500 hover:text-gray-900 transition-all">JSON View</button>
        </div>
    </div>

    <!-- Pretty View -->
    <div id="prettyView" class="space-y-6 block">
        <!-- Metadata -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group cursor-pointer hover:border-gray-300 transition-all">
            <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <span class="material-symbols-outlined text-gray-400">data_object</span>
                <h2 class="text-lg font-bold text-gray-900">Metadata</h2>
            </div>
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">protocol_name</div>
                    <div class="font-mono text-sm text-blue-600">Lending Vault</div>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">compiler_version</div>
                    <div class="font-mono text-sm text-gray-900">1.0.0</div>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">integrity_score</div>
                    <div class="font-mono text-sm text-green-600">96%</div>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">cache</div>
                    <div class="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">HIT</div>
                </div>
            </div>
        </div>

        <!-- Structural -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group cursor-pointer hover:border-gray-300 transition-all">
            <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <span class="material-symbols-outlined text-gray-400">account_tree</span>
                <h2 class="text-lg font-bold text-gray-900">Structural</h2>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-3 border-b border-gray-100 pb-2">Roles</div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="font-mono text-sm text-gray-700">Owner</span></div>
                        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange-500"></span><span class="font-mono text-sm text-gray-700">Guardian</span></div>
                        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500"></span><span class="font-mono text-sm text-gray-700">Operator</span></div>
                    </div>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-3 border-b border-gray-100 pb-2">Dependencies</div>
                    <div class="space-y-2">
                        <div class="font-mono text-sm text-gray-700 hover:text-blue-600">→ Oracle</div>
                        <div class="font-mono text-sm text-gray-700 hover:text-blue-600">→ Treasury</div>
                        <div class="font-mono text-sm text-gray-700 hover:text-blue-600">→ USDC</div>
                    </div>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-3 border-b border-gray-100 pb-2">Events</div>
                    <div class="space-y-2">
                        <div class="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">Deposit</div>
                        <div class="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">Withdraw</div>
                        <div class="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">Liquidate</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Semantic -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group cursor-pointer hover:border-gray-300 transition-all">
            <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <span class="material-symbols-outlined text-gray-400">psychology</span>
                <h2 class="text-lg font-bold text-gray-900">Semantic</h2>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2">
                    <div class="text-xs font-bold text-gray-400 uppercase mb-2">Intent</div>
                    <p class="text-gray-900 leading-relaxed text-lg">Accepts collateral deposits in USDC and allows users to borrow against it based on the Oracle price feed.</p>
                </div>
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-2">Confidence</div>
                    <div class="text-3xl font-bold text-green-600 mb-4">96%</div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-2">Derived From</div>
                    <div class="flex flex-wrap gap-2">
                        <span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">deposit()</span>
                        <span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">withdraw()</span>
                        <span class="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">Deposit Event</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- JSON View -->
    <div id="jsonView" class="hidden">
        <div class="bg-[#0A0A0A] rounded-2xl p-6 shadow-xl border border-gray-800">
<pre class="text-sm font-mono text-gray-300 overflow-x-auto">
{
  <span class="text-blue-300">"metadata"</span>: {
    <span class="text-blue-300">"protocol_name"</span>: <span class="text-green-300">"Lending Vault"</span>,
    <span class="text-blue-300">"compiler_version"</span>: <span class="text-green-300">"1.0.0"</span>,
    <span class="text-blue-300">"integrity_score"</span>: <span class="text-yellow-300">96</span>,
    <span class="text-blue-300">"cache"</span>: <span class="text-green-300">"HIT"</span>
  },
  <span class="text-blue-300">"structural"</span>: {
    <span class="text-blue-300">"roles"</span>: [<span class="text-green-300">"Owner"</span>, <span class="text-green-300">"Guardian"</span>, <span class="text-green-300">"Operator"</span>],
    <span class="text-blue-300">"dependencies"</span>: [<span class="text-green-300">"Oracle"</span>, <span class="text-green-300">"Treasury"</span>, <span class="text-green-300">"USDC"</span>],
    <span class="text-blue-300">"events"</span>: [<span class="text-green-300">"Deposit"</span>, <span class="text-green-300">"Withdraw"</span>, <span class="text-green-300">"Liquidate"</span>]
  },
  <span class="text-blue-300">"semantic"</span>: {
    <span class="text-blue-300">"intent"</span>: <span class="text-green-300">"Accepts collateral deposits in USDC..."</span>,
    <span class="text-blue-300">"confidence"</span>: <span class="text-yellow-300">96</span>,
    <span class="text-blue-300">"derived_from"</span>: [<span class="text-green-300">"deposit()"</span>, <span class="text-green-300">"withdraw()"</span>, <span class="text-green-300">"Deposit Event"</span>]
  }
}
</pre>
        </div>
    </div>
</main>
<script>
    const btnPretty = document.getElementById('btnPretty');
    const btnJson = document.getElementById('btnJson');
    const prettyView = document.getElementById('prettyView');
    const jsonView = document.getElementById('jsonView');

    btnPretty.addEventListener('click', () => {
        prettyView.classList.remove('hidden');
        jsonView.classList.add('hidden');
        btnPretty.className = 'px-4 py-2 bg-white shadow-sm rounded-md text-gray-900 transition-all';
        btnJson.className = 'px-4 py-2 text-gray-500 hover:text-gray-900 transition-all';
    });

    btnJson.addEventListener('click', () => {
        jsonView.classList.remove('hidden');
        prettyView.classList.add('hidden');
        btnJson.className = 'px-4 py-2 bg-white shadow-sm rounded-md text-gray-900 transition-all';
        btnPretty.className = 'px-4 py-2 text-gray-500 hover:text-gray-900 transition-all';
    });
</script>
`;
fs.writeFileSync('schema.html', wrapPage(schemaContent));


// -------------------------------------------------------------
// 2. SDK PLAYGROUND
// -------------------------------------------------------------
const sdkContent = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-16 text-center">
        <h1 class="text-5xl font-serif text-gray-900 mb-6">Build with HashGraph</h1>
        <p class="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">Integrate deterministic blockchain intelligence into your app in under five minutes.</p>
        
        <div class="inline-flex items-center gap-4 bg-gray-900 text-white p-2 pl-6 pr-2 rounded-full shadow-lg">
            <span class="font-mono text-sm text-green-400">npm install @hashgraph/sdk</span>
            <button class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center">
                <span class="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
        </div>
    </div>

    <div class="space-y-12">
        <!-- Example 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div class="bg-[#0A0A0A] rounded-2xl p-6 shadow-xl relative border border-gray-800">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button class="text-xs font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors run-demo" data-target="out1">
                        <span class="material-symbols-outlined text-[14px]">play_arrow</span> Run
                    </button>
                </div>
<pre class="text-sm font-mono text-gray-300 mt-6 overflow-x-auto">
<span class="text-purple-400">const</span> graph = <span class="text-purple-400">await</span> client.<span class="text-blue-300">getProtocolGraph</span>(
  <span class="text-green-300">"0x420...015"</span>
);
<span class="text-blue-300">console</span>.log(graph.semantic.intent);
</pre>
            </div>
            <div id="out1" class="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 min-h-[140px] flex flex-col justify-center font-mono text-sm text-gray-500 opacity-50 transition-opacity">
                Awaiting execution...
            </div>
        </div>

        <!-- Example 2 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div class="bg-[#0A0A0A] rounded-2xl p-6 shadow-xl relative border border-gray-800">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button class="text-xs font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors run-demo" data-target="out2">
                        <span class="material-symbols-outlined text-[14px]">play_arrow</span> Run
                    </button>
                </div>
<pre class="text-sm font-mono text-gray-300 mt-6 overflow-x-auto">
<span class="text-purple-400">const</span> summary = <span class="text-purple-400">await</span> client.<span class="text-blue-300">getContractSummary</span>(
  <span class="text-green-300">"0x420...015"</span>
);
</pre>
            </div>
            <div id="out2" class="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 min-h-[140px] flex flex-col justify-center font-mono text-sm text-gray-500 opacity-50 transition-opacity">
                Awaiting execution...
            </div>
        </div>

        <!-- Example 3 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div class="bg-[#0A0A0A] rounded-2xl p-6 shadow-xl relative border border-gray-800">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button class="text-xs font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors run-demo" data-target="out3">
                        <span class="material-symbols-outlined text-[14px]">play_arrow</span> Run
                    </button>
                </div>
<pre class="text-sm font-mono text-gray-300 mt-6 overflow-x-auto">
<span class="text-purple-400">await</span> client.<span class="text-blue-300">searchProtocol</span>(
  address,
  <span class="text-green-300">"Can anyone pause this protocol?"</span>
);
</pre>
            </div>
            <div id="out3" class="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 min-h-[140px] flex flex-col justify-center font-mono text-sm text-gray-500 opacity-50 transition-opacity">
                Awaiting execution...
            </div>
        </div>
    </div>
</main>
<script>
    const outputs = {
        out1: \`> "Stores L1 block attributes for HashKey Chain bridging."\`,
        out2: \`{\\n  "protocol_name": "L1Block",\\n  "structural_integrity": 96,\\n  "roles": ["Owner"],\\n  "privileged_functions": ["setL1BlockValues"]\\n}\`,
        out3: \`> Found 1 result:\\n> [Function] pause() - Requires OWNER_ROLE.\\n> Confidence: 100% (Verified via ABI)\`
    };

    document.querySelectorAll('.run-demo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            const outDiv = document.getElementById(targetId);
            const originalHtml = e.currentTarget.innerHTML;
            
            e.currentTarget.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>';
            outDiv.innerHTML = 'Running...';
            
            setTimeout(() => {
                outDiv.innerHTML = '<pre class="text-gray-800 whitespace-pre-wrap">' + outputs[targetId] + '</pre>';
                outDiv.classList.remove('opacity-50');
                outDiv.classList.add('bg-white', 'border-gray-300', 'shadow-md');
                outDiv.classList.remove('bg-gray-50', 'border-gray-200', 'shadow-sm');
                e.currentTarget.innerHTML = originalHtml;
            }, 800);
        });
    });
</script>
`;
fs.writeFileSync('sdk.html', wrapPage(sdkContent));


// -------------------------------------------------------------
// 3. MCP INTEGRATION (Claude Desktop Clone)
// -------------------------------------------------------------
const mcpContent = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-10 text-center">
        <h1 class="text-4xl font-serif text-gray-900 mb-4">Model Context Protocol</h1>
        <p class="text-gray-500 max-w-2xl mx-auto">Expose the deterministic protocol graph directly to Claude, Cursor, and other AI agents.</p>
    </div>

    <div class="flex flex-col md:flex-row bg-[#FAF9F7] rounded-xl overflow-hidden border border-[#E5E1D8] shadow-2xl max-w-4xl mx-auto min-h-[600px] font-sans">
        
        <!-- Sidebar -->
        <div class="w-full md:w-64 bg-[#F2F0E9] border-r border-[#E5E1D8] p-4 flex flex-col">
            <div class="flex items-center gap-2 mb-8">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div class="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            
            <div class="text-xs font-bold text-[#8C877D] uppercase tracking-wider mb-3">MCP Servers</div>
            <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-[#E5E1D8] mb-6">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <span class="text-sm font-medium text-[#4A463F]">HashGraph</span>
            </div>

            <div class="text-xs font-bold text-[#8C877D] uppercase tracking-wider mb-3">Available Tools</div>
            <div class="space-y-1">
                <div class="flex items-center gap-2 text-sm text-[#6B665E]"><span class="material-symbols-outlined text-[14px]">build</span> get_protocol_graph</div>
                <div class="flex items-center gap-2 text-sm text-[#6B665E]"><span class="material-symbols-outlined text-[14px]">build</span> explain_transaction</div>
                <div class="flex items-center gap-2 text-sm text-[#6B665E]"><span class="material-symbols-outlined text-[14px]">build</span> search_protocol</div>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 flex flex-col bg-white">
            <div class="flex-1 p-6 space-y-6 overflow-y-auto">
                <!-- User Msg -->
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-sm">U</div>
                    <div class="flex-1 pt-1">
                        <div class="text-[15px] text-[#222]">Can anyone mint tokens on this Lending Vault contract? (0xVault...)</div>
                    </div>
                </div>

                <!-- Tool Call -->
                <div class="flex gap-4 ml-12">
                    <div class="bg-[#F2F0E9] border border-[#E5E1D8] rounded-lg p-3 text-sm flex flex-col gap-2 w-full">
                        <div class="flex items-center gap-2 text-[#6B665E] font-medium">
                            <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                            Using HashGraph.get_protocol_graph
                        </div>
                        <div class="font-mono text-xs text-[#8C877D] bg-white p-2 rounded border border-[#E5E1D8]">
                            {"address": "0xVault..."}
                        </div>
                    </div>
                </div>

                <!-- Claude Msg -->
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-lg bg-[#D97757] flex items-center justify-center font-serif italic text-white text-sm">C</div>
                    <div class="flex-1 pt-1">
                        <div class="text-[15px] text-[#222] leading-relaxed">
                            According to the HashGraph compiler, the answer is <strong>No</strong>.<br><br>
                            The structural graph reveals that the <code class="bg-gray-100 px-1 rounded text-sm text-red-600">mint()</code> function requires the <code class="bg-gray-100 px-1 rounded text-sm font-mono">MINTER_ROLE</code>.<br><br>
                            Looking at the dependency graph, only the <strong>Operator Contract</strong> (0xOper...) currently holds this role. Regular users can only interact via the <code class="bg-gray-100 px-1 rounded text-sm font-mono">deposit()</code> function.
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Chat Input -->
            <div class="p-4 border-t border-[#E5E1D8]">
                <div class="bg-white border border-[#E5E1D8] shadow-sm rounded-xl px-4 py-3 text-gray-400 text-sm flex justify-between items-center">
                    Ask Claude...
                    <span class="material-symbols-outlined">arrow_upward</span>
                </div>
            </div>
        </div>
    </div>
</main>
`;
fs.writeFileSync('mcp.html', wrapPage(mcpContent));


// -------------------------------------------------------------
// 4. BENCHMARKS
// -------------------------------------------------------------
const benchmarksContent = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-16 text-center">
        <h1 class="text-5xl font-serif text-gray-900 mb-6">Performance & Scale</h1>
        <p class="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">HashGraph runs entirely on deterministic pure functions. It is fast, highly cacheable, and incredibly accurate.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Stat Card 1 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Cold Compile</div>
            <div class="text-6xl font-bold text-gray-900 font-mono mb-1"><span class="counter" data-target="183">0</span><span class="text-2xl text-gray-400">ms</span></div>
            <p class="text-sm text-gray-500 mt-2">Time to fetch ABI, decompile proxy, and build structural graph.</p>
        </div>

        <!-- Stat Card 2 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Cache Hit</div>
            <div class="text-6xl font-bold text-blue-600 font-mono mb-1"><span class="counter" data-target="12">0</span><span class="text-2xl text-blue-400">ms</span></div>
            <p class="text-sm text-gray-500 mt-2">Time to retrieve full Protocol Graph via SQLite.</p>
        </div>

        <!-- Stat Card 3 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Integrity Score</div>
            <div class="text-6xl font-bold text-green-600 font-mono mb-1"><span class="counter" data-target="96">0</span><span class="text-2xl text-green-400">%</span></div>
            <p class="text-sm text-gray-500 mt-2">Average deterministic confidence across testnet contracts.</p>
        </div>

        <!-- Stat Card 4 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Functions</div>
            <div class="text-5xl font-bold text-gray-900 font-mono mb-1"><span class="counter" data-target="28">0</span></div>
        </div>

        <!-- Stat Card 5 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Events</div>
            <div class="text-5xl font-bold text-gray-900 font-mono mb-1"><span class="counter" data-target="17">0</span></div>
        </div>

        <!-- Stat Card 6 -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
            <div class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dependencies</div>
            <div class="text-5xl font-bold text-gray-900 font-mono mb-1"><span class="counter" data-target="6">0</span></div>
        </div>

    </div>
</main>
<script>
    // Animated Counters
    const counters = document.querySelectorAll('.counter');
    const speed = 200; 

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 15);
            } else {
                counter.innerText = target;
            }
        };

        // Trigger animation on load
        setTimeout(updateCount, 500);
    });
</script>
`;
fs.writeFileSync('benchmarks.html', wrapPage(benchmarksContent));

