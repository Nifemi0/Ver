/**
 * Submit VerRegistry source for verification on Blockscout.
 * Uses Hardhat standard-json input (optimizer 200, evm paris, solc 0.8.20).
 * Usage: npx tsx scripts/verify_registry.ts
 */
import fs from "fs";
import path from "path";

const ADDRESS = "0x3776Cc9AEe3AFb005F9465e6B78079FCf4d16DA6";
const API = "https://xlayer.blockscout.com/api";
const BUILD_INFO = path.join(
  __dirname,
  "../contracts/artifacts/build-info"
);
const SOURCE_PATH = path.join(
  __dirname,
  "../contracts/contracts/VerRegistry.sol"
);

async function alreadyVerified(): Promise<boolean> {
  const url = `${API}?module=contract&action=getsourcecode&address=${ADDRESS}`;
  const res = await fetch(url);
  const data = await res.json();
  const r = Array.isArray(data.result) ? data.result[0] : data.result;
  return Boolean(r?.SourceCode);
}

function loadStandardInput(): string {
  // Prefer Hardhat build-info (exact compiler settings)
  if (fs.existsSync(BUILD_INFO)) {
    const files = fs.readdirSync(BUILD_INFO).filter((f) => f.endsWith(".json"));
    if (files[0]) {
      const info = JSON.parse(
        fs.readFileSync(path.join(BUILD_INFO, files[0]), "utf8")
      );
      const input = info.input || {};
      input.settings = {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: "paris",
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
          },
        },
      };
      return JSON.stringify(input);
    }
  }
  // Fallback single-file wrapper
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  return JSON.stringify({
    language: "Solidity",
    sources: { "contracts/VerRegistry.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"] },
      },
    },
  });
}

async function verify() {
  if (await alreadyVerified()) {
    console.log("Already verified on Blockscout.");
    return;
  }

  const sourceCode = loadStandardInput();
  const body = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
    contractaddress: ADDRESS,
    sourceCode,
    codeformat: "solidity-standard-json-input",
    contractname: "contracts/VerRegistry.sol:VerRegistry",
    compilerversion: "v0.8.20+commit.a1b79de6",
    licenseType: "3", // MIT
  });

  console.log("Submitting standard-json verification…");
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  console.log("response:", data);

  if (data.status !== "1") {
    console.error("Verification submit failed. Manual URL:");
    console.error(
      `https://xlayer.blockscout.com/address/${ADDRESS}/contract-verification`
    );
    process.exitCode = 1;
    return;
  }

  const guid = data.result;
  console.log("guid:", guid);
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const checkUrl = `${API}?module=contract&action=checkverifystatus&guid=${guid}`;
    const check = await (await fetch(checkUrl)).json();
    console.log("status poll:", check);
    if (String(check.result || "").toLowerCase().includes("pass")) {
      console.log("✅ Verified");
      return;
    }
    if (String(check.result || "").toLowerCase().includes("fail")) {
      console.error("Verification failed:", check);
      process.exitCode = 1;
      return;
    }
  }
  console.log("Still pending — check explorer manually.");
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});