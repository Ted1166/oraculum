import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("PredictionMarket", function () {
  let viem: any;
  let projectRegistry: any;
  let predictionMarket: any;
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

    // Submit a project with a milestone
    const listingFee = parseEther("0.1");
    const fundingGoal = parseEther("10");
    const now = Math.floor(Date.now() / 1000);
    const milestone1Date = BigInt(now + 30 * 24 * 3600);

    await projectRegistry.write.submitProject(
      [
        "Test Project",
        "Test Description",
        "DeFi",
        "https://logo.url",
        fundingGoal,
        ["Launch Testnet"],
        [milestone1Date],
      ],
      { value: listingFee, account: projectOwner.account }
    );
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(predictionMarket.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should set correct ProjectRegistry address", async function () {
      const registryAddress = await predictionMarket.read.projectRegistry();
      expect(registryAddress).to.equal(projectRegistry.address);
    });

    it("Should set correct min bet amount", async function () {
      const minBet = await predictionMarket.read.minBetAmount();
      expect(minBet).to.equal(parseEther("0.01"));
    });

    it("Should start with market ID counter at 0", async function () {
      const currentMarketId = await predictionMarket.read.getCurrentMarketId();
      expect(currentMarketId).to.equal(0n);
    });

    it("Should start with zero protocol fees collected", async function () {
      const fees = await predictionMarket.read.protocolFeesCollected();
      expect(fees).to.equal(0n);
    });
  });

  describe("Market Creation", function () {
    it("Should create a market successfully", async function () {
      await predictionMarket.write.createMarket([1n], { account: owner.account });

      const currentMarketId = await predictionMarket.read.getCurrentMarketId();
      expect(currentMarketId).to.equal(1n);

      const market = await predictionMarket.read.getMarket([1n]) as any;
      expect(market.milestoneId).to.equal(1n);
      expect(market.status).to.equal(0); // MarketStatus.Open
    });

    it("Should fail to create market for non-existent milestone", async function () {
      try {
        await predictionMarket.write.createMarket([999n], { account: owner.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("revert");
      }
    });

    it("Should fail when non-owner tries to create market", async function () {
      try {
        await predictionMarket.write.createMarket([1n], { account: user1.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      // Create market
      await predictionMarket.write.createMarket([1n], { account: owner.account });
    });

    it("Should place a bet successfully", async function () {
      const betAmount = parseEther("1");

      await predictionMarket.write.placeBet([1n, 0], {
        value: betAmount,
        account: user1.account,
      });

      const currentBetId = await predictionMarket.read.getCurrentBetId();
      expect(currentBetId).to.equal(1n);

      const bet = await predictionMarket.read.getBet([1n]) as any;
      expect(bet.bettor).to.equal(user1.account.address);
      expect(bet.marketId).to.equal(1n);
    });

    it("Should fail with bet amount below minimum", async function () {
      const lowBet = parseEther("0.005");

      try {
        await predictionMarket.write.placeBet([1n, 0], {
          value: lowBet,
          account: user1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Bet amount too low");
      }
    });

    it("Should fail when betting on non-existent market", async function () {
      const betAmount = parseEther("1");

      try {
        await predictionMarket.write.placeBet([999n, 0], {
          value: betAmount,
          account: user1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Market does not exist");
      }
    });

    it("Should fail when user bets twice on same market", async function () {
      const betAmount = parseEther("1");

      await predictionMarket.write.placeBet([1n, 0], {
        value: betAmount,
        account: user1.account,
      });

      try {
        await predictionMarket.write.placeBet([1n, 1], {
          value: betAmount,
          account: user1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Already bet on this market");
      }
    });

    it("Should update market totals correctly", async function () {
      const bet1Amount = parseEther("1");
      const bet2Amount = parseEther("0.5");

      await predictionMarket.write.placeBet([1n, 0], {
        value: bet1Amount,
        account: user1.account,
      });

      await predictionMarket.write.placeBet([1n, 1], {
        value: bet2Amount,
        account: user2.account,
      });

      const market = await predictionMarket.read.getMarket([1n]) as any;
      expect(market.totalYesBettors).to.equal(1n);
      expect(market.totalNoBettors).to.equal(1n);
    });

    it("Should calculate market odds correctly", async function () {
      const bet1Amount = parseEther("2");
      const bet2Amount = parseEther("1");

      await predictionMarket.write.placeBet([1n, 0], {
        value: bet1Amount,
        account: user1.account,
      });

      await predictionMarket.write.placeBet([1n, 1], {
        value: bet2Amount,
        account: user2.account,
      });

      const odds = await predictionMarket.read.getMarketOdds([1n]) as [bigint, bigint];
      // Should be roughly 2:1 ratio (66.67% YES, 33.33% NO)
      expect(Number(odds[0])).to.be.greaterThan(6000); // ~66%
      expect(Number(odds[1])).to.be.lessThan(4000); // ~33%
    });

    it("Should allow increasing bet", async function () {
      const initialBet = parseEther("1");
      const additionalBet = parseEther("0.5");

      await predictionMarket.write.placeBet([1n, 0], {
        value: initialBet,
        account: user1.account,
      });

      await predictionMarket.write.increaseBet([1n], {
        value: additionalBet,
        account: user1.account,
      });

      const bet = await predictionMarket.read.getBet([1n]) as any;
      // Amount should be increased (minus fees)
      expect(Number(bet.amount)).to.be.greaterThan(Number(initialBet));
    });
  });

  describe("Market Closing", function () {
    beforeEach(async function () {
      await predictionMarket.write.createMarket([1n], { account: owner.account });
    });

    it("Should close market successfully", async function () {
      await predictionMarket.write.closeMarket([1n], { account: owner.account });

      const market = await predictionMarket.read.getMarket([1n]) as any;
      expect(market.status).to.equal(1); // MarketStatus.Closed
    });

    it("Should fail when non-owner tries to close market", async function () {
      try {
        await predictionMarket.write.closeMarket([1n], { account: user1.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });

    it("Should fail to close already closed market", async function () {
      await predictionMarket.write.closeMarket([1n], { account: owner.account });

      try {
        await predictionMarket.write.closeMarket([1n], { account: owner.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Market not open");
      }
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      await predictionMarket.write.createMarket([1n], { account: owner.account });

      const bet1Amount = parseEther("1");
      const bet2Amount = parseEther("0.5");

      await predictionMarket.write.placeBet([1n, 0], {
        value: bet1Amount,
        account: user1.account,
      });

      await predictionMarket.write.placeBet([1n, 1], {
        value: bet2Amount,
        account: user2.account,
      });

      await predictionMarket.write.closeMarket([1n], { account: owner.account });
    });

    it("Should resolve market successfully", async function () {
      await predictionMarket.write.resolveMarket([1n, 0], { account: owner.account });

      const market = await predictionMarket.read.getMarket([1n]) as any;
      expect(market.status).to.equal(2); // MarketStatus.Resolved
      expect(market.outcomeSet).to.equal(true);
      expect(market.finalOutcome).to.equal(0); // Outcome.Yes
    });

    it("Should calculate rewards for winners", async function () {
      await predictionMarket.write.resolveMarket([1n, 0], { account: owner.account });

      const claimable = await predictionMarket.read.getClaimableAmount([1n]) as bigint;
      expect(Number(claimable)).to.be.greaterThan(0);
    });

    it("Should fail when non-owner tries to resolve", async function () {
      try {
        await predictionMarket.write.resolveMarket([1n, 0], { account: user1.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });
  });

  describe("Reward Claiming", function () {
    beforeEach(async function () {
      await predictionMarket.write.createMarket([1n], { account: owner.account });

      const bet1Amount = parseEther("1");
      await predictionMarket.write.placeBet([1n, 0], {
        value: bet1Amount,
        account: user1.account,
      });

      const bet2Amount = parseEther("0.5");
      await predictionMarket.write.placeBet([1n, 1], {
        value: bet2Amount,
        account: user2.account,
      });

      await predictionMarket.write.closeMarket([1n], { account: owner.account });
      await predictionMarket.write.resolveMarket([1n, 0], { account: owner.account });
    });

    it("Should allow winner to claim rewards", async function () {
      const publicClient = await viem.getPublicClient();
      const balanceBefore = await publicClient.getBalance({
        address: user1.account.address,
      });

      await predictionMarket.write.claimRewards([1n], { account: user1.account });

      const balanceAfter = await publicClient.getBalance({
        address: user1.account.address,
      });

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should fail when claiming twice", async function () {
      await predictionMarket.write.claimRewards([1n], { account: user1.account });

      try {
        await predictionMarket.write.claimRewards([1n], { account: user1.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Already claimed");
      }
    });

    it("Should fail when loser tries to claim", async function () {
      try {
        await predictionMarket.write.claimRewards([2n], { account: user2.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("revert");
      }
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to withdraw protocol fees", async function () {
      await predictionMarket.write.createMarket([1n], { account: owner.account });

      const betAmount = parseEther("1");
      await predictionMarket.write.placeBet([1n, 0], {
        value: betAmount,
        account: user1.account,
      });

      const publicClient = await viem.getPublicClient();
      const balanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      await predictionMarket.write.withdrawProtocolFees(
        [owner.account.address],
        { account: owner.account }
      );

      const balanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should allow owner to update min bet amount", async function () {
      const newMinBet = parseEther("0.05");

      await predictionMarket.write.updateMinBetAmount([newMinBet], {
        account: owner.account,
      });

      const minBet = await predictionMarket.read.minBetAmount();
      expect(minBet).to.equal(newMinBet);
    });
  });
});