import { bscTestnet } from 'wagmi/chains'

// Contract addresses from BSC Testnet deployment
export const CONTRACTS = {
  bscTestnet: {
    ProjectRegistry: '0x19230de3207b681dc4498083f4be1f8baccf140e',
    PredictionMarket: '0x61ab17d1f917e06b92c2d98cd7f9ee584ac64c86',
    FundingPool: '0x8c6fd67f7990ce198660354ec378a560f24fdd72',
    ReputationNFT: '0x4f23ce97c737d792c575cf0b9421497ea0e6850a',
  },
  // Keep Sepolia for reference
  sepolia: {
    ProjectRegistry: '0x1f35c6a03b99a58afcb0acbaaaf459d202eb3f2f',
    PredictionMarket: '0x0c5450a30deee8f1c9673ad058f1f6b3ac0edc30',
    FundingPool: '0xf1f1a3d5259d169da3347809d5fc07ad6ffa017e',
    ReputationNFT: '0x90df65e6f779d7ac1f62a7591d581006dc78ff87',
  },
}

// Use BSC Testnet
export const ACTIVE_CHAIN = bscTestnet
export const ACTIVE_CONTRACTS = CONTRACTS.bscTestnet

// ABIs remain the same...
export const PROJECT_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'getTotalProjects',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_projectId', type: 'uint256' }],
    name: 'getProject',
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'imageUrl', type: 'string' },
          { name: 'websiteUrl', type: 'string' },
          { name: 'fundingGoal', type: 'uint256' },
          { name: 'fundingRaised', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_projectId', type: 'uint256' }],
    name: 'getProjectMilestones',
    outputs: [
      {
        components: [
          { name: 'description', type: 'string' },
          { name: 'targetDate', type: 'uint256' },
          { name: 'fundingTarget', type: 'uint256' },
          { name: 'achieved', type: 'bool' },
        ],
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'getOwnerProjects',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_category', type: 'string' },
      { name: '_imageUrl', type: 'string' },
      { name: '_websiteUrl', type: 'string' },
      { name: '_fundingGoal', type: 'uint256' },
      { name: '_milestoneDescriptions', type: 'string[]' },
      { name: '_milestoneDates', type: 'uint256[]' },
      { name: '_milestoneFunding', type: 'uint256[]' },
    ],
    name: 'submitProject',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const PREDICTION_MARKET_ABI = [
  {
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'milestoneIndex', type: 'uint256' },
    ],
    name: 'getMarket',
    outputs: [
      { name: 'totalYes', type: 'uint256' },
      { name: 'totalNo', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'outcome', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserBets',
    outputs: [
      {
        components: [
          { name: 'projectId', type: 'uint256' },
          { name: 'milestoneIndex', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'predictedYes', type: 'bool' },
          { name: 'claimed', type: 'bool' },
        ],
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'milestoneIndex', type: 'uint256' },
      { name: 'predictYes', type: 'bool' },
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
  inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'milestoneIndex', type: 'uint256' },
    ],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const