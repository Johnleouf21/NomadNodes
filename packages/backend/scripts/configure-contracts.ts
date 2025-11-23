import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = await network.connect();

/**
 * Configure contract dependencies after deployment
 * Links EscrowFactory, PropertyNFT, ReviewRegistry, etc.
 */
async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log(`\n🔧 Configuring contracts on ${networkName} (chainId: ${chainId})...\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`
  );

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, `../ignition/deployments/chain-${chainId}`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for chain ${chainId}`);
    console.log(`Deploy contracts first using: npx hardhat ignition deploy`);
    process.exit(1);
  }

  const deployedAddresses = JSON.parse(
    fs.readFileSync(path.join(deploymentPath, "deployed_addresses.json"), "utf-8")
  );

  console.log("📋 Deployed Contracts:");
  Object.entries(deployedAddresses).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log();

  // Extract contract addresses
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

  // Get contract instances
  const escrowFactory = await ethers.getContractAt("EscrowFactory", escrowFactoryAddr);
  const propertyNFT = await ethers.getContractAt("PropertyNFT", propertyNFTAddr);
  const hostSBT = await ethers.getContractAt("HostSBT", hostSBTAddr);
  const travelerSBT = await ethers.getContractAt("TravelerSBT", travelerSBTAddr);

  console.log("🔗 Configuring contract relationships...\n");

  // 1. Set PropertyNFT in EscrowFactory
  try {
    const currentPropertyNFT = await escrowFactory.propertyNFT();
    if (currentPropertyNFT === ethers.ZeroAddress) {
      console.log("Setting PropertyNFT in EscrowFactory...");
      const tx = await escrowFactory.setPropertyNFT(propertyNFTAddr);
      await tx.wait();
      console.log("✅ PropertyNFT set in EscrowFactory");
    } else {
      console.log(`✓ PropertyNFT already set in EscrowFactory: ${currentPropertyNFT}`);
    }
  } catch (error: any) {
    console.error(`⚠️  Failed to set PropertyNFT in EscrowFactory: ${error.message}`);
  }

  // 2. Authorize PropertyNFT to update HostSBT
  try {
    const isAuthorized = await hostSBT.authorizedUpdaters(propertyNFTAddr);
    if (!isAuthorized) {
      console.log("\nAuthorizing PropertyNFT to update HostSBT...");
      const tx = await hostSBT.setAuthorizedUpdater(propertyNFTAddr, true);
      await tx.wait();
      console.log("✅ PropertyNFT authorized on HostSBT");
    } else {
      console.log("\n✓ PropertyNFT already authorized on HostSBT");
    }
  } catch (error: any) {
    console.error(`⚠️  Failed to authorize PropertyNFT on HostSBT: ${error.message}`);
  }

  // 3. Authorize ReviewRegistry to update HostSBT
  try {
    const isAuthorized = await hostSBT.authorizedUpdaters(reviewRegistryAddr);
    if (!isAuthorized) {
      console.log("\nAuthorizing ReviewRegistry to update HostSBT...");
      const tx = await hostSBT.setAuthorizedUpdater(reviewRegistryAddr, true);
      await tx.wait();
      console.log("✅ ReviewRegistry authorized on HostSBT");
    } else {
      console.log("\n✓ ReviewRegistry already authorized on HostSBT");
    }
  } catch (error: any) {
    console.error(`⚠️  Failed to authorize ReviewRegistry on HostSBT: ${error.message}`);
  }

  // 4. Authorize ReviewRegistry to update TravelerSBT
  try {
    const isAuthorized = await travelerSBT.authorizedUpdaters(reviewRegistryAddr);
    if (!isAuthorized) {
      console.log("\nAuthorizing ReviewRegistry to update TravelerSBT...");
      const tx = await travelerSBT.setAuthorizedUpdater(reviewRegistryAddr, true);
      await tx.wait();
      console.log("✅ ReviewRegistry authorized on TravelerSBT");
    } else {
      console.log("\n✓ ReviewRegistry already authorized on TravelerSBT");
    }
  } catch (error: any) {
    console.error(`⚠️  Failed to authorize ReviewRegistry on TravelerSBT: ${error.message}`);
  }

  // 5. Set ReviewRegistry in PropertyNFT
  try {
    const currentReviewRegistry = await propertyNFT.reviewRegistry();
    if (currentReviewRegistry === ethers.ZeroAddress) {
      console.log("\nSetting ReviewRegistry in PropertyNFT...");
      const tx = await propertyNFT.setReviewRegistry(reviewRegistryAddr);
      await tx.wait();
      console.log("✅ ReviewRegistry set in PropertyNFT");
    } else {
      console.log(`\n✓ ReviewRegistry already set in PropertyNFT: ${currentReviewRegistry}`);
    }
  } catch (error: any) {
    console.error(`⚠️  Failed to set ReviewRegistry in PropertyNFT: ${error.message}`);
  }

  console.log("\n✅ Contract configuration complete!\n");

  // Summary
  console.log("📊 Configuration Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`EscrowFactory → PropertyNFT: ${propertyNFTAddr}`);
  console.log(`PropertyNFT → authorized on HostSBT`);
  console.log(`ReviewRegistry → authorized on HostSBT`);
  console.log(`ReviewRegistry → authorized on TravelerSBT`);
  console.log(`PropertyNFT → ReviewRegistry: ${reviewRegistryAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
