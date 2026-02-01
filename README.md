<p align="center">
  <img src="https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white" alt="Polygon" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/USDC-2775CA?style=for-the-badge&logo=circle&logoColor=white" alt="USDC" />
</p>

<h1 align="center">💸 FlowLedger</h1>

<p align="center">
  <strong>Production-Grade Web3 Payroll & Payment Request System on Polygon</strong>
</p>

<p align="center">
  A decentralized, gas-optimized payroll management system enabling employers to pay workers in USDC on Polygon, with walletless onboarding via Dynamic.xyz and complete offline-first architecture.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-why-polygon">Why Polygon</a> •
  <a href="#-smart-contracts">Smart Contracts</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## 🌟 Project Vision

FlowLedger revolutionizes payroll management by combining the security of blockchain with the simplicity of modern web applications. Our mission is to make crypto payroll accessible to everyone—from small businesses to large enterprises—while maintaining the highest standards of security, privacy, and user experience.

### The Problem We Solve

Traditional payroll systems are:
- **Expensive**: Cross-border payments incur high fees (3-7%)
- **Slow**: International transfers take 3-5 business days
- **Opaque**: Limited transparency in payment tracking
- **Centralized**: Single points of failure and data breaches

### Our Solution

FlowLedger provides:
- **Near-zero fees**: ~$0.01 per transaction on Polygon
- **Instant settlement**: Payments confirm in 2-3 seconds
- **Full transparency**: All payments verifiable on-chain
- **Decentralized**: No single point of failure
- **Privacy-first**: Sensitive data stored locally, only hashes on-chain

---

## ✨ Features

### 🏢 Employer Portal

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time overview of USDC balance, worker count, and payment history |
| **Worker Management** | Add, edit, and organize workers with wallet addresses and contact info |
| **Batch Payroll** | Pay multiple workers in a single transaction (gas-efficient) |
| **Payment Requests** | Create and track payment requests with shareable links |
| **Export** | Download CSV reports for accounting and tax purposes |
| **Search** | Full-text search across all transactions and workers |

### 👷 Worker Portal

| Feature | Description |
|---------|-------------|
| **Request Payment** | Submit payment requests to employers |
| **Track Payments** | View all incoming payments and their status |
| **Payment History** | Complete history with on-chain verification |
| **Share Links** | Generate shareable payment request links |

### 🔐 Security Features

- **Walletless Onboarding**: Sign up with email via Dynamic.xyz, create wallet later
- **Multi-wallet Support**: MetaMask, WalletConnect, Coinbase Wallet, and more
- **Transaction Confirmation**: Always confirm before signing
- **Risk Warnings**: Clear warnings before irreversible actions
- **Local Storage**: Sensitive data never leaves your device

### ⚡ Gas Optimization

- **Memo Hashing**: Store only 8-byte hashes on-chain instead of full text (90% gas savings)
- **Batch Operations**: Combine multiple payments in single transactions
- **Gas Estimation**: See estimated costs before confirming
- **Optimized ABIs**: Minimal contract calls for common operations

---

## 💎 Why Polygon?

We chose **Polygon (POL/MATIC)** as our primary network for these compelling reasons:

### 1. **Ultra-Low Transaction Costs**
| Network | Avg. Transaction Fee |
|---------|---------------------|
| Ethereum Mainnet | $5-50 |
| Arbitrum | $0.10-0.50 |
| **Polygon** | **$0.001-0.01** |

### 2. **Lightning-Fast Finality**
- **Block Time**: ~2 seconds
- **Finality**: 2-3 seconds
- Perfect for payroll where instant confirmation matters

### 3. **Native USDC Support**
- Circle's official USDC on Polygon: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- No bridge risks—native stablecoin
- Deep liquidity on all major DEXs

### 4. **Enterprise Ready**
- Battle-tested with billions in daily volume
- Major brands using Polygon: Starbucks, Nike, Reddit
- Polygon zkEVM upgrade path for future scalability

### 5. **Developer Experience**
- Full EVM compatibility
- Extensive tooling and documentation
- Reliable RPC endpoints (Alchemy, Infura, QuickNode)

---

## 📜 Smart Contracts

All contracts are deployed on **Polygon Mainnet (Chain ID: 137)**:

### FlowLedgerPayRequests
```
Address: 0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E
```
**Purpose**: Payment request management system

| Function | Description |
|----------|-------------|
| `createRequest()` | Create a new payment request |
| `approveRequest()` | Employer approves a request |
| `rejectRequest()` | Employer rejects with reason |
| `payRequest()` | Pay an approved request |
| `cancelRequest()` | Worker cancels pending request |

### FlowWagePayrollEscrow
```
Address: 0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81
```
**Purpose**: Secure payroll escrow and batch payments

| Function | Description |
|----------|-------------|
| `depositPayroll()` | Deposit USDC for payroll |
| `executePayroll()` | Pay multiple workers at once |
| `withdrawUnused()` | Withdraw unused funds |
| `getPayrollRun()` | Query payroll run details |

### FlowWageIdentityRegistry
```
Address: 0x1cA44D55950922C64a81334cEDE9aa81C240a4e6
```
**Purpose**: Worker identity and verification

| Function | Description |
|----------|-------------|
| `registerWorker()` | Register worker identity |
| `updateWorker()` | Update worker details |
| `verifyWorker()` | Verify worker status |
| `getWorkerInfo()` | Query worker information |

