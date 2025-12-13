// Escrow ABI for autoReleaseToHost
export const ESCROW_ABI = [
  {
    inputs: [],
    name: "autoReleaseToHost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Ponder URL
export const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
