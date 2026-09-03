import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.create("hardhat");

describe("VerRegistry", function () {
  it("authorizes, revokes, and blocks a revoked attester", async function () {
    const [owner, attester, protocol] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("VerRegistry")).deploy();
    await registry.authorizeAttester(attester.address);
    expect(await registry.authorizedAttesters(attester.address)).to.equal(true);
    await registry.revokeAttester(attester.address);
    expect(await registry.authorizedAttesters(attester.address)).to.equal(false);
    await expect(registry.connect(attester).getFunction("attest")(protocol.address, ethers.id("graph"), "ipfs://graph"))
      .to.be.revertedWithCustomError(registry, "NotAuthorized");
  });

  it("attests and verifies a graph hash", async function () {
    const [, protocol] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("VerRegistry")).deploy();
    const hash = ethers.id("graph");
    await registry.attest(protocol.address, hash, "ipfs://graph");
    expect(await registry.verifyHash(protocol.address, hash)).to.equal(true);
    expect(await registry.totalProtocols()).to.equal(1n);
  });

  it("restricts attester administration to the owner", async function () {
    const [, other] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("VerRegistry")).deploy();
    await expect(registry.connect(other).getFunction("authorizeAttester")(other.address)).to.be.revertedWithCustomError(registry, "NotOwner");
    await expect(registry.authorizeAttester(ethers.ZeroAddress)).to.be.revertedWith("Zero address");
  });
});
