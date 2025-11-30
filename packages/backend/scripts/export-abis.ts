import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Export contract ABIs to frontend and indexer
 *
 * This script can be run standalone after compilation:
 *   pnpm export-abis
 *
 * It is also called automatically during deployment.
 */
async function main() {
  console.log("📦 Exporting contract ABIs...\n");

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
    console.log(`  📁 Created: frontend/lib/contracts/abis/`);
  }
  if (!fs.existsSync(indexerOutputDir)) {
    fs.mkdirSync(indexerOutputDir, { recursive: true });
    console.log(`  📁 Created: indexer/abis/`);
  }

  let exportedCount = 0;
  let notFoundCount = 0;

  // Key contracts that need full artifacts for indexer
  const indexerContracts = [
    "PropertyRegistry",
    "RoomTypeNFT",
    "BookingManager",
    "EscrowFactory",
    "ReviewRegistry",
    "TravelEscrow",
  ];

  for (const contract of contracts) {
    const artifactPath = path.join(artifactsDir, contract.path);

    if (!fs.existsSync(artifactPath)) {
      console.log(`  ⚠️  Not found: ${contract.name}`);
      notFoundCount++;
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Export to frontend (ABI only)
    const frontendPath = path.join(frontendOutputDir, `${contract.name}.json`);
    fs.writeFileSync(frontendPath, JSON.stringify(artifact.abi, null, 2));

    // Export to indexer (full artifact for key contracts)
    if (indexerContracts.includes(contract.name)) {
      const indexerPath = path.join(indexerOutputDir, `${contract.name}.json`);
      fs.writeFileSync(indexerPath, JSON.stringify(artifact, null, 2));
      console.log(`  ✅ ${contract.name} (frontend + indexer)`);
    } else {
      console.log(`  ✅ ${contract.name} (frontend only)`);
    }

    exportedCount++;
  }

  console.log("\n" + "─".repeat(40));
  console.log(`✨ Exported: ${exportedCount} contracts`);
  if (notFoundCount > 0) {
    console.log(`⚠️  Not found: ${notFoundCount} contracts (run 'pnpm compile' first)`);
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Export failed:", error);
    process.exit(1);
  });
