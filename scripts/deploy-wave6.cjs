const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Wave 6 contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

  console.log("\n--- Deploying Wave 6 Contracts ---\n");

  // 1. Deploy Streaming
  console.log("Deploying FlowLedgerStreaming...");
  const Streaming = await hre.ethers.getContractFactory("FlowLedgerStreaming");
  const streaming = await Streaming.deploy(USDC_ADDRESS);
  await streaming.waitForDeployment();
  const streamingAddress = await streaming.getAddress();
  console.log("FlowLedgerStreaming deployed to:", streamingAddress);

  // 2. Deploy Bounties
  console.log("\nDeploying FlowLedgerBounties...");
  const Bounties = await hre.ethers.getContractFactory("FlowLedgerBounties");
  const bounties = await Bounties.deploy(USDC_ADDRESS);
  await bounties.waitForDeployment();
  const bountiesAddress = await bounties.getAddress();
  console.log("FlowLedgerBounties deployed to:", bountiesAddress);

  // 3. Deploy Multisig
  console.log("\nDeploying FlowLedgerMultisig...");
  const Multisig = await hre.ethers.getContractFactory("FlowLedgerMultisig");
  const multisig = await Multisig.deploy(USDC_ADDRESS);
  await multisig.waitForDeployment();
  const multisigAddress = await multisig.getAddress();
  console.log("FlowLedgerMultisig deployed to:", multisigAddress);

  // Summary
  console.log("\n--- Wave 6 Deployment Summary ---\n");
  console.log("Network: Polygon Mainnet (chainId: 137)");
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("");
  console.log("New Contract Addresses:");
  console.log("  FlowLedgerStreaming:", streamingAddress);
  console.log("  FlowLedgerBounties:", bountiesAddress);
  console.log("  FlowLedgerMultisig:", multisigAddress);
  console.log("");
  console.log("Add to .env:");
  console.log(`  VITE_STREAMING_ADDRESS=${streamingAddress}`);
  console.log(`  VITE_BOUNTIES_ADDRESS=${bountiesAddress}`);
  console.log(`  VITE_MULTISIG_ADDRESS=${multisigAddress}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FlowLedgerStreaming: streamingAddress,
      FlowLedgerBounties: bountiesAddress,
      FlowLedgerMultisig: multisigAddress,
    },
  };
  fs.writeFileSync(
    "deployment-wave6.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-wave6.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
