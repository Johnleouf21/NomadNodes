import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy Mock ERC20 tokens (USDC, EURC) for testing
 * Only deploy on testnets, not mainnet
 */
export default buildModule("MockTokens", (m) => {
  // Deploy MockUSDC (6 decimals like real USDC)
  const mockUSDC = m.contract("MockERC20", ["USD Coin", "USDC", 6], {
    id: "MockUSDC",
  });

  // Deploy MockEURC (6 decimals like real EURC)
  const mockEURC = m.contract("MockERC20", ["Euro Coin", "EURC", 6], {
    id: "MockEURC",
  });

  return { mockUSDC, mockEURC };
});
