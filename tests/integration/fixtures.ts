/**
 * Integration test fixtures for the 7 contract types specified in GEMINI.md ADR-010.
 *
 * Each fixture provides:
 *   - abi: realistic ABI array with type, name, inputs, outputs, stateMutability
 *   - source: optional Solidity source code string for source-based extraction
 *
 * Contract types: ERC20, ERC721, Ownable, AccessControl, Proxy, LendingVault, Oracle
 */

import type { CompilerInput } from "../../src/engine/compiler/interfaces";

// ---------------------------------------------------------------------------
// 1. ERC20 — Standard token
// ---------------------------------------------------------------------------

export const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "value", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "spender", type: "address", indexed: true, internalType: "address" },
      { name: "value", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
];

export const ERC20_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
`;

// ---------------------------------------------------------------------------
// 2. ERC721 — Standard NFT
// ---------------------------------------------------------------------------

export const ERC721_ABI = [
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "approved", type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "operator", type: "address", indexed: true, internalType: "address" },
      { name: "approved", type: "bool", indexed: false, internalType: "bool" },
    ],
  },
];

export const ERC721_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _nextTokenId;
    constructor() ERC721("MyNFT", "MNFT") {}
    function mint(address to) public {
        _nextTokenId++;
        _safeMint(to, _nextTokenId);
    }
}
`;

// ---------------------------------------------------------------------------
// 3. Ownable — Ownership pattern
// ---------------------------------------------------------------------------

export const OWNABLE_ABI = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "transferOwnership",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "renounceOwnership",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" },
    ],
  },
];

export const OWNABLE_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyOwnable is Ownable {
    constructor() Ownable(msg.sender) {}
}
`;

// ---------------------------------------------------------------------------
// 4. AccessControl — Role-based access
// ---------------------------------------------------------------------------

export const ACCESS_CONTROL_ABI = [
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "grantRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getRoleAdmin",
    stateMutability: "view",
    inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
  },
  {
    type: "function",
    name: "MINTER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
  },
  {
    type: "event",
    name: "RoleGranted",
    inputs: [
      { name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "sender", type: "address", indexed: true, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "RoleRevoked",
    inputs: [
      { name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "sender", type: "address", indexed: true, internalType: "address" },
    ],
  },
];

export const ACCESS_CONTROL_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyAccessControl is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
`;

// ---------------------------------------------------------------------------
// 5. Proxy — Upgradeable proxy pattern
// ---------------------------------------------------------------------------

export const PROXY_ABI = [
  {
    type: "function",
    name: "upgradeTo",
    stateMutability: "nonpayable",
    inputs: [{ name: "newImplementation", type: "address", internalType: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "implementation",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "admin",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      { name: "implementation", type: "address", indexed: true, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "AdminChanged",
    inputs: [
      { name: "previousAdmin", type: "address", indexed: false, internalType: "address" },
      { name: "newAdmin", type: "address", indexed: false, internalType: "address" },
    ],
  },
];

export const PROXY_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract MyProxy is TransparentUpgradeableProxy {
    constructor(address _logic, address admin_, bytes memory _data)
        TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
`;

// ---------------------------------------------------------------------------
// 6. Lending Vault — DeFi vault with dependencies
// ---------------------------------------------------------------------------

export const LENDING_VAULT_ABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address", internalType: "contract IERC20" },
      { name: "oracle", type: "address", internalType: "contract IPriceOracle" },
    ],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "borrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "liquidate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "borrower", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "MINTER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
  },
  {
    type: "function",
    name: "setInterestRate",
    stateMutability: "nonpayable",
    inputs: [{ name: "rate", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Liquidation",
    inputs: [
      { name: "borrower", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
];

export const LENDING_VAULT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPriceOracle {
    function latestPrice() external view returns (uint256);
}

contract LendingVault is AccessControl {
    IERC20 public token;
    IPriceOracle public oracle;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(IERC20 _token, IPriceOracle _oracle) {
        token = _token;
        oracle = _oracle;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function deposit(uint256 amount) external {}
    function withdraw(uint256 amount) external {}
    function borrow(uint256 amount) external {}
    function liquidate(address borrower, uint256 amount) external {}
    function setInterestRate(uint256 rate) external {}
    function pause() external {}
}
`;

// ---------------------------------------------------------------------------
// 7. Oracle — Price oracle
// ---------------------------------------------------------------------------

export const ORACLE_ABI = [
  {
    type: "function",
    name: "latestPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "updatePrice",
    stateMutability: "nonpayable",
    inputs: [{ name: "price", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setHeartbeat",
    stateMutability: "nonpayable",
    inputs: [{ name: "interval", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
  },
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "HeartbeatChanged",
    inputs: [
      { name: "oldInterval", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newInterval", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
];

export const ORACLE_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracle is Ownable {
    uint256 public latestPrice;
    uint256 public heartbeat;

    constructor() Ownable(msg.sender) {}
    function updatePrice(uint256 price) external onlyOwner { latestPrice = price; }
    function setHeartbeat(uint256 interval) external onlyOwner { heartbeat = interval; }
}
`;

// ---------------------------------------------------------------------------
// Helper: build CompilerInput from a fixture
// ---------------------------------------------------------------------------

export interface FixtureContract {
  name: string;
  abi: any[];
  source: string | null;
  isProxy: boolean;
  implementation: string | null;
}

export const FIXTURES: FixtureContract[] = [
  { name: "ERC20",          abi: ERC20_ABI,           source: ERC20_SOURCE,          isProxy: false, implementation: null },
  { name: "ERC721",         abi: ERC721_ABI,          source: ERC721_SOURCE,         isProxy: false, implementation: null },
  { name: "Ownable",        abi: OWNABLE_ABI,         source: OWNABLE_SOURCE,        isProxy: false, implementation: null },
  { name: "AccessControl",  abi: ACCESS_CONTROL_ABI,  source: ACCESS_CONTROL_SOURCE, isProxy: false, implementation: null },
  { name: "Proxy",          abi: PROXY_ABI,           source: PROXY_SOURCE,          isProxy: true,  implementation: "0x1234567890abcdef1234567890abcdef12345678" },
  { name: "LendingVault",   abi: LENDING_VAULT_ABI,   source: LENDING_VAULT_SOURCE,  isProxy: false, implementation: null },
  { name: "Oracle",         abi: ORACLE_ABI,          source: ORACLE_SOURCE,         isProxy: false, implementation: null },
];

/**
 * Build a CompilerInput from a FixtureContract.
 * Uses a fresh visited-set per call to avoid cross-test contamination.
 */
export function buildInput(fixture: FixtureContract, overrides?: Partial<CompilerInput>): CompilerInput {
  return {
    address: `0x${fixture.name.toLowerCase().padStart(40, "0")}`,
    abi: fixture.abi,
    source: fixture.source,
    isProxy: fixture.isProxy,
    implementation: fixture.implementation,
    metadata: {
      protocolName: fixture.name,
      compilerVersion: "0.8.20",
    },
    depth: 0,
    maxDepth: 5,
    visited: new Set<string>(),
    ...overrides,
  };
}
