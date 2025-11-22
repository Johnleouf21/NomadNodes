export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
}

export interface SmartContractAddresses {
  hostSBT: string;
  travelerSBT: string;
  propertyNFT: string;
  escrowFactory: string;
  reviewValidator: string;
  reviewRegistry: string;
  usdc: string;
  eurc: string;
}

export enum NetworkType {
  SEPOLIA = "sepolia",
  BASE = "base",
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: SmartContractAddresses;
}
