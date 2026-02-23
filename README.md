<p align="center">
  <img src="public/logofl.jpg" alt="FlowLedger" width="120" style="border-radius: 20px" />
</p>

<h1 align="center">FlowLedger</h1>

<p align="center">
  <strong>Production Web3 Payroll & Payment Platform on Polygon</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Polygon_Mainnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/USDC-2775CA?style=for-the-badge&logo=circle&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<p align="center">
  <a href="#-live-contracts">Contracts</a> •
  <a href="#-features">Features</a> •
  <a href="#-wave-6--whats-new">Wave 6</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## 🌍 What is FlowLedger?

FlowLedger is a **production-deployed** decentralized payroll and payment management platform running on **Polygon Mainnet**. It enables employers to pay workers in **USDC** with near-zero fees (~$0.01/tx), 2-second finality, and full on-chain transparency.

Built for the real world — not a testnet demo. **8 smart contracts deployed**, **20+ pages**, **offline-first architecture**, and wallet-less onboarding via Dynamic.xyz.

### The Problem

| Traditional Payroll | FlowLedger |
|---|---|
| 3-7% cross-border fees | ~$0.01 per transaction |
| 3-5 day settlement | 2-3 second finality |
| Opaque payment tracking | 100% on-chain verifiable |
| Single point of failure | Decentralized + offline-first |

---

## 📜 Live Contracts

All **8 contracts** are deployed and verified on **Polygon Mainnet (Chain ID: 137)**:

### Core Contracts (Wave 1-5)

