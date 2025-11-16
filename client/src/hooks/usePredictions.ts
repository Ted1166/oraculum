import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { ACTIVE_CONTRACTS, ACTIVE_CHAIN, PREDICTION_MARKET_ABI } from '@/lib/contracts'
import { parseEther, formatEther } from 'viem'

// ========================================
// EXISTING HOOKS (UNCHANGED)
// ========================================

// Hook to get market data for a specific project milestone
export function useMarket(projectId: number, milestoneIndex: number) {
  const result = useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMarket',
    args: [BigInt(projectId), BigInt(milestoneIndex)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && milestoneIndex !== undefined,
      refetchInterval: 5000, // ✅ Refetch every 5 seconds for real-time updates
    },
  })

  // Parse market data
  const data = result.data as any
  if (data) {
    const totalYes = data[0] || 0n
    const totalNo = data[1] || 0n
    const total = totalYes + totalNo
    
    let yesPercentage = 50
    let noPercentage = 50
    
    if (total > 0n) {
      yesPercentage = Number((totalYes * 100n) / total)
      noPercentage = 100 - yesPercentage
    }

    return {
      ...result,
      data: {
        totalYes,
        totalNo,
        resolved: data[2] || false,
        outcome: data[3] || false,
        yesPercentage,
        noPercentage,
      },
    }
  }

  return result
}

// Hook to get user's bets
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
      refetchInterval: 10000, // ✅ Refetch every 10 seconds
    },
  })
}

// Hook to place a bet on a milestone
export function usePlaceBet() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
  })

  const placeBet = async (
    projectId: number,
    milestoneIndex: number,
    predictYes: boolean,
    amount: string
  ) => {
    try {
      const value = parseEther(amount)
      
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placeBet',
        args: [BigInt(projectId), BigInt(milestoneIndex), predictYes],
        value, // Send BNB with the transaction
        gas: 500000n, // ✅ Set reasonable gas limit
      } as any)
    } catch (err: any) {
      console.error('Place bet error:', err)
      throw err
    }
  }

  return {
    placeBet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
  }
}

// Hook to claim winnings from a resolved bet
export function useClaimWinnings() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimWinnings = async (projectId: number, milestoneIndex: number) => {
    try {
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimWinnings',
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

// ========================================
// NEW: REAL LEADERBOARD IMPLEMENTATION
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
  projectId: bigint;
  milestoneIndex: bigint;
  amount: bigint;
  predictedYes: boolean;
  claimed: boolean;
}

/**
 * Calculate reputation score based on multiple factors
 * Formula: (winRate * 100 * 0.4) + (totalPredictions * 10 * 0.3) + (totalStakedBNB * 5 * 0.3)
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
    
    // Get all logs from PredictionMarket contract
    const logs = await publicClient.getLogs({
      address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
      fromBlock,
      toBlock: currentBlock,
    });
    
    const addresses = new Set<string>();
    
    // Extract unique addresses from logs
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
 * Hook to get real leaderboard data from blockchain
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
        
        // Step 1: Get all predictor addresses
        const addresses = await getAllPredictorAddresses(publicClient);
        
        if (addresses.length === 0) {
          console.log('📭 No predictor addresses found');
          return [];
        }
        
        // Step 2: Fetch bets for each address
        const leaderboardData: LeaderboardEntry[] = [];
        
        for (const address of addresses) {
          try {
            // Get user bets from contract
            const bets = await publicClient.readContract({
              address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'getUserBets',
              args: [address as `0x${string}`],
            }as any) as UserBet[];

            if (!bets || bets.length === 0) continue;

            // Calculate metrics
            const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0n);
            const totalPredictions = bets.length;
            
            // Claimed bets are winning bets (approximation)
            const claimedBets = bets.filter(b => b.claimed).length;
            const correctPredictions = claimedBets;
            
            const winRate = totalPredictions > 0 
              ? (correctPredictions / totalPredictions) * 100 
              : 0;
            
            // Estimate total won
            const totalWon = totalStaked * BigInt(Math.floor(winRate)) / 100n;
            
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
            console.error(`Error fetching bets for ${address}:`, error);
          }
        }

        // Step 3: Filter users with < 10 predictions
        const qualified = leaderboardData.filter(
          entry => entry.totalPredictions >= 10
        );

        // Step 4: Sort by reputation score
        qualified.sort((a, b) => b.reputationScore - a.reputationScore);

        // Step 5: Assign ranks
        qualified.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        console.log(`✅ Leaderboard calculated: ${qualified.length} qualified users`);

        // Step 6: Return top N
        return qualified.slice(0, limit);
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    retry: 1,
  });
}

/**
 * Hook to get leaderboard stats (for overview cards)
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