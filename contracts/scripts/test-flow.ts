import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { parseEther, formatEther } from "viem";

async function main() {
  console.log("\n🧪 ═══════════════════════════════════════════════════════");
  console.log("   PREDICT & FUND - Complete Workflow Test");
  console.log("═══════════════════════════════════════════════════════\n");

  const networkName = (hre.network as any).name;
  const publicClient = await (hre as any).viem.getPublicClient();
  const walletClients = await (hre as any).viem.getWalletClients();

  const [owner, user1, user2, projectOwner] = walletClients;

  console.log("📋 Test Accounts:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  Owner:         ", owner.account.address);
  console.log("  User1 (Better):", user1.account.address);
  console.log("  User2 (Better):", user2.account.address);
  console.log("  Project Owner: ", projectOwner.account.address);
  console.log("─────────────────────────────────────────────────────────\n");

  // Load deployed contracts
  const deploymentPath = path.join(process.cwd(), "deployments", `${networkName}_latest.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`❌ No deployment found for ${networkName}. Run deployment first!`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  console.log("📦 Loading Contracts:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("  ProjectRegistry:  ", deployment.projectRegistry);
  console.log("  PredictionMarket: ", deployment.predictionMarket);
  console.log("  FundingPool:      ", deployment.fundingPool);
  console.log("  ReputationNFT:    ", deployment.reputationNFT);
  console.log("─────────────────────────────────────────────────────────\n");

  const projectRegistry = await (hre as any).viem.getContractAt(
    "ProjectRegistry",
    deployment.projectRegistry
  );

  const predictionMarket = await (hre as any).viem.getContractAt(
    "PredictionMarket",
    deployment.predictionMarket
  );

  const fundingPool = await (hre as any).viem.getContractAt(
    "FundingPool",
    deployment.fundingPool
  );

  const reputationNFT = await (hre as any).viem.getContractAt(
    "ReputationNFT",
    deployment.reputationNFT
  );

  // ================================================
  // STEP 1: Submit Project
  // ================================================
  console.log("📝 STEP 1: Submitting Project");
  console.log("─────────────────────────────────────────────────────────");
  
  const listingFee = parseEther("0.1");
  const fundingGoal = parseEther("10");
  
  const now = Math.floor(Date.now() / 1000);
  const milestone1Date = BigInt(now + 30 * 24 * 3600); // 30 days
  const milestone2Date = BigInt(now + 60 * 24 * 3600); // 60 days

  await projectRegistry.write.submitProject(
    [
      "DeFi Lending Platform",
      "Revolutionary P2P lending protocol",
      "DeFi",
      "https://example.com/logo.png",
      fundingGoal,
      ["Complete Smart Contract Development", "Launch Testnet"],
      [milestone1Date, milestone2Date],
    ],
    {
      value: listingFee,
      account: projectOwner.account,
    }
  );

  console.log("✅ Project submitted (Project ID: 1)");
  console.log("   Funding Goal: 10 BNB");
  console.log("   Milestones: 2\n");

  // ================================================
  // STEP 2: Create Prediction Market
  // ================================================
  console.log("🎯 STEP 2: Creating Prediction Market");
  console.log("─────────────────────────────────────────────────────────");

  await predictionMarket.write.createMarket([1n], { account: owner.account }); // milestoneId = 1

  console.log("✅ Market created for Milestone #1");
  console.log("   Market ID: 1\n");

  // ================================================
  // STEP 3: Place Bets
  // ================================================
  console.log("💰 STEP 3: Placing Bets");
  console.log("─────────────────────────────────────────────────────────");

  const bet1Amount = parseEther("1");
  const bet2Amount = parseEther("0.5");

  // User1 bets YES
  await predictionMarket.write.placeBet([1n, 0], {
    value: bet1Amount,
    account: user1.account,
  });
  console.log("✅ User1 bet 1.0 BNB on YES");

  // User2 bets NO
  await predictionMarket.write.placeBet([1n, 1], {
    value: bet2Amount,
    account: user2.account,
  });
  console.log("✅ User2 bet 0.5 BNB on NO\n");

  // ================================================
  // STEP 4: Check Market Odds
  // ================================================
  console.log("📊 STEP 4: Market Statistics");
  console.log("─────────────────────────────────────────────────────────");

  const market = await predictionMarket.read.getMarket([1n]) as any;
  const odds = await predictionMarket.read.getMarketOdds([1n]) as [bigint, bigint];

  console.log("  Total YES Stake: ", formatEther(market.totalYesStake), "BNB");
  console.log("  Total NO Stake:  ", formatEther(market.totalNoStake), "BNB");
  console.log("  YES Odds:        ", Number(odds[0]) / 100, "%");
  console.log("  NO Odds:         ", Number(odds[1]) / 100, "%\n");

  // ================================================
  // STEP 5: Close Market
  // ================================================
  console.log("🔒 STEP 5: Closing Market");
  console.log("─────────────────────────────────────────────────────────");

  await predictionMarket.write.closeMarket([1n], { account: owner.account });
  console.log("✅ Market closed for betting\n");

  // ================================================
  // STEP 6: Resolve Market (YES outcome)
  // ================================================
  console.log("✅ STEP 6: Resolving Market");
  console.log("─────────────────────────────────────────────────────────");

  await predictionMarket.write.resolveMarket([1n, 0], { account: owner.account }); // Outcome: YES
  console.log("✅ Market resolved with YES outcome");
  console.log("   Winners: Users who bet YES\n");

  // ================================================
  // STEP 7: Check Claimable Rewards
  // ================================================
  console.log("💎 STEP 7: Checking Rewards");
  console.log("─────────────────────────────────────────────────────────");

  const claimable1 = await predictionMarket.read.getClaimableAmount([1n]) as bigint;
  console.log("  User1 can claim:", formatEther(claimable1), "BNB\n");

  // ================================================
  // STEP 8: Claim Rewards
  // ================================================
  console.log("💰 STEP 8: Claiming Rewards");
  console.log("─────────────────────────────────────────────────────────");

  await predictionMarket.write.claimRewards([1n], { account: user1.account });
  console.log("✅ User1 claimed", formatEther(claimable1), "BNB\n");

  // ================================================
  // STEP 9: Transfer Funding Pool
  // ================================================
  console.log("💸 STEP 9: Transferring Funding Pool");
  console.log("─────────────────────────────────────────────────────────");

  const poolAddress = deployment.fundingPool;
  await predictionMarket.write.transferFundingPool([poolAddress as `0x${string}`], {
    account: owner.account,
  });
  console.log("✅ Funding pool transferred to FundingPool contract\n");

  // ================================================
  // STEP 10: Grant Token Allocations
  // ================================================
  console.log("🎁 STEP 10: Granting Token Allocations");
  console.log("─────────────────────────────────────────────────────────");

  await fundingPool.write.grantTokenAllocations([1n, 1n], { account: owner.account });
  console.log("✅ Token allocation rights granted to top predictors\n");

  // ================================================
  // STEP 11: Allocate Funds
  // ================================================
  console.log("💵 STEP 11: Allocating Funds to Project");
  console.log("─────────────────────────────────────────────────────────");

  const allocation = parseEther("5");
  await fundingPool.write.allocateToProject([1n, allocation], { account: owner.account });
  console.log("✅ Allocated 5 BNB to project\n");

  // ================================================
  // STEP 12: Check Pool Stats
  // ================================================
  console.log("📊 STEP 12: Final Pool Statistics");
  console.log("─────────────────────────────────────────────────────────");

  const poolStats = await fundingPool.read.getPoolStats() as any;
  console.log("  Total Balance:    ", formatEther(poolStats.balance), "BNB");
  console.log("  Total Allocated:  ", formatEther(poolStats.allocated), "BNB");
  console.log("  Total Distributed:", formatEther(poolStats.distributed), "BNB");
  console.log("  Available:        ", formatEther(poolStats.available), "BNB\n");

  // ================================================
  // STEP 13: Check ReputationNFT Stats
  // ================================================
  console.log("🏆 STEP 13: Reputation System");
  console.log("─────────────────────────────────────────────────────────");

  const totalBadges = await reputationNFT.read.getTotalBadges() as bigint;
  const user1Stats = await reputationNFT.read.getUserStats([user1.account.address]) as any;

  console.log("  Total Badges Minted:", totalBadges.toString());
  console.log("  User1 Stats:");
  console.log("    Total Predictions:", user1Stats.totalPredictions.toString());
  console.log("    Total Wins:       ", user1Stats.totalWins.toString());
  console.log("    Current Streak:   ", user1Stats.currentStreak.toString());
  console.log("    Win Rate:         ", user1Stats.totalPredictions > 0n 
    ? (Number(user1Stats.totalWins) * 100 / Number(user1Stats.totalPredictions)).toFixed(2) + "%" 
    : "N/A");

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ WORKFLOW TEST COMPLETED SUCCESSFULLY!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n🎯 Summary:");
  console.log("  ✅ Project submitted and funded");
  console.log("  ✅ Prediction market created and resolved");
  console.log("  ✅ Winners claimed rewards");
  console.log("  ✅ Funding allocated to project");
  console.log("  ✅ Token allocation rights distributed");
  console.log("  ✅ Reputation system tracking performance");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ═══════════════════════════════════════════════════════");
    console.error("   WORKFLOW TEST FAILED!");
    console.error("═══════════════════════════════════════════════════════\n");
    console.error(error);
    process.exit(1);
  });