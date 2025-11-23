import fs from "fs";
import path from "path";

/**
 * Export contract ABIs to frontend
 */
async function main() {
  console.log("📦 Exporting contract ABIs to frontend...\n");

  const contracts = [
    "EscrowFactory",
    "PropertyNFT",
    "TravelEscrow",
    "HostSBT",
    "TravelerSBT",
    "ReviewRegistry",
    "ReviewValidator",
  ];

  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const outputDir = path.join(__dirname, "../../frontend/lib/contracts/abis");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files: Record<string, string> = {
    EscrowFactory: "EscrowFactory.sol/EscrowFactory.json",
    PropertyNFT: "PropertyNFT.sol/PropertyNFT.json",
    TravelEscrow: "TravelEscrow.sol/TravelEscrow.json",
    HostSBT: "HostSBT.sol/HostSBT.json",
    TravelerSBT: "TravelerSBT.sol/TravelerSBT.json",
    ReviewRegistry: "ReviewRegistry.sol/ReviewRegistry.json",
    ReviewValidator: "ReviewValidator.sol/ReviewValidator.json",
  };

  for (const contract of contracts) {
    const artifactPath = path.join(artifactsDir, files[contract]);

    if (!fs.existsSync(artifactPath)) {
      console.log(`❌ Not found: ${artifactPath}`);
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const outputPath = path.join(outputDir, `${contract}.json`);

    fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✅ Exported ABI for ${contract}`);
  }

  console.log("\n✨ ABIs exported successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