| Contract | Address | Purpose |
|----------|---------|---------|
| **PayrollEscrow** | [`0xa0B6...4f81`](https://polygonscan.com/address/0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81) | Batch payroll with escrow, claims, disputes & revocation |
| **PayRequests** | [`0xe7ed...f9E`](https://polygonscan.com/address/0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E) | Worker-to-employer payment requests with approval flow |
| **IdentityRegistry** | [`0x1cA4...a4e6`](https://polygonscan.com/address/0x1cA44D55950922C64a81334cEDE9aa81C240a4e6) | On-chain identity linking with IPFS metadata |
| **FeeManager** | [`0x0D85...0b3b`](https://polygonscan.com/address/0x0D85592De2c91F39E13712965144029da7a60b3b) | Platform fee collection (0.5% default, max 5%) |
| **Attestations** | [`0xB5fF...be0B`](https://polygonscan.com/address/0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a) | On-chain payment proofs for audit & verification |

### Wave 6 Contracts (New)

| Contract | Address | Purpose |
|----------|---------|---------|
| **Streaming** | [`0x8471...cA9`](https://polygonscan.com/address/0x847169EC1463c493F663cF76Bd1cC283B185be0B) | Linear USDC streaming for continuous payroll |
| **Bounties** | [`0x7c8B...cA9`](https://polygonscan.com/address/0x7c8B4B5eC17e0B641909ca686cA6E4F7e5967cA9) | On-chain bounty board with submissions & approvals |
| **Multisig** | [`0x99df...9b6f`](https://polygonscan.com/address/0x99dfa41b6614e170A46D1DEbB12fB7C6f9779b6f) | Multi-signature payroll with N-of-M approvals |

**Stablecoin:** Native USDC [`0x3c49...3359`](https://polygonscan.com/token/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359)

---

## ✨ Features

### 🏢 Employer Portal (14 Pages)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time USDC balance, worker count, recent payments, quick actions |
| **Workers** | Add/edit/organize workers with wallet addresses and metadata |
| **New Payroll** | Batch pay multiple workers in a single on-chain transaction |
| **Requests Inbox** | Review, approve, or reject incoming payment requests |
| **Request Payment** | Create payment requests with shareable links |
| **Disputes** | Revoke unclaimed payroll runs, dispute management |
| **History** | Full transaction history via Polygonscan API with search & filters |
| **Identity** | Register on-chain identity with IPFS-backed metadata |
| **Streams** | Create linear USDC streams for continuous payroll *(Wave 6)* |
| **Bounties** | Post bounties, review submissions, release payments *(Wave 6)* |
| **Multisig** | Create teams, propose payroll, N-of-M approval system *(Wave 6)* |
| **Analytics** | Payment volume charts, spending trends, top recipients *(Wave 6)* |
| **Export** | Download CSV reports for accounting and tax |
| **Settings** | App configuration and data management |

### 👷 Worker Portal (6 Pages)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of earnings, pending claims, active streams |
| **Claim Payment** | Claim payroll payments from escrow |
| **History** | View all incoming payments with on-chain verification |
| **My Streams** | Track and withdraw from active USDC streams *(Wave 6)* |
| **Bounties** | Browse bounties, submit work, track approvals *(Wave 6)* |
| **Settings** | Worker-specific configuration |

### 🔗 Public Pages

| Page | Description |
|------|-------------|
| **Landing** | Marketing page with video background and feature showcase |
| **Search** | Global search across all transactions |
| **Transaction Details** | Deep-dive into any on-chain transaction |
| **Payslip** | Shareable payment verification page |

---

## 🚀 Wave 6 — What's New

Wave 6 is a major upgrade with **3 new smart contracts**, **10+ new pages**, and significant infrastructure improvements:

### New Smart Contracts
- **Streaming** — Linear USDC streaming for continuous payroll. Workers withdraw accrued amounts in real-time.
- **Bounties** — On-chain bounty board. Employers deposit USDC, workers submit proof, employer approves to release.
- **Multisig** — Multi-sig payroll approval. Create teams with N-of-M threshold, auto-execute on sufficient approvals.

### New Frontend Pages
- Streaming management (employer + worker views)
- Bounties board (employer + worker views)
- Multisig teams & proposals
- Analytics dashboard with Recharts (volume, trends, recipients, cumulative spending)

### Infrastructure Improvements
- All 5 existing ABIs rewritten to match deployed contracts
- All 13 page files fixed with correct contract function calls
- Explicit gas limits on all 29 `writeContract` calls (100k-500k)
- Hardcoded fallback contract addresses (no more undefined errors)
- History auto-sync via Polygonscan REST API
- Event polling with Alchemy (9-block clamped for free tier)
- Safe BigInt conversions throughout Analytics
- Smooth page transitions with Framer Motion AnimatePresence
- Removed all `window.location.reload()` — pure SPA navigation
- Lighter inline page loader (sidebar stays visible during navigation)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Dynamic.xyz│  │  wagmi v2  │  │   Dexie    │  │ Framer    │  │
│  │   (Auth)   │  │  + viem    │  │ (IndexedDB)│  │  Motion   │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                    8 Smart Contracts (Solidity)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Escrow   │ │Requests  │ │Identity  │ │   Attestations   │    │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────────┤    │
│  │Streaming │ │ Bounties │ │ Multisig │ │   Fee Manager    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│              Polygon Mainnet · Native USDC · Chain 137           │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5.6, Vite 5 |
| **UI** | Tailwind CSS 3, shadcn/ui (Radix), Framer Motion |
| **Charts** | Recharts |
| **Web3** | wagmi v2, viem v2 |
| **Auth** | Dynamic.xyz (walletless onboarding → MetaMask, WalletConnect, etc.) |
| **Storage** | Dexie (IndexedDB) — offline-first, no backend needed |
| **Contracts** | Solidity 0.8.20, OpenZeppelin 5.4 |
| **Network** | Polygon Mainnet (Chain ID: 137) |
| **Stablecoin** | Native USDC by Circle |
| **Deploy** | Hardhat, Vercel |

---

## 🔐 Security

- **Walletless onboarding** via Dynamic.xyz — email signup, wallet created later
- **Multi-wallet support** — MetaMask, WalletConnect, Coinbase Wallet
- **Offline-first** — Sensitive data stored locally in IndexedDB, only hashes on-chain
- **Gas optimization** — Memo hashing (8-byte on-chain vs full text), batch operations
- **Explicit gas limits** — Every contract call has a capped gas limit
- **No backend** — Fully client-side, no server to hack

---

## 📁 Project Structure

```
FlowLedger/
├── contracts/              # 8 Solidity smart contracts
│   ├── FlowWagePayrollEscrow.sol
│   ├── FlowLedgerPayRequests.sol
│   ├── FlowWageIdentityRegistry.sol
│   ├── FlowWageFeeManager.sol
│   ├── FlowLedgerAttestations.sol
│   ├── FlowLedgerStreaming.sol      # Wave 6
│   ├── FlowLedgerBounties.sol       # Wave 6
│   └── FlowLedgerMultisig.sol       # Wave 6
├── scripts/                # Deployment scripts
├── src/
│   ├── abi/                # Contract ABIs (8 files)
│   ├── app/                # Providers (Dynamic, wagmi, QueryClient)
│   ├── components/         # Shared UI components
│   ├── lib/                # Core logic
│   │   ├── api/            # Polygonscan API integration
│   │   ├── chain.ts        # Contract addresses, RPC config
│   │   ├── events/         # On-chain event polling
│   │   ├── storage/        # Dexie database schema
│   │   └── usdc.ts         # USDC utilities
│   └── pages/
│       ├── app/            # 15 employer pages
│       ├── worker/         # 6 worker pages
│       ├── Landing.tsx     # Marketing page
│       ├── Search.tsx      # Global search
│       ├── TxDetails.tsx   # Transaction explorer
│       └── Payslip.tsx     # Shareable payslip
├── deployment-polygon.json # Core contract addresses
├── deployment-wave6.json   # Wave 6 contract addresses
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or any EVM wallet
- POL (for gas) and USDC on Polygon

### Install & Run

```bash
git clone https://github.com/Chain-Crafter213/FlowLedger.git
cd FlowLedger
npm install
cp .env.example .env   # Add your RPC URL and keys
npm run dev             # Start dev server at localhost:5173
```

### Environment Variables

```env
VITE_DYNAMIC_ENV_ID=your_dynamic_env_id
VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
VITE_ALCHEMY_API_KEY=YOUR_KEY
```

### Deploy Contracts

```bash
npm run compile          # Compile Solidity contracts
npm run deploy:polygon   # Deploy to Polygon Mainnet
```

---

## 🌐 Deployment

- **Frontend**: Deployed on Vercel
- **Contracts**: Polygon Mainnet via Hardhat
- **RPC**: Alchemy (primary) + Polygonscan API (transaction history)

---

## 📊 Smart Contract Details

### PayrollEscrow — Batch Payroll
```
createPayroll → claimPayment → revokePayroll
```
Employer deposits USDC for multiple workers. Workers claim individually. Employer can revoke unclaimed funds.

### PayRequests — Invoice System
```
createRequest → approveRequest → payRequest
```
Workers request payment, employers approve/reject, payment executes on-chain.

### Streaming — Continuous Pay
```
createStream → withdrawFromStream → cancelStream
```
Linear USDC streaming. Workers withdraw accrued amounts anytime. Real-time salary.

### Bounties — Task Marketplace
```
createBounty → submitWork → approveBounty
```
Employer posts bounty with USDC deposit. Worker submits proof. Employer releases payment.

### Multisig — Team Approvals
```
createTeam → createProposal → approveProposal → (auto-execute)
```
N-of-M signature requirement for payroll proposals. Auto-executes when threshold met.

### Identity — On-Chain KYC
```
registerIdentity → verifyIdentity
```
Link wallets to identity metadata via IPFS hashes. Verifier system for trust.

### Attestations — Payment Proofs
```
createAttestation → verifyAttestation
```
Immutable on-chain proof that a payment occurred. For audits and disputes.

### FeeManager — Protocol Fees
```
calculateFee → collectFee → setPayrollFee
```
Configurable fee system (default 0.5%). Treasury management and fee exemptions.

---

## 🛣️ Roadmap

- [x] Core payroll escrow system
- [x] Payment request workflow
- [x] Identity registry with IPFS
- [x] Fee management system
- [x] On-chain attestations
- [x] USDC streaming (Wave 6)
- [x] Bounty board (Wave 6)
- [x] Multi-sig approvals (Wave 6)
- [x] Analytics dashboard (Wave 6)
- [x] Smooth SPA transitions (Wave 6)
- [x] Polygonscan API integration (Wave 6)
- [ ] Multi-chain (Arbitrum, Base, Optimism)
- [ ] Recurring scheduled payments
- [ ] Invoice generation with PDF export
- [ ] Mobile-optimized progressive web app
- [ ] DAO governance for fee parameters

---

## 📄 License

MIT

---

<p align="center">
  <strong>Built on Polygon · Powered by USDC · Made for the Future of Work</strong>
</p>
