import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import SBTContracts from "./SBTContracts";

/**
 * Deploy PropertyNFT contract
 * Requires HostSBT to be deployed first
 */
export default buildModule("PropertyNFT", (m) => {
  // Get parameters
  const escrowFactory = m.getParameter("escrowFactory");

  // Import HostSBT from SBTContracts module
  const { hostSBT } = m.useModule(SBTContracts);

  // Deploy PropertyNFT
  const propertyNFT = m.contract("PropertyNFT", [hostSBT, escrowFactory], {
    id: "PropertyNFT",
  });

  return { propertyNFT };
});
