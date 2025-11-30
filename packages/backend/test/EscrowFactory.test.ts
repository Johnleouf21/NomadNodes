import { expect } from "chai";
import { network } from "hardhat";
import { keccak256, solidityPacked, Wallet } from "ethers";
import type {
  EscrowFactory,
  EscrowRegistry,
  EscrowDeployer,
  MockERC20,
  PropertyNFTAdapter,
  PropertyRegistry,
  RoomTypeNFT,
  AvailabilityManager,
  BookingManager,
  HostSBT,
  TravelerSBT,
} from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("EscrowFactory", function () {
  let escrowFactory: EscrowFactory;
  let escrowRegistry: EscrowRegistry;
  let escrowDeployer: EscrowDeployer;
  let usdc: MockERC20;
  let eurc: MockERC20;
  let propertyNFTAdapter: PropertyNFTAdapter;
  let propertyRegistry: PropertyRegistry;
  let roomTypeNFT: RoomTypeNFT;
  let availabilityManager: AvailabilityManager;
  let bookingManager: BookingManager;
  let hostSBT: HostSBT;
  let travelerSBT: TravelerSBT;

  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let admin: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let backendSigner: Wallet;

  let tokenId: bigint;
  let checkIn: number;
  let checkOut: number;

  async function signQuote(
    tokenId: bigint,
    checkIn: number,
    checkOut: number,
    price: bigint,
    currency: string,
    validUntil: number,
    quantity: number,
    contractAddress: string
  ): Promise<string> {
    const messageHash = keccak256(
      solidityPacked(
        [
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "uint256",
          "address",
        ],
        [
          tokenId,
          checkIn,
          checkOut,
          price,
          currency,
          validUntil,
          quantity,
          await ethers.provider.send("eth_chainId"),
          contractAddress,
        ]
      )
    );

    return await backendSigner.signMessage(ethers.getBytes(messageHash));
  }

  async function signBatchQuote(
    tokenIds: bigint[],
    quantities: number[],
    prices: bigint[],
    checkIn: number,
    checkOut: number,
    totalPrice: bigint,
    currency: string,
    validUntil: number,
    contractAddress: string
  ): Promise<string> {
    // Hash room bookings
    const roomsHash = keccak256(
      solidityPacked(["uint256[]", "uint256[]", "uint256[]"], [tokenIds, quantities, prices])
    );

    // Create message hash
    const messageHash = keccak256(
      solidityPacked(
        ["bytes32", "uint256", "uint256", "uint256", "address", "uint256", "uint256", "address"],
        [
          roomsHash,
          checkIn,
          checkOut,
          totalPrice,
          currency,
          validUntil,
          await ethers.provider.send("eth_chainId"),
          contractAddress,
        ]
      )
    );

    return await backendSigner.signMessage(ethers.getBytes(messageHash));
  }

  beforeEach(async function () {
    [owner, platform, admin, host, traveler] = await ethers.getSigners();

    // Create backend signer wallet
    backendSigner = Wallet.createRandom();

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdc = (await MockERC20Factory.deploy("USDC", "USDC", 6)) as unknown as MockERC20;
    await usdc.waitForDeployment();

    eurc = (await MockERC20Factory.deploy("EURC", "EURC", 6)) as unknown as MockERC20;
    await eurc.waitForDeployment();

    // Mint tokens to traveler
    await usdc.mint(traveler.address, ethers.parseUnits("10000", 6));
    await eurc.mint(traveler.address, ethers.parseUnits("10000", 6));

    // Deploy SBTs
    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;
    await travelerSBT.waitForDeployment();

    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();

    await travelerSBT.mint(traveler.address);
    await hostSBT.mint(host.address);

    // Deploy property system
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = (await PropertyRegistryFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyRegistry;
    await propertyRegistry.waitForDeployment();

    await hostSBT.setAuthorizedUpdater(await propertyRegistry.getAddress(), true);

    const RoomTypeNFTFactory = await ethers.getContractFactory("RoomTypeNFT");
    roomTypeNFT = (await RoomTypeNFTFactory.deploy(
      await propertyRegistry.getAddress()
    )) as unknown as RoomTypeNFT;
    await roomTypeNFT.waitForDeployment();

    const AvailabilityManagerFactory = await ethers.getContractFactory("AvailabilityManager");
    availabilityManager = (await AvailabilityManagerFactory.deploy(
      await roomTypeNFT.getAddress()
    )) as unknown as AvailabilityManager;
    await availabilityManager.waitForDeployment();

    const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
    bookingManager = (await BookingManagerFactory.deploy(
      await propertyRegistry.getAddress(),
      await roomTypeNFT.getAddress(),
      await availabilityManager.getAddress(),
      await travelerSBT.getAddress()
    )) as unknown as BookingManager;
    await bookingManager.waitForDeployment();

    const PropertyNFTAdapterFactory = await ethers.getContractFactory("PropertyNFTAdapter");
    propertyNFTAdapter = (await PropertyNFTAdapterFactory.deploy(
      await propertyRegistry.getAddress(),
      await roomTypeNFT.getAddress(),
      await availabilityManager.getAddress(),
      await bookingManager.getAddress()
    )) as unknown as PropertyNFTAdapter;
    await propertyNFTAdapter.waitForDeployment();

    // Wire up contracts
    await propertyRegistry.setRoomTypeNFT(await roomTypeNFT.getAddress());
    await propertyRegistry.setBookingManager(await bookingManager.getAddress());
    await roomTypeNFT.setAvailabilityManager(await availabilityManager.getAddress());
    await roomTypeNFT.setBookingManager(await bookingManager.getAddress());
    await availabilityManager.setBookingManager(await bookingManager.getAddress());
    await travelerSBT.setAuthorizedUpdater(await bookingManager.getAddress(), true);
    await bookingManager.setPropertyNFTAdapter(await propertyNFTAdapter.getAddress());

    // Deploy EscrowRegistry
    const EscrowRegistryFactory = await ethers.getContractFactory("EscrowRegistry");
    escrowRegistry = (await EscrowRegistryFactory.deploy()) as unknown as EscrowRegistry;
    await escrowRegistry.waitForDeployment();

    // Deploy EscrowDeployer
    const EscrowDeployerFactory = await ethers.getContractFactory("EscrowDeployer");
    escrowDeployer = (await EscrowDeployerFactory.deploy()) as unknown as EscrowDeployer;
    await escrowDeployer.waitForDeployment();

    // Deploy EscrowFactory
    const EscrowFactoryContract = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = (await EscrowFactoryContract.deploy(
      platform.address,
      admin.address,
      backendSigner.address,
      await usdc.getAddress(),
      await eurc.getAddress()
    )) as unknown as EscrowFactory;
    await escrowFactory.waitForDeployment();

    // Set dependencies
    await escrowFactory.setEscrowRegistry(await escrowRegistry.getAddress());
    await escrowFactory.setEscrowDeployer(await escrowDeployer.getAddress());
    await escrowFactory.setPropertyNFT(await propertyNFTAdapter.getAddress());

    // Set EscrowFactory as authorized in registry/deployer
    await escrowRegistry.setEscrowFactory(await escrowFactory.getAddress());
    await escrowDeployer.setEscrowFactory(await escrowFactory.getAddress());

    // Set BookingManager to accept calls from PropertyNFTAdapter
    await bookingManager.setEscrowFactory(await propertyNFTAdapter.getAddress());

    // Create property and room
    await propertyRegistry.connect(host).createProperty("ipfs://property", "hotel", "Paris");
    await roomTypeNFT.connect(host).addRoomType(
      1,
      "Standard Room",
      "ipfs://room",
      100_000000, // 100 USDC (6 decimals)
      20_000000,
      2,
      3
    );

    tokenId = await roomTypeNFT.encodeTokenId(1, 1);

    // Set availability
    const now = await time.latest();
    checkIn = Math.floor(now / 86400) * 86400 + 86400;
    checkOut = checkIn + 86400 * 3;

    await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await escrowFactory.platformWallet()).to.equal(platform.address);
      expect(await escrowFactory.admin()).to.equal(admin.address);
      expect(await escrowFactory.backendSigner()).to.equal(backendSigner.address);
      expect(await escrowFactory.USDC()).to.equal(await usdc.getAddress());
      expect(await escrowFactory.EURC()).to.equal(await eurc.getAddress());
    });

    it("should have correct default fee settings", async function () {
      expect(await escrowFactory.platformFeePercent()).to.equal(750); // 7.5%
      expect(await escrowFactory.minFee()).to.equal(500000); // 0.5 USDC
    });

    it("should revert if deployed with zero addresses", async function () {
      const EscrowFactoryContract = await ethers.getContractFactory("EscrowFactory");

      await expect(
        EscrowFactoryContract.deploy(
          ethers.ZeroAddress,
          admin.address,
          backendSigner.address,
          await usdc.getAddress(),
          await eurc.getAddress()
        )
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set platform fee", async function () {
      await escrowFactory.setPlatformFee(1000); // 10%
      expect(await escrowFactory.platformFeePercent()).to.equal(1000);
    });

    it("should allow owner to set min fee", async function () {
      await escrowFactory.setMinFee(1_000000);
      expect(await escrowFactory.minFee()).to.equal(1_000000);
    });

    it("should allow owner to set platform wallet", async function () {
      await escrowFactory.setPlatformWallet(owner.address);
      expect(await escrowFactory.platformWallet()).to.equal(owner.address);
    });

    it("should allow owner to pause/unpause", async function () {
      await escrowFactory.pause();
      expect(await escrowFactory.paused()).to.be.true;

      await escrowFactory.unpause();
      expect(await escrowFactory.paused()).to.be.false;
    });

    it("should revert if non-owner tries to set fee", async function () {
      await expect(
        escrowFactory.connect(traveler).setPlatformFee(1000)
      ).to.be.revertedWithCustomError(escrowFactory, "OwnableUnauthorizedAccount");
    });

    it("should revert when setting zero address", async function () {
      await expect(
        escrowFactory.setPlatformWallet(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });
  });

  describe("View Functions", function () {
    it("should return escrow count", async function () {
      expect(await escrowFactory.escrowCount()).to.equal(0);
    });

    it("should return batch count", async function () {
      expect(await escrowFactory.batchCount()).to.equal(0);
    });
  });

  describe("Create Travel Escrow With Quote", function () {
    it("should create escrow with valid quote", async function () {
      const price = BigInt(320_000000); // 320 USDC
      const validUntil = (await time.latest()) + 3600; // 1 hour from now
      const quantity = 2;

      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        quantity,
        await escrowFactory.getAddress()
      );

      // Approve tokens
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity,
          signature,
        })
      ).to.emit(escrowFactory, "EscrowCreated");
    });

    it("should revert with expired quote", async function () {
      const price = BigInt(320_000000);
      const validUntil = (await time.latest()) - 100; // Already expired
      const quantity = 2;

      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        quantity,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "QuoteExpired");
    });

    it("should revert with invalid signature", async function () {
      const price = BigInt(320_000000);
      const validUntil = (await time.latest()) + 3600;
      const quantity = 2;

      // Sign with wrong signer
      const wrongSigner = Wallet.createRandom();
      const messageHash = keccak256(
        solidityPacked(
          [
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "uint256",
            "address",
          ],
          [
            tokenId,
            checkIn,
            checkOut,
            price,
            await usdc.getAddress(),
            validUntil,
            quantity,
            await ethers.provider.send("eth_chainId"),
            await escrowFactory.getAddress(),
          ]
        )
      );
      const badSignature = await wrongSigner.signMessage(ethers.getBytes(messageHash));

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity,
          signature: badSignature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidQuote");
    });

    it("should revert with unsupported currency", async function () {
      const price = BigInt(320_000000);
      const validUntil = (await time.latest()) + 3600;
      const quantity = 2;

      // Use random address as currency
      const fakeCurrency = Wallet.createRandom().address;

      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        fakeCurrency,
        validUntil,
        quantity,
        await escrowFactory.getAddress()
      );

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: fakeCurrency,
          validUntil,
          quantity,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "UnsupportedCurrency");
    });

    it("should revert when paused", async function () {
      await escrowFactory.pause();

      const price = BigInt(320_000000);
      const validUntil = (await time.latest()) + 3600;
      const quantity = 2;

      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        quantity,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "EnforcedPause");
    });
  });

  describe("Additional View Functions", function () {
    beforeEach(async function () {
      // Create an escrow first
      const price = BigInt(320_000000);
      const validUntil = (await time.latest()) + 3600;
      const quantity = 2;

      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        quantity,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await escrowFactory.connect(traveler).createTravelEscrowWithQuote({
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await usdc.getAddress(),
        validUntil,
        quantity,
        signature,
      });
    });

    it("should get user escrows", async function () {
      const escrows = await escrowFactory.getUserEscrows(traveler.address);
      expect(escrows.length).to.equal(1);
      expect(escrows[0]).to.equal(0);
    });

    it("should get escrow address by ID", async function () {
      const escrowAddr = await escrowFactory.escrows(0);
      expect(escrowAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("should get batch escrows", async function () {
      const batchEscrows = await escrowFactory.getBatchEscrows(0);
      expect(batchEscrows.length).to.equal(0); // Single escrows aren't in batches
    });
  });

  describe("Additional Admin Functions", function () {
    it("should allow owner to set admin", async function () {
      await escrowFactory.setAdmin(traveler.address);
      expect(await escrowFactory.admin()).to.equal(traveler.address);
    });

    it("should allow owner to set backend signer", async function () {
      await escrowFactory.setBackendSigner(traveler.address);
      expect(await escrowFactory.backendSigner()).to.equal(traveler.address);
    });

    it("should allow owner to set property NFT", async function () {
      await escrowFactory.setPropertyNFT(traveler.address);
      expect(await escrowFactory.propertyNFT()).to.equal(traveler.address);
    });

    it("should allow owner to set USDC", async function () {
      await escrowFactory.setUSDC(traveler.address);
      expect(await escrowFactory.USDC()).to.equal(traveler.address);
    });

    it("should allow owner to set EURC", async function () {
      await escrowFactory.setEURC(traveler.address);
      expect(await escrowFactory.EURC()).to.equal(traveler.address);
    });

    it("should allow owner to set escrow registry", async function () {
      const newRegistry = traveler.address;
      await escrowFactory.setEscrowRegistry(newRegistry);
      expect(await escrowFactory.escrowRegistry()).to.equal(newRegistry);
    });

    it("should allow owner to set escrow deployer", async function () {
      const newDeployer = traveler.address;
      await escrowFactory.setEscrowDeployer(newDeployer);
      expect(await escrowFactory.escrowDeployer()).to.equal(newDeployer);
    });

    it("should revert if setting admin to zero address", async function () {
      await expect(escrowFactory.setAdmin(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should revert if setting backend signer to zero address", async function () {
      await expect(
        escrowFactory.setBackendSigner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should revert if setting property NFT to zero address", async function () {
      await expect(escrowFactory.setPropertyNFT(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should revert if setting USDC to zero address", async function () {
      await expect(escrowFactory.setUSDC(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should revert if setting EURC to zero address", async function () {
      await expect(escrowFactory.setEURC(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should revert if setting escrow registry to zero address", async function () {
      await expect(
        escrowFactory.setEscrowRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should revert if setting escrow deployer to zero address", async function () {
      await expect(
        escrowFactory.setEscrowDeployer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });
  });

  describe("Create Batch Travel Escrow", function () {
    let tokenId2: bigint;
    let tokenId3: bigint;

    beforeEach(async function () {
      // Add more room types for batch booking
      await roomTypeNFT.connect(host).addRoomType(
        1,
        "Deluxe Room",
        "ipfs://room2",
        150_000000, // 150 USDC
        20_000000,
        2,
        5
      );

      await roomTypeNFT.connect(host).addRoomType(
        1,
        "Suite",
        "ipfs://room3",
        200_000000, // 200 USDC
        30_000000,
        4,
        3
      );

      tokenId2 = await roomTypeNFT.encodeTokenId(1, 2);
      tokenId3 = await roomTypeNFT.encodeTokenId(1, 3);

      // Set availability for all rooms
      await availabilityManager.connect(host).setAvailability(tokenId2, 0, checkIn, checkOut, true);
      await availabilityManager.connect(host).setAvailability(tokenId3, 0, checkIn, checkOut, true);
    });

    it("should create batch escrow with valid quote", async function () {
      const room1Price = BigInt(320_000000); // 100*3 + 20
      const room2Price = BigInt(470_000000); // 150*3 + 20
      const totalPrice = room1Price + room2Price;
      const validUntil = (await time.latest()) + 3600;

      const signature = await signBatchQuote(
        [tokenId, tokenId2],
        [2, 2],
        [room1Price, room2Price],
        checkIn,
        checkOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [
            { tokenId, quantity: 2, price: room1Price },
            { tokenId: tokenId2, quantity: 2, price: room2Price },
          ],
          checkIn,
          checkOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.emit(escrowFactory, "BatchBookingCreated");
    });

    it("should revert with empty room list", async function () {
      const validUntil = (await time.latest()) + 3600;
      const signature = await signBatchQuote(
        [],
        [],
        [],
        checkIn,
        checkOut,
        0,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [],
          checkIn,
          checkOut,
          totalPrice: 0,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "EmptyRoomList");
    });

    it("should revert with invalid batch quote signature", async function () {
      const room1Price = BigInt(320_000000);
      const room2Price = BigInt(470_000000);
      const totalPrice = room1Price + room2Price;
      const validUntil = (await time.latest()) + 3600;

      // Sign with wrong data
      const wrongSignature = await signBatchQuote(
        [tokenId, tokenId2],
        [2, 2],
        [room1Price, room2Price + BigInt(1)], // Wrong price
        checkIn,
        checkOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [
            { tokenId, quantity: 2, price: room1Price },
            { tokenId: tokenId2, quantity: 2, price: room2Price },
          ],
          checkIn,
          checkOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature: wrongSignature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidQuote");
    });

    it("should revert with expired batch quote", async function () {
      const room1Price = BigInt(320_000000);
      const room2Price = BigInt(470_000000);
      const totalPrice = room1Price + room2Price;
      const validUntil = (await time.latest()) - 100; // Already expired

      const signature = await signBatchQuote(
        [tokenId, tokenId2],
        [2, 2],
        [room1Price, room2Price],
        checkIn,
        checkOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [
            { tokenId, quantity: 2, price: room1Price },
            { tokenId: tokenId2, quantity: 2, price: room2Price },
          ],
          checkIn,
          checkOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "QuoteExpired");
    });

    it("should revert when rooms from different properties", async function () {
      // Create a second property
      await propertyRegistry
        .connect(host)
        .createProperty("ipfs://property2", "apartment", "London");
      await roomTypeNFT
        .connect(host)
        .addRoomType(2, "Standard Room", "ipfs://room4", 120_000000, 15_000000, 2, 3);

      const tokenId4 = await roomTypeNFT.encodeTokenId(2, 1);
      await availabilityManager.connect(host).setAvailability(tokenId4, 0, checkIn, checkOut, true);

      const room1Price = BigInt(320_000000);
      const room2Price = BigInt(375_000000); // 120*3 + 15
      const totalPrice = room1Price + room2Price;
      const validUntil = (await time.latest()) + 3600;

      const signature = await signBatchQuote(
        [tokenId, tokenId4],
        [2, 2],
        [room1Price, room2Price],
        checkIn,
        checkOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [
            { tokenId, quantity: 2, price: room1Price },
            { tokenId: tokenId4, quantity: 2, price: room2Price },
          ],
          checkIn,
          checkOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should revert when total price doesn't match sum", async function () {
      const room1Price = BigInt(320_000000);
      const room2Price = BigInt(470_000000);
      const wrongTotalPrice = room1Price + room2Price + BigInt(1000); // Wrong total
      const validUntil = (await time.latest()) + 3600;

      const signature = await signBatchQuote(
        [tokenId, tokenId2],
        [2, 2],
        [room1Price, room2Price],
        checkIn,
        checkOut,
        wrongTotalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), wrongTotalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [
            { tokenId, quantity: 2, price: room1Price },
            { tokenId: tokenId2, quantity: 2, price: room2Price },
          ],
          checkIn,
          checkOut,
          totalPrice: wrongTotalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAmount");
    });
  });

  describe("Additional Error Coverage", function () {
    let checkIn: number;
    let checkOut: number;
    let validUntil: number;

    beforeEach(async function () {
      const now = await time.latest();
      checkIn = Math.floor(now / 86400) * 86400 + 86400;
      checkOut = checkIn + 86400 * 3;
      validUntil = now + 3600;
    });

    it("should revert if checkAvailability returns false", async function () {
      // Use a time that's not available
      const unavailableCheckIn = checkIn + 86400 * 100;
      const unavailableCheckOut = unavailableCheckIn + 86400 * 3;

      const price = BigInt(300_000000);
      const signature = await signQuote(
        tokenId,
        unavailableCheckIn,
        unavailableCheckOut,
        price,
        await usdc.getAddress(),
        validUntil,
        2,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, price);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn: unavailableCheckIn,
          checkOut: unavailableCheckOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity: 2,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAmount");
    });

    it("should revert if traveler is the host (batch)", async function () {
      const room1Price = BigInt(320_000000);
      const totalPrice = room1Price;

      const signature = await signBatchQuote(
        [tokenId],
        [2],
        [room1Price],
        checkIn,
        checkOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.mint(host.address, totalPrice);
      await usdc.connect(host).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(host).createBatchTravelEscrow({
          rooms: [{ tokenId, quantity: 2, price: room1Price }],
          checkIn,
          checkOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should revert if batch currency is not USDC or EURC", async function () {
      const room1Price = BigInt(320_000000);
      const totalPrice = room1Price;
      const invalidToken = traveler.address; // Not USDC or EURC

      const signature = await signBatchQuote(
        [tokenId],
        [2],
        [room1Price],
        checkIn,
        checkOut,
        totalPrice,
        invalidToken,
        validUntil,
        await escrowFactory.getAddress()
      );

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [{ tokenId, quantity: 2, price: room1Price }],
          checkIn,
          checkOut,
          totalPrice,
          currency: invalidToken,
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "UnsupportedCurrency");
    });

    it("should revert if batch room is not available", async function () {
      const unavailableCheckIn = checkIn + 86400 * 100;
      const unavailableCheckOut = unavailableCheckIn + 86400 * 3;

      const room1Price = BigInt(320_000000);
      const totalPrice = room1Price;

      const signature = await signBatchQuote(
        [tokenId],
        [2],
        [room1Price],
        unavailableCheckIn,
        unavailableCheckOut,
        totalPrice,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, totalPrice);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), totalPrice);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [{ tokenId, quantity: 2, price: room1Price }],
          checkIn: unavailableCheckIn,
          checkOut: unavailableCheckOut,
          totalPrice,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAmount");
    });

    it("should use minFee when calculated fee is too low", async function () {
      // Set min fee to 1 USDC
      await escrowFactory.setMinFee(BigInt(1_000000));

      // Use price of 5 USDC so fee calculation (7.5%) = 0.375 < 1 USDC minFee, but 1 USDC < 5 USDC
      const price = BigInt(5_000000);
      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        2,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, price);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      // Should succeed - fee will be set to minFee (1 USDC) which is < price (5 USDC)
      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity: 2,
          signature,
        })
      ).to.emit(escrowFactory, "EscrowCreated");
    });

    it("should revert if fee >= price (single escrow)", async function () {
      // Set platform fee to 100% (10000 basis points)
      await escrowFactory.setPlatformFee(10000);

      const price = BigInt(100_000000);
      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        2,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, price);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote({
          tokenId,
          checkIn,
          checkOut,
          price,
          currency: await usdc.getAddress(),
          validUntil,
          quantity: 2,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidFee");
    });

    it("should use minFee when calculated fee is too low (batch)", async function () {
      // Set min fee to 10 USDC
      await escrowFactory.setMinFee(BigInt(10_000000));

      // Use price of 50 USDC so fee (7.5%) = 3.75 < 10 USDC minFee, but 10 USDC < 50 USDC
      const price = BigInt(50_000000);
      const signature = await signBatchQuote(
        [tokenId],
        [2],
        [price],
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, price);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      // Should succeed - fee will be set to minFee (10 USDC) which is < price (50 USDC)
      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [{ tokenId, quantity: 2, price }],
          checkIn,
          checkOut,
          totalPrice: price,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.emit(escrowFactory, "BatchBookingCreated");
    });

    it("should revert if fee >= price (batch)", async function () {
      // Set platform fee to 100%
      await escrowFactory.setPlatformFee(10000);

      const price = BigInt(100_000000);
      const signature = await signBatchQuote(
        [tokenId],
        [2],
        [price],
        checkIn,
        checkOut,
        price,
        await usdc.getAddress(),
        validUntil,
        await escrowFactory.getAddress()
      );

      await usdc.mint(traveler.address, price);
      await usdc.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createBatchTravelEscrow({
          rooms: [{ tokenId, quantity: 2, price }],
          checkIn,
          checkOut,
          totalPrice: price,
          currency: await usdc.getAddress(),
          validUntil,
          signature,
        })
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidFee");
    });
  });
});
