import crypto from "crypto";
import { IExplorerRepository } from "./repository.interface";
import { ExplorerAPIError, ExplorerDataError } from "../errors";

type XLayerContractInfo = {
  contractAbi?: string;
  sourceCode?: string;
  implementation?: string;
  contractName?: string;
  compilerVersion?: string;
};

/** Official OKX X Layer verified-contract API adapter. */
export class XLayerExplorerRepository implements IExplorerRepository {
  private cache = new Map<string, XLayerContractInfo>();
  private endpoint = "https://web3.okx.com/api/v5/xlayer/contract/verify-contract-info";

  private async fetchInfo(address: string): Promise<XLayerContractInfo> {
    const key = address.toLowerCase();
    const cached = this.cache.get(key);
    if (cached) return cached;

    const accessKey = process.env.OKX_ACCESS_KEY;
    const secretKey = process.env.OKX_SECRET_KEY;
    const passphrase = process.env.OKX_PASSPHRASE;
    if (!accessKey || !secretKey || !passphrase) {
      throw new ExplorerAPIError("X Layer verified-contract access requires OKX_ACCESS_KEY, OKX_SECRET_KEY, and OKX_PASSPHRASE");
    }

    const query = `?chainShortName=XLAYER&contractAddress=${address}`;
    const requestPath = `/api/v5/xlayer/contract/verify-contract-info${query}`;
    const timestamp = new Date().toISOString();
    const signature = crypto.createHmac("sha256", secretKey).update(`${timestamp}GET${requestPath}`).digest("base64");
    const response = await fetch(`${this.endpoint}${query}`, {
      headers: {
        "OK-ACCESS-KEY": accessKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });
    if (!response.ok) throw new ExplorerAPIError(`X Layer explorer HTTP ${response.status}`, response.status);
    const payload: any = await response.json();
    if (payload.code !== "0" || !Array.isArray(payload.data) || !payload.data[0]) {
      throw new ExplorerDataError(payload.msg || "Invalid X Layer explorer response");
    }
    const info = payload.data[0] as XLayerContractInfo;
    this.cache.set(key, info);
    return info;
  }

  async fetchContractAbi(address: string) { return (await this.fetchInfo(address)).contractAbi ?? null; }
  async fetchContractSource(address: string) { return (await this.fetchInfo(address)).sourceCode ?? null; }
  async resolveProxyImplementation(address: string) { return (await this.fetchInfo(address)).implementation || null; }
  async fetchContractName(address: string) { return (await this.fetchInfo(address)).contractName ?? null; }
  async fetchCompilerVersion(address: string) { return (await this.fetchInfo(address)).compilerVersion ?? null; }
}
