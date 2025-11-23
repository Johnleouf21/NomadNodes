import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import SBTContracts from "./SBTContracts";
import PropertyNFT from "./PropertyNFT";

/**
 * Deploy Review System contracts
 * - ReviewRegistry: Stores reviews on-chain
 * - ReviewValidator: Moderates reviews before publication
 */
export default buildModule("ReviewSystem", (m) => {
  // Import dependencies
  const { travelerSBT, hostSBT } = m.useModule(SBTContracts);
  const { propertyNFT } = m.useModule(PropertyNFT);

  // Deploy ReviewRegistry
  const reviewRegistry = m.contract("ReviewRegistry", [travelerSBT, hostSBT, propertyNFT], {
    id: "ReviewRegistry",
  });

  // Deploy ReviewValidator
  const reviewValidator = m.contract("ReviewValidator", [propertyNFT, reviewRegistry], {
    id: "ReviewValidator",
  });

  return { reviewRegistry, reviewValidator };
});
