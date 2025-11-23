import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy EscrowFactory contract
 * Factory for creating TravelEscrow instances for each booking
 *
 * IMPORTANT: Pass existing token addresses as parameters!
 *
 * Example parameters file:
 * {
 *   "EscrowFactory": {
 *     "usdcAddress": "0x...",
 *     "eurcAddress": "0x..."
 *   }
 * }
 */
export default buildModule("EscrowFactory", (m) => {
  // Get deployer account
  const deployer = m.getAccount(0);

  // Get token addresses from parameters
  const usdcAddress = m.getParameter("usdcAddress");
  const eurcAddress = m.getParameter("eurcAddress");

  // Deploy EscrowFactory
  const escrowFactory = m.contract(
    "EscrowFactory",
    [
      deployer, // platformWallet (temporary, should be multisig in production)
      deployer, // admin (temporary, should be multisig in production)
      deployer, // backendSigner (temporary, should be real backend in production)
      usdcAddress, // USDC address
      eurcAddress, // EURC address
    ],
    {
      id: "EscrowFactory",
    }
  );

  return { escrowFactory };
});
