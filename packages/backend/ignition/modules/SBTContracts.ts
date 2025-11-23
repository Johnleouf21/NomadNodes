import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy Soulbound Token (SBT) contracts
 * - TravelerSBT: For travelers' reputation
 * - HostSBT: For hosts' reputation
 */
export default buildModule("SBTContracts", (m) => {
  // Deploy TravelerSBT
  const travelerSBT = m.contract("TravelerSBT", [], {
    id: "TravelerSBT",
  });

  // Deploy HostSBT
  const hostSBT = m.contract("HostSBT", [], {
    id: "HostSBT",
  });

  return { travelerSBT, hostSBT };
});
