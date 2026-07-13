import { createPublicClient, http, Address, Hex } from 'viem';

// Demo contracts live on X Layer Mainnet (chain id 196).
// Prefer XLAYER_RPC_URL; fall back to public mainnet RPC.
const XLAYER_MAINNET = {
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: [process.env.XLAYER_RPC_URL ?? process.env.RPC_URL ?? "https://rpc.xlayer.tech"] } },
} as const;

export class TransactionSimulator {
    private client = createPublicClient({
        chain: XLAYER_MAINNET,
        transport: http()
    });

    public async simulate(to: string, data: string, from?: string, value?: string): Promise<any> {
        try {
            const result = await this.client.call({
                to: to as Address,
                data: data as Hex,
                account: from ? (from as Address) : undefined,
                value: value ? BigInt(value) : undefined
            });
            return {
                status: "success",
                returnData: result.data || "0x",
            };
        } catch (e: any) {
            return {
                status: "reverted",
                error: e.shortMessage || e.message
            };
        }
    }

    public async read(address: string, data: string): Promise<any> {
        try {
            const result = await this.client.call({
                to: address as Address,
                data: data as Hex
            });
            return {
                status: "success",
                returnData: result.data || "0x"
            };
        } catch (e: any) {
            return {
                status: "reverted",
                error: e.shortMessage || e.message
            };
        }
    }
}
