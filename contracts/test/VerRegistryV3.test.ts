import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create("hardhat");
describe("VerRegistryV3 candidate (simulated chain only)", function () {
  let registry: any, owner: any, attester: any, successor: any, protocol: any;
  const hash = ethers.id("graph");
  beforeEach(async function () {
    [owner, attester, successor, protocol] = await ethers.getSigners();
    registry = await ethers.deployContract("VerRegistryV3");
    await registry.waitForDeployment();
  });
  it("rejects a zero protocol", async function () {
    await expect(registry.attest(ethers.ZeroAddress, hash, "ipfs://graph")).to.be.revertedWithCustomError(registry, "ZeroAddress");
  });
  it("rejects a zero hash and empty metadata", async function () {
    await expect(registry.attest(protocol.address, ethers.ZeroHash, "ipfs://graph")).to.be.revertedWithCustomError(registry, "ZeroHash");
    await expect(registry.attest(protocol.address, hash, "")).to.be.revertedWithCustomError(registry, "EmptyURI");
  });
  it("rejects unauthorized writes and governance", async function () {
    await expect(registry.connect(attester).attest(protocol.address, hash, "ipfs://graph")).to.be.revertedWithCustomError(registry, "NotAuthorized");
    await expect(registry.connect(attester).authorizeAttester(attester.address)).to.be.revertedWithCustomError(registry, "NotOwner");
    await expect(registry.connect(attester).revokeAttester(owner.address)).to.be.revertedWithCustomError(registry, "NotOwner");
    await expect(registry.connect(attester).transferOwnership(attester.address)).to.be.revertedWithCustomError(registry, "NotOwner");
  });
  it("verifies exact hashes and does not duplicate protocol enumeration", async function () {
    expect(await registry.isVerified(protocol.address)).to.equal(false);
    await registry.attest(protocol.address, hash, "ipfs://graph");
    await registry.attest(protocol.address, hash, "ipfs://graph2");
    expect(await registry.verifyHash(protocol.address, hash)).to.equal(true);
    expect(await registry.verifyHash(protocol.address, ethers.id("wrong"))).to.equal(false);
    expect((await registry.getAttestation(protocol.address)).verified).to.equal(true);
    expect(await registry.totalProtocols()).to.equal(1n);
    expect(await registry.getAllProtocols()).to.deep.equal([protocol.address]);
  });
  it("invalidates existing attestations permanently when an attester is revoked", async function () {
    await registry.authorizeAttester(attester.address);
    await registry.connect(attester).attest(protocol.address, hash, "ipfs://graph");
    await registry.revokeAttester(attester.address);
    expect(await registry.verifyHash(protocol.address, hash)).to.equal(false);
    expect((await registry.getAttestation(protocol.address)).verified).to.equal(false);
    await registry.authorizeAttester(attester.address);
    expect(await registry.isVerified(protocol.address)).to.equal(false);
    await registry.connect(attester).attest(protocol.address, hash, "ipfs://fresh");
    expect(await registry.isVerified(protocol.address)).to.equal(true);
  });
  it("makes graph revocation explicit", async function () {
    await registry.attest(protocol.address, hash, "ipfs://graph");
    await registry.revoke(protocol.address);
    expect(await registry.isVerified(protocol.address)).to.equal(false);
    await expect(registry.revoke(protocol.address)).to.be.revertedWithCustomError(registry, "NotAttested");
  });
  it("reverts a whole invalid batch without partial writes", async function () {
    await expect(registry.attestBatch([protocol.address, ethers.ZeroAddress], [hash, hash], ["ipfs://a", "ipfs://b"])).to.be.revertedWithCustomError(registry, "ZeroAddress");
    expect(await registry.totalProtocols()).to.equal(0n);
    expect(await registry.isVerified(protocol.address)).to.equal(false);
    await expect(registry.attestBatch([protocol.address], [], [])).to.be.revertedWithCustomError(registry, "LengthMismatch");
  });
  it("requires ownership acceptance and removes the previous owner's authority", async function () {
    await registry.attest(protocol.address, hash, "ipfs://graph");
    await registry.transferOwnership(successor.address);
    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.authorizedAttesters(successor.address)).to.equal(false);
    await expect(registry.connect(attester).acceptOwnership()).to.be.revertedWithCustomError(registry, "NotAuthorized");
    await registry.connect(successor).acceptOwnership();
    expect(await registry.owner()).to.equal(successor.address);
    expect(await registry.pendingOwner()).to.equal(ethers.ZeroAddress);
    expect(await registry.authorizedAttesters(owner.address)).to.equal(false);
    expect(await registry.isVerified(protocol.address)).to.equal(false);
    await expect(registry.attest(protocol.address, hash, "ipfs://old-owner")).to.be.revertedWithCustomError(registry, "NotAuthorized");
    await registry.connect(successor).attest(protocol.address, hash, "ipfs://new-owner");
  });
  it("allows cancellation and replacement of pending ownership", async function () {
    await registry.transferOwnership(attester.address);
    await registry.transferOwnership(successor.address);
    await expect(registry.connect(attester).acceptOwnership()).to.be.revertedWithCustomError(registry, "NotAuthorized");
    await registry.cancelOwnershipTransfer();
    await expect(registry.connect(successor).acceptOwnership()).to.be.revertedWithCustomError(registry, "NotAuthorized");
  });
  it("rejects zero governance addresses and owner self-revocation", async function () {
    await expect(registry.authorizeAttester(ethers.ZeroAddress)).to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.revokeAttester(ethers.ZeroAddress)).to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.transferOwnership(owner.address)).to.be.revertedWithCustomError(registry, "InvalidOwner");
    await expect(registry.revokeAttester(owner.address)).to.be.revertedWithCustomError(registry, "InvalidOwner");
  });
});
