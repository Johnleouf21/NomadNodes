/**
 * Constants for Booking Confirmation
 */

/**
 * Check if we're in development mode (no backend signature service)
 */
export const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

/**
 * ERC20 ABI for approve and allowance
 */
export const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
