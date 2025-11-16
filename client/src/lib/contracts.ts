import { bscTestnet } from "wagmi/chains";

// Contract addresses from BSC Testnet deployment
export const CONTRACTS = {
  bscTestnet: {
    ProjectRegistry: "0xfd4b0fbe8f148dbf628714fd856ab136ca9419ae",
    PredictionMarket: "0x36e546e116ef7ec787c7f50c47f997fda194e881",
    FundingPool: "0x70228c02b198d40477050a5f34189040b76f34ad",
    ReputationNFT: "0xe0b7f5050f6fc38c078a05c0becc3877b12ae729",
  },
  sepolia: {
    ProjectRegistry: "0x165f0e15F7CDA6EEFefAb1B1CC18dbb7Bf0b3DdA",
    PredictionMarket: "0x0c5450a30deee8f1c9673ad058f1f6b3ac0edc30",
    FundingPool: "0xf1f1a3d5259d169da3347809d5fc07ad6ffa017e",
    ReputationNFT: "0x90df65e6f779d7ac1f62a7591d581006dc78ff87",
  },
};

// Use BSC Testnet
export const ACTIVE_CHAIN = bscTestnet;
export const ACTIVE_CONTRACTS = CONTRACTS.bscTestnet;

// ✅ CORRECTED ABI - Matches your deployed contract (7 params)
export const PROJECT_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalRaised",
        type: "uint256",
      },
    ],
    name: "FundsRaised",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
    ],
    name: "incrementPredictions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "milestoneId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "targetDate",
        type: "uint256",
      },
    ],
    name: "MilestoneAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "milestoneId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "outcomeAchieved",
        type: "bool",
      },
    ],
    name: "MilestoneResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum ProjectRegistry.ProjectStatus",
        name: "oldStatus",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "enum ProjectRegistry.ProjectStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "ProjectStatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fundingGoal",
        type: "uint256",
      },
    ],
    name: "ProjectSubmitted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "recordFundsRaised",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_milestoneId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_outcomeAchieved",
        type: "bool",
      },
    ],
    name: "resolveMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "string",
        name: "_category",
        type: "string",
      },
      {
        internalType: "string",
        name: "_logoUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_fundingGoal",
        type: "uint256",
      },
      {
        internalType: "string[]",
        name: "_milestoneDescriptions",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "_milestoneDates",
        type: "uint256[]",
      },
    ],
    name: "submitProject",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
      {
        internalType: "enum ProjectRegistry.ProjectStatus",
        name: "_newStatus",
        type: "uint8",
      },
    ],
    name: "updateProjectStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllProjects",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "string",
            name: "category",
            type: "string",
          },
          {
            internalType: "string",
            name: "logoUrl",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fundingGoal",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "submissionDate",
            type: "uint256",
          },
          {
            internalType: "enum ProjectRegistry.ProjectStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint256[]",
            name: "milestoneIds",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "totalFundsRaised",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalPredictions",
            type: "uint256",
          },
        ],
        internalType: "struct ProjectRegistry.Project[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_milestoneId",
        type: "uint256",
      },
    ],
    name: "getMilestone",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "targetDate",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isResolved",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "outcomeAchieved",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "resolutionDate",
            type: "uint256",
          },
        ],
        internalType: "struct ProjectRegistry.Milestone",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    name: "getOwnerProjects",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
    ],
    name: "getProject",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "string",
            name: "category",
            type: "string",
          },
          {
            internalType: "string",
            name: "logoUrl",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fundingGoal",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "submissionDate",
            type: "uint256",
          },
          {
            internalType: "enum ProjectRegistry.ProjectStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint256[]",
            name: "milestoneIds",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "totalFundsRaised",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalPredictions",
            type: "uint256",
          },
        ],
        internalType: "struct ProjectRegistry.Project",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256",
      },
    ],
    name: "getProjectMilestones",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "targetDate",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isResolved",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "outcomeAchieved",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "resolutionDate",
            type: "uint256",
          },
        ],
        internalType: "struct ProjectRegistry.Milestone[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalMilestones",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalProjects",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LISTING_FEE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "milestones",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "targetDate",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isResolved",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "outcomeAchieved",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "resolutionDate",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "ownerProjects",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "projectMilestones",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "projects",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "category",
        type: "string",
      },
      {
        internalType: "string",
        name: "logoUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "fundingGoal",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "submissionDate",
        type: "uint256",
      },
      {
        internalType: "enum ProjectRegistry.ProjectStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "totalFundsRaised",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalPredictions",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ✅ UPDATED PREDICTION_MARKET_ABI - Paste this into contracts.ts

export const PREDICTION_MARKET_ABI = [
  // ✅ UPDATED: placeBet now takes projectId, milestoneIndex, predictYes
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "predictYes", type: "bool" }
    ],
    name: "placeBet",
    outputs: [
      { name: "betId", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBets",
    outputs: [
      { name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { name: "marketId", type: "uint256" },
          { name: "milestoneId", type: "uint256" },
          { name: "projectId", type: "uint256" },
          { name: "closeTime", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "outcomeSet", type: "bool" },
          { name: "finalOutcome", type: "uint8" },
          { name: "totalYesStake", type: "uint256" },
          { name: "totalNoStake", type: "uint256" },
          { name: "totalYesBettors", type: "uint256" },
          { name: "totalNoBettors", type: "uint256" },
          { name: "resolutionTime", type: "uint256" },
          { name: "rewardsCalculated", type: "bool" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // ✅ NEW: Get market by projectId and milestoneIndex
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" }
    ],
    name: "getMarketByProjectMilestone",
    outputs: [
      {
        components: [
          { name: "marketId", type: "uint256" },
          { name: "milestoneId", type: "uint256" },
          { name: "projectId", type: "uint256" },
          { name: "closeTime", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "outcomeSet", type: "bool" },
          { name: "finalOutcome", type: "uint8" },
          { name: "totalYesStake", type: "uint256" },
          { name: "totalNoStake", type: "uint256" },
          { name: "totalYesBettors", type: "uint256" },
          { name: "totalNoBettors", type: "uint256" },
          { name: "resolutionTime", type: "uint256" },
          { name: "rewardsCalculated", type: "bool" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "getBet",
    outputs: [
      {
        components: [
          { name: "betId", type: "uint256" },
          { name: "marketId", type: "uint256" },
          { name: "bettor", type: "address" },
          { name: "prediction", type: "uint8" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "rewardAmount", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "increaseBet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "closeMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "finalOutcome", type: "uint8" }
    ],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "reason", type: "string" }
    ],
    name: "cancelMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "getClaimableAmount",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "user", type: "address" }
    ],
    name: "hasUserBetOnMarket",
    outputs: [
      { name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarketOdds",
    outputs: [
      { name: "yesOdds", type: "uint256" },
      { name: "noOdds", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarketBets",
    outputs: [
      { name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function",
  },
  // Admin functions
  {
    inputs: [{ name: "_fundingPool", type: "address" }],
    name: "setFundingPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newMinBet", type: "uint256" }],
    name: "updateMinBetAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "to", type: "address" }],
    name: "withdrawProtocolFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "fundingPoolContract", type: "address" }],
    name: "transferFundingPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentMarketId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentBetId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Public variables
  {
    inputs: [],
    name: "fundingPoolAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minBetAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolFeesCollected",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fundingPoolBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
