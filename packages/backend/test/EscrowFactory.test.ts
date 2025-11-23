import { expect } from "chai";
import { network } from "hardhat";
import type { EscrowFactory, PropertyNFT, HostSBT, MockERC20 } from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("EscrowFactory", function () {
  let escrowFactory: EscrowFactory;
  let propertyNFT: PropertyNFT;
  let hostSBT: HostSBT;
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let admin: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let backendSigner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  // Mock USDC/EURC
  let USDC: MockERC20;
  let EURC: MockERC20;

  const PROPERTY_TYPE = "hotel";
  const LOCATION = "Paris, France";
  const IPFS_HASH = "ipfs://QmTest123";

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, _platform, _admin, _backendSigner, _host, _traveler] = await ethers.getSigners();
    platform = _platform;
    admin = _admin;
    backendSigner = _backendSigner;
    host = _host;
    traveler = _traveler;

    // Deploy mock USDC and EURC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    USDC = (await MockERC20.deploy("USD Coin", "USDC", 6)) as unknown as MockERC20;
    EURC = (await MockERC20.deploy("EUR Coin", "EURC", 6)) as unknown as MockERC20;

    // Mint tokens to traveler
    await USDC.mint(traveler.address, ethers.parseUnits("10000", 6));
    await EURC.mint(traveler.address, ethers.parseUnits("10000", 6));

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Deploy PropertyNFT
    const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = (await PropertyNFTFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyNFT;

    // Deploy EscrowFactory
    const EscrowFactoryFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = (await EscrowFactoryFactory.deploy(
      platform.address,
      admin.address,
      backendSigner.address,
      await USDC.getAddress(),
      await EURC.getAddress()
    )) as unknown as EscrowFactory;

    // Link contracts
    await propertyNFT.setEscrowFactory(await escrowFactory.getAddress());
    await escrowFactory.setPropertyNFT(await propertyNFT.getAddress());

    // Authorize PropertyNFT to update HostSBT reputation
    await hostSBT.setAuthorizedUpdater(await propertyNFT.getAddress(), true);

    // Setup host and property
    await hostSBT.mint(host.address);
    await propertyNFT.connect(host).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
    await propertyNFT.connect(host).addRoomType(1, "Standard Room", 5, IPFS_HASH);
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await escrowFactory.platformWallet()).to.equal(platform.address);
      expect(await escrowFactory.admin()).to.equal(admin.address);
      expect(await escrowFactory.backendSigner()).to.equal(backendSigner.address);
      expect(await escrowFactory.USDC()).to.equal(await USDC.getAddress());
      expect(await escrowFactory.EURC()).to.equal(await EURC.getAddress());
    });

    it("should set default platform fee", async function () {
      expect(await escrowFactory.platformFeePercent()).to.equal(750); // 7.5%
    });

    it("should revert on invalid constructor params", async function () {
      const EscrowFactoryFactory = await ethers.getContractFactory("EscrowFactory");

      await expect(
        EscrowFactoryFactory.deploy(
          ethers.ZeroAddress,
          admin.address,
          backendSigner.address,
          await USDC.getAddress(),
          await EURC.getAddress()
        )
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });
  });

  describe("Quote Signing & Verification", function () {
    let tokenId: bigint;
    let checkIn: number;
    let checkOut: number;
    const price = ethers.parseUnits("500", 6); // 500 USDC

    beforeEach(async function () {
      tokenId = await propertyNFT.encodeTokenId(1, 0);
      checkIn = (await time.latest()) + 86400; // Tomorrow
      checkOut = checkIn + 86400 * 3; // 3 days

      // Set availability
      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);
    });

    async function signQuote(
      _tokenId: bigint,
      _checkIn: number,
      _checkOut: number,
      _price: bigint,
      _currency: string,
      _validUntil: number
    ) {
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [_tokenId, _checkIn, _checkOut, _price, _currency, _validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));
      return signature;
    }

    it("should verify valid quote signature", async function () {
      const validUntil = (await time.latest()) + 300; // 5min
      const signature = await signQuote(
        tokenId,
        checkIn,
        checkOut,
        price,
        await USDC.getAddress(),
        validUntil
      );

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      const isValid = await escrowFactory.verifyQuote(quote);
      expect(isValid).to.be.true;
    });

    it("should reject invalid signature", async function () {
      const validUntil = (await time.latest()) + 300;
      const wrongSigner = traveler;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await wrongSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      const isValid = await escrowFactory.verifyQuote(quote);
      expect(isValid).to.be.false;
    });
  });

  describe("Create TravelEscrow with Quote", function () {
    let tokenId: bigint;
    let checkIn: number;
    let checkOut: number;
    const price = ethers.parseUnits("500", 6);

    beforeEach(async function () {
      tokenId = await propertyNFT.encodeTokenId(1, 0);
      checkIn = (await time.latest()) + 86400;
      checkOut = checkIn + 86400 * 3;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);
    });

    async function createValidQuote(currency: string) {
      const validUntil = (await time.latest()) + 300;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, currency, validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      return {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency,
        validUntil,
        signature,
      };
    }

    it("should create TravelEscrow with valid USDC quote", async function () {
      const quote = await createValidQuote(await USDC.getAddress());

      // Approve USDC
      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      const tx = await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "TravelEscrowCreated"
      );

      expect(event).to.not.be.undefined;

      // Check escrow count
      expect(await escrowFactory.escrowCount()).to.equal(1);
    });

    it("should create TravelEscrow with valid EURC quote", async function () {
      const quote = await createValidQuote(await EURC.getAddress());

      await EURC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)).to.emit(
        escrowFactory,
        "TravelEscrowCreated"
      );
    });

    it("should revert if quote expired", async function () {
      const expiredValidUntil = (await time.latest()) - 100;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), expiredValidUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil: expiredValidUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "QuoteExpired");
    });

    it("should revert if unsupported currency", async function () {
      const quote = await createValidQuote(traveler.address); // Wrong currency

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "UnsupportedCurrency");
    });

    it("should revert if room not available", async function () {
      // Book all 5 rooms
      for (let i = 0; i < 5; i++) {
        const quote = await createValidQuote(await USDC.getAddress());
        await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);
        await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);
      }

      // 6th booking should fail
      const quote = await createValidQuote(await USDC.getAddress());
      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAmount");
    });

    it("should transfer tokens to escrow", async function () {
      const quote = await createValidQuote(await USDC.getAddress());

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      const balanceBefore = await USDC.balanceOf(traveler.address);

      const tx = await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);
      const receipt = await tx.wait();

      const balanceAfter = await USDC.balanceOf(traveler.address);
      expect(balanceBefore - balanceAfter).to.equal(price);

      // Get escrow address from event
      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "EscrowCreated"
      ) as any;
      const escrowAddress = event?.args[0];

      // Check escrow has the funds
      expect(await USDC.balanceOf(escrowAddress)).to.equal(price);
    });

    it("should calculate and enforce platform fee", async function () {
      const quote = await createValidQuote(await USDC.getAddress());

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);

      const expectedFee = (price * 750n) / 10000n; // 7.5%
      const calculatedFee = await escrowFactory.calculateFee(price);
      expect(calculatedFee).to.equal(expectedFee);
    });

    it("should enforce minimum fee", async function () {
      const smallPrice = ethers.parseUnits("1", 6); // 1 USDC
      const minFee = await escrowFactory.minFee(); // 0.5 USDC

      const calculatedFee = await escrowFactory.calculateFee(smallPrice);
      expect(calculatedFee).to.equal(minFee);
    });
  });

  describe("Admin Functions", function () {
    it("should update platform fee", async function () {
      const newFee = 500; // 5%
      await expect(escrowFactory.setPlatformFee(newFee))
        .to.emit(escrowFactory, "PlatformFeeUpdated")
        .withArgs(750, newFee);

      expect(await escrowFactory.platformFeePercent()).to.equal(newFee);
    });

    it("should revert if fee > 10%", async function () {
      await expect(escrowFactory.setPlatformFee(1001)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidFee"
      );
    });

    it("should update min fee", async function () {
      const newMinFee = ethers.parseUnits("1", 6);
      await expect(escrowFactory.setMinFee(newMinFee))
        .to.emit(escrowFactory, "MinFeeUpdated")
        .withArgs(ethers.parseUnits("0.5", 6), newMinFee);
    });

    it("should update platform wallet", async function () {
      const newWallet = traveler.address;
      await expect(escrowFactory.setPlatformWallet(newWallet))
        .to.emit(escrowFactory, "PlatformWalletUpdated")
        .withArgs(platform.address, newWallet);
    });

    it("should revert on zero address for platform wallet", async function () {
      await expect(
        escrowFactory.setPlatformWallet(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should update backend signer", async function () {
      await expect(escrowFactory.setBackendSigner(traveler.address))
        .to.emit(escrowFactory, "BackendSignerUpdated")
        .withArgs(backendSigner.address, traveler.address);
    });

    it("should revert on zero address for backend signer", async function () {
      await expect(
        escrowFactory.setBackendSigner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should update PropertyNFT address", async function () {
      const newPropertyNFT = traveler.address;
      await expect(escrowFactory.setPropertyNFT(newPropertyNFT)).to.emit(
        escrowFactory,
        "PropertyNFTUpdated"
      );
    });

    it("should revert on zero address for PropertyNFT", async function () {
      await expect(escrowFactory.setPropertyNFT(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should update USDC address", async function () {
      const newUSDC = traveler.address;
      await expect(escrowFactory.setUSDC(newUSDC))
        .to.emit(escrowFactory, "CurrencyUpdated")
        .withArgs(newUSDC, "USDC");
    });

    it("should revert on zero address for USDC", async function () {
      await expect(escrowFactory.setUSDC(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should update EURC address", async function () {
      const newEURC = traveler.address;
      await expect(escrowFactory.setEURC(newEURC))
        .to.emit(escrowFactory, "CurrencyUpdated")
        .withArgs(newEURC, "EURC");
    });

    it("should revert on zero address for EURC", async function () {
      await expect(escrowFactory.setEURC(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });

    it("should only allow owner to update settings", async function () {
      await expect(
        escrowFactory.connect(traveler).setPlatformFee(500)
      ).to.be.revertedWithCustomError(escrowFactory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pause Functionality", function () {
    it("should pause contract", async function () {
      await escrowFactory.pause();
      expect(await escrowFactory.paused()).to.be.true;
    });

    it("should unpause contract", async function () {
      await escrowFactory.pause();
      await escrowFactory.unpause();
      expect(await escrowFactory.paused()).to.be.false;
    });

    it("should block operations when paused", async function () {
      await escrowFactory.pause();

      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "EnforcedPause");
    });
  });

  describe("View Functions", function () {
    it("should return user escrows", async function () {
      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);
      await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);

      const userEscrows = await escrowFactory.getUserEscrows(traveler.address);
      expect(userEscrows.length).to.equal(1);

      const hostEscrows = await escrowFactory.getUserEscrows(host.address);
      expect(hostEscrows.length).to.equal(1);
    });

    it("should check if currency is supported", async function () {
      expect(await escrowFactory.isCurrencySupported(await USDC.getAddress())).to.be.true;
      expect(await escrowFactory.isCurrencySupported(await EURC.getAddress())).to.be.true;
      expect(await escrowFactory.isCurrencySupported(traveler.address)).to.be.false;
    });

    it("should get escrow address by ID", async function () {
      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);
      await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);

      const escrowAddress = await escrowFactory.getEscrowAddress(0);
      expect(escrowAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should calculate fee correctly", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const fee = await escrowFactory.calculateFee(amount);

      // Platform fee is 7.5% (750 basis points)
      const expectedFee = (amount * 750n) / 10000n;
      expect(fee).to.equal(expectedFee);
    });

    it("should get TravelEscrow details", async function () {
      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);
      await escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote);

      const escrowAddress = await escrowFactory.getEscrowAddress(0);
      const details = await escrowFactory.getTravelEscrowDetails(escrowAddress);

      expect(details.traveler).to.equal(traveler.address);
      expect(details.host).to.equal(host.address);
      expect(details.token).to.equal(await USDC.getAddress());
      expect(details.amount).to.equal(price);
    });
  });

  describe("Admin Management", function () {
    it("should update admin address", async function () {
      const newAdmin = admin.address;
      await expect(escrowFactory.setAdmin(newAdmin)).to.emit(escrowFactory, "AdminUpdated");
      expect(await escrowFactory.admin()).to.equal(newAdmin);
    });

    it("should revert setAdmin with zero address", async function () {
      await expect(escrowFactory.setAdmin(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrowFactory,
        "InvalidAddress"
      );
    });
  });

  describe("Edge Cases", function () {
    it("should revert when host tries to book own property", async function () {
      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(host).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(host).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });

    it("should revert when fee >= price", async function () {
      // Create a scenario where minFee would be >= price
      // First, set a very high min fee
      const highMinFee = ethers.parseUnits("1000", 6); // 1000 USDC
      await escrowFactory.setMinFee(highMinFee);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const lowPrice = ethers.parseUnits("500", 6); // 500 USDC (less than minFee)
      const validUntil = (await time.latest()) + 300;

      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, lowPrice, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price: lowPrice,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), lowPrice);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidFee");
    });

    it("should revert when propertyNFT is not set", async function () {
      // Deploy a new factory without setting propertyNFT
      const EscrowFactoryFactory = await ethers.getContractFactory("EscrowFactory");
      const newFactory = (await EscrowFactoryFactory.deploy(
        platform.address,
        admin.address,
        backendSigner.address,
        await USDC.getAddress(),
        await EURC.getAddress()
      )) as unknown as EscrowFactory;

      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await newFactory.getAddress(), price);

      await expect(
        newFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");
    });

    it.skip("should revert when property has no owner", async function () {
      // Create property but then transfer ownership to address(0) through PropertyNFT
      // This tests line 157: if (host == address(0)) revert InvalidAddress();

      // First, let's create a property with ID 2
      await propertyNFT.connect(host).createProperty(IPFS_HASH, PROPERTY_TYPE, "Test Location");
      await propertyNFT.connect(host).addRoomType(2, "Standard", 5, IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(2, 0);
      const checkIn = (await time.latest()) + 86400;
      const checkOut = checkIn + 86400 * 3;
      const price = ethers.parseUnits("500", 6);
      const validUntil = (await time.latest()) + 300;

      // Set availability BEFORE transferring ownership
      await propertyNFT.connect(host).setAvailability(tokenId, checkIn, checkOut, 5);

      // Transfer property ownership to address(0) using platform
      await propertyNFT.connect(platform).transferPropertyOwnership(2, ethers.ZeroAddress);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256", "uint256", "address", "uint256"],
        [tokenId, checkIn, checkOut, price, await USDC.getAddress(), validUntil]
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      const quote = {
        tokenId,
        checkIn,
        checkOut,
        price,
        currency: await USDC.getAddress(),
        validUntil,
        signature,
      };

      await USDC.connect(traveler).approve(await escrowFactory.getAddress(), price);

      await expect(
        escrowFactory.connect(traveler).createTravelEscrowWithQuote(quote)
      ).to.be.revertedWithCustomError(escrowFactory, "InvalidAddress");
    });
  });
});
