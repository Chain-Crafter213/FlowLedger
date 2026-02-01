const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Polygon Mainnet USDC address
  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
  
  // Treasury address (deployer for now)
  const TREASURY_ADDRESS = deployer.address;

  console.log("\n--- Deploying FlowLedger Contracts ---\n");

  // 1. Deploy Attestations
  console.log("Deploying FlowLedgerAttestations...");
  const Attestations = await hre.ethers.getContractFactory("FlowLedgerAttestations");
  const attestations = await Attestations.deploy(deployer.address);
  await attestations.waitForDeployment();
  const attestationsAddress = await attestations.getAddress();
  console.log("FlowLedgerAttestations deployed to:", attestationsAddress);

  // 2. Deploy Identity Registry
  console.log("\nDeploying FlowWageIdentityRegistry...");
  const IdentityRegistry = await hre.ethers.getContractFactory("FlowWageIdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(deployer.address);
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("FlowWageIdentityRegistry deployed to:", identityAddress);

  // 3. Deploy Fee Manager
  console.log("\nDeploying FlowWageFeeManager...");
  const FeeManager = await hre.ethers.getContractFactory("FlowWageFeeManager");
  const feeManager = await FeeManager.deploy(USDC_ADDRESS, TREASURY_ADDRESS, deployer.address);
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();
  console.log("FlowWageFeeManager deployed to:", feeManagerAddress);

  // 4. Deploy Payroll Escrow
  console.log("\nDeploying FlowWagePayrollEscrow...");
  const PayrollEscrow = await hre.ethers.getContractFactory("FlowWagePayrollEscrow");
  const payrollEscrow = await PayrollEscrow.deploy(USDC_ADDRESS, deployer.address);
  await payrollEscrow.waitForDeployment();
  const escrowAddress = await payrollEscrow.getAddress();
  console.log("FlowWagePayrollEscrow deployed to:", escrowAddress);

  // 5. Deploy Pay Requests
  console.log("\nDeploying FlowLedgerPayRequests...");
  const PayRequests = await hre.ethers.getContractFactory("FlowLedgerPayRequests");
  const payRequests = await PayRequests.deploy(USDC_ADDRESS, deployer.address);
  await payRequests.waitForDeployment();
  const payRequestsAddress = await payRequests.getAddress();
  console.log("FlowLedgerPayRequests deployed to:", payRequestsAddress);

  // 6. Configure: Set fee manager in escrow
  console.log("\nConfiguring contracts...");
  await payrollEscrow.setFeeManager(feeManagerAddress);
  console.log("Fee manager set in PayrollEscrow");

  // Summary
  console.log("\n--- Deployment Summary ---\n");
  console.log("Network: Polygon Mainnet (chainId: 137)");
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("");
  console.log("Contract Addresses:");
  console.log("  FlowLedgerAttestations:", attestationsAddress);
  console.log("  FlowWageIdentityRegistry:", identityAddress);
  console.log("  FlowWageFeeManager:", feeManagerAddress);
  console.log("  FlowWagePayrollEscrow:", escrowAddress);
  console.log("  FlowLedgerPayRequests:", payRequestsAddress);

  // Save addresses to a file
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    usdc: USDC_ADDRESS,
    contracts: {
      FlowLedgerAttestations: attestationsAddress,
      FlowWageIdentityRegistry: identityAddress,
      FlowWageFeeManager: feeManagerAddress,
      FlowWagePayrollEscrow: escrowAddress,
      FlowLedgerPayRequests: payRequestsAddress,
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployment-polygon.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-polygon.json");

  // Environment variables update
  console.log("\n--- Environment Variables (for .env) ---\n");
  console.log(`VITE_ATTESTATIONS_ADDRESS=${attestationsAddress}`);
  console.log(`VITE_IDENTITY_REGISTRY_ADDRESS=${identityAddress}`);
  console.log(`VITE_FEE_MANAGER_ADDRESS=${feeManagerAddress}`);
  console.log(`VITE_PAYROLL_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`VITE_PAY_REQUESTS_ADDRESS=${payRequestsAddress}`);

  console.log("\n--- Verification Commands ---\n");
  console.log(`npx hardhat verify --network polygon ${attestationsAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network polygon ${identityAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network polygon ${feeManagerAddress} "${USDC_ADDRESS}" "${TREASURY_ADDRESS}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network polygon ${escrowAddress} "${USDC_ADDRESS}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network polygon ${payRequestsAddress} "${USDC_ADDRESS}" "${deployer.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
