# NomadNodes

> Decentralized vacation rental platform - Airbnb/Booking competitor built entirely on blockchain

[![CI](https://github.com/YOUR_USERNAME/nomad-nodes/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/nomad-nodes/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Vision

NomadNodes is a Web3-native vacation rental platform that eliminates intermediaries, reduces fees, and gives control back to hosts and travelers through blockchain technology.

## 🏗️ Architecture

This is a **monorepo** managed with:

- **pnpm workspaces** - Package management
- **Turborepo** - Build system optimization
- **Node 20 LTS** - Runtime environment

### Project Structure

```
nomad-nodes/
├── packages/
│   ├── backend/          # Smart contracts (Hardhat + Solidity)
│   ├── frontend/         # Next.js 16 application
│   └── shared/           # Shared TypeScript types & utilities
├── .github/
│   └── workflows/        # CI/CD pipelines
├── .husky/               # Git hooks
└── package.json          # Root workspace config
```

## 📋 Tech Stack

### Backend (Blockchain)

- **Hardhat 3.0** - Smart contract development
- **Solidity 0.8.28** - Smart contract language
- **OpenZeppelin 5.4** - Audited contract libraries
- **TypeChain** - TypeScript bindings for contracts
- **Networks**: Sepolia (testnet) → Base (production)

### Frontend

- **Next.js 16** - React framework with Turbopack
- **Reown AppKit** - Wallet connection (WalletConnect v2)
- **Wagmi v3** - React hooks for Ethereum
- **Viem** - Low-level Ethereum interactions
- **Prisma 7** - Database ORM (PostgreSQL)
- **Tailwind CSS 4** - Styling
- **Shadcn/ui** - Component library

### Shared

- **TypeScript 5.7** - Type-safe shared utilities
- **Zod** (planned) - Runtime validation

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0 (recommended: 20 LTS)
- **pnpm** >= 8.0.0
- **PostgreSQL** (for frontend database)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/nomad-nodes.git
cd nomad-nodes
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Setup environment variables**

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your keys

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
# Edit packages/frontend/.env with your keys
```

4. **Initialize Husky hooks**

```bash
pnpm prepare
```

### Development

Run all packages in development mode:

```bash
pnpm dev
```

Or run specific packages:

```bash
# Frontend only
pnpm --filter @nomad-nodes/frontend dev

# Backend only (compile contracts)
pnpm --filter @nomad-nodes/backend compile
```

### Testing

```bash
# Run all tests
pnpm test

# Test smart contracts only
pnpm --filter @nomad-nodes/backend test

# With coverage
pnpm --filter @nomad-nodes/backend test:coverage
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @nomad-nodes/frontend build
```

## 🔐 Smart Contracts Architecture

### Core Contracts

1. **SBT (Soul Bound Tokens)**
   - `HostSBT.sol` - Non-transferable identity for hosts
   - `TravelerSBT.sol` - Non-transferable identity for travelers

2. **Property Management**
   - `PropertyNFT.sol` - ERC-1155 for properties (supports multi-unit)

3. **Escrow System**
   - `TravelEscrowFactory.sol` - Deploys escrow contracts
   - `TravelEscrow.sol` - Per-booking payment escrow

4. **Review System**
   - `ReviewValidator.sol` - Review validation logic
   - `ReviewRegistry.sol` - Review storage

### Deployment

```bash
# Deploy to Sepolia testnet
pnpm --filter @nomad-nodes/backend deploy:sepolia

# Deploy to Base mainnet (when ready)
pnpm --filter @nomad-nodes/backend deploy:base

# Verify contracts
pnpm --filter @nomad-nodes/backend verify:sepolia
```

## 💰 Payment System

- **USDC** - For USD transactions
- **EURC** - For EUR transactions
- **Network**: Sepolia (testnet) → Base (production)

## 📦 Package Scripts

### Root Commands

```bash
pnpm dev           # Start all packages in dev mode
pnpm build         # Build all packages
pnpm test          # Run all tests
pnpm lint          # Lint all packages
pnpm format        # Format all files with Prettier
pnpm clean         # Clean all build artifacts
```

### Backend Commands

```bash
pnpm --filter @nomad-nodes/backend compile
pnpm --filter @nomad-nodes/backend test
pnpm --filter @nomad-nodes/backend deploy:sepolia
```

### Frontend Commands

```bash
pnpm --filter @nomad-nodes/frontend dev
pnpm --filter @nomad-nodes/frontend build
pnpm --filter @nomad-nodes/frontend db:generate
pnpm --filter @nomad-nodes/frontend db:migrate
```

## 🔧 Development Workflow

### Pre-commit Hooks (Husky)

- **Linting** - Auto-fix with ESLint
- **Formatting** - Auto-format with Prettier
- **Type checking** - Verify TypeScript types

### Pre-push Hooks

- **Tests** - All tests must pass before push

### CI/CD Pipeline

- **Lint** - Code quality checks
- **Test** - Smart contract tests
- **Build** - Build all packages
- **Coverage** - Upload to Codecov

## 🗂️ Database Schema (Prisma)

Located in `packages/frontend/prisma/schema.prisma`

Key models:

- `User` - Off-chain user data
- `Property` - Property metadata (images, descriptions)
- `Booking` - Booking records
- `Review` - Review content

## 🌐 Network Configuration

### Sepolia (Testnet - Current)

- Chain ID: 11155111
- RPC: Alchemy/Infura
- Faucet: https://sepoliafaucet.com

### Base (Production - Future)

- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality Standards

- ✅ Tests coverage > 80%
- ✅ Type-safe TypeScript
- ✅ Gas-optimized contracts
- ✅ Mobile-first responsive design
- ✅ Accessibility (a11y) compliant

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for audited smart contract libraries
- Hardhat team for excellent dev tools
- Vercel for Next.js and deployment platform
- Reown (WalletConnect) for wallet infrastructure

---

**Built with ❤️ by the NomadNodes Team**
