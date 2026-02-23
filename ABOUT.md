# 💸 FlowLedger - Web3 Payroll Revolution on Polygon

**Production-grade decentralized payroll system with USDC payments, gasless onboarding, and enterprise-ready smart contracts.**

## 🎯 The Problem

Traditional payroll is broken:
- Cross-border fees: 3-7% per transaction
- Settlement time: 3-5 business days
- No transparency in payment tracking
- Centralized systems prone to failures

## 💡 Our Solution

FlowLedger enables instant, near-zero-fee payroll using **USDC on Polygon**:
- **$0.01 per transaction** (vs $5-50 on Ethereum)
- **2-3 second finality**
- **100% on-chain verification**
- **Privacy-first**: Only hashes stored on-chain

## ✨ Key Features

### Employer Portal
- **Dashboard**: Real-time USDC balance, worker stats, payment history
- **Worker Management**: Add/edit workers with wallet addresses
- **Batch Payroll**: Pay multiple workers in one transaction
- **Payment Requests**: Create shareable payment links
- **CSV Export**: Download reports for accounting
- **Global Search**: Find any transaction or worker instantly

### Worker Portal
- **Request Payments**: Submit payment requests to employers
- **Track Status**: Real-time payment tracking
- **Payment History**: Complete on-chain verification
- **Shareable Links**: Generate payment request URLs

### Security
- **Walletless Onboarding**: Email signup via Dynamic.xyz
- **Multi-wallet Support**: MetaMask, WalletConnect, Coinbase
- **Transaction Confirmation**: Always verify before signing
- **Local Storage**: Sensitive data never leaves your device

### Gas Optimization
- **Memo Hashing**: 90% gas savings by storing hashes instead of text
- **Batch Operations**: Multiple payments in single transactions
- **Gas Estimation**: See costs before confirming

## 📜 Deployed Smart Contracts (Polygon Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **PayRequests** | `0xe7ed29937EA32BC8e3F910409bcf9680E27B9f9E` | Payment request management |
| **PayrollEscrow** | `0xa0B6E018C036f8C7F2aBe3095CADe7954EAa4f81` | Secure batch payments |
| **IdentityRegistry** | `0x1cA44D55950922C64a81334cEDE9aa81C240a4e6` | Worker verification |
| **FeeManager** | `0x0D85592De2c91F39E13712965144029da7a60b3b` | Platform fees |
| **Attestations** | `0xB5fFeB1a0558377a7c99559Cdc5eB2A8A7F8fc2a` | Payment proofs |

### Contract Functions
- `createRequest()` / `approveRequest()` / `payRequest()`
- `depositPayroll()` / `executePayroll()` / `withdrawUnused()`
- `registerWorker()` / `verifyWorker()`
- `createAttestation()` / `verifyAttestation()`

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Web3**: wagmi v2, viem, Dynamic.xyz SDK
- **Storage**: Dexie (IndexedDB) for offline-first
- **Contracts**: Solidity 0.8.20, OpenZeppelin
- **Network**: Polygon Mainnet (Chain ID: 137)
- **Stablecoin**: Native USDC (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`)

## 📱 Application Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/app` | Employer dashboard |
| `/app/workers` | Worker management |
| `/app/payroll/new` | Create batch payroll |
| `/app/requests/new` | Create payment request |
| `/app/export` | CSV export |
| `/worker` | Worker portal |
| `/pay/:id` | Pay shared request |

## 💎 Why Polygon?

1. **Ultra-low fees**: $0.001-0.01 per tx
2. **Fast finality**: 2-3 seconds
3. **Native USDC**: No bridge risks
4. **Enterprise-ready**: Used by Starbucks, Nike, Reddit
5. **EVM compatible**: Full tooling support

## 📊 Gas Savings

| Operation | Ethereum | Polygon | Savings |
|-----------|----------|---------|---------|
| USDC Transfer | $5.00 | $0.005 | 99.9% |
| Create Request | $15.00 | $0.01 | 99.9% |
| Batch Payroll (10) | $50.00 | $0.05 | 99.9% |

## 🔗 Links

- **GitHub**: https://github.com/Chain-Crafter213/FlowLedger
- **Live Demo**: Deployed on Vercel
- **Contracts**: Verified on PolygonScan

## 🚀 What's Next

- Multi-chain support (Arbitrum, Base)
- Recurring payments
- Invoice PDF generation
- Mobile app (React Native)
- DAO governance

---

**Built for the Polygon ecosystem** - Enabling borderless, instant, low-cost payroll for the future of work.
