import { expect } from "chai";
import { network } from "hardhat";
import type { TravelEscrow, PropertyNFT, HostSBT, MockERC20 } from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("TravelEscrow", function () {
  let travelEscrow: TravelEscrow;
  let propertyNFT: PropertyNFT;
  let hostSBT: HostSBT;
  let USDC: MockERC20;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let admin: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let backendSigner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  let tokenId: bigint;
  let checkIn: number;
  let checkOut: number;
  const amount = ethers.parseUnits("500", 6); // 500 USDC
  const platformFee = ethers.parseUnits("37.5", 6); // 7.5%

  beforeEach(async function () {
    [owner, platform, admin, backendSigner, host, traveler] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    USDC = (await MockERC20.deploy("USD Coin", "USDC", 6)) as unknown as MockERC20;
    await USDC.mint(traveler.address, ethers.parseUnits("10000", 6));

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Deploy PropertyNFT
    const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = (await PropertyNFTFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyNFT;

    await hostSBT.setAuthorizedUpdater(await propertyNFT.getAddress(), true);

    // Setup property
    await hostSBT.connect(host).mint(host.address);
    await propertyNFT.connect(host).createProperty("ipfs://", "hotel", "Paris");
    await propertyNFT.connect(host).addRoomType(1, "Standard", 5, "ipfs://");

    tokenId = await propertyNFT.encodeTokenId(1, 0);
    checkIn = (await time.latest()) + 86400; // Tomorrow
    checkOut = checkIn + 86400 * 3; // 3 days

    // Set availability for next 100 days
    const now = await time.latest();
    const startDate = now;
    const endDate = now + 86400 * 100; // 100 days availability
    await propertyNFT.connect(host).setAvailability(tokenId, startDate, endDate, 5);

    // Set owner as escrowFactory to be able to create bookings
    await propertyNFT.setEscrowFactory(owner.address);

    // Create booking in PropertyNFT
    await propertyNFT.bookRoom(tokenId, traveler.address, checkIn, checkOut, 0);

    // Deploy TravelEscrow
    const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
    travelEscrow = (await TravelEscrowFactory.deploy(
      traveler.address,
      host.address,
      await USDC.getAddress(),
      amount,
      platformFee,
      platform.address,
      admin.address,
      backendSigner.address,
      await propertyNFT.getAddress(),
      tokenId,
      0, // bookingIndex
      checkIn,
      checkOut
    )) as unknown as TravelEscrow;

    // Fund escrow
    await USDC.connect(traveler).transfer(await travelEscrow.getAddress(), amount);
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await travelEscrow.traveler()).to.equal(traveler.address);
      expect(await travelEscrow.host()).to.equal(host.address);
      expect(await travelEscrow.token()).to.equal(await USDC.getAddress());
      expect(await travelEscrow.amount()).to.equal(amount);
      expect(await travelEscrow.platformFee()).to.equal(platformFee);
      expect(await travelEscrow.checkIn()).to.equal(checkIn);
      expect(await travelEscrow.checkOut()).to.equal(checkOut);
    });

    it("should initialize with Pending status", async function () {
      const details = await travelEscrow.getDetails();
      expect(details._status).to.equal(0); // Pending
    });

    it("should revert on invalid addresses", async function () {
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");

      await expect(
        TravelEscrowFactory.deploy(
          ethers.ZeroAddress,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          0,
          checkIn,
          checkOut
        )
      ).to.be.revertedWithCustomError(travelEscrow, "InvalidAddress");
    });

    it("should revert on invalid dates (checkOut <= checkIn)", async function () {
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");

      await expect(
        TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          0,
          checkOut, // checkIn after checkOut
          checkIn
        )
      ).to.be.revertedWithCustomError(travelEscrow, "InvalidDates");
    });

    it("should revert on invalid dates (checkIn in past)", async function () {
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");

      const pastTime = (await time.latest()) - 1000;

      await expect(
        TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          0,
          pastTime, // checkIn in the past
          pastTime + 86400
        )
      ).to.be.revertedWithCustomError(travelEscrow, "InvalidDates");
    });

    it("should revert on invalid amount (amount = 0)", async function () {
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");

      await expect(
        TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          0, // amount = 0
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          0,
          checkIn,
          checkOut
        )
      ).to.be.revertedWithCustomError(travelEscrow, "InvalidAmount");
    });

    it("should revert on invalid amount (platformFee >= amount)", async function () {
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");

      await expect(
        TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          amount, // platformFee >= amount
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          0,
          checkIn,
          checkOut
        )
      ).to.be.revertedWithCustomError(travelEscrow, "InvalidAmount");
    });
  });

  describe("Payment Preference", function () {
    it("should set payment preference to CRYPTO", async function () {
      await expect(travelEscrow.connect(host).setPaymentPreference(0)) // CRYPTO
        .to.emit(travelEscrow, "PaymentPreferenceSet")
        .withArgs(0);

      const details = await travelEscrow.getDetails();
      expect(details._preference).to.equal(0); // CRYPTO
    });

    it("should set payment preference to FIAT", async function () {
      await expect(travelEscrow.connect(host).setPaymentPreference(1)) // FIAT
        .to.emit(travelEscrow, "PaymentPreferenceSet")
        .withArgs(1);

      const details = await travelEscrow.getDetails();
      expect(details._preference).to.equal(1); // FIAT
    });

    it("should revert if not host", async function () {
      await expect(
        travelEscrow.connect(traveler).setPaymentPreference(0)
      ).to.be.revertedWithCustomError(travelEscrow, "Unauthorized");
    });

    it("should revert if already withdrawn", async function () {
      // Fast forward past checkIn + 48h
      await time.increaseTo(checkIn + 86400 * 2 + 1);

      // Auto-release funds
      await travelEscrow.autoReleaseToHost();

      // Withdraw
      await travelEscrow.connect(host).withdrawCrypto();

      // Try to change preference
      await expect(
        travelEscrow.connect(host).setPaymentPreference(1)
      ).to.be.revertedWithCustomError(travelEscrow, "AlreadyWithdrawn");
    });
  });

  describe("Timeline: CheckIn-Based Payment", function () {
    it("should allow confirmStay 24h after checkIn", async function () {
      // Fast forward to checkIn + 24h
      await time.increaseTo(checkIn + 86400);

      const tx = await travelEscrow.connect(traveler).confirmStay();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(travelEscrow, "StayConfirmed")
        .withArgs(traveler.address, block!.timestamp);

      const details = await travelEscrow.getDetails();
      expect(details._status).to.equal(1); // Completed
    });

    it("should revert confirmStay before 24h grace period", async function () {
      // Just after checkIn (less than 24h)
      await time.increaseTo(checkIn + 100);

      await expect(travelEscrow.connect(traveler).confirmStay()).to.be.revertedWithCustomError(
        travelEscrow,
        "TooEarlyForAction"
      );
    });

    it("should auto-release 48h after checkIn", async function () {
      // Fast forward to checkIn + 48h
      await time.increaseTo(checkIn + 86400 * 2 + 1);

      const tx = await travelEscrow.autoReleaseToHost();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(travelEscrow, "AutoReleased")
        .withArgs(host.address, amount - platformFee, block!.timestamp);

      const details = await travelEscrow.getDetails();
      expect(details._status).to.equal(1); // Completed
    });

    it("should revert auto-release before 48h", async function () {
      // Just after checkIn (less than 48h)
      await time.increaseTo(checkIn + 100);

      await expect(travelEscrow.autoReleaseToHost()).to.be.revertedWithCustomError(
        travelEscrow,
        "TooEarlyForAction"
      );
    });

    it("should check if can auto-release", async function () {
      expect(await travelEscrow.canAutoRelease()).to.be.false;

      await time.increaseTo(checkIn + 86400 * 2 + 1);
      expect(await travelEscrow.canAutoRelease()).to.be.true;
    });

    it("should check if traveler can confirm stay", async function () {
      expect(await travelEscrow.canConfirmStay()).to.be.false;

      await time.increaseTo(checkIn + 86400);
      expect(await travelEscrow.canConfirmStay()).to.be.true;
    });
  });

  describe("Host Withdrawal", function () {
    beforeEach(async function () {
      // Release funds (48h after checkIn)
      await time.increaseTo(checkIn + 86400 * 2 + 1);
      await travelEscrow.autoReleaseToHost();
    });

    it("should allow host to withdraw crypto", async function () {
      const hostBalanceBefore = await USDC.balanceOf(host.address);

      await expect(travelEscrow.connect(host).withdrawCrypto())
        .to.emit(travelEscrow, "HostWithdrewCrypto")
        .withArgs(host.address, amount - platformFee);

      const hostBalanceAfter = await USDC.balanceOf(host.address);
      expect(hostBalanceAfter - hostBalanceBefore).to.equal(amount - platformFee);

      const details = await travelEscrow.getDetails();
      expect(details._withdrawn).to.be.true;
    });

    it("should have transferred platform fee during auto-release", async function () {
      const platformBalance = await USDC.balanceOf(platform.address);
      // Platform fee was already transferred during autoReleaseToHost in beforeEach
      expect(platformBalance).to.equal(platformFee);
    });

    it("should revert if not host", async function () {
      await expect(travelEscrow.connect(traveler).withdrawCrypto()).to.be.revertedWithCustomError(
        travelEscrow,
        "Unauthorized"
      );
    });

    it("should revert if already withdrawn", async function () {
      await travelEscrow.connect(host).withdrawCrypto();

      await expect(travelEscrow.connect(host).withdrawCrypto()).to.be.revertedWithCustomError(
        travelEscrow,
        "AlreadyWithdrawn"
      );
    });

    it("should revert if wrong payment preference", async function () {
      // Set to FIAT
      await travelEscrow.connect(host).setPaymentPreference(1);

      await expect(travelEscrow.connect(host).withdrawCrypto()).to.be.revertedWithCustomError(
        travelEscrow,
        "WrongPaymentPreference"
      );
    });
  });

  describe("Off-Ramp (Fiat Withdrawal)", function () {
    beforeEach(async function () {
      // Set preference to FIAT
      await travelEscrow.connect(host).setPaymentPreference(1);

      // Release funds
      await time.increaseTo(checkIn + 86400 * 2 + 1);
      await travelEscrow.autoReleaseToHost();
    });

    it("should initiate off-ramp with valid signature", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "address"],
        [
          await travelEscrow.getAddress(),
          host.address,
          amount - platformFee,
          await USDC.getAddress(),
        ]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const platformBalanceBefore = await USDC.balanceOf(platform.address);

      await expect(travelEscrow.initiateOffRamp(signature)).to.emit(
        travelEscrow,
        "BackendInitiatedOffRamp"
      );

      const platformBalanceAfter = await USDC.balanceOf(platform.address);
      // Platform receives host amount (for EUR conversion)
      // Platform fee was already transferred during autoReleaseToHost in beforeEach
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(amount - platformFee);
    });

    it("should revert with invalid signature", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "address"],
        [
          await travelEscrow.getAddress(),
          host.address,
          amount - platformFee,
          await USDC.getAddress(),
        ]
      );

      const wrongSigner = traveler;
      const signature = await wrongSigner.signMessage(ethers.getBytes(messageHash));

      await expect(travelEscrow.initiateOffRamp(signature)).to.be.revertedWithCustomError(
        travelEscrow,
        "InvalidSignature"
      );
    });

    it("should revert if already withdrawn", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "address"],
        [
          await travelEscrow.getAddress(),
          host.address,
          amount - platformFee,
          await USDC.getAddress(),
        ]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await travelEscrow.initiateOffRamp(signature);

      await expect(travelEscrow.initiateOffRamp(signature)).to.be.revertedWithCustomError(
        travelEscrow,
        "AlreadyWithdrawn"
      );
    });

    it("should revert if wrong payment preference", async function () {
      // Switch back to CRYPTO
      await travelEscrow.connect(host).setPaymentPreference(0);

      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "address"],
        [
          await travelEscrow.getAddress(),
          host.address,
          amount - platformFee,
          await USDC.getAddress(),
        ]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(travelEscrow.initiateOffRamp(signature)).to.be.revertedWithCustomError(
        travelEscrow,
        "WrongPaymentPreference"
      );
    });
  });

  describe("Cancellation Logic", function () {
    describe("100% refund (>30 days before checkIn)", function () {
      let futureEscrow: TravelEscrow;
      let futureCheckIn: number;
      let futureCheckOut: number;
      let bookingIndex: number;

      beforeEach(async function () {
        // Create new escrow with far future date
        futureCheckIn = (await time.latest()) + 86400 * 32; // 32 days (>30 for 100% refund)
        futureCheckOut = futureCheckIn + 86400 * 3;

        // Create booking in PropertyNFT for this escrow
        await propertyNFT.bookRoom(
          tokenId,
          traveler.address,
          futureCheckIn,
          futureCheckOut,
          100 // Unique escrowId
        );
        const bookings = await propertyNFT.getBookings(tokenId);
        bookingIndex = Number(bookings.length) - 1;

        const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
        futureEscrow = (await TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          bookingIndex,
          futureCheckIn,
          futureCheckOut
        )) as unknown as TravelEscrow;

        // Authorize futureEscrow as escrowFactory so it can cancel bookings
        await propertyNFT.setEscrowFactory(await futureEscrow.getAddress());

        await USDC.connect(traveler).transfer(await futureEscrow.getAddress(), amount);
      });

      afterEach(async function () {
        // Reset escrowFactory to owner for next tests
        await propertyNFT.setEscrowFactory(owner.address);
      });

      it("should give 100% refund if >30 days before checkIn", async function () {
        const travelerBalanceBefore = await USDC.balanceOf(traveler.address);

        await futureEscrow.connect(traveler).cancelBooking();

        const travelerBalanceAfter = await USDC.balanceOf(traveler.address);
        // Gets back amount - platformFee (100% of refundable)
        expect(travelerBalanceAfter - travelerBalanceBefore).to.equal(amount - platformFee);
      });
    });

    describe("50% refund (14-30 days before checkIn)", function () {
      let futureEscrow: TravelEscrow;
      let futureCheckIn: number;
      let futureCheckOut: number;
      let bookingIndex: number;

      beforeEach(async function () {
        futureCheckIn = (await time.latest()) + 86400 * 20; // 20 days
        futureCheckOut = futureCheckIn + 86400 * 3;

        // Create booking in PropertyNFT for this escrow
        await propertyNFT.bookRoom(
          tokenId,
          traveler.address,
          futureCheckIn,
          futureCheckOut,
          101 // Unique escrowId
        );
        const bookings = await propertyNFT.getBookings(tokenId);
        bookingIndex = Number(bookings.length) - 1;

        const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
        futureEscrow = (await TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          bookingIndex,
          futureCheckIn,
          futureCheckOut
        )) as unknown as TravelEscrow;

        // Authorize futureEscrow as escrowFactory so it can cancel bookings
        await propertyNFT.setEscrowFactory(await futureEscrow.getAddress());

        await USDC.connect(traveler).transfer(await futureEscrow.getAddress(), amount);
      });

      afterEach(async function () {
        // Reset escrowFactory to owner for next tests
        await propertyNFT.setEscrowFactory(owner.address);
      });

      it("should give 50% refund if 14-30 days before checkIn", async function () {
        const travelerBalanceBefore = await USDC.balanceOf(traveler.address);

        await futureEscrow.connect(traveler).cancelBooking();

        // 50% refund of (amount - platformFee)
        const refundable = amount - platformFee;
        const expectedRefund = refundable / 2n;

        const travelerBalanceAfter = await USDC.balanceOf(traveler.address);
        expect(travelerBalanceAfter - travelerBalanceBefore).to.equal(expectedRefund);
      });
    });

    describe("0% refund (<14 days before checkIn)", function () {
      let futureEscrow: TravelEscrow;
      let futureCheckIn: number;
      let futureCheckOut: number;
      let bookingIndex: number;

      beforeEach(async function () {
        futureCheckIn = (await time.latest()) + 86400 * 10; // 10 days
        futureCheckOut = futureCheckIn + 86400 * 3;

        // Create booking in PropertyNFT for this escrow
        await propertyNFT.bookRoom(
          tokenId,
          traveler.address,
          futureCheckIn,
          futureCheckOut,
          102 // Unique escrowId
        );
        const bookings = await propertyNFT.getBookings(tokenId);
        bookingIndex = Number(bookings.length) - 1;

        const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
        futureEscrow = (await TravelEscrowFactory.deploy(
          traveler.address,
          host.address,
          await USDC.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFT.getAddress(),
          tokenId,
          bookingIndex,
          futureCheckIn,
          futureCheckOut
        )) as unknown as TravelEscrow;

        // Authorize futureEscrow as escrowFactory so it can cancel bookings
        await propertyNFT.setEscrowFactory(await futureEscrow.getAddress());

        await USDC.connect(traveler).transfer(await futureEscrow.getAddress(), amount);
      });

      afterEach(async function () {
        // Reset escrowFactory to owner for next tests
        await propertyNFT.setEscrowFactory(owner.address);
      });

      it("should give 0% refund if <14 days before checkIn", async function () {
        const travelerBalanceBefore = await USDC.balanceOf(traveler.address);

        await futureEscrow.connect(traveler).cancelBooking();

        const travelerBalanceAfter = await USDC.balanceOf(traveler.address);
        // 0% refund
        expect(travelerBalanceAfter).to.equal(travelerBalanceBefore);
      });
    });

    it("should get 100% refund percentage >30 days before", async function () {
      const futureCheckIn = (await time.latest()) + 86400 * 32; // 32 days to ensure >30
      const futureCheckOut = futureCheckIn + 86400 * 3;

      // Create booking in PropertyNFT for this escrow
      await propertyNFT.bookRoom(tokenId, traveler.address, futureCheckIn, futureCheckOut, 4);
      const bookings = await propertyNFT.getBookings(tokenId);
      const bookingIndex = Number(bookings.length) - 1;

      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
      const futureEscrow = (await TravelEscrowFactory.deploy(
        traveler.address,
        host.address,
        await USDC.getAddress(),
        amount,
        platformFee,
        platform.address,
        admin.address,
        backendSigner.address,
        await propertyNFT.getAddress(),
        tokenId,
        bookingIndex,
        futureCheckIn,
        futureCheckOut
      )) as unknown as TravelEscrow;

      expect(await futureEscrow.getRefundPercentage()).to.equal(100);
    });

    it("should get 50% refund percentage 14-30 days before", async function () {
      const futureCheckIn = (await time.latest()) + 86400 * 20; // 20 days
      const futureCheckOut = futureCheckIn + 86400 * 3;

      // Create booking in PropertyNFT for this escrow
      await propertyNFT.bookRoom(tokenId, traveler.address, futureCheckIn, futureCheckOut, 5);
      const bookings = await propertyNFT.getBookings(tokenId);
      const bookingIndex = Number(bookings.length) - 1;

      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
      const futureEscrow = (await TravelEscrowFactory.deploy(
        traveler.address,
        host.address,
        await USDC.getAddress(),
        amount,
        platformFee,
        platform.address,
        admin.address,
        backendSigner.address,
        await propertyNFT.getAddress(),
        tokenId,
        bookingIndex,
        futureCheckIn,
        futureCheckOut
      )) as unknown as TravelEscrow;

      expect(await futureEscrow.getRefundPercentage()).to.equal(50);
    });

    it("should get 0% refund percentage <14 days before", async function () {
      const futureCheckIn = (await time.latest()) + 86400 * 10; // 10 days
      const futureCheckOut = futureCheckIn + 86400 * 3;

      // Create booking in PropertyNFT for this escrow
      await propertyNFT.bookRoom(tokenId, traveler.address, futureCheckIn, futureCheckOut, 6);
      const bookings = await propertyNFT.getBookings(tokenId);
      const bookingIndex = Number(bookings.length) - 1;

      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
      const futureEscrow = (await TravelEscrowFactory.deploy(
        traveler.address,
        host.address,
        await USDC.getAddress(),
        amount,
        platformFee,
        platform.address,
        admin.address,
        backendSigner.address,
        await propertyNFT.getAddress(),
        tokenId,
        bookingIndex,
        futureCheckIn,
        futureCheckOut
      )) as unknown as TravelEscrow;

      expect(await futureEscrow.getRefundPercentage()).to.equal(0);
    });

    it("should get 0% refund percentage after checkIn", async function () {
      // Use the existing escrow from main beforeEach
      // Fast forward past checkIn
      await time.increaseTo(checkIn + 100);

      expect(await travelEscrow.getRefundPercentage()).to.equal(0);
    });

    it("should revert cancelBooking after checkIn", async function () {
      // Use the existing escrow from main beforeEach
      // Fast forward past checkIn
      await time.increaseTo(checkIn + 100);

      await expect(travelEscrow.connect(traveler).cancelBooking()).to.be.revertedWithCustomError(
        travelEscrow,
        "TooEarlyForAction"
      );
    });
  });

  describe("Dispute Resolution", function () {
    it("should open dispute after checkIn", async function () {
      await time.increaseTo(checkIn + 100);

      const tx = await travelEscrow.connect(traveler).openDispute("Room dirty");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(travelEscrow, "DisputeOpened")
        .withArgs(traveler.address, "Room dirty", block!.timestamp);

      const details = await travelEscrow.getDetails();
      expect(details._status).to.equal(4); // Disputed
    });

    it("should revert if dispute opened before checkIn", async function () {
      await expect(
        travelEscrow.connect(traveler).openDispute("Reason")
      ).to.be.revertedWithCustomError(travelEscrow, "TooEarlyForAction");
    });

    it("should revert if dispute after 7 days window", async function () {
      await time.increaseTo(checkOut + 86400 * 7 + 1);

      await expect(
        travelEscrow.connect(traveler).openDispute("Reason")
      ).to.be.revertedWithCustomError(travelEscrow, "DisputeWindowExpired");
    });

    it("should resolve dispute in favor of traveler", async function () {
      await time.increaseTo(checkIn + 100);
      await travelEscrow.connect(traveler).openDispute("Bad experience");

      const travelerBalanceBefore = await USDC.balanceOf(traveler.address);

      await expect(travelEscrow.connect(admin).resolveDispute(true, "Traveler was right"))
        .to.emit(travelEscrow, "DisputeResolved")
        .withArgs(true, admin.address, "Traveler was right");

      const travelerBalanceAfter = await USDC.balanceOf(traveler.address);
      expect(travelerBalanceAfter - travelerBalanceBefore).to.equal(amount - platformFee);
    });

    it("should resolve dispute in favor of host", async function () {
      await time.increaseTo(checkIn + 100);
      await travelEscrow.connect(host).openDispute("Traveler damaged property");

      const hostBalanceBefore = await USDC.balanceOf(host.address);

      await travelEscrow.connect(admin).resolveDispute(false, "Host was right");

      const hostBalanceAfter = await USDC.balanceOf(host.address);
      expect(hostBalanceAfter - hostBalanceBefore).to.equal(amount - platformFee);
    });

    it("should revert if not admin resolving", async function () {
      await time.increaseTo(checkIn + 100);
      await travelEscrow.connect(traveler).openDispute("Reason");

      await expect(
        travelEscrow.connect(traveler).resolveDispute(true, "Resolution")
      ).to.be.revertedWithCustomError(travelEscrow, "Unauthorized");
    });

    it("should revert if unauthorized user tries to open dispute", async function () {
      await time.increaseTo(checkIn + 100);

      await expect(
        travelEscrow.connect(platform).openDispute("Reason")
      ).to.be.revertedWithCustomError(travelEscrow, "Unauthorized");
    });
  });

  describe("View Functions", function () {
    it("should return correct details", async function () {
      const details = await travelEscrow.getDetails();

      expect(details._traveler).to.equal(traveler.address);
      expect(details._host).to.equal(host.address);
      expect(details._token).to.equal(await USDC.getAddress());
      expect(details._amount).to.equal(amount);
      expect(details._tokenId).to.equal(tokenId);
      expect(details._checkIn).to.equal(checkIn);
      expect(details._checkOut).to.equal(checkOut);
      expect(details._status).to.equal(0); // Pending
      expect(details._preference).to.equal(0); // CRYPTO
      expect(details._withdrawn).to.be.false;
    });
  });
});
