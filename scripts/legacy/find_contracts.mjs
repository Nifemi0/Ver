// Find real smart contracts on HashKey Chain
async function findContracts() {
  const allContracts = [];

  // Get verified contracts
  try {
    const res = await fetch("https://hashkey.blockscout.com/api/v2/smart-contracts?limit=50");
    const data = await res.json();
    if (data.items) {
      for (const c of data.items) {
        const addr = c.address?.hash || c.address;
        if (addr) allContracts.push({ address: addr, name: c.name || "Unknown", source: "verified" });
      }
    }
  } catch (e) {}

  // Get tokens
  try {
    const res = await fetch("https://hashkey.blockscout.com/api/v2/tokens?limit=20&type=ERC-20");
    const data = await res.json();
    if (data.items) {
      for (const t of data.items) {
        const addr = t.address_hash || t.address?.hash || t.address;
        if (addr) allContracts.push({ address: addr, name: `${t.name} (${t.symbol})`, source: "token" });
      }
    }
  } catch (e) {}

  // Get recent transactions to find contract addresses
  try {
    const res = await fetch("https://hashkey.blockscout.com/api/v2/transactions?limit=50");
    const data = await res.json();
    if (data.items) {
      for (const tx of data.items) {
        if (tx.to?.is_contract && tx.to?.hash) {
          allContracts.push({ address: tx.to.hash, name: tx.to.name || tx.to.implementation_name || "Unknown", source: "tx_target" });
        }
      }
    }
  } catch (e) {}

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const c of allContracts) {
    const key = c.address.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  console.log(`Found ${unique.length} unique contract addresses on HashKey Chain:\n`);
  
  for (let i = 0; i < Math.min(unique.length, 25); i++) {
    console.log(`${i + 1}. ${unique[i].address}`);
    console.log(`   Name: ${unique[i].name} | Source: ${unique[i].source}`);
    console.log("");
  }

  // Print just the addresses for easy copy
  console.log("\n=== Copy-paste list ===\n");
  for (let i = 0; i < Math.min(unique.length, 25); i++) {
    console.log(unique[i].address);
  }
}

findContracts();
