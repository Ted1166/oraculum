import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { ACTIVE_CONTRACTS, ACTIVE_CHAIN, PREDICTION_MARKET_ABI } from '@/lib/contracts'
import { parseEther, formatEther } from 'viem'

// ========================================
// MARKET HOOKS
// ========================================

/**
 * ✅ UPDATED: Get market by projectId and milestoneIndex
 */
export function useMarket(projectId: number, milestoneIndex: number) {
  const result = useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMarketByProjectMilestone',  // ✅ NEW function
    args: [BigInt(projectId), BigInt(milestoneIndex)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && milestoneIndex !== undefined,
      refetchInterval: 5000,
    },
  })

  const data = result.data as any
  if (data) {
    return {
      ...result,
      data: {
        marketId: data.marketId,
        milestoneId: data.milestoneId,
        projectId: data.projectId,
        totalYesStake: data.totalYesStake,
        totalNoStake: data.totalNoStake,
        status: data.status,
        finalOutcome: data.finalOutcome,
        outcomeSet: data.outcomeSet,
        yesPercentage: data.totalYesStake + data.totalNoStake > 0n
          ? Number((data.totalYesStake * 100n) / (data.totalYesStake + data.totalNoStake))
          : 50,
        noPercentage: data.totalYesStake + data.totalNoStake > 0n
          ? Number((data.totalNoStake * 100n) / (data.totalYesStake + data.totalNoStake))
          : 50,
      },
    }
  }

  return result
}

/**
 * Get user's bet IDs
 */
export function useUserBets() {
  const { address } = useAccount()
  
  return useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getUserBets',
    args: address ? [address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })
}

// ========================================
// BETTING HOOKS
// ========================================

/**
 * ✅ UPDATED: Place bet with projectId, milestoneIndex, predictYes
 */
export function usePlaceBet() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = async (
    projectId: number,
    milestoneIndex: number,  // ✅ Added milestoneIndex
    predictYes: boolean,
    amount: string
  ) => {
    try {
      const value = parseEther(amount);
      
      console.log('🎲 Placing bet with params:', {
        projectId: BigInt(projectId).toString(),
        milestoneIndex: BigInt(milestoneIndex).toString(),
        predictYes,
        amount,
        value: value.toString(),
      });
      
      // ✅ UPDATED: Now sends projectId, milestoneIndex, predictYes
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placeBet',
        args: [
          BigInt(projectId),      // uint256 projectId
          BigInt(milestoneIndex), // uint256 milestoneIndex
          predictYes              // bool predictYes
        ],
        value,
        gas: 500000n,
      } as any);
      
      console.log('✅ Bet transaction submitted');
    } catch (err: any) {
      console.error('❌ Place bet error:', err);
      throw err;
    }
  };

  return {
    placeBet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
  };
}

/**
 * Claim winnings for a resolved market
 */
export function useClaimWinnings() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimWinnings = async (projectId: number, milestoneIndex: number) => {
    try {
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimRewards',
        args: [BigInt(projectId), BigInt(milestoneIndex)],
        gas: 300000n,
      } as any)
    } catch (err) {
      console.error('Claim winnings error:', err)
      throw err
    }
  }

  return {
    claimWinnings,
    isPending,
    isConfirming,
    isSuccess,
  }
}

/**
 * Claim rewards for a winning bet
 */
export function useClaimRewards() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimRewards = async (betId: number) => {
    try {
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimRewards',
        args: [BigInt(betId)],
        gas: 300000n,
      } as any)
    } catch (err) {
      console.error('Claim rewards error:', err)
      throw err
    }
  }

  return {
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
  }
}

// ========================================
// LEADERBOARD IMPLEMENTATION
// ========================================

interface LeaderboardEntry {
  address: string;
  displayName?: string;
  totalStaked: bigint;
  totalWon: bigint;
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  reputationScore: number;
  rank: number;
}

interface UserBet {
  betId: bigint;
  marketId: bigint;
  bettor: string;
  prediction: number;
  amount: bigint;
  timestamp: bigint;
  claimed: boolean;
  rewardAmount: bigint;
}

/**
 * Calculate reputation score
 */
function calculateReputationScore(
  winRate: number,
  totalPredictions: number,
  totalStakedBNB: number
): number {
  const accuracyScore = winRate * 100 * 0.4;
  const volumeScore = Math.min(totalPredictions * 10, 1000) * 0.3;
  const stakeScore = Math.min(totalStakedBNB * 5, 500) * 0.3;
  
  return Math.round(accuracyScore + volumeScore + stakeScore);
}

/**
 * Get all unique predictor addresses from blockchain events
 */
async function getAllPredictorAddresses(publicClient: any): Promise<string[]> {
  try {
    console.log('📡 Scanning blockchain for predictor addresses...');
    
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
    
    console.log(`Scanning from block ${fromBlock} to ${currentBlock}`);
    
    const logs = await publicClient.getLogs({
      address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
      fromBlock,
      toBlock: currentBlock,
    });
    
    const addresses = new Set<string>();
    
    logs.forEach((log: any) => {
      if (log.topics && log.topics.length > 1) {
        const address = `0x${log.topics[1].slice(-40)}`;
        addresses.add(address.toLowerCase());
      }
    });
    
    console.log(`✅ Found ${addresses.size} unique predictors`);
    
    return Array.from(addresses);
  } catch (error) {
    console.error('❌ Error scanning for predictor addresses:', error);
    return [];
  }
}

/**
 * Hook to get real leaderboard data
 */
export function useTopPredictors(limit: number = 10) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!publicClient) {
        console.log('⏳ Waiting for public client...');
        return [];
      }

      try {
        console.log('🏆 Fetching leaderboard data...');
        
        const addresses = await getAllPredictorAddresses(publicClient);
        
        if (addresses.length === 0) {
          console.log('📭 No predictor addresses found');
          return [];
        }
        
        const leaderboardData: LeaderboardEntry[] = [];
        
        for (const address of addresses) {
          try {
            // Get user's bet IDs
            const betIds = await publicClient.readContract({
              address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'getUserBets',
              args: [address as `0x${string}`],
            } as any) as bigint[];

            if (!betIds || betIds.length === 0) continue;

            // Fetch each bet's details
            let totalStaked = 0n;
            let totalWon = 0n;
            let correctPredictions = 0;

            for (const betId of betIds) {
              try {
                const bet = await publicClient.readContract({
                  address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
                  abi: PREDICTION_MARKET_ABI,
                  functionName: 'getBet',
                  args: [betId],
                } as any) as UserBet;

                totalStaked += bet.amount;

                if (bet.claimed && bet.rewardAmount > 0n) {
                  correctPredictions++;
                  totalWon += bet.rewardAmount;
                }
              } catch (error) {
                console.error(`Error fetching bet ${betId}:`, error);
              }
            }

            const totalPredictions = betIds.length;
            const winRate = totalPredictions > 0 
              ? (correctPredictions / totalPredictions) * 100 
              : 0;
            
            const totalStakedBNB = parseFloat(formatEther(totalStaked));
            const reputationScore = calculateReputationScore(
              winRate,
              totalPredictions,
              totalStakedBNB
            );

            // Check for display name in localStorage
            const profileKey = `predict_fund_profile_${address}`;
            const storedProfile = localStorage.getItem(profileKey);
            let displayName: string | undefined;
            
            if (storedProfile) {
              try {
                const profile = JSON.parse(storedProfile);
                displayName = profile.displayName;
              } catch {}
            }

            leaderboardData.push({
              address,
              displayName,
              totalStaked,
              totalWon,
              totalPredictions,
              correctPredictions,
              winRate: Math.round(winRate),
              reputationScore,
              rank: 0,
            });
          } catch (error) {
            console.error(`Error fetching data for ${address}:`, error);
          }
        }

        // Filter users with < 10 predictions
        const qualified = leaderboardData.filter(
          entry => entry.totalPredictions >= 10
        );

        // Sort by reputation score
        qualified.sort((a, b) => b.reputationScore - a.reputationScore);

        // Assign ranks
        qualified.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        console.log(`✅ Leaderboard calculated: ${qualified.length} qualified users`);

        return qualified.slice(0, limit);
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to get leaderboard stats
 */
export function useLeaderboardStats() {
  const { data: leaderboard } = useTopPredictors(100);

  return useQuery({
    queryKey: ['leaderboard-stats', leaderboard],
    queryFn: () => {
      if (!leaderboard || leaderboard.length === 0) {
        return {
          topPredictor: null,
          activePredictors: 0,
          totalStaked: '0',
        };
      }

      const topPredictor = leaderboard[0];
      const activePredictors = leaderboard.length;
      const totalStaked = leaderboard.reduce(
        (sum, entry) => sum + entry.totalStaked,
        0n
      );

      return {
        topPredictor,
        activePredictors,
        totalStaked: formatEther(totalStaked),
      };
    },
    enabled: !!leaderboard,
  });
}

/**
 * Update user stats in localStorage
 */
export function updateUserStats(
  address: string,
  betAmount: bigint,
  won: boolean = false,
  wonAmount: bigint = 0n
) {
  const LEADERBOARD_KEY = 'oraculum_leaderboard_v1';
  
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    const stats = stored ? JSON.parse(stored) : {};
    
    const addr = address.toLowerCase();
    
    if (!stats[addr]) {
      stats[addr] = {
        address: addr,
        totalStaked: '0',
        totalWon: '0',
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      };
    }
    
    const userStats = stats[addr];
    userStats.totalStaked = (BigInt(userStats.totalStaked) + betAmount).toString();
    userStats.totalPredictions += 1;
    
    if (won) {
      userStats.wins += 1;
      userStats.totalWon = (BigInt(userStats.totalWon) + wonAmount).toString();
    }
    
    const resolvedBets = userStats.wins + userStats.losses;
    userStats.winRate = resolvedBets > 0 ? Math.round((userStats.wins / resolvedBets) * 100) : 0;
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to update user stats:', error);
  }
}