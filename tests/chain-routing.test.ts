import { describe, expect, it } from "vitest";
import { BOT_TESTNET, XLAYER_MAINNET, getChainById } from "../src/chain/networks";

describe("chain-scoped routing", () => {
  it("maps the supported wallet chain IDs to the correct networks", () => {
    expect(getChainById(196)).toBe(XLAYER_MAINNET);
    expect(getChainById(968)).toBe(BOT_TESTNET);
  });

  it("rejects unsupported chain IDs before creating a client", () => {
    expect(() => getChainById(1)).toThrow("Unsupported chainId '1'");
  });
});
