import hre from "hardhat";
import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const networkName = (hre.network as any).name;

  console.log("\n🚀 ═══════════════════════════════════════════════════════");
  console.log("   DEPLOYING PREDICTION MARKET ONLY");
  console.log("═══════════════════════════════════════════════════════\n");

  // Get network connection
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  const deployer = walletClient.account.address;
  const chainId = await publicClient.getChainId();
  const balance = await publicClient.getBalance({ address: deployer });

  console.log("📋 Network Information:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  Network:      ", networkName);
  console.log("  Chain ID:     ", chainId);
  console.log("  Deployer:     ", deployer);
  console.log("  Balance:      ", (Number(balance) / 1e18).toFixed(4), "BNB");
  console.log("─────────────────────────────────────────────────────────\n");

  // Check balance
  if (balance < 50000000000000000n) { // 0.05 BNB minimum
    throw new Error("❌ Insufficient balance! Need at least 0.05 BNB");
  }

  // ================================================
  // Deploy PredictionMarket (Simplified - no constructor args)
  // ================================================
  console.log("📦 Deploying PredictionMarket (Simplified Version)...");
  console.log("⏳ This may take a minute...\n");
  
  const predictionMarket = await viem.deployContract("PredictionMarket");
  
  console.log("✅ PredictionMarket deployed!");
  console.log("   Address:", predictionMarket.address);
  console.log("   Waiting for confirmations...\n");
  
  // Wait for confirmations
  await new Promise(resolve => setTimeout(resolve, 5000));

  // ================================================
  // Save Deployment Info
  // ================================================
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    deployer: deployer,
    predictionMarket: predictionMarket.address,
    deploymentTime: new Date().toISOString(),
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `predictionmarket_${networkName}_${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Saved deployment info to:", filename);

  // ================================================
  // Summary
  // ================================================
  console.log("\n🎉 ═══════════════════════════════════════════════════════");
  console.log("   DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n📋 Contract Address:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  PredictionMarket: ", predictionMarket.address);
  console.log("─────────────────────────────────────────────────────────");

  if (networkName === "bscTestnet") {
    console.log("\n🔗 View on BscScan:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("  https://testnet.bscscan.com/address/" + predictionMarket.address);
  }

  console.log("\n📝 Next Steps:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  1. Update contracts.ts with:");
  console.log(`     PredictionMarket: "${predictionMarket.address}",`);
  console.log("\n  2. Verify contract (optional):");
  console.log(`     npx hardhat verify --network ${networkName} ${predictionMarket.address}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED!\n");
    console.error(error);
    process.exit(1);
  });