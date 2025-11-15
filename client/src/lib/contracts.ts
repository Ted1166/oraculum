import { bscTestnet } from 'wagmi/chains'

// Contract addresses from BSC Testnet deployment
export const CONTRACTS = {
  bscTestnet: {
    ProjectRegistry: '0x34e4665cfb85e33ef6553663df7b484f3543f0cf',
    PredictionMarket: '0x5350df00c2ae9193fce4a508b7e12964a659bb31',
    FundingPool: '0x002d30e416ae9cde9c5f541a690685d89a361ba6',
    ReputationNFT: '0x4ce58c4e57af2a5f61b68465e56f97e6bd041363',
  },
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

// ✅ CORRECTED ABI - Matches your deployed contract (7 params)
export const PROJECT_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'LISTING_FEE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_projectId', type: 'uint256' }],
    name: 'getProject',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'category', type: 'string' },
          { internalType: 'string', name: 'logoUrl', type: 'string' },
          { internalType: 'uint256', name: 'fundingGoal', type: 'uint256' },
          { internalType: 'uint256', name: 'submissionDate', type: 'uint256' },
          { internalType: 'enum ProjectRegistry.ProjectStatus', name: 'status', type: 'uint8' },
          { internalType: 'uint256[]', name: 'milestoneIds', type: 'uint256[]' },
          { internalType: 'uint256', name: 'totalFundsRaised', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPredictions', type: 'uint256' },
        ],
        internalType: 'struct ProjectRegistry.Project',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_projectId', type: 'uint256' }],
    name: 'getProjectMilestones',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'uint256', name: 'targetDate', type: 'uint256' },
          { internalType: 'bool', name: 'isResolved', type: 'bool' },
          { internalType: 'bool', name: 'outcomeAchieved', type: 'bool' },
          { internalType: 'uint256', name: 'resolutionDate', type: 'uint256' },
        ],
        internalType: 'struct ProjectRegistry.Milestone[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'getOwnerProjects',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalProjects',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalMilestones',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_projectId', type: 'uint256' },
    ],
    name: 'incrementPredictions',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ✅ CORRECTED submitProject - 7 parameters 
   {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_description', type: 'string' },
      { internalType: 'string', name: '_category', type: 'string' },
      { internalType: 'string', name: '_logoUrl', type: 'string' },
      { internalType: 'uint256', name: '_fundingGoal', type: 'uint256' },
      // { internalType: 'uint256', name: '_totalFunding', type: 'uint256' },
      { internalType: 'string[]', name: '_milestoneDescriptions', type: 'string[]' },
      { internalType: 'uint256[]', name: '_milestoneDates', type: 'uint256[]' },
      // { internalType: 'uint256[]', name: '_milestoneFunding', type: 'uint256[]' },
    ],
    name: 'submitProject',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },,
  {
    inputs: [],
    name: 'withdrawFees',
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