import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = await network.connect();

/**
 * Post-deployment setup script
 * Run after Ignition deployment to configure contracts and mint test tokens
 */
async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  console.log(`\n🚀 Post-deployment setup on ${networkName}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`
  );

  // Load deployment addresses from Ignition
  const deploymentPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${(await ethers.provider.getNetwork()).chainId}`
  );

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for network ${networkName}`);
    console.log(
      `Run: npx hardhat ignition deploy ignition/modules/NomadNodes.ts --network ${networkName}`
    );
    process.exit(1);
  }

  console.log(`📂 Loading deployment from: ${deploymentPath}\n`);

  // Get deployed contract addresses
  const deployedAddresses = JSON.parse(
    fs.readFileSync(path.join(deploymentPath, "deployed_addresses.json"), "utf-8")
  );

  console.log("📋 Deployed Contracts:");
  Object.entries(deployedAddresses).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  // Mint test tokens if using mocks
  const mockUSDCAddress = deployedAddresses["MockTokens#MockUSDC"];
  const mockEURCAddress = deployedAddresses["MockTokens#MockEURC"];

  if (mockUSDCAddress && mockEURCAddress) {
    console.log("\n💰 Minting test tokens...");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = MockERC20.attach(mockUSDCAddress);
    const eurc = MockERC20.attach(mockEURCAddress);

    const mintAmount = ethers.parseUnits("1000000", 6); // 1M tokens

    await usdc.mint(deployer.address, mintAmount);
    console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer`);

    await eurc.mint(deployer.address, mintAmount);
    console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} EURC to deployer`);
  }

  console.log("\n✅ Post-deployment setup complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend with deployed addresses");
  console.log("2. Verify contracts on block explorer");
  console.log("3. Test contract interactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
