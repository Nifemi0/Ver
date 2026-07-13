import Bottleneck from "bottleneck";
import { z } from "zod";
import { IExplorerRepository } from "./repository.interface";
import { 
  ExplorerAPIError, 
  ExplorerDataError, 
  ExplorerRateLimitError, 
  ExplorerTimeoutError 
} from "../errors";

// Blockscout returns generic responses matching this shape
const BlockscoutResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  result: z.any()
});

const FALLBACKS: Record<string, { abi: string; source: string; name: string; compiler: string; implementation?: string }> = {
  // USDT
  "0x1e4a5963abfd975d8c9021ce480b42188849d41d": {
    name: "TetherToken",
    compiler: "v0.8.20+commit.a1b79de6",
    abi: `[
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
    ]`,
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract TetherToken {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8 public decimals = 6;
    uint256 public totalSupply = 1000000000 * 10**6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`
  },
  // USDC
  "0x74b7f16337b8972027f6196a17a631ac6de26d22": {
    name: "USDCCoin",
    compiler: "v0.8.20+commit.a1b79de6",
    abi: `[
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
    ]`,
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract USDCCoin {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply = 500000000 * 10**6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`
  },
  // WETH
  "0x5a77f1443d16ee5761d310e38b62f77f726bc71c": {
    name: "WrappedEther",
    compiler: "v0.8.20+commit.a1b79de6",
    abi: `[
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ]`,
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract WrappedEther {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    function withdraw(uint256 wad) public {
        require(balanceOf[msg.sender] >= wad, "Insufficient balance");
        balanceOf[msg.sender] -= wad;
        totalSupply -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`
  }
};

export class BlockscoutRepository implements IExplorerRepository {
  private baseUrl: string;
  private limiter: Bottleneck;

  constructor(baseUrl: string = "https://hsk.blockscout.com/api") {
    this.baseUrl = baseUrl;
    
    // Bottleneck handles concurrency and rate limiting
    // Setting to max 5 requests per second to avoid hitting 429 limits
    this.limiter = new Bottleneck({
      minTime: 200,
      maxConcurrent: 5
    });
  }

  /**
   * Internal method wrapping fetch with rate limiter and exponential backoff.
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.limiter.schedule(() => this.makeRequest(url));
      } catch (error) {
        // Only retry on rate limits or 5xx server errors
        if (error instanceof ExplorerRateLimitError || 
           (error instanceof ExplorerAPIError && error.statusCode && error.statusCode >= 500)) {
          if (i === retries - 1) throw error;
          const backoff = 1000 * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
          // Immediately throw on 400s or data errors
          throw error;
        }
      }
    }
  }

  private async makeRequest(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new ExplorerRateLimitError();
      }

      if (!response.ok) {
        throw new ExplorerAPIError(`HTTP Error: ${response.statusText}`, response.status);
      }

      const rawData = await response.json();
      
      // Strict Zod validation on the boundary
      const parsedData = BlockscoutResponseSchema.safeParse(rawData);
      if (!parsedData.success) {
        throw new ExplorerDataError("Invalid response schema from Blockscout");
      }

      return parsedData.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ExplorerTimeoutError();
      }
      throw error;
    }
  }

  public async fetchContractAbi(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (FALLBACKS[addr]) {
      return FALLBACKS[addr].abi;
    }

    try {
      const url = `${this.baseUrl}?module=contract&action=getabi&address=${address}`;
      const data = await this.fetchWithRetry(url);
      
      // Status "1" means success/verified. Status "0" usually means unverified.
      if (data.status === "1" && typeof data.result === "string") {
        return data.result;
      }
    } catch (e) {
      console.warn(`[Blockscout] Failed to fetch ABI for ${address}, trying local fallback...`);
    }

    // Local Fallbacks for demo contracts
    if (address.toLowerCase() === "0xb210d2120d57b758ee163cffb43e73728c471cf1".toLowerCase()) {
      return '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]';
    }
    if (address.toLowerCase() === "0x4200000000000000000000000000000000000015".toLowerCase()) {
      return '[{"inputs":[{"internalType":"address","name":"_admin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"payable","type":"receive"}]';
    }
    if (address.toLowerCase() === "0x4200000000000000000000000000000000000016".toLowerCase()) {
      return '[{"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]';
    }

    return null;
  }

  public async fetchContractSource(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (FALLBACKS[addr]) {
      return FALLBACKS[addr].source;
    }

    const url = `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}`;
    const data = await this.fetchWithRetry(url);
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      if (data.result[0].SourceCode) {
         return data.result[0].SourceCode;
      }
    }
    return null;
  }

  public async resolveProxyImplementation(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (FALLBACKS[addr]) {
      return FALLBACKS[addr].implementation || null;
    }

    const url = `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}`;
    const data = await this.fetchWithRetry(url);
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      const contract = data.result[0];
      const impl = contract.Implementation || contract.implementation;
      if (impl && 
          typeof impl === "string" && 
          impl.startsWith("0x") && 
          impl !== "0x0000000000000000000000000000000000000000") {
        return impl.trim();
      }
    }
    return null;
  }

  public async fetchContractName(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (FALLBACKS[addr]) {
      return FALLBACKS[addr].name;
    }

    try {
      const url = `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}`;
      const data = await this.fetchWithRetry(url);
      if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
        return data.result[0].ContractName || data.result[0].contractName || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async fetchCompilerVersion(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (FALLBACKS[addr]) {
      return FALLBACKS[addr].compiler;
    }

    try {
      const url = `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}`;
      const data = await this.fetchWithRetry(url);
      if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
        return data.result[0].CompilerVersion || data.result[0].compilerVersion || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }
}
