// Quick script to check if addresses are contracts on HashKey Chain
const addresses = [
  "0xc17a8414ccb23fa80f4a3736dfa68bf1fde002d6",
  "0xd4580c2ded8f072940ae226245b4f88336be8441",
  "0x280c535c040e9d117282fb665e53ef06b9d0058d",
  "0xc7b078a9e3d5d0e7152abec5ac96676e9029f76e",
  "0xc02af6b96946b938c27bb3bdd8a3fe515984c373",
  "0x4012f923db15ca9959163ca66cdca7ea936af51a",
  "0x06d116f366ea95e949d9ff85756f170f6227d043",
  "0x3596136e21cd04b11d0dc80d512b4f5a910f468c",
  "0xa7fae0e99468829fe3147074fed688916e2adf6f",
  "0x3bad0ad5af9add5a7e0051525ef31e658d1a3a8b",
  "0xcd32e361b60d50dbca08a7feb22b9ab38fa73813",
  "0x8ba8c075473ffa726ec9e599f2cf99c41c9fd3ce",
  "0x71354fcfe29df492e1f44b2cd0eef87770204ba5",
  "0x8b1afaae19a942094725447a4369e9caee6bfcba",
  "0x2cd85cd48bfd8c046983c69e4d241433ad4c9568",
  "0xf3dca2d879c4db48731c32dc441a1c206face9f4",
  "0x82628ed2b5eec1d5a54b43939ac85c9431d47efd",
  "0xa7151f4fb2367686cb7c559c53f00700869ac006",
  "0xaebf68d85efb40d73ce6804704ccff5e9607693b",
  "0x0b59c658cdca920525ee80a5d3ed1fb5ff704267",
  "0x2518bc31e90332c0d947daa4e9c7dbc041a8f381",
  "0x75efd74982de5b92e4e19d410cf626f5c7755900",
  "0x5470d582f8e3eb37acf31e76f214655b78e096a4",
  "0x55c9e5ec02eb7a9ac9957903149717d34c2c5bc3",
  "0x1b52169464da21a63b6b1774a00962ef5d14166b",
  "0x342c2fe5bb5454d6842b62236264f82f3dc3c98c",
  "0xf673b32c0b699adcf1d72be3a368ab8ef6d99a10",
  "0xbec969cac3845d571462265d8c7a68a8d07ac24f",
  "0x9bcabca1fdbfdcb2896be21e481fd691a0555937",
  "0xa466e9b6ec171a604e7b58ac41e302550ba114aa",
  "0xbad5b7a7369e51b5afc707f0bc843152dbbf2ca3",
  "0x40d3ad169c14101193f9dc3fb01ce3afabb82c5a",
  "0x16f164db8abe02316f1205b082fc9fa155e95832",
  "0xb0b4edc52496dcc1750ed81180b4d3a4c607c486",
  "0x434049ef08d69434752548e5aed6e2b97ad8d248",
  "0x3998bb4b8b333b426f04665459e4b79bb1cabf5a",
  "0x5a0ef7f1d7724a2eab3688b9f0b518c6d48ffc72",
  "0xa593726777c87551d5534b875c27a2139efa42c7",
  "0xa9f93bce47b44fa5a008103dfa0bbe5d7c0ec785",
  "0x6368605d77a3471f627cf06f146aa09257af12e5",
  "0xa7e9c39c4bf6735d031aaf9d3999132449404a5a",
  "0x5b0296dd8cd17ecdd67741b484598ac979430ec8",
  "0xd5502f1799adda71951f8cdb74349fe4fa8a84c1",
  "0x08c2501237b40aa06055addc12c8590ce91b651f",
  "0xf6cc9b6633374486ecb5e01d0238c4d825ae0c37",
  "0xc4f9b0fb663f6068eb9d77594355d0cda33cd43f",
  "0x148f55c26f2da6de4d95ea7aece2a74bbd4324cb",
  "0xed53253d26ec2e49fa4b69b261202ebd048ac80b",
  "0xa877d14830ba39660fa2587006dc96aa5b2098e8",
];

const BASE_URL = "https://hashkey.blockscout.com/api/v2/addresses";

async function checkAddress(addr) {
  try {
    const res = await fetch(`${BASE_URL}/${addr}`);
    if (!res.ok) return { addr, status: "NOT_FOUND", name: "-" };
    const data = await res.json();
    return {
      addr,
      status: data.is_contract ? "CONTRACT" : "EOA",
      name: data.name || data.implementation_name || "-",
      verified: data.is_verified || false,
    };
  } catch (e) {
    return { addr, status: "ERROR", name: e.message };
  }
}

async function main() {
  console.log("Checking", addresses.length, "addresses on HashKey Chain...\n");

  let contracts = 0;
  let eoas = 0;
  let errors = 0;

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < addresses.length; i += 5) {
    const batch = addresses.slice(i, i + 5);
    const results = await Promise.all(batch.map(checkAddress));
    for (const r of results) {
      const icon = r.status === "CONTRACT" ? "✅" : r.status === "EOA" ? "👤" : "❌";
      const verified = r.verified ? " [VERIFIED]" : "";
      console.log(`${icon} ${r.addr} → ${r.status}${verified} ${r.name}`);
      if (r.status === "CONTRACT") contracts++;
      else if (r.status === "EOA") eoas++;
      else errors++;
    }
    // Small delay between batches
    if (i + 5 < addresses.length) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total:     ${addresses.length}`);
  console.log(`Contracts: ${contracts}`);
  console.log(`EOAs:      ${eoas}`);
  console.log(`Errors:    ${errors}`);
}

main();
