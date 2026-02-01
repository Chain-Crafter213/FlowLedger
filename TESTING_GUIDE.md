# FlowLedger Contract Testing Guide

## Overview
This guide helps you test all contract integrations in FlowLedger to ensure the frontend works correctly with the deployed contracts on Polygon mainnet.

## Prerequisites
- MetaMask or another Web3 wallet connected to Polygon (chainId 137)
- Some POL (MATIC) for gas fees (~0.1 POL should be enough for testing)
- Some USDC on Polygon for payment tests

## Deployed Contracts (Polygon Mainnet)
| Contract | Address |
|----------|---------|
| FlowLedgerAttestations | `0x5e2c5E99A756EE91E8F0bb7CffdfF95427fD18c3` |
| FlowWageIdentityRegistry | `0x6d7e935aA5e7A12D7E6e0bCD9F3a7C76ea0F1d0B` |
| FlowWageFeeManager | `0xC1fF1aFbC7C21Ac7cc8c4d6e0f9dA2356D2c8B7e` |
| FlowWagePayrollEscrow | `0x3D9aE5C6F9e7B2d1A0c8F4E6D7b3A5c2E1f9D0B8` |
| FlowLedgerPayRequests | `0x8F2c3D4e5A6B7c8D9E0f1A2b3C4d5E6F7a8B9c0D` |
| USDC (Polygon) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |

---

## Test 1: Payment Request Creation (FlowLedgerPayRequests)
**Page:** `/app/requests/new`

### Steps:
1. Connect wallet via Dynamic.xyz
2. Fill in the "Request Payment From" field with another wallet address
3. Enter an amount (e.g., $1 USDC)
4. Add a memo/description
5. Set expiry days (default 7)
6. Click "Create Request"
7. Confirm in the popup (check estimated gas!)
8. Approve transaction in your wallet

### Expected Results:
- ✅ Gas estimate shows in the form (~$0.01-0.05)
- ✅ Confirmation popup shows optimized gas estimate
- ✅ Transaction confirms on Polygon
- ✅ Success dialog shows with shareable link
- ✅ Request saved to IndexedDB
- ✅ Redirects to dashboard

### Verify On-Chain:
```
https://polygonscan.com/address/0x8F2c3D4e5A6B7c8D9E0f1A2b3C4d5E6F7a8B9c0D#readContract
```
Call `getRequestsByWorker(YOUR_ADDRESS)` to see your request IDs.

---

## Test 2: USDC Payroll (FlowWagePayrollEscrow)
**Page:** `/app/payroll/new`

### Prerequisites:
- USDC in your wallet
- Approved USDC spending to escrow contract

### Steps:
1. Go to New Payroll page
2. Add workers with addresses and amounts
3. Click "Create Payroll Run"
4. Approve USDC allowance (first time only)
5. Confirm the payroll transaction

### Expected Results:
- ✅ USDC allowance requested (if needed)
- ✅ Payroll batch created on-chain
- ✅ Workers receive USDC
- ✅ Transaction hash recorded
- ✅ Payroll saved to IndexedDB

### Verify On-Chain:
Check `payrollRuns` mapping on the escrow contract.

---

## Test 3: Worker Registration (FlowWageIdentityRegistry)
**Page:** `/app/workers`

### Steps:
1. Go to Workers page
2. Click "Add Worker"
3. Enter worker address and details
4. Submit to register on-chain

### Expected Results:
- ✅ Worker registered in identity registry
- ✅ Worker appears in local database
- ✅ Can search for worker

---

## Test 4: Attestations (FlowLedgerAttestations)
**Page:** Integrated across the app

### Purpose:
- Creates on-chain proof of payments
- Links payments to identities

### Testing:
- Attestations are automatically created when payments complete
- Check `attestations` mapping on the contract

---

## Test 5: Fee Manager (FlowWageFeeManager)
**Page:** Settings

### Purpose:
- Manages platform fees (if enabled)
- Fee collection and distribution

### Testing:
- Fees are automatically handled during transactions
- Check fee rates: `getFeeRate()` on contract

---

## Common Issues & Solutions

### "Insufficient Gas"
- Make sure you have at least 0.1 POL in your wallet

### "User rejected transaction"
- You cancelled in your wallet - try again

### "Contract not configured"
- Check `.env` file has correct contract addresses
- Restart dev server after changing `.env`

### "Network mismatch"
- Make sure wallet is on Polygon (chainId 137)
- Dynamic.xyz should auto-prompt to switch

### High Gas Fees
- The app is optimized to store minimal data on-chain
- Full memos are stored locally, only hashes go on-chain
- Typical gas: $0.01-0.10 depending on network

---

## Gas Optimization Features

1. **Memo Hashing**: Instead of storing full text on-chain, we store a short hash (saves ~90% gas)
2. **Local Storage**: Full details stored in IndexedDB (free!)
3. **Gas Estimation**: Shows estimated cost before confirming
4. **Batch Operations**: Payroll combines multiple payments in one tx

---

## Testing Checklist

| Feature | Contract | Status |
|---------|----------|--------|
| Connect Wallet | - | ⬜ |
| Create Payment Request | PayRequests | ⬜ |
| View Payment Requests | PayRequests | ⬜ |
| Cancel Request | PayRequests | ⬜ |
| Pay Request | PayRequests + USDC | ⬜ |
| Add Worker | IdentityRegistry | ⬜ |
| Create Payroll | Escrow + USDC | ⬜ |
| Approve USDC | USDC | ⬜ |
| View Attestations | Attestations | ⬜ |
| Export Data | - (local only) | ⬜ |
| Search | - (local + on-chain) | ⬜ |

---

## Test with Small Amounts First!

Always test with minimal amounts ($1 USDC) before doing larger transactions.

## Get Test USDC

If you need test funds:
1. Bridge USDC from another chain
2. Swap POL → USDC on Polygon DEX (QuickSwap, Uniswap)
3. Use a faucet (if available)

---

## Contract Interaction Logs

All transactions are logged in browser console and can be verified on PolygonScan.
