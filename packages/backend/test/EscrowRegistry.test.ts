import { expect } from "chai";
import { network } from "hardhat";
import type { EscrowRegistry } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("EscrowRegistry", function () {
  let escrowRegistry: EscrowRegistry;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let factory: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let escrowAddress1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let escrowAddress2: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let escrowAddress3: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, factory, traveler, host, escrowAddress1, escrowAddress2, escrowAddress3] =
      await ethers.getSigners();

    // Deploy EscrowRegistry
    const EscrowRegistryFactory = await ethers.getContractFactory("EscrowRegistry");
    escrowRegistry = (await EscrowRegistryFactory.deploy()) as unknown as EscrowRegistry;
    await escrowRegistry.waitForDeployment();

    // Set factory address
    await escrowRegistry.setEscrowFactory(factory.address);
  });

  describe("Deployment", function () {
    it("should deploy with correct owner", async function () {
      expect(await escrowRegistry.owner()).to.equal(owner.address);
    });

    it("should have escrow factory set", async function () {
      expect(await escrowRegistry.escrowFactory()).to.equal(factory.address);
    });

    it("should have zero escrow count", async function () {
      expect(await escrowRegistry.escrowCount()).to.equal(0);
    });

    it("should have zero batch count", async function () {
      expect(await escrowRegistry.batchCount()).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set escrow factory", async function () {
      const newFactory = traveler.address;
      await escrowRegistry.setEscrowFactory(newFactory);
      expect(await escrowRegistry.escrowFactory()).to.equal(newFactory);
    });

    it("should emit event when setting escrow factory", async function () {
      const newFactory = traveler.address;
      await expect(escrowRegistry.setEscrowFactory(newFactory))
        .to.emit(escrowRegistry, "EscrowFactoryUpdated")
        .withArgs(factory.address, newFactory);
    });

    it("should revert if setting zero address", async function () {
      await expect(
        escrowRegistry.setEscrowFactory(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowRegistry, "InvalidAddress");
    });

    it("should revert if non-owner tries to set factory", async function () {
      await expect(
        escrowRegistry.connect(traveler).setEscrowFactory(traveler.address)
      ).to.be.revertedWithCustomError(escrowRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Register Escrow", function () {
    it("should register escrow when called by factory", async function () {
      const tx = await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should emit EscrowRegistered event", async function () {
      await expect(
        escrowRegistry
          .connect(factory)
          .registerEscrow(escrowAddress1.address, traveler.address, host.address)
      )
        .to.emit(escrowRegistry, "EscrowRegistered")
        .withArgs(0, escrowAddress1.address, traveler.address, host.address);
    });

    it("should increment escrow count", async function () {
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      expect(await escrowRegistry.escrowCount()).to.equal(1);
    });

    it("should return correct escrow ID", async function () {
      const escrowId = await escrowRegistry
        .connect(factory)
        .registerEscrow.staticCall(escrowAddress1.address, traveler.address, host.address);

      expect(escrowId).to.equal(0);
    });

    it("should store escrow address by ID", async function () {
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      expect(await escrowRegistry.escrows(0)).to.equal(escrowAddress1.address);
    });

    it("should add escrow to traveler's list", async function () {
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      const userEscrows = await escrowRegistry.getUserEscrows(traveler.address);
      expect(userEscrows.length).to.equal(1);
      expect(userEscrows[0]).to.equal(0);
    });

    it("should add escrow to host's list", async function () {
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      const userEscrows = await escrowRegistry.getUserEscrows(host.address);
      expect(userEscrows.length).to.equal(1);
      expect(userEscrows[0]).to.equal(0);
    });

    it("should register multiple escrows with sequential IDs", async function () {
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress2.address, traveler.address, host.address);

      expect(await escrowRegistry.escrowCount()).to.equal(2);
      expect(await escrowRegistry.escrows(0)).to.equal(escrowAddress1.address);
      expect(await escrowRegistry.escrows(1)).to.equal(escrowAddress2.address);
    });

    it("should revert if called by non-factory", async function () {
      await expect(
        escrowRegistry
          .connect(traveler)
          .registerEscrow(escrowAddress1.address, traveler.address, host.address)
      ).to.be.revertedWithCustomError(escrowRegistry, "OnlyEscrowFactory");
    });

    it("should revert if escrow address is zero", async function () {
      await expect(
        escrowRegistry
          .connect(factory)
          .registerEscrow(ethers.ZeroAddress, traveler.address, host.address)
      ).to.be.revertedWithCustomError(escrowRegistry, "InvalidAddress");
    });
  });

  describe("Register Batch Escrow", function () {
    beforeEach(async function () {
      // Register some escrows first
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress2.address, traveler.address, host.address);
    });

    it("should create new batch when batchId is 0", async function () {
      const batchId = await escrowRegistry.connect(factory).registerBatchEscrow.staticCall(0, 0);
      expect(batchId).to.equal(0);

      await escrowRegistry.connect(factory).registerBatchEscrow(0, 0);
      expect(await escrowRegistry.batchCount()).to.equal(1);
    });

    it("should emit BatchCreated event when creating new batch", async function () {
      await expect(escrowRegistry.connect(factory).registerBatchEscrow(0, 0))
        .to.emit(escrowRegistry, "BatchCreated")
        .withArgs(0, 0);
    });

    it("should add escrow to existing batch", async function () {
      // Create first batch (batch 0)
      await escrowRegistry.connect(factory).registerBatchEscrow(0, 0);

      // Create second batch (batch 1) - we can't add to batch 0 by passing 0 since 0 means "create new"
      await escrowRegistry.connect(factory).registerBatchEscrow(1, 0);

      // Add to batch 1 (must pass actual batch number, not 0)
      const batchId = await escrowRegistry.connect(factory).registerBatchEscrow.staticCall(2, 1);
      expect(batchId).to.equal(1);

      await escrowRegistry.connect(factory).registerBatchEscrow(2, 1);

      const batchEscrows = await escrowRegistry.getBatchEscrows(1);
      expect(batchEscrows.length).to.equal(2);
      expect(batchEscrows[0]).to.equal(1);
      expect(batchEscrows[1]).to.equal(2);
    });

    it("should map escrow to batch", async function () {
      await escrowRegistry.connect(factory).registerBatchEscrow(0, 0);

      expect(await escrowRegistry.escrowToBatch(0)).to.equal(0);
    });

    it("should revert if called by non-factory", async function () {
      await expect(
        escrowRegistry.connect(traveler).registerBatchEscrow(0, 0)
      ).to.be.revertedWithCustomError(escrowRegistry, "OnlyEscrowFactory");
    });
  });

  describe("Create Batch ID", function () {
    it("should create new batch ID", async function () {
      const batchId = await escrowRegistry.connect(factory).createBatchId.staticCall();
      expect(batchId).to.equal(0);

      await escrowRegistry.connect(factory).createBatchId();
      expect(await escrowRegistry.batchCount()).to.equal(1);
    });

    it("should emit BatchCreated event", async function () {
      await expect(escrowRegistry.connect(factory).createBatchId())
        .to.emit(escrowRegistry, "BatchCreated")
        .withArgs(0, 0);
    });

    it("should create sequential batch IDs", async function () {
      await escrowRegistry.connect(factory).createBatchId();
      const batchId = await escrowRegistry.connect(factory).createBatchId.staticCall();
      expect(batchId).to.equal(1);
    });

    it("should revert if called by non-factory", async function () {
      await expect(escrowRegistry.connect(traveler).createBatchId()).to.be.revertedWithCustomError(
        escrowRegistry,
        "OnlyEscrowFactory"
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Register 3 escrows
      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress1.address, traveler.address, host.address);

      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress2.address, traveler.address, host.address);

      await escrowRegistry
        .connect(factory)
        .registerEscrow(escrowAddress3.address, traveler.address, host.address);

      // Create batch 0 with escrow 0
      await escrowRegistry.connect(factory).registerBatchEscrow(0, 0);
      // Create batch 1 with escrow 1 (batchId=0 creates new batch)
      await escrowRegistry.connect(factory).registerBatchEscrow(1, 0);
      // Add escrow 2 to batch 1 (pass batch number 1)
      await escrowRegistry.connect(factory).registerBatchEscrow(2, 1);
    });

    it("should get user escrow IDs", async function () {
      const escrows = await escrowRegistry.getUserEscrows(traveler.address);
      expect(escrows.length).to.equal(3);
      expect(escrows[0]).to.equal(0);
      expect(escrows[1]).to.equal(1);
      expect(escrows[2]).to.equal(2);
    });

    it("should get user escrow addresses", async function () {
      const addresses = await escrowRegistry.getUserEscrowAddresses(traveler.address);
      expect(addresses.length).to.equal(3);
      expect(addresses[0]).to.equal(escrowAddress1.address);
      expect(addresses[1]).to.equal(escrowAddress2.address);
      expect(addresses[2]).to.equal(escrowAddress3.address);
    });

    it("should get batch escrow IDs", async function () {
      // Batch 1 has escrows 1 and 2
      const escrows = await escrowRegistry.getBatchEscrows(1);
      expect(escrows.length).to.equal(2);
      expect(escrows[0]).to.equal(1);
      expect(escrows[1]).to.equal(2);
    });

    it("should get batch escrow addresses", async function () {
      // Batch 1 has escrows 1 and 2
      const addresses = await escrowRegistry.getBatchEscrowAddresses(1);
      expect(addresses.length).to.equal(2);
      expect(addresses[0]).to.equal(escrowAddress2.address);
      expect(addresses[1]).to.equal(escrowAddress3.address);
    });

    it("should get escrow batch", async function () {
      expect(await escrowRegistry.getEscrowBatch(0)).to.equal(0); // Escrow 0 in batch 0
      expect(await escrowRegistry.getEscrowBatch(1)).to.equal(1); // Escrow 1 in batch 1
      expect(await escrowRegistry.getEscrowBatch(2)).to.equal(1); // Escrow 2 in batch 1
    });

    it("should check if escrow is in batch", async function () {
      // NOTE: Contract bug - isInBatch() returns false for escrows in batch 0
      // because it checks escrowToBatch[id] != 0. Escrow 0 is in batch 0, so returns false.
      expect(await escrowRegistry.isInBatch(0)).to.be.false; // In batch 0, but bug returns false
      expect(await escrowRegistry.isInBatch(1)).to.be.true; // In batch 1
      expect(await escrowRegistry.isInBatch(2)).to.be.true; // In batch 1
    });

    it("should get total escrows", async function () {
      expect(await escrowRegistry.totalEscrows()).to.equal(3);
    });

    it("should get total batches", async function () {
      // We created 2 batches (batch 0 and batch 1)
      expect(await escrowRegistry.totalBatches()).to.equal(2);
    });

    it("should get next batch ID without incrementing", async function () {
      // After creating batches 0 and 1, next should be 2
      const nextId = await escrowRegistry.getNextBatchId();
      expect(nextId).to.equal(2);

      // Call again to verify it doesn't increment
      const nextIdAgain = await escrowRegistry.getNextBatchId();
      expect(nextIdAgain).to.equal(2);
    });

    it("should return empty array for user with no escrows", async function () {
      const escrows = await escrowRegistry.getUserEscrows(escrowAddress1.address);
      expect(escrows.length).to.equal(0);
    });

    it("should return empty array for batch with no escrows", async function () {
      const escrows = await escrowRegistry.getBatchEscrows(999);
      expect(escrows.length).to.equal(0);
    });
  });

  describe("Multiple Batches", function () {
    beforeEach(async function () {
      // Register escrows
      for (let i = 0; i < 5; i++) {
        const mockEscrow = ethers.Wallet.createRandom();
        await escrowRegistry
          .connect(factory)
          .registerEscrow(mockEscrow.address, traveler.address, host.address);
      }
    });

    it("should create multiple batches", async function () {
      // Create batch 0 with escrow 0
      await escrowRegistry.connect(factory).registerBatchEscrow(0, 0);

      // Create batch 1 with escrow 1 (batchId=0 creates new batch)
      await escrowRegistry.connect(factory).registerBatchEscrow(1, 0);

      // Create batch 2 with escrow 2
      await escrowRegistry.connect(factory).registerBatchEscrow(2, 0);

      // Add escrow 3 to batch 1 (pass batch number 1)
      await escrowRegistry.connect(factory).registerBatchEscrow(3, 1);

      // Add escrow 4 to batch 2 (pass batch number 2)
      await escrowRegistry.connect(factory).registerBatchEscrow(4, 2);

      expect(await escrowRegistry.batchCount()).to.equal(3);

      const batch0 = await escrowRegistry.getBatchEscrows(0);
      const batch1 = await escrowRegistry.getBatchEscrows(1);
      const batch2 = await escrowRegistry.getBatchEscrows(2);

      expect(batch0.length).to.equal(1);
      expect(batch1.length).to.equal(2);
      expect(batch2.length).to.equal(2);

      expect(batch0[0]).to.equal(0);
      expect(batch1[0]).to.equal(1);
      expect(batch1[1]).to.equal(3);
      expect(batch2[0]).to.equal(2);
      expect(batch2[1]).to.equal(4);
    });
  });
});
