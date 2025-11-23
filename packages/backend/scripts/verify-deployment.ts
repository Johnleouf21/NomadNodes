import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = await network.connect();

/**
 * Verify deployment configuration and display contract status
 */
async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log(`\n🔍 Verifying deployment on ${networkName} (chainId: ${chainId})...\n`);

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, `../ignition/deployments/chain-${chainId}`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for chain ${chainId}`);
    process.exit(1);
  }

  const deployedAddresses = JSON.parse(
    fs.readFileSync(path.join(deploymentPath, "deployed_addresses.json"), "utf-8")
  );

  console.log("📋 Deployed Contracts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Object.entries(deployedAddresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(40)} ${address}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Extract addresses
  const mockUSDCAddr =
    deployedAddresses["NomadNodes#MockUSDC"] || deployedAddresses["MockTokens#MockUSDC"];
  const mockEURCAddr =
    deployedAddresses["NomadNodes#MockEURC"] || deployedAddresses["MockTokens#MockEURC"];
  const escrowFactoryAddr = deployedAddresses["NomadNodes#EscrowFactory"];
  const propertyNFTAddr =
    deployedAddresses["NomadNodes#PropertyNFT"] || deployedAddresses["PropertyNFT#PropertyNFT"];
  const hostSBTAddr =
    deployedAddresses["NomadNodes#HostSBT"] || deployedAddresses["SBTContracts#HostSBT"];
  const travelerSBTAddr =
    deployedAddresses["NomadNodes#TravelerSBT"] || deployedAddresses["SBTContracts#TravelerSBT"];
  const reviewRegistryAddr =
    deployedAddresses["NomadNodes#ReviewRegistry"] ||
    deployedAddresses["ReviewSystem#ReviewRegistry"];
  const reviewValidatorAddr =
    deployedAddresses["NomadNodes#ReviewValidator"] ||
    deployedAddresses["ReviewSystem#ReviewValidator"];

  // Check configurations
  console.log("🔍 Checking Configuration...\n");

  let allConfigured = true;

  // 1. Check EscrowFactory
  if (escrowFactoryAddr) {
    console.log("📦 EscrowFactory:");
    const escrowFactory = await ethers.getContractAt("EscrowFactory", escrowFactoryAddr);

    const propertyNFT = await escrowFactory.propertyNFT();
    const usdc = await escrowFactory.USDC();
    const eurc = await escrowFactory.EURC();
    const platformWallet = await escrowFactory.platformWallet();
    const backendSigner = await escrowFactory.backendSigner();

    console.log(`  PropertyNFT: ${propertyNFT === propertyNFTAddr ? "✅" : "❌"} ${propertyNFT}`);
    console.log(`  USDC: ${usdc === mockUSDCAddr ? "✅" : "⚠️ "} ${usdc}`);
    console.log(`  EURC: ${eurc === mockEURCAddr ? "✅" : "⚠️ "} ${eurc}`);
    console.log(`  Platform Wallet: ${platformWallet}`);
    console.log(`  Backend Signer: ${backendSigner}\n`);

    if (propertyNFT === ethers.ZeroAddress) {
      allConfigured = false;
      console.log("  ⚠️  PropertyNFT not set in EscrowFactory\n");
    }
  }

  // 2. Check PropertyNFT
  if (propertyNFTAddr) {
    console.log("🏠 PropertyNFT:");
    const propertyNFT = await ethers.getContractAt("PropertyNFT", propertyNFTAddr);

    const hostSBT = await propertyNFT.hostSBT();
    const escrowFactory = await propertyNFT.escrowFactory();
    const reviewRegistry = await propertyNFT.reviewRegistry();

    console.log(`  HostSBT: ${hostSBT === hostSBTAddr ? "✅" : "❌"} ${hostSBT}`);
    console.log(
      `  EscrowFactory: ${escrowFactory === escrowFactoryAddr ? "✅" : "❌"} ${escrowFactory}`
    );
    console.log(
      `  ReviewRegistry: ${reviewRegistry === reviewRegistryAddr ? "✅" : "❌"} ${reviewRegistry}\n`
    );

    if (reviewRegistry === ethers.ZeroAddress) {
      allConfigured = false;
      console.log("  ⚠️  ReviewRegistry not set in PropertyNFT\n");
    }
  }

  // 3. Check HostSBT authorizations
  if (hostSBTAddr) {
    console.log("👔 HostSBT Authorizations:");
    const hostSBT = await ethers.getContractAt("HostSBT", hostSBTAddr);

    const propertyNFTAuth = await hostSBT.authorizedUpdaters(propertyNFTAddr);
    const reviewRegistryAuth = await hostSBT.authorizedUpdaters(reviewRegistryAddr);

    console.log(`  PropertyNFT: ${propertyNFTAuth ? "✅ Authorized" : "❌ Not Authorized"}`);
    console.log(
      `  ReviewRegistry: ${reviewRegistryAuth ? "✅ Authorized" : "❌ Not Authorized"}\n`
    );

    if (!propertyNFTAuth || !reviewRegistryAuth) {
      allConfigured = false;
    }
  }

  // 4. Check TravelerSBT authorizations
  if (travelerSBTAddr) {
    console.log("🧳 TravelerSBT Authorizations:");
    const travelerSBT = await ethers.getContractAt("TravelerSBT", travelerSBTAddr);

    const reviewRegistryAuth = await travelerSBT.authorizedUpdaters(reviewRegistryAddr);

    console.log(
      `  ReviewRegistry: ${reviewRegistryAuth ? "✅ Authorized" : "❌ Not Authorized"}\n`
    );

    if (!reviewRegistryAuth) {
      allConfigured = false;
    }
  }

  // 5. Check ReviewRegistry
  if (reviewRegistryAddr) {
    console.log("⭐ ReviewRegistry:");
    const reviewRegistry = await ethers.getContractAt("ReviewRegistry", reviewRegistryAddr);

    const travelerSBT = await reviewRegistry.travelerSBT();
    const hostSBT = await reviewRegistry.hostSBT();
    const propertyNFT = await reviewRegistry.propertyNFT();

    console.log(`  TravelerSBT: ${travelerSBT === travelerSBTAddr ? "✅" : "❌"} ${travelerSBT}`);
    console.log(`  HostSBT: ${hostSBT === hostSBTAddr ? "✅" : "❌"} ${hostSBT}`);
    console.log(`  PropertyNFT: ${propertyNFT === propertyNFTAddr ? "✅" : "❌"} ${propertyNFT}\n`);
  }

  // 6. Check ReviewValidator
  if (reviewValidatorAddr) {
    console.log("🛡️  ReviewValidator:");
    const reviewValidator = await ethers.getContractAt("ReviewValidator", reviewValidatorAddr);

    const propertyNFT = await reviewValidator.propertyNFT();
    const reviewRegistry = await reviewValidator.reviewRegistry();

    console.log(`  PropertyNFT: ${propertyNFT === propertyNFTAddr ? "✅" : "❌"} ${propertyNFT}`);
    console.log(
      `  ReviewRegistry: ${reviewRegistry === reviewRegistryAddr ? "✅" : "❌"} ${reviewRegistry}\n`
    );
  }

  // Final status
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (allConfigured) {
    console.log("✅ All contracts are properly configured!");
  } else {
    console.log("⚠️  Some contracts need configuration");
    console.log("\nRun the following to configure:");
    console.log(`  npx hardhat run scripts/configure-contracts.ts --network ${networkName}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
