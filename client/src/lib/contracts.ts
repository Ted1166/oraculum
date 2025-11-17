import { bscTestnet } from "wagmi/chains";

// Contract addresses from BSC Testnet deployment
export const CONTRACTS = {
  bscTestnet: {
    ProjectRegistry: "0x55a615f72b6d80e79d5d33e0f52745e66b3c3da4",
    PredictionMarket: "0x4c8904a00c5b98342f7643f75c9060a6484d1f78",
    FundingPool: "0xfc811c4a7a5b61d79de9096d5f9cfe792d8b7f92",
    ReputationNFT: "0xc29042c81d780cdd77c2b6096539d519eb2cfea2",
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

// contracts.ts - Updated to match PredictionMarket.sol

export const PREDICTION_MARKET_ABI = [
  // ========================================
  // CORE BETTING FUNCTIONS
  // ========================================
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "predictYes", type: "bool" }
    ],
    name: "placeBet",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // ========================================
  // MARKET MANAGEMENT
  // ========================================
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "projectOwner", type: "address" },
      { name: "daysUntilDeadline", type: "uint256" }
    ],
    name: "createMarket",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "addOwnerBonus",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "milestoneAchieved", type: "bool" }
    ],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "closeMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // ========================================
  // VIEW FUNCTIONS - MARKETS
  // ========================================
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "projectId", type: "uint256" },
          { name: "milestoneIndex", type: "uint256" },
          { name: "projectOwner", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "ownerBonusPool", type: "uint256" },
          { name: "isOpen", type: "bool" },
          { name: "isResolved", type: "bool" },
          { name: "outcome", type: "bool" },
          { name: "totalYesAmount", type: "uint256" },
          { name: "totalNoAmount", type: "uint256" },
          { name: "yesCount", type: "uint256" },
          { name: "noCount", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" }
    ],
    name: "getMarketByProject",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "projectId", type: "uint256" },
          { name: "milestoneIndex", type: "uint256" },
          { name: "projectOwner", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "ownerBonusPool", type: "uint256" },
          { name: "isOpen", type: "bool" },
          { name: "isResolved", type: "bool" },
          { name: "outcome", type: "bool" },
          { name: "totalYesAmount", type: "uint256" },
          { name: "totalNoAmount", type: "uint256" },
          { name: "yesCount", type: "uint256" },
          { name: "noCount", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarketOdds",
    outputs: [
      { name: "yesPercent", type: "uint256" },
      { name: "noPercent", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarketBets",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  
  // ========================================
  // VIEW FUNCTIONS - BETS
  // ========================================
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "getBet",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "marketId", type: "uint256" },
          { name: "bettor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "predictedYes", type: "bool" },
          { name: "claimed", type: "bool" },
          { name: "reward", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBets",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "betId", type: "uint256" }],
    name: "estimateReward",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "user", type: "address" }
    ],
    name: "hasUserBet",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  
  // ========================================
  // COMMUNITY FUNCTIONS
  // ========================================
  {
    inputs: [{ name: "projectId", type: "uint256" }],
    name: "followProject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "projectId", type: "uint256" }],
    name: "unfollowProject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "projectId", type: "uint256" }],
    name: "getProjectFollowers",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "user", type: "address" }
    ],
    name: "isUserFollowing",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  
  // ========================================
  // ADMIN FUNCTIONS
  // ========================================
  {
    inputs: [{ name: "to", type: "address" }],
    name: "withdrawPlatformFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newMin", type: "uint256" }],
    name: "setMinBet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newFee", type: "uint256" }],
    name: "setPlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // ========================================
  // PUBLIC VARIABLES
  // ========================================
  {
    inputs: [],
    name: "marketCounter",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "betCounter",
    outputs: [{ name: "", type: "uint256" }],
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
    name: "platformFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  
  // ========================================
  // EVENTS
  // ========================================
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "projectId", type: "uint256" },
      { indexed: false, name: "milestoneIndex", type: "uint256" },
      { indexed: false, name: "projectOwner", type: "address" },
      { indexed: false, name: "deadline", type: "uint256" }
    ],
    name: "MarketCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "OwnerBonusAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "predictedYes", type: "bool" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "BetPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: false, name: "outcome", type: "bool" }
    ],
    name: "MarketResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "RewardClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "projectId", type: "uint256" },
      { indexed: true, name: "follower", type: "address" }
    ],
    name: "ProjectFollowed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "projectId", type: "uint256" },
      { indexed: true, name: "follower", type: "address" }
    ],
    name: "ProjectUnfollowed",
    type: "event",
  },
] as const;