import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("FundingPool", function () {
  let viem: any;
  let projectRegistry: any;
  let predictionMarket: any;
  let fundingPool: any;
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
    fundingPool = await viem.deployContract("FundingPool", [
      projectRegistry.address,
      predictionMarket.address,
    ]);

    // Submit a project
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

    // Create market and place bets
    await predictionMarket.write.createMarket([1n], { account: owner.account });

    await predictionMarket.write.placeBet([1n, 0], {
      value: parseEther("1"),
      account: user1.account,
    });

    await predictionMarket.write.placeBet([1n, 1], {
      value: parseEther("0.5"),
      account: user2.account,
    });

    await predictionMarket.write.closeMarket([1n], { account: owner.account });
    await predictionMarket.write.resolveMarket([1n, 0], { account: owner.account });
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(fundingPool.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should set correct ProjectRegistry address", async function () {
      const registryAddress = await fundingPool.read.projectRegistry();
      expect(registryAddress).to.equal(projectRegistry.address);
    });

    it("Should set correct PredictionMarket address", async function () {
      const marketAddress = await fundingPool.read.predictionMarket();
      expect(marketAddress).to.equal(predictionMarket.address);
    });

    it("Should start with zero pool balance", async function () {
      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.balance)).to.equal(0);
    });
  });

  describe("Receiving Funds", function () {
    it("Should receive funds from PredictionMarket", async function () {
      const publicClient = await viem.getPublicClient();
      
      // Transfer funding pool from prediction market
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );

      const balance = await publicClient.getBalance({
        address: fundingPool.address,
      });

      expect(Number(balance)).to.be.greaterThan(0);
    });

    it("Should update pool stats after receiving funds", async function () {
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );

      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.balance)).to.be.greaterThan(0);
    });
  });

  describe("Token Allocation Rights", function () {
    beforeEach(async function () {
      // Transfer funds to pool
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );
    });

    it("Should grant token allocations to top predictors", async function () {
      await fundingPool.write.grantTokenAllocations([1n, 1n], {
        account: owner.account,
      });

      const hasReceived = await fundingPool.read.hasReceivedAllocation([1n]);
      expect(hasReceived).to.equal(true);
    });

    it("Should fail to grant allocations twice", async function () {
      await fundingPool.write.grantTokenAllocations([1n, 1n], {
        account: owner.account,
      });

      try {
        await fundingPool.write.grantTokenAllocations([1n, 1n], {
          account: owner.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Already granted for this project");
      }
    });

    it("Should track user token allocations", async function () {
      await fundingPool.write.grantTokenAllocations([1n, 1n], {
        account: owner.account,
      });

      const userAllocations = await fundingPool.read.getUserTokenAllocations([
        user1.account.address,
      ]);

      expect(userAllocations.length).to.be.greaterThan(0);
    });

    it("Should assign correct allocation percentages", async function () {
      await fundingPool.write.grantTokenAllocations([1n, 1n], {
        account: owner.account,
      });

      const allocation = await fundingPool.read.getTokenAllocation([1n]) as any;
      
      // Top 3 should get 2% (200 BPS)
      expect(Number(allocation.allocationBps)).to.equal(200);
    });
  });

  describe("Fund Allocation", function () {
    beforeEach(async function () {
      // Transfer funds to pool
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );
    });

    it("Should allocate funds to a project", async function () {
      const allocation = parseEther("5");

      await fundingPool.write.allocateToProject([1n, allocation], {
        account: owner.account,
      });

      const projectAllocation = await fundingPool.read.getProjectAllocation([1n]) as any;
      expect(Number(projectAllocation.totalAllocated)).to.equal(Number(allocation));
    });

    it("Should fail with insufficient pool balance", async function () {
      const tooMuch = parseEther("1000");

      try {
        await fundingPool.write.allocateToProject([1n, tooMuch], {
          account: owner.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Insufficient pool balance");
      }
    });

    it("Should fail when non-owner tries to allocate", async function () {
      const allocation = parseEther("5");

      try {
        await fundingPool.write.allocateToProject([1n, allocation], {
          account: user1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });

    it("Should update pool stats after allocation", async function () {
      const allocation = parseEther("2");

      await fundingPool.write.allocateToProject([1n, allocation], {
        account: owner.account,
      });

      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.allocated)).to.equal(Number(allocation));
      expect(Number(stats.available)).to.be.lessThan(Number(stats.balance));
    });
  });

  describe("Batch Allocation", function () {
    beforeEach(async function () {
      // Transfer funds to pool
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );
    });

    it("Should batch allocate to multiple projects", async function () {
      const projectIds = [1n];
      const amounts = [parseEther("1")];

      await fundingPool.write.batchAllocate([projectIds, amounts], {
        account: owner.account,
      });

      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.allocated)).to.be.greaterThan(0);
    });

    it("Should fail with mismatched array lengths", async function () {
      const projectIds = [1n, 2n];
      const amounts = [parseEther("1")];

      try {
        await fundingPool.write.batchAllocate([projectIds, amounts], {
          account: owner.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Array length mismatch");
      }
    });
  });

  describe("Milestone Release", function () {
    beforeEach(async function () {
      // Transfer funds and allocate
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );

      await fundingPool.write.allocateToProject([1n, parseEther("5")], {
        account: owner.account,
      });
    });

    it("Should release funds on milestone achievement", async function () {
      const releaseAmount = parseEther("2");

      await fundingPool.write.releaseOnMilestone([1n, 1n, releaseAmount], {
        account: owner.account,
      });

      const projectAllocation = await fundingPool.read.getProjectAllocation([1n]) as any;
      expect(Number(projectAllocation.totalReleased)).to.equal(Number(releaseAmount));
    });

    it("Should fail with insufficient pending release", async function () {
      const tooMuch = parseEther("10");

      try {
        await fundingPool.write.releaseOnMilestone([1n, 1n, tooMuch], {
          account: owner.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Insufficient pending release");
      }
    });

    it("Should update distributed amount", async function () {
      const releaseAmount = parseEther("2");

      await fundingPool.write.releaseOnMilestone([1n, 1n, releaseAmount], {
        account: owner.account,
      });

      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.distributed)).to.equal(Number(releaseAmount));
    });

    it("Should transfer funds to project owner", async function () {
      const publicClient = await viem.getPublicClient();
      const balanceBefore = await publicClient.getBalance({
        address: projectOwner.account.address,
      });

      const releaseAmount = parseEther("2");
      await fundingPool.write.releaseOnMilestone([1n, 1n, releaseAmount], {
        account: owner.account,
      });

      const balanceAfter = await publicClient.getBalance({
        address: projectOwner.account.address,
      });

      expect(Number(balanceAfter)).to.be.greaterThan(Number(balanceBefore));
    });

    it("Should check if milestone is released", async function () {
      const releaseAmount = parseEther("2");
      await fundingPool.write.releaseOnMilestone([1n, 1n, releaseAmount], {
        account: owner.account,
      });

      const isReleased = await fundingPool.read.isMilestoneReleased([1n, 1n]);
      expect(isReleased).to.equal(true);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );
      await fundingPool.write.grantTokenAllocations([1n, 1n], {
        account: owner.account,
      });
    });

    it("Should get user project allocation", async function () {
      const userProjectAlloc = await fundingPool.read.getUserProjectAllocation([
        user1.account.address,
        1n,
      ]);

      expect(Number(userProjectAlloc)).to.be.greaterThan(0);
    });

    it("Should get project token allocations", async function () {
      const projectAllocations = await fundingPool.read.getProjectTokenAllocations([1n]);
      expect(projectAllocations.length).to.be.greaterThan(0);
    });

    it("Should get available pool amount", async function () {
      const available = await fundingPool.read.getAvailablePool();
      expect(Number(available)).to.be.greaterThan(0);
    });

    it("Should get pool stats", async function () {
      const stats = await fundingPool.read.getPoolStats() as any;
      
      expect(stats.balance).to.exist;
      expect(stats.allocated).to.exist;
      expect(stats.distributed).to.exist;
      expect(stats.available).to.exist;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update ProjectRegistry", async function () {
      const newRegistry = await viem.deployContract("ProjectRegistry");

      await fundingPool.write.updateProjectRegistry([newRegistry.address], {
        account: owner.account,
      });

      const registryAddress = await fundingPool.read.projectRegistry();
      expect(registryAddress).to.equal(newRegistry.address);
    });

    it("Should allow owner to update PredictionMarket", async function () {
      const newMarket = await viem.deployContract("PredictionMarket", [
        projectRegistry.address,
      ]);

      await fundingPool.write.updatePredictionMarket([newMarket.address], {
        account: owner.account,
      });

      const marketAddress = await fundingPool.read.predictionMarket();
      expect(marketAddress).to.equal(newMarket.address);
    });

    it("Should allow owner to pause contract", async function () {
      await fundingPool.write.pause({ account: owner.account });

      try {
        await fundingPool.write.allocateToProject([1n, parseEther("1")], {
          account: owner.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Pausable");
      }
    });

    it("Should allow owner to unpause contract", async function () {
      await fundingPool.write.pause({ account: owner.account });
      await fundingPool.write.unpause({ account: owner.account });

      // Should be able to allocate after unpause
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );

      await fundingPool.write.allocateToProject([1n, parseEther("1")], {
        account: owner.account,
      });

      const stats = await fundingPool.read.getPoolStats() as any;
      expect(Number(stats.allocated)).to.be.greaterThan(0);
    });

    it("Should allow emergency withdrawal", async function () {
      await predictionMarket.write.transferFundingPool(
        [fundingPool.address],
        { account: owner.account }
      );

      const publicClient = await viem.getPublicClient();
      const poolBalance = await publicClient.getBalance({
        address: fundingPool.address,
      });

      const balanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      await fundingPool.write.emergencyWithdraw(
        [owner.account.address, poolBalance],
        { account: owner.account }
      );

      const balanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      expect(Number(balanceAfter)).to.be.greaterThan(Number(balanceBefore));
    });
  });
});