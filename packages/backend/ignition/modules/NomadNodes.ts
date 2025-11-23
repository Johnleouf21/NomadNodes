import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Main deployment module for NomadNodes platform
 * Deploys all contracts in the correct order with proper dependencies
 */
export default buildModule("NomadNodes", (m) => {
  // Get deployer account
  const deployer = m.getAccount(0);

  // 1. Deploy Mock Tokens for testing
  const mockUSDC = m.contract("MockERC20", ["USD Coin", "USDC", 6], {
    id: "MockUSDC",
  });

  const mockEURC = m.contract("MockERC20", ["Euro Coin", "EURC", 6], {
    id: "MockEURC",
  });

  // 2. Deploy SBT Contracts
  const travelerSBT = m.contract("TravelerSBT", [], {
    id: "TravelerSBT",
  });

  const hostSBT = m.contract("HostSBT", [], {
    id: "HostSBT",
  });

  // 3. Deploy EscrowFactory
  const escrowFactory = m.contract(
    "EscrowFactory",
    [
      deployer, // platformWallet (temporary, should be multisig in production)
      deployer, // admin (temporary, should be multisig in production)
      deployer, // backendSigner (temporary, should be real backend in production)
      mockUSDC, // USDC address
      mockEURC, // EURC address
    ],
    {
      id: "EscrowFactory",
    }
  );

  // 4. Deploy PropertyNFT
  const propertyNFT = m.contract("PropertyNFT", [hostSBT, escrowFactory], {
    id: "PropertyNFT",
  });

  // Set PropertyNFT address in EscrowFactory
  m.call(escrowFactory, "setPropertyNFT", [propertyNFT], {
    id: "set_propertyNFT_in_escrowFactory",
  });

  // 5. Deploy Review System
  const reviewRegistry = m.contract("ReviewRegistry", [travelerSBT, hostSBT, propertyNFT], {
    id: "ReviewRegistry",
  });

  const reviewValidator = m.contract("ReviewValidator", [propertyNFT, reviewRegistry], {
    id: "ReviewValidator",
  });

  // 5. Setup authorizations

  // Authorize PropertyNFT to update HostSBT
  m.call(hostSBT, "setAuthorizedUpdater", [propertyNFT, true], {
    id: "authorize_propertyNFT_on_hostSBT",
  });

  // Authorize ReviewRegistry to update HostSBT
  m.call(hostSBT, "setAuthorizedUpdater", [reviewRegistry, true], {
    id: "authorize_reviewRegistry_on_hostSBT",
  });

  // Authorize ReviewRegistry to update TravelerSBT
  m.call(travelerSBT, "setAuthorizedUpdater", [reviewRegistry, true], {
    id: "authorize_reviewRegistry_on_travelerSBT",
  });

  // Set ReviewRegistry address on PropertyNFT
  m.call(propertyNFT, "setReviewRegistry", [reviewRegistry], {
    id: "set_reviewRegistry_on_propertyNFT",
  });

  return {
    mockUSDC,
    mockEURC,
    travelerSBT,
    hostSBT,
    escrowFactory,
    propertyNFT,
    reviewRegistry,
    reviewValidator,
  };
});
