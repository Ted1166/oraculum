import hre from "hardhat";
import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  network: string;
  chainId: string;
  deployer: string;
  projectRegistry: string;
  predictionMarket: string;
  fundingPool: string;
  reputationNFT: string;
  deploymentTime: string;
  blockNumber: string;
}

async function main() {
  const networkName = (hre.network as any).name;

  console.log("\n🚀 ═══════════════════════════════════════════════════════");
  console.log("   PREDICT & FUND - Smart Contract Deployment");
  console.log("═══════════════════════════════════════════════════════\n");

  // Get network connection using Hardhat 3 API
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  const deployer = walletClient.account.address;
  const chainId = await publicClient.getChainId();
  const balance = await publicClient.getBalance({ address: deployer });
  const blockNumber = await publicClient.getBlockNumber();

  console.log("📋 Network Information:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  Network:      ", networkName);
  console.log("  Chain ID:     ", chainId);
  console.log("  Deployer:     ", deployer);
  console.log("  Balance:      ", (Number(balance) / 1e18).toFixed(4), "ETH/BNB");
  console.log("  Block Number: ", blockNumber);
  console.log("─────────────────────────────────────────────────────────\n");

  // Check balance
  const minBalance = networkName === "hardhat" ? 0n : 100000000000000000n; // 0.1 ETH/BNB
  if (balance < minBalance) {
    throw new Error("❌ Insufficient balance! Need at least 0.1 ETH/BNB for deployment");
  }

  const addresses: Partial<DeploymentAddresses> = {
    network: networkName,
    chainId: chainId.toString(),
    deployer: deployer,
    deploymentTime: new Date().toISOString(),
    blockNumber: blockNumber.toString(),
  };

  // ================================================
  // 1. Deploy ProjectRegistry
  // ================================================
  console.log("📦 [1/4] Deploying ProjectRegistry...");
  const projectRegistry = await viem.deployContract("ProjectRegistry");
  addresses.projectRegistry = projectRegistry.address;

  console.log("✅ ProjectRegistry deployed!");
  console.log("   Address:", projectRegistry.address);
  console.log("   Waiting for block confirmation...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ================================================
  // 2. Deploy PredictionMarket
  // ================================================
  console.log("📦 [2/4] Deploying PredictionMarket...");
  const predictionMarket = await viem.deployContract("PredictionMarket", [
    projectRegistry.address,
  ]);
  addresses.predictionMarket = predictionMarket.address;

  console.log("✅ PredictionMarket deployed!");
  console.log("   Address:", predictionMarket.address);
  console.log("   Constructor: [", projectRegistry.address, "]");
  console.log("   Waiting for block confirmation...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ================================================
  // 3. Deploy FundingPool
  // ================================================
  console.log("📦 [3/4] Deploying FundingPool...");
  const fundingPool = await viem.deployContract("FundingPool", [
    projectRegistry.address,
    predictionMarket.address,
  ]);
  addresses.fundingPool = fundingPool.address;

  console.log("✅ FundingPool deployed!");
  console.log("   Address:", fundingPool.address);
  console.log("   Constructor: [", projectRegistry.address, ",", predictionMarket.address, "]");
  console.log("   Waiting for block confirmation...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ================================================
  // 4. Deploy ReputationNFT
  // ================================================
  console.log("📦 [4/4] Deploying ReputationNFT...");
  const reputationNFT = await viem.deployContract("ReputationNFT", [
    predictionMarket.address,
  ]);
  addresses.reputationNFT = reputationNFT.address;

  console.log("✅ ReputationNFT deployed!");
  console.log("   Address:", reputationNFT.address);
  console.log("   Constructor: [", predictionMarket.address, "]");
  console.log("   Waiting for block confirmation...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ================================================
  // Save Deployment Info
  // ================================================
  console.log("💾 Saving deployment information...");
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${networkName}_${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(addresses, null, 2));
  
  // Also save as latest
  const latestPath = path.join(deploymentsDir, `${networkName}_latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(addresses, null, 2));
  
  console.log("✅ Saved to:", filename);
  console.log("✅ Saved to:", `${networkName}_latest.json\n`);

  // ================================================
  // Deployment Summary
  // ================================================
  console.log("\n🎉 ═══════════════════════════════════════════════════════");
  console.log("   DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n📋 Contract Addresses:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  ProjectRegistry:  ", projectRegistry.address);
  console.log("  PredictionMarket: ", predictionMarket.address);
  console.log("  FundingPool:      ", fundingPool.address);
  console.log("  ReputationNFT:    ", reputationNFT.address);
  console.log("─────────────────────────────────────────────────────────");

  // Network-specific links
  if (networkName === "sepolia") {
    console.log("\n🔗 View on Etherscan:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("  ProjectRegistry:   https://sepolia.etherscan.io/address/" + projectRegistry.address);
    console.log("  PredictionMarket:  https://sepolia.etherscan.io/address/" + predictionMarket.address);
    console.log("  FundingPool:       https://sepolia.etherscan.io/address/" + fundingPool.address);
    console.log("  ReputationNFT:     https://sepolia.etherscan.io/address/" + reputationNFT.address);
  } else if (networkName === "bscTestnet") {
    console.log("\n🔗 View on BscScan Testnet:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("  ProjectRegistry:   https://testnet.bscscan.com/address/" + projectRegistry.address);
    console.log("  PredictionMarket:  https://testnet.bscscan.com/address/" + predictionMarket.address);
    console.log("  FundingPool:       https://testnet.bscscan.com/address/" + fundingPool.address);
    console.log("  ReputationNFT:     https://testnet.bscscan.com/address/" + reputationNFT.address);
  } else if (networkName === "bscMainnet") {
    console.log("\n🔗 View on BscScan:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("  ProjectRegistry:   https://bscscan.com/address/" + projectRegistry.address);
    console.log("  PredictionMarket:  https://bscscan.com/address/" + predictionMarket.address);
    console.log("  FundingPool:       https://bscscan.com/address/" + fundingPool.address);
    console.log("  ReputationNFT:     https://bscscan.com/address/" + reputationNFT.address);
  }

  console.log("\n📝 Next Steps:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  1. Verify contracts on block explorer");
  console.log("  2. Update frontend with contract addresses");
  console.log("─────────────────────────────────────────────────────────");

  console.log("\n🔍 Verification Commands:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`npx hardhat verify --network ${networkName} ${projectRegistry.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${predictionMarket.address} "${projectRegistry.address}"`);
  console.log(`npx hardhat verify --network ${networkName} ${fundingPool.address} "${projectRegistry.address}" "${predictionMarket.address}"`);
  console.log(`npx hardhat verify --network ${networkName} ${reputationNFT.address} "${predictionMarket.address}"`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ═══════════════════════════════════════════════════════");
    console.error("   DEPLOYMENT FAILED!");
    console.error("═══════════════════════════════════════════════════════\n");
    console.error(error);
    process.exit(1);
  });