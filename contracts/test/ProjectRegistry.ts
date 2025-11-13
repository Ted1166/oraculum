import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("ProjectRegistry", function () {
  let viem: any;
  let projectRegistry: any;
  let owner: any;
  let projectOwner: any;
  let user1: any;

  beforeEach(async function () {
    const viem = (hre as any).viem;
    const walletClients = await viem.getWalletClients();
    [owner, projectOwner, user1] = walletClients;

    // Deploy ProjectRegistry
    projectRegistry = await viem.deployContract("ProjectRegistry");
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(projectRegistry.address).to.be.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should set correct listing fee", async function () {
      const listingFee = await projectRegistry.read.LISTING_FEE();
      expect(listingFee).to.equal(parseEther("0.1"));
    });

    it("Should start with zero projects", async function () {
      const totalProjects = await projectRegistry.read.getTotalProjects();
      expect(totalProjects).to.equal(0n);
    });
  });

  describe("Project Submission", function () {
    const listingFee = parseEther("0.1");
    const fundingGoal = parseEther("10");
    const now = Math.floor(Date.now() / 1000);
    const milestone1Date = BigInt(now + 30 * 24 * 3600);
    const milestone2Date = BigInt(now + 60 * 24 * 3600);

    it("Should submit a project successfully", async function () {
      await projectRegistry.write.submitProject(
        [
          "Test Project",
          "Test Description",
          "DeFi",
          "https://logo.url",
          fundingGoal,
          ["Milestone 1", "Milestone 2"],
          [milestone1Date, milestone2Date],
        ],
        { value: listingFee, account: projectOwner.account }
      );

      const totalProjects = await projectRegistry.read.getTotalProjects();
      expect(totalProjects).to.equal(1n);
    });

    it("Should fail with insufficient listing fee", async function () {
      const lowFee = parseEther("0.05");
      
      try {
        await projectRegistry.write.submitProject(
          [
            "Test Project",
            "Test Description",
            "DeFi",
            "https://logo.url",
            fundingGoal,
            ["Milestone 1"],
            [milestone1Date],
          ],
          { value: lowFee, account: projectOwner.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Insufficient listing fee");
      }
    });

    it("Should fail with empty project name", async function () {
      try {
        await projectRegistry.write.submitProject(
          [
            "",
            "Test Description",
            "DeFi",
            "https://logo.url",
            fundingGoal,
            ["Milestone 1"],
            [milestone1Date],
          ],
          { value: listingFee, account: projectOwner.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Name cannot be empty");
      }
    });

    it("Should fail with no milestones", async function () {
      try {
        await projectRegistry.write.submitProject(
          [
            "Test Project",
            "Test Description",
            "DeFi",
            "https://logo.url",
            fundingGoal,
            [],
            [],
          ],
          { value: listingFee, account: projectOwner.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Must have at least one milestone");
      }
    });

    it("Should fail with mismatched milestone arrays", async function () {
      try {
        await projectRegistry.write.submitProject(
          [
            "Test Project",
            "Test Description",
            "DeFi",
            "https://logo.url",
            fundingGoal,
            ["Milestone 1", "Milestone 2"],
            [milestone1Date],
          ],
          { value: listingFee, account: projectOwner.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Milestone arrays length mismatch");
      }
    });

    it("Should track owner projects", async function () {
      await projectRegistry.write.submitProject(
        [
          "Test Project",
          "Test Description",
          "DeFi",
          "https://logo.url",
          fundingGoal,
          ["Milestone 1"],
          [milestone1Date],
        ],
        { value: listingFee, account: projectOwner.account }
      );

      const ownerProjects = await projectRegistry.read.getOwnerProjects([
        projectOwner.account.address,
      ]);
      expect(ownerProjects.length).to.equal(1);
      expect(ownerProjects[0]).to.equal(1n);
    });

    it("Should retrieve project details", async function () {
      await projectRegistry.write.submitProject(
        [
          "Test Project",
          "Test Description",
          "DeFi",
          "https://logo.url",
          fundingGoal,
          ["Milestone 1"],
          [milestone1Date],
        ],
        { value: listingFee, account: projectOwner.account }
      );

      const project = await projectRegistry.read.getProject([1n]);
      expect(project.name).to.equal("Test Project");
      expect(project.owner).to.equal(projectOwner.account.address);
      expect(project.fundingGoal).to.equal(fundingGoal);
    });
  });

  describe("Milestone Management", function () {
    const listingFee = parseEther("0.1");
    const fundingGoal = parseEther("10");
    const now = Math.floor(Date.now() / 1000);
    const milestone1Date = BigInt(now - 1); // Past date for resolution

    beforeEach(async function () {
      await projectRegistry.write.submitProject(
        [
          "Test Project",
          "Test Description",
          "DeFi",
          "https://logo.url",
          fundingGoal,
          ["Milestone 1"],
          [milestone1Date],
        ],
        { value: listingFee, account: projectOwner.account }
      );
    });

    it("Should retrieve milestone details", async function () {
      const milestone = await projectRegistry.read.getMilestone([1n]);
      expect(milestone.description).to.equal("Milestone 1");
      expect(milestone.isResolved).to.equal(false);
    });

    it("Should resolve milestone by owner", async function () {
      await projectRegistry.write.resolveMilestone(
        [1n, 1n, true],
        { account: projectOwner.account }
      );

      const milestone = await projectRegistry.read.getMilestone([1n]);
      expect(milestone.isResolved).to.equal(true);
      expect(milestone.outcomeAchieved).to.equal(true);
    });

    it("Should fail to resolve milestone by non-owner", async function () {
      try {
        await projectRegistry.write.resolveMilestone(
          [1n, 1n, true],
          { account: user1.account }
        );
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Not authorized");
      }
    });

    it("Should get project milestones", async function () {
      const milestones = await projectRegistry.read.getProjectMilestones([1n]);
      expect(milestones.length).to.equal(1);
      expect(milestones[0].description).to.equal("Milestone 1");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to withdraw fees", async function () {
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
          ["Milestone 1"],
          [milestone1Date],
        ],
        { value: listingFee, account: projectOwner.account }
      );

      const publicClient = await viem.getPublicClient();
      const balanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      await projectRegistry.write.withdrawFees({ account: owner.account });

      const balanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should fail withdrawal by non-owner", async function () {
      try {
        await projectRegistry.write.withdrawFees({ account: user1.account });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Ownable");
      }
    });
  });
});