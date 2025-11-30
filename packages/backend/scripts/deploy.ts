import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Full deployment script for NomadNodes platform
 *
 * Deploys all contracts in correct order:
 * 1. Mock Tokens (USDC, EURC)
 * 2. SBTs (TravelerSBT, HostSBT)
 * 3. Property System (PropertyRegistry, RoomTypeNFT, AvailabilityManager, BookingManager)
 * 4. PropertyNFTAdapter (facade for EscrowFactory compatibility)
 * 5. Escrow System (EscrowRegistry, EscrowDeployer, EscrowFactory)
 * 6. Review System (ReviewRegistry, ReviewValidator)
 *
 * Then configures all contract interconnections and exports:
 * - ABIs to frontend and indexer
 * - Addresses to .env files
 *
 * Usage: pnpm deploy:local or pnpm deploy:sepolia
 */

interface DeployedAddresses {
  // Tokens
  usdc: string;
  eurc: string;
  // SBTs
  travelerSBT: string;
  hostSBT: string;
  // Property System
  propertyRegistry: string;
  roomTypeNFT: string;
  availabilityManager: string;
  bookingManager: string;
  propertyNFTAdapter: string;
  // Escrow System
  escrowRegistry: string;
  escrowDeployer: string;
  escrowFactory: string;
  // Review System
  reviewRegistry: string;
  reviewValidator: string;
}

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("\n" + "=".repeat(60));
  console.log("🚀 NomadNodes Full Deployment");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName} (chainId: ${chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`
  );

  // For testnet, use deployer as platform/admin/signer
  // In production, these should be separate addresses (multisigs)
  const platformWallet = deployer.address;
  const adminWallet = deployer.address;
  const backendSigner = deployer.address;

  console.log("📋 Configuration:");
  console.log(`  Platform Wallet: ${platformWallet}`);
  console.log(`  Admin Wallet: ${adminWallet}`);
  console.log(`  Backend Signer: ${backendSigner}`);
  console.log("");

  const addresses: DeployedAddresses = {} as DeployedAddresses;

  // =====================================================
  // PHASE 1: Deploy Token Contracts
  // =====================================================
  console.log("📦 Phase 1: Deploying Token Contracts...\n");

  // Deploy MockUSDC
  console.log("  Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  addresses.usdc = await usdc.getAddress();
  console.log(`  ✅ MockUSDC: ${addresses.usdc}`);

  // Deploy MockEURC
  console.log("  Deploying MockEURC...");
  const eurc = await MockERC20.deploy("Euro Coin", "EURC", 6);
  await eurc.waitForDeployment();
  addresses.eurc = await eurc.getAddress();
  console.log(`  ✅ MockEURC: ${addresses.eurc}`);

  // =====================================================
  // PHASE 2: Deploy SBT Contracts
  // =====================================================
  console.log("\n📦 Phase 2: Deploying SBT Contracts...\n");

  // Deploy TravelerSBT
  console.log("  Deploying TravelerSBT...");
  const TravelerSBT = await ethers.getContractFactory("TravelerSBT");
  const travelerSBT = await TravelerSBT.deploy();
  await travelerSBT.waitForDeployment();
  addresses.travelerSBT = await travelerSBT.getAddress();
  console.log(`  ✅ TravelerSBT: ${addresses.travelerSBT}`);

  // Deploy HostSBT
  console.log("  Deploying HostSBT...");
  const HostSBT = await ethers.getContractFactory("HostSBT");
  const hostSBT = await HostSBT.deploy();
  await hostSBT.waitForDeployment();
  addresses.hostSBT = await hostSBT.getAddress();
  console.log(`  ✅ HostSBT: ${addresses.hostSBT}`);

  // =====================================================
  // PHASE 3: Deploy Property System
  // =====================================================
  console.log("\n📦 Phase 3: Deploying Property System...\n");

  // Deploy PropertyRegistry
  console.log("  Deploying PropertyRegistry...");
  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistry.deploy(addresses.hostSBT, platformWallet);
  await propertyRegistry.waitForDeployment();
  addresses.propertyRegistry = await propertyRegistry.getAddress();
  console.log(`  ✅ PropertyRegistry: ${addresses.propertyRegistry}`);

  // Deploy RoomTypeNFT
  console.log("  Deploying RoomTypeNFT...");
  const RoomTypeNFT = await ethers.getContractFactory("RoomTypeNFT");
  const roomTypeNFT = await RoomTypeNFT.deploy(addresses.propertyRegistry);
  await roomTypeNFT.waitForDeployment();
  addresses.roomTypeNFT = await roomTypeNFT.getAddress();
  console.log(`  ✅ RoomTypeNFT: ${addresses.roomTypeNFT}`);

  // Deploy AvailabilityManager
  console.log("  Deploying AvailabilityManager...");
  const AvailabilityManager = await ethers.getContractFactory("AvailabilityManager");
  const availabilityManager = await AvailabilityManager.deploy(addresses.roomTypeNFT);
  await availabilityManager.waitForDeployment();
  addresses.availabilityManager = await availabilityManager.getAddress();
  console.log(`  ✅ AvailabilityManager: ${addresses.availabilityManager}`);

  // Deploy BookingManager
  console.log("  Deploying BookingManager...");
  const BookingManager = await ethers.getContractFactory("BookingManager");
  const bookingManager = await BookingManager.deploy(
    addresses.propertyRegistry,
    addresses.roomTypeNFT,
    addresses.availabilityManager,
    addresses.travelerSBT
  );
  await bookingManager.waitForDeployment();
  addresses.bookingManager = await bookingManager.getAddress();
  console.log(`  ✅ BookingManager: ${addresses.bookingManager}`);

  // Deploy PropertyNFTAdapter (facade for backward compatibility)
  console.log("  Deploying PropertyNFTAdapter...");
  const PropertyNFTAdapter = await ethers.getContractFactory("PropertyNFTAdapter");
  const propertyNFTAdapter = await PropertyNFTAdapter.deploy(
    addresses.propertyRegistry,
    addresses.roomTypeNFT,
    addresses.availabilityManager,
    addresses.bookingManager
  );
  await propertyNFTAdapter.waitForDeployment();
  addresses.propertyNFTAdapter = await propertyNFTAdapter.getAddress();
  console.log(`  ✅ PropertyNFTAdapter: ${addresses.propertyNFTAdapter}`);

  // =====================================================
  // PHASE 4: Deploy Escrow System
  // =====================================================
  console.log("\n📦 Phase 4: Deploying Escrow System...\n");

  // Deploy EscrowRegistry
  console.log("  Deploying EscrowRegistry...");
  const EscrowRegistry = await ethers.getContractFactory("EscrowRegistry");
  const escrowRegistry = await EscrowRegistry.deploy();
  await escrowRegistry.waitForDeployment();
  addresses.escrowRegistry = await escrowRegistry.getAddress();
  console.log(`  ✅ EscrowRegistry: ${addresses.escrowRegistry}`);

  // Deploy EscrowDeployer
  console.log("  Deploying EscrowDeployer...");
  const EscrowDeployer = await ethers.getContractFactory("EscrowDeployer");
  const escrowDeployer = await EscrowDeployer.deploy();
  await escrowDeployer.waitForDeployment();
  addresses.escrowDeployer = await escrowDeployer.getAddress();
  console.log(`  ✅ EscrowDeployer: ${addresses.escrowDeployer}`);

  // Deploy EscrowFactory
  console.log("  Deploying EscrowFactory...");
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(
    platformWallet,
    adminWallet,
    backendSigner,
    addresses.usdc,
    addresses.eurc
  );
  await escrowFactory.waitForDeployment();
  addresses.escrowFactory = await escrowFactory.getAddress();
  console.log(`  ✅ EscrowFactory: ${addresses.escrowFactory}`);

  // =====================================================
  // PHASE 5: Deploy Review System
  // =====================================================
  console.log("\n📦 Phase 5: Deploying Review System...\n");

  // Deploy ReviewRegistry
  console.log("  Deploying ReviewRegistry...");
  const ReviewRegistry = await ethers.getContractFactory("ReviewRegistry");
  const reviewRegistry = await ReviewRegistry.deploy(
    addresses.travelerSBT,
    addresses.hostSBT,
    addresses.propertyNFTAdapter, // Uses PropertyNFTAdapter as IPropertyNFT
    addresses.propertyRegistry
  );
  await reviewRegistry.waitForDeployment();
  addresses.reviewRegistry = await reviewRegistry.getAddress();
  console.log(`  ✅ ReviewRegistry: ${addresses.reviewRegistry}`);

  // Deploy ReviewValidator
  console.log("  Deploying ReviewValidator...");
  const ReviewValidator = await ethers.getContractFactory("ReviewValidator");
  const reviewValidator = await ReviewValidator.deploy(
    addresses.propertyNFTAdapter, // Uses PropertyNFTAdapter as IPropertyNFT
    addresses.reviewRegistry
  );
  await reviewValidator.waitForDeployment();
  addresses.reviewValidator = await reviewValidator.getAddress();
  console.log(`  ✅ ReviewValidator: ${addresses.reviewValidator}`);

  // =====================================================
  // PHASE 6: Configure Contract Interconnections
  // =====================================================
  console.log("\n🔧 Phase 6: Configuring Contract Interconnections...\n");

  // PropertyRegistry setters
  console.log("  Configuring PropertyRegistry...");
  await propertyRegistry.setRoomTypeNFT(addresses.roomTypeNFT);
  await propertyRegistry.setBookingManager(addresses.bookingManager);
  await propertyRegistry.setReviewRegistry(addresses.reviewRegistry);
  console.log("    ✅ setRoomTypeNFT, setBookingManager, setReviewRegistry");

  // RoomTypeNFT setters
  console.log("  Configuring RoomTypeNFT...");
  await roomTypeNFT.setAvailabilityManager(addresses.availabilityManager);
  await roomTypeNFT.setBookingManager(addresses.bookingManager);
  console.log("    ✅ setAvailabilityManager, setBookingManager");

  // AvailabilityManager setters
  console.log("  Configuring AvailabilityManager...");
  await availabilityManager.setBookingManager(addresses.bookingManager);
  console.log("    ✅ setBookingManager");

  // BookingManager setters
  console.log("  Configuring BookingManager...");
  await bookingManager.setPropertyNFTAdapter(addresses.propertyNFTAdapter);
  await bookingManager.setEscrowFactory(addresses.propertyNFTAdapter); // PropertyNFTAdapter acts as facade
  await bookingManager.setReviewRegistry(addresses.reviewRegistry);
  console.log("    ✅ setPropertyNFTAdapter, setEscrowFactory, setReviewRegistry");

  // EscrowFactory setters
  console.log("  Configuring EscrowFactory...");
  await escrowFactory.setEscrowRegistry(addresses.escrowRegistry);
  await escrowFactory.setEscrowDeployer(addresses.escrowDeployer);
  await escrowFactory.setPropertyNFT(addresses.propertyNFTAdapter); // PropertyNFTAdapter implements IPropertyNFT
  console.log("    ✅ setEscrowRegistry, setEscrowDeployer, setPropertyNFT");

  // EscrowRegistry & EscrowDeployer setters
  console.log("  Configuring EscrowRegistry & EscrowDeployer...");
  await escrowRegistry.setEscrowFactory(addresses.escrowFactory);
  await escrowDeployer.setEscrowFactory(addresses.escrowFactory);
  console.log("    ✅ setEscrowFactory on both");

  // SBT authorizations
  console.log("  Configuring SBT Authorizations...");
  await hostSBT.setAuthorizedUpdater(addresses.propertyRegistry, true);
  await hostSBT.setAuthorizedUpdater(addresses.reviewRegistry, true);
  await travelerSBT.setAuthorizedUpdater(addresses.bookingManager, true);
  await travelerSBT.setAuthorizedUpdater(addresses.reviewRegistry, true);
  console.log("    ✅ HostSBT: PropertyRegistry, ReviewRegistry");
  console.log("    ✅ TravelerSBT: BookingManager, ReviewRegistry");

  // =====================================================
  // PHASE 7: Mint Test Tokens
  // =====================================================
  console.log("\n💰 Phase 7: Minting Test Tokens...\n");

  const mintAmount = ethers.parseUnits("1000000", 6); // 1M tokens
  await usdc.mint(deployer.address, mintAmount);
  console.log(`  ✅ Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer`);

  await eurc.mint(deployer.address, mintAmount);
  console.log(`  ✅ Minted ${ethers.formatUnits(mintAmount, 6)} EURC to deployer`);

  // =====================================================
  // PHASE 8: Export ABIs
  // =====================================================
  console.log("\n📦 Phase 8: Exporting ABIs...\n");
  await exportABIs();

  // =====================================================
  // PHASE 9: Update .env Files
  // =====================================================
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log(`\n📝 Phase 9: Updating .env Files (start block: ${currentBlock})...\n`);

  await updateFrontendEnv(addresses, chainId);
  await updateIndexerEnv(addresses, currentBlock);
  await saveDeploymentAddresses(addresses, chainId);

  // =====================================================
  // Summary
  // =====================================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Complete!");
  console.log("=".repeat(60));

  console.log("\n📋 Deployed Contracts:");
  console.log("  Tokens:");
  console.log(`    USDC: ${addresses.usdc}`);
  console.log(`    EURC: ${addresses.eurc}`);
  console.log("  SBTs:");
  console.log(`    TravelerSBT: ${addresses.travelerSBT}`);
  console.log(`    HostSBT: ${addresses.hostSBT}`);
  console.log("  Property System:");
  console.log(`    PropertyRegistry: ${addresses.propertyRegistry}`);
  console.log(`    RoomTypeNFT: ${addresses.roomTypeNFT}`);
  console.log(`    AvailabilityManager: ${addresses.availabilityManager}`);
  console.log(`    BookingManager: ${addresses.bookingManager}`);
  console.log(`    PropertyNFTAdapter: ${addresses.propertyNFTAdapter}`);
  console.log("  Escrow System:");
  console.log(`    EscrowRegistry: ${addresses.escrowRegistry}`);
  console.log(`    EscrowDeployer: ${addresses.escrowDeployer}`);
  console.log(`    EscrowFactory: ${addresses.escrowFactory}`);
  console.log("  Review System:");
  console.log(`    ReviewRegistry: ${addresses.reviewRegistry}`);
  console.log(`    ReviewValidator: ${addresses.reviewValidator}`);

  console.log("\n🚀 Next Steps:");
  console.log("  1. Restart the frontend: cd packages/frontend && pnpm dev");
  console.log("  2. Restart Ponder: cd packages/indexer && pnpm dev");
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log(`  3. Verify contracts: pnpm verify:${networkName}`);
  }
  console.log("");
}

/**
 * Export ABIs to frontend and indexer
 */
async function exportABIs() {
  const contracts = [
    // Tokens
    { name: "MockERC20", path: "mocks/MockERC20.sol/MockERC20.json" },
    // SBTs
    { name: "TravelerSBT", path: "TravelerSBT.sol/TravelerSBT.json" },
    { name: "HostSBT", path: "HostSBT.sol/HostSBT.json" },
    // Property System
    { name: "PropertyRegistry", path: "PropertyRegistry.sol/PropertyRegistry.json" },
    { name: "RoomTypeNFT", path: "RoomTypeNFT.sol/RoomTypeNFT.json" },
    { name: "AvailabilityManager", path: "AvailabilityManager.sol/AvailabilityManager.json" },
    { name: "BookingManager", path: "BookingManager.sol/BookingManager.json" },
    { name: "PropertyNFTAdapter", path: "PropertyNFTAdapter.sol/PropertyNFTAdapter.json" },
    // Escrow System
    { name: "EscrowRegistry", path: "EscrowRegistry.sol/EscrowRegistry.json" },
    { name: "EscrowDeployer", path: "EscrowDeployer.sol/EscrowDeployer.json" },
    { name: "EscrowFactory", path: "EscrowFactory.sol/EscrowFactory.json" },
    { name: "TravelEscrow", path: "TravelEscrow.sol/TravelEscrow.json" },
    // Review System
    { name: "ReviewRegistry", path: "ReviewRegistry.sol/ReviewRegistry.json" },
    { name: "ReviewValidator", path: "ReviewValidator.sol/ReviewValidator.json" },
  ];

  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const frontendOutputDir = path.join(__dirname, "../../frontend/lib/contracts/abis");
  const indexerOutputDir = path.join(__dirname, "../../indexer/abis");

  // Create output directories
  if (!fs.existsSync(frontendOutputDir)) {
    fs.mkdirSync(frontendOutputDir, { recursive: true });
  }
  if (!fs.existsSync(indexerOutputDir)) {
    fs.mkdirSync(indexerOutputDir, { recursive: true });
  }

  for (const contract of contracts) {
    const artifactPath = path.join(artifactsDir, contract.path);

    if (!fs.existsSync(artifactPath)) {
      console.log(`  ⚠️ Not found: ${contract.name}`);
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Export to frontend (ABI only)
    const frontendPath = path.join(frontendOutputDir, `${contract.name}.json`);
    fs.writeFileSync(frontendPath, JSON.stringify(artifact.abi, null, 2));

    // Export to indexer (full artifact for key contracts)
    const indexerContracts = [
      "PropertyRegistry",
      "RoomTypeNFT",
      "BookingManager",
      "EscrowFactory",
      "ReviewRegistry",
    ];
    if (indexerContracts.includes(contract.name)) {
      const indexerPath = path.join(indexerOutputDir, `${contract.name}.json`);
      fs.writeFileSync(indexerPath, JSON.stringify(artifact, null, 2));
    }

    console.log(`  ✅ ${contract.name}`);
  }
}

/**
 * Update frontend .env.local with new contract addresses
 */
async function updateFrontendEnv(addresses: DeployedAddresses, chainId: bigint) {
  const envPath = path.join(__dirname, "../../frontend/.env.local");

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const envMappings: Record<string, string> = {
    // Chain
    NEXT_PUBLIC_CHAIN_ID: chainId.toString(),
    // Tokens
    NEXT_PUBLIC_USDC_ADDRESS: addresses.usdc,
    NEXT_PUBLIC_EURC_ADDRESS: addresses.eurc,
    // SBTs
    NEXT_PUBLIC_TRAVELER_SBT_ADDRESS: addresses.travelerSBT,
    NEXT_PUBLIC_HOST_SBT_ADDRESS: addresses.hostSBT,
    // Property System
    NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS: addresses.propertyRegistry,
    NEXT_PUBLIC_ROOM_TYPE_NFT_ADDRESS: addresses.roomTypeNFT,
    NEXT_PUBLIC_AVAILABILITY_MANAGER_ADDRESS: addresses.availabilityManager,
    NEXT_PUBLIC_BOOKING_MANAGER_ADDRESS: addresses.bookingManager,
    NEXT_PUBLIC_PROPERTY_NFT_ADAPTER_ADDRESS: addresses.propertyNFTAdapter,
    // Escrow System
    NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS: addresses.escrowRegistry,
    NEXT_PUBLIC_ESCROW_DEPLOYER_ADDRESS: addresses.escrowDeployer,
    NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS: addresses.escrowFactory,
    // Review System
    NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS: addresses.reviewRegistry,
    NEXT_PUBLIC_REVIEW_VALIDATOR_ADDRESS: addresses.reviewValidator,
  };

  for (const [key, value] of Object.entries(envMappings)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`  ✅ Updated frontend/.env.local with ${Object.keys(envMappings).length} addresses`);
}

/**
 * Update indexer .env.local with new contract addresses and start block
 */
async function updateIndexerEnv(addresses: DeployedAddresses, startBlock: number) {
  const envPath = path.join(__dirname, "../../indexer/.env.local");

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const envMappings: Record<string, string> = {
    // Core contracts for indexing
    PROPERTY_REGISTRY_ADDRESS: addresses.propertyRegistry,
    ROOM_TYPE_NFT_ADDRESS: addresses.roomTypeNFT,
    BOOKING_MANAGER_ADDRESS: addresses.bookingManager,
    ESCROW_FACTORY_ADDRESS: addresses.escrowFactory,
    REVIEW_REGISTRY_ADDRESS: addresses.reviewRegistry,
    // Start block
    START_BLOCK: startBlock.toString(),
  };

  for (const [key, value] of Object.entries(envMappings)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`  ✅ Updated indexer/.env.local with ${Object.keys(envMappings).length} addresses`);
}

/**
 * Save deployment addresses to a JSON file for reference
 */
async function saveDeploymentAddresses(addresses: DeployedAddresses, chainId: bigint) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `chain-${chainId}.json`);
  const deploymentData = {
    chainId: chainId.toString(),
    timestamp: new Date().toISOString(),
    addresses,
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log(`  ✅ Saved deployment to deployments/chain-${chainId}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
