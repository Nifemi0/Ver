import { createPublicClient, http, Address, Hex } from 'viem';
import { getActiveChain } from '../chain/networks';

export class TransactionSimulator {
    private client;

    constructor(chain = getActiveChain()) {
        this.client = createPublicClient({ chain, transport: http() });
    }

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