### FlowWageFeeManager
```
Address: 0x0D85592De2c91F39E13712965144029da7a60b3b
```
**Purpose**: Platform fee management (optional)

| Function | Description |
|----------|-------------|
| `setFeeRate()` | Set platform fee percentage |
| `collectFees()` | Collect accumulated fees |
| `getFeeRate()` | Query current fee rate |

### FlowLedgerAttestations
```
Address: 0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a
```
**Purpose**: On-chain payment attestations

| Function | Description |
|----------|-------------|
| `createAttestation()` | Record payment proof |
| `verifyAttestation()` | Verify payment occurred |
| `getAttestationsByAddress()` | Query attestations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vite + React)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Dynamic    │  │    wagmi     │  │      IndexedDB       │   │
│  │    (Auth)    │  │   (Web3)     │  │   (Local Storage)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         Smart Contracts                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PayRequests  │  │   Escrow     │  │  Identity Registry   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Polygon Mainnet (Chain ID: 137)               │
│                         Native USDC                              │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Web3** | wagmi v2, viem |
| **Auth** | Dynamic.xyz SDK |
| **Storage** | Dexie (IndexedDB wrapper) |
| **Contracts** | Solidity 0.8.20, OpenZeppelin |
| **Network** | Polygon Mainnet |
| **Stablecoin** | USDC (Circle Native) |

---

## 📱 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page with features |
| `/app` | Dashboard | Main employer dashboard |
| `/app/workers` | Workers | Worker management |
| `/app/payroll/new` | New Payroll | Create batch payroll |
| `/app/payroll/:id` | Payroll Run | View payroll details |
| `/app/requests/new` | New Request | Create payment request |
| `/app/export` | Export | Download CSV reports |
| `/app/settings` | Settings | App configuration |
| `/app/search` | Search | Global search |
| `/worker` | Worker Portal | Worker-facing dashboard |
| `/worker/requests` | My Requests | Worker's payment requests |
| `/pay/:id` | Pay Request | Pay a shared request link |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Some POL (MATIC) for gas

### Installation

```bash
# Clone the repository
git clone https://github.com/Chain-Crafter213/FlowLedger.git
cd FlowLedger

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Dynamic.xyz Environment ID
VITE_DYNAMIC_ENV_ID=your_dynamic_env_id

# Polygon Configuration
VITE_CHAIN_ID=137
VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# USDC Address (Polygon Mainnet)
VITE_USDC_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

# Contract Addresses (Already Deployed)
VITE_ATTESTATIONS_ADDRESS=0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a
VITE_PAYROLL_ESCROW_ADDRESS=0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81
VITE_PAY_REQUESTS_ADDRESS=0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E
VITE_FEE_MANAGER_ADDRESS=0x0D85592De2c91F39E13712965144029da7a60b3b
VITE_IDENTITY_REGISTRY_ADDRESS=0x1cA44D55950922C64a81334cEDE9aa81C240a4e6
```

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub** (already done)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub: `Chain-Crafter213/FlowLedger`

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables** (in Vercel Dashboard):
   ```
   VITE_DYNAMIC_ENV_ID=621c8327-48db-4270-b7e2-b6e6ceb90c73
   VITE_CHAIN_ID=137
   VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
   VITE_USDC_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
   VITE_ATTESTATIONS_ADDRESS=0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a
   VITE_PAYROLL_ESCROW_ADDRESS=0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81
   VITE_PAY_REQUESTS_ADDRESS=0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E
   VITE_FEE_MANAGER_ADDRESS=0x0D85592De2c91F39E13712965144029da7a60b3b
   VITE_IDENTITY_REGISTRY_ADDRESS=0x1cA44D55950922C64a81334cEDE9aa81C240a4e6
   ```

5. **Deploy!**

---

## 📊 Gas Comparison

| Operation | Ethereum | Polygon | Savings |
|-----------|----------|---------|---------|
| USDC Transfer | $5.00 | $0.005 | 99.9% |
| Create Request | $15.00 | $0.01 | 99.9% |
| Batch Payroll (10) | $50.00 | $0.05 | 99.9% |
| Contract Deploy | $500+ | $0.50 | 99.9% |

---

## 🔒 Security Considerations

1. **Never share your private keys**
2. **Verify contract addresses** before interacting
3. **Start with small amounts** for testing
4. **Check gas estimates** before confirming
5. **Use hardware wallets** for large amounts

---

## 🛣️ Roadmap

- [x] Core smart contracts
- [x] Employer dashboard
- [x] Worker portal
- [x] Payment requests
- [x] Batch payroll
- [x] Gas optimization
- [ ] Multi-chain support (Arbitrum, Base)
- [ ] Recurring payments
- [ ] Invoice generation (PDF)
- [ ] Mobile app (React Native)
- [ ] DAO governance

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Polygon](https://polygon.technology/) - Scalable blockchain infrastructure
- [Dynamic.xyz](https://dynamic.xyz/) - Web3 authentication
- [Circle](https://circle.com/) - Native USDC on Polygon
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contracts

---

<p align="center">
  <strong>Built with ❤️ for the Web3 Community</strong>
</p>

<p align="center">
  <a href="https://polygon.technology/">
    <img src="https://img.shields.io/badge/Powered%20by-Polygon-8247E5?style=flat-square" alt="Powered by Polygon" />
  </a>
</p>
