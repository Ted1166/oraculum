import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("ReputationNFT", function () {
  let viem: any;
  let projectRegistry: any;
  let predictionMarket: any;
  let reputationNFT: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let projectOwner: any;

  beforeEach(async function () {
    const viem = (hre as any).viem;
    const walletClients = await viem.getWalletClients();
    [owner, user1, user2, projectOwner] = walletClients;

    // Deploy contracts
    projectRegistry = await viem.deployContract("ProjectRegistry");
    predictionMarket = await viem.deployContract("PredictionMarket", [
      projectRegistry.address,
    ]);
    reputationNFT = await viem.deployContract("ReputationNFT", [
      predictionMarket.address,
    ]);
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(reputationNFT.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should set correct PredictionMarket address", async function () {
      const marketAddress = await reputationNFT.read.predictionMarket();
      expect(marketAddress).to.equal(predictionMarket.address);
    });

    it("Should set correct NFT name", async function () {
      const name = await reputationNFT.read.name();
      expect(name).to.equal("PREDICT & FUND Badge");
    });

    it("Should set correct NFT symbol", async function () {
      const symbol = await reputationNFT.read.symbol();
      expect(symbol).to.equal("PFB");
    });

    it("Should start with token counter at 0", async function () {
      const currentTokenId = await reputationNFT.read.getCurrentTokenId();
      expect(currentTokenId).to.equal(0n);
    });

    it("Should start with zero badges minted", async function () {
      const totalBadges = await reputationNFT.read.getTotalBadges();
      expect(Number(totalBadges)).to.equal(0);
    });
  });

  describe("Badge Minting", function () {
    it("Should mint achievement badge", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6], // AchievementType.Veteran
        { account: owner.account }
      );

      const totalBadges = await reputationNFT.read.getTotalBadges();
      expect(Number(totalBadges)).to.equal(1);
    });

    it("Should mint top predictor badge", async function () {
      await reputationNFT.write.mintTopPredictorBadge(
        [user1.account.address, 1n],
        { account: owner.account }
      );

      const totalBadges = await reputationNFT.read.getTotalBadges();
      expect(Number(totalBadges)).to.equal(1);
    });

    it("Should fail when non-owner tries to mint", async function () {
      try {
        await reputationNFT.write.mintAchievementBadge(
          [user1.account.address, 6],
          { account: user1.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });

    it("Should track user badges", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const userBadges = await reputationNFT.read.getUserBadges([
        user1.account.address,
      ]);

      expect(userBadges.length).to.equal(1);
    });

    it("Should not allow duplicate achievements", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      try {
        await reputationNFT.write.mintAchievementBadge(
          [user1.account.address, 6],
          { account: owner.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Already has this achievement");
      }
    });

    it("Should assign correct token to user", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const publicClient = await viem.getPublicClient();
      const tokenOwner = await publicClient.readContract({
        address: reputationNFT.address,
        abi: reputationNFT.abi,
        functionName: "ownerOf",
        args: [1n],
      });

      expect(tokenOwner).to.equal(user1.account.address);
    });
  });

  describe("User Stats Tracking", function () {
    it("Should update stats on win", async function () {
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.totalPredictions)).to.equal(1);
      expect(Number(stats.totalWins)).to.equal(1);
      expect(Number(stats.currentStreak)).to.equal(1);
    });

    it("Should update stats on loss", async function () {
      await reputationNFT.write.updateStats(
        [user1.account.address, false, parseEther("1"), 0n],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.totalPredictions)).to.equal(1);
      expect(Number(stats.totalLosses)).to.equal(1);
      expect(Number(stats.currentStreak)).to.equal(0);
    });

    it("Should track longest win streak", async function () {
      // Win 3 times
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.longestStreak)).to.equal(3);
    });

    it("Should reset current streak on loss", async function () {
      // Win twice
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );

      // Then lose
      await reputationNFT.write.updateStats(
        [user1.account.address, false, parseEther("1"), 0n],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.currentStreak)).to.equal(0);
      expect(Number(stats.longestStreak)).to.equal(2);
    });

    it("Should accumulate total wagered", async function () {
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("2"), parseEther("3")],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.totalWagered)).to.equal(Number(parseEther("3")));
    });

    it("Should accumulate total earnings", async function () {
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("2")],
        { account: owner.account }
      );

      const stats = await reputationNFT.read.getUserStats([
        user1.account.address,
      ]) as any;

      expect(Number(stats.totalEarnings)).to.equal(Number(parseEther("3.5")));
    });
  });

  describe("Automatic Achievement Unlocking", function () {
    it("Should unlock 5 win streak badge", async function () {
      // Win 5 times
      for (let i = 0; i < 5; i++) {
        await reputationNFT.write.updateStats(
          [user1.account.address, true, parseEther("1"), parseEther("1.5")],
          { account: owner.account }
        );
      }

      const hasBadge = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        2, // AchievementType.WinStreak5
      ]);

      expect(hasBadge).to.equal(true);
    });

    it("Should unlock 10 win streak badge", async function () {
      // Win 10 times
      for (let i = 0; i < 10; i++) {
        await reputationNFT.write.updateStats(
          [user1.account.address, true, parseEther("1"), parseEther("1.5")],
          { account: owner.account }
        );
      }

      const hasBadge = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        3, // AchievementType.WinStreak10
      ]);

      expect(hasBadge).to.equal(true);
    });

    it("Should unlock veteran badge at 50 predictions", async function () {
      // Make 50 predictions
      for (let i = 0; i < 50; i++) {
        await reputationNFT.write.updateStats(
          [user1.account.address, i % 2 === 0, parseEther("1"), i % 2 === 0 ? parseEther("1.5") : 0n],
          { account: owner.account }
        );
      }

      const hasBadge = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        6, // AchievementType.Veteran
      ]);

      expect(hasBadge).to.equal(true);
    });

    it("Should unlock whale badge at 10 BNB wagered", async function () {
      // Wager 10 BNB
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("10"), parseEther("15")],
        { account: owner.account }
      );

      const hasBadge = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        8, // AchievementType.Whale
      ]);

      expect(hasBadge).to.equal(true);
    });
  });

  describe("Win Rate Calculation", function () {
    it("Should calculate correct win rate", async function () {
      // 3 wins, 1 loss = 75% win rate
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, false, parseEther("1"), 0n],
        { account: owner.account }
      );

      const winRate = await reputationNFT.read.getWinRate([
        user1.account.address,
      ]) as bigint;

      // Should be 7500 (75% in basis points)
      expect(Number(winRate)).to.equal(7500);
    });

    it("Should return 0 win rate for no predictions", async function () {
      const winRate = await reputationNFT.read.getWinRate([
        user1.account.address,
      ]) as bigint;

      expect(Number(winRate)).to.equal(0);
    });
  });

  describe("Badge Details", function () {
    it("Should retrieve badge details", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const badge = await reputationNFT.read.getBadge([1n]) as any;

      expect(Number(badge.tokenId)).to.equal(1);
      expect(Number(badge.achievementType)).to.equal(6);
      expect(badge.customMessage).to.equal("50 Predictions");
    });

    it("Should generate SVG for badge", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const svg = await reputationNFT.read.generateSVG([1n]);

      expect(svg).to.include("<svg");
      expect(svg).to.include("</svg>");
    });

    it("Should generate token URI with metadata", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const tokenURI = await reputationNFT.read.tokenURI([1n]);

      expect(tokenURI).to.include("data:application/json;base64,");
    });
  });

  describe("Soulbound Tokens", function () {
    it("Should mark specific badges as soulbound", async function () {
      // WinStreak badges are soulbound
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );
      await reputationNFT.write.updateStats(
        [user1.account.address, true, parseEther("1"), parseEther("1.5")],
        { account: owner.account }
      );

      const badge = await reputationNFT.read.getBadge([1n]) as any;
      expect(badge.soulbound).to.equal(true);
    });

    it("Should prevent transfer of soulbound tokens", async function () {
      // Mint a soulbound badge
      for (let i = 0; i < 5; i++) {
        await reputationNFT.write.updateStats(
          [user1.account.address, true, parseEther("1"), parseEther("1.5")],
          { account: owner.account }
        );
      }

      try {
        await reputationNFT.write.transferFrom(
          [user1.account.address, user2.account.address, 1n],
          { account: user1.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Token is soulbound");
      }
    });

    it("Should allow transfer of non-soulbound tokens", async function () {
      // TopPredictor badges are NOT soulbound
      await reputationNFT.write.mintTopPredictorBadge(
        [user1.account.address, 1n],
        { account: owner.account }
      );

      await reputationNFT.write.transferFrom(
        [user1.account.address, user2.account.address, 1n],
        { account: user1.account }
      );

      const publicClient = await viem.getPublicClient();
      const newOwner = await publicClient.readContract({
        address: reputationNFT.address,
        abi: reputationNFT.abi,
        functionName: "ownerOf",
        args: [1n],
      });

      expect(newOwner).to.equal(user2.account.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update PredictionMarket", async function () {
      const newMarket = await viem.deployContract("PredictionMarket", [
        projectRegistry.address,
      ]);

      await reputationNFT.write.updatePredictionMarket([newMarket.address], {
        account: owner.account,
      });

      const marketAddress = await reputationNFT.read.predictionMarket();
      expect(marketAddress).to.equal(newMarket.address);
    });

    it("Should fail when non-owner tries to update", async function () {
      const newMarket = await viem.deployContract("PredictionMarket", [
        projectRegistry.address,
      ]);

      try {
        await reputationNFT.write.updatePredictionMarket([newMarket.address], {
          account: user1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });

    it("Should get current token ID", async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );

      const currentTokenId = await reputationNFT.read.getCurrentTokenId();
      expect(Number(currentTokenId)).to.equal(1);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await reputationNFT.write.mintAchievementBadge(
        [user1.account.address, 6],
        { account: owner.account }
      );
    });

    it("Should check if user has achievement", async function () {
      const hasAchievement = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        6,
      ]);

      expect(hasAchievement).to.equal(true);
    });

    it("Should return false for achievements user doesn't have", async function () {
      const hasAchievement = await reputationNFT.read.hasUserAchievement([
        user1.account.address,
        7, // Legend
      ]);

      expect(hasAchievement).to.equal(false);
    });

    it("Should get total badges minted", async function () {
      const totalBadges = await reputationNFT.read.getTotalBadges();
      expect(Number(totalBadges)).to.equal(1);
    });

    it("Should get user badges", async function () {
      const userBadges = await reputationNFT.read.getUserBadges([
        user1.account.address,
      ]);

      expect(userBadges.length).to.equal(1);
      expect(Number(userBadges[0])).to.equal(1);
    });
  });
});