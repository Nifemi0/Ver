import { createPublicClient, http, Address } from 'viem';

const XLAYER_MAINNET = {
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [process.env.XLAYER_RPC_URL ?? process.env.RPC_URL ?? "https://rpc.xlayer.tech"] } },
} as const;

export class BytecodeDecompiler {
    private client = createPublicClient({ chain: XLAYER_MAINNET, transport: http() });

    public async generatePseudoAbi(address: string): Promise<string | null> {
        const bytecode = await this.client.getBytecode({ address: address as Address });
        if (!bytecode || bytecode === "0x") return null;

        // Extract PUSH4 [selector] EQ pattern (63 [4 bytes] 14)
        const selectorRegex = /63([a-fA-F0-9]{8})14/g;
        const selectors = new Set<string>();
        
        let match: RegExpExecArray | null;
        while ((match = selectorRegex.exec(bytecode)) !== null) {
            if (match[1]) selectors.add(match[1]);
        }

        if (selectors.size === 0) return null;

        const abiItems: any[] = [];
        
        // Batch requests to 4byte.directory can be slow, but for MVP we will do simple individual fetches
        // Since we want this to be fast, we'll map them all in parallel with a timeout
        const fetchSignature = async (hex: string) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=0x${hex}`, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data.count > 0) {
                    // Just take the oldest/shortest text signature as best guess
                    return data.results[data.results.length - 1].text_signature;
                }
            } catch (e) {
                // Ignore timeout
            }
            return `unknown_${hex}()`;
        };

        const signatures = await Promise.all(Array.from(selectors).map(fetchSignature));
        
        for (const sig of signatures) {
            // Parse sig like 'transfer(address,uint256)'
            const nameMatch = sig.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
            if (nameMatch) {
                const name = nameMatch[1];
                const args = nameMatch[2] ? nameMatch[2].split(',') : [];
                abiItems.push({
                    type: "function",
                    name: name,
                    inputs: args.map((t: string, i: number) => ({ type: t, name: `arg${i}` })),
                    outputs: [],
                    stateMutability: "nonpayable"
                });
            } else {
                abiItems.push({
                    type: "function",
                    name: sig.replace('()', ''),
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable"
                });
            }
        }

        return JSON.stringify(abiItems);
    }
}
