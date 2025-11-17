import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { ACTIVE_CONTRACTS, ACTIVE_CHAIN, PREDICTION_MARKET_ABI } from '@/lib/contracts'
import { parseEther, formatEther } from 'viem'

// ========================================
// MARKET HOOKS
// ========================================

/**
 * Get market by projectId and milestoneIndex
 */
export function useMarket(projectId: number, milestoneIndex: number) {
  const result = useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMarketByProject',
    args: [BigInt(projectId), BigInt(milestoneIndex)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && milestoneIndex !== undefined,
      refetchInterval: 5000,
      retry: false
    },
  })

  const data = result.data as any
  if (data) {
    return {
      ...result,
      data: {
        id: data.id,
        projectId: data.projectId,
        milestoneIndex: data.milestoneIndex,
        projectOwner: data.projectOwner,
        deadline: data.deadline,
        ownerBonusPool: data.ownerBonusPool,
        isOpen: data.isOpen,
        isResolved: data.isResolved,
        outcome: data.outcome,
        totalYesAmount: data.totalYesAmount,
        totalNoAmount: data.totalNoAmount,
        yesCount: data.yesCount,
        noCount: data.noCount,
        yesPercentage: data.totalYesAmount + data.totalNoAmount > 0n
          ? Number((data.totalYesAmount * 100n) / (data.totalYesAmount + data.totalNoAmount))
          : 50,
        noPercentage: data.totalYesAmount + data.totalNoAmount > 0n
          ? Number((data.totalNoAmount * 100n) / (data.totalYesAmount + data.totalNoAmount))
          : 50,
      },
    }
  }

  return result
}

/**
 * Check if market exists for a project milestone
 */
export function useMarketExists(projectId: number, milestoneIndex: number) {
  const result = useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMarketByProject',
    args: [BigInt(projectId), BigInt(milestoneIndex)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && milestoneIndex !== undefined,
      retry: false,
    },
  });

  const data = result.data as any;
  const exists = data && data.id !== 0n;

  return {
    exists,
    marketId: exists ? data.id : null,
    market: exists ? data : null,
    isLoading: result.isLoading,
    error: result.error,
  };
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

/**
 * Get specific bet details
 */
export function useBet(betId?: number) {
  return useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getBet',
    args: betId !== undefined ? [BigInt(betId)] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 5000,
    },
  })
}

/**
 * Check if user has already bet on a market
 */
export function useHasUserBet(marketId?: number) {
  const { address } = useAccount()
  
  return useReadContract({
    address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'hasUserBet',
    args: marketId !== undefined && address ? [BigInt(marketId), address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: marketId !== undefined && !!address,
      refetchInterval: 5000,
    },
  })
}

// ========================================
// MARKET CREATION HOOK
// ========================================

/**
 * Create a new prediction market for a milestone
 * NOTE: Only contract owner can call this
 */
export function useCreateMarket() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createMarket = async (
    projectId: number,
    milestoneIndex: number,
    projectOwnerAddress: string,
    daysUntilDeadline: number = 30
  ) => {
    try {
      console.log('🏗️ Creating market:', {
        projectId,
        milestoneIndex,
        projectOwnerAddress,
        daysUntilDeadline,
      });

      const txHash = await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'createMarket',
        args: [
          BigInt(projectId),
          BigInt(milestoneIndex),
          projectOwnerAddress as `0x${string}`,
          BigInt(daysUntilDeadline)
        ],
        gas: 300000n,
      } as any);

      console.log('✅ Market creation tx:', txHash);
      console.log('🔗 View on BSCScan:', `https://testnet.bscscan.com/tx/${txHash}`);
      
      return txHash;
    } catch (err) {
      console.error('❌ Create market error:', err);
      throw err;
    }
  };

  return {
    createMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
  };
}

// ========================================
// BETTING HOOKS
// ========================================

/**
 * Enhanced place bet with pre-flight checks and better error handling
 */
export function usePlaceBet() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const placeBet = async (
    projectId: number,
    milestoneIndex: number,
    predictYes: boolean,
    amount: string
  ) => {
    try {
      const value = parseEther(amount);
      
      console.log('🔍 Pre-flight checks...');
      console.log('🎲 Placing bet with params:', {
        projectId,
        milestoneIndex,
        predictYes,
        amount,
        valueWei: value.toString(),
      });
      
      // ========================================
      // PRE-FLIGHT VALIDATION
      // ========================================
      
      if (!publicClient) {
        throw new Error('❌ Blockchain client not ready');
      }

      // 1. Check if market exists
      let market: any;
      try {
        market = await publicClient.readContract({
          address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'getMarketByProject',
          args: [BigInt(projectId), BigInt(milestoneIndex)],
        } as any);
        
        if (!market || market.id === 0n) {
          throw new Error(
            `❌ No prediction market exists for this milestone yet.\n\n` +
            `Project ID: ${projectId}\n` +
            `Milestone Index: ${milestoneIndex}\n\n` +
            `The project owner or admin needs to create a prediction market first.`
          );
        }
        
        console.log('✅ Market found:', {
          marketId: market.id.toString(),
          isOpen: market.isOpen,
          isResolved: market.isResolved,
          deadline: new Date(Number(market.deadline) * 1000).toLocaleString(),
        });
        
      } catch (err: any) {
        if (err.message?.includes('Market does not exist')) {
          throw new Error(
            `❌ No prediction market exists for this milestone.\n\n` +
            `Project ID: ${projectId}\n` +
            `Milestone Index: ${milestoneIndex}\n\n` +
            `Please ask the project owner to create a prediction market first.`
          );
        }
        throw err;
      }
      
      // 2. Check market is open
      if (!market.isOpen) {
        throw new Error('❌ This market is closed for betting.');
      }
      
      // 3. Check market not resolved
      if (market.isResolved) {
        throw new Error('❌ This market has already been resolved.');
      }
      
      // 4. Check deadline not passed
      const now = Math.floor(Date.now() / 1000);
      if (now >= Number(market.deadline)) {
        throw new Error('❌ The betting deadline has passed for this market.');
      }
      
      const hoursRemaining = Math.floor((Number(market.deadline) - now) / 3600);
      console.log('⏰ Time remaining:', hoursRemaining, 'hours');
      
      // 5. Check minimum bet amount
      const minBet = await publicClient.readContract({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'minBetAmount',
      } as any) as bigint;
      
      if (value < minBet) {
        throw new Error(
          `❌ Bet amount too small.\n\n` +
          `Minimum bet: ${formatEther(minBet)} BNB\n` +
          `Your bet: ${amount} BNB`
        );
      }
      
      console.log('💰 Min bet amount:', formatEther(minBet), 'BNB');
      
      // 6. Check if user already bet on this market
      if (address) {
        const alreadyBet = await publicClient.readContract({
          address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'hasUserBet',
          args: [market.id, address],
        } as any) as boolean;
        
        if (alreadyBet) {
          throw new Error('❌ You have already placed a bet on this market. Only one bet per user is allowed.');
        }
      }
      
      console.log('✅ All pre-flight checks passed!');
      
      // ========================================
      // PLACE BET TRANSACTION
      // ========================================
      
      console.log('📤 Submitting transaction...');
      
      const txHash = await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placeBet',
        args: [
          BigInt(projectId),
          BigInt(milestoneIndex),
          predictYes
        ],
        value,
        gas: 500000n,
      } as any);
      
      console.log('✅ Transaction submitted:', txHash);
      console.log('🔗 View on BSCScan:', `https://testnet.bscscan.com/tx/${txHash}`);
      
      return txHash;
      
    } catch (err: any) {
      console.error('❌ Place bet error:', err);
      
      // Parse and format error messages
      let errorMessage = err.message || 'Unknown error occurred';
      
      // Common error patterns
      if (errorMessage.includes('user rejected')) {
        errorMessage = '❌ Transaction was rejected by user.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient BNB in your wallet to place this bet.';
      } else if (errorMessage.includes('Market does not exist')) {
        errorMessage = '❌ Market not found. Please create a prediction market for this milestone first.';
      } else if (errorMessage.includes('Market closed')) {
        errorMessage = '❌ This market is closed for betting.';
      } else if (errorMessage.includes('Betting ended')) {
        errorMessage = '❌ The betting deadline has passed.';
      } else if (errorMessage.includes('Already bet')) {
        errorMessage = '❌ You have already placed a bet on this market.';
      } else if (errorMessage.includes('Bet too small')) {
        errorMessage = '❌ Your bet amount is below the minimum required.';
      }
      
      // Extract revert reason from contract
      if (err.walk) {
        const revertError = err.walk((e: any) => e.name === 'ContractFunctionRevertedError');
        if (revertError?.data?.errorName) {
          console.error('🔴 Contract Revert:', revertError.data.errorName);
        }
        if (revertError?.reason) {
          console.error('🔴 Revert Reason:', revertError.reason);
          errorMessage = `❌ Contract Error: ${revertError.reason}`;
        }
      }
      
      throw new Error(errorMessage);
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
 * Claim rewards for a winning bet
 */
export function useClaimRewards() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimRewards = async (betId: number) => {
    try {
      console.log('💰 Claiming rewards for bet:', betId);
      
      const txHash = await writeContractAsync({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimReward',
        args: [BigInt(betId)],
        gas: 300000n,
      } as any)
      
      console.log('✅ Claim transaction hash:', txHash);
      console.log('🔗 View on BSCScan:', `https://testnet.bscscan.com/tx/${txHash}`);
      
      return txHash;
    } catch (err: any) {
      console.error('❌ Claim rewards error:', err)
      
      let errorMessage = err.message || 'Failed to claim rewards';
      
      if (errorMessage.includes('Not your bet')) {
        errorMessage = '❌ This is not your bet.';
      } else if (errorMessage.includes('Already claimed')) {
        errorMessage = '❌ You have already claimed rewards for this bet.';
      } else if (errorMessage.includes('Not resolved')) {
        errorMessage = '❌ This market has not been resolved yet.';
      } else if (errorMessage.includes('Lost bet')) {
        errorMessage = '❌ This bet did not win.';
      } else if (errorMessage.includes('No reward')) {
        errorMessage = '❌ No reward available for this bet.';
      }
      
      throw new Error(errorMessage);
    }
  }

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
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
  id: bigint;
  marketId: bigint;
  bettor: string;
  amount: bigint;
  predictedYes: boolean;
  claimed: boolean;
  reward: bigint;
}

/**
 * Calculate reputation score
 */
function calculateReputationScore(
  winRate: number,
  totalPredictions: number,
  totalStakedBNB: number
): number {
  const accuracyScore = winRate * 0.4;
  const volumeScore = Math.min(totalPredictions * 10, 1000) * 0.3;
  const stakeScore = Math.min(totalStakedBNB * 5, 500) * 0.3;
  
  return Math.round(accuracyScore + volumeScore + stakeScore);
}

/**
 * Get all unique predictor addresses by querying recent bets
 * ✅ Much more reliable than event scanning for BSC testnet
 */
async function getAllPredictorAddresses(publicClient: any): Promise<string[]> {
  try {
    console.log('📡 Getting predictor addresses from bet counter...');
    
    // Get total number of bets
    const betCounter = await publicClient.readContract({
      address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'betCounter',
    }) as bigint;
    
    const totalBets = Number(betCounter);
    console.log(`Total bets: ${totalBets}`);
    
    if (totalBets === 0 || totalBets === 1) {
      console.log('No bets found yet');
      return [];
    }
    
    const addresses = new Set<string>();
    
    // ✅ Fetch last 50 bets to find active predictors (reduced from 100)
    const betsToCheck = Math.min(totalBets - 1, 50); // Subtract 1 because betCounter starts at 1
    const startBetId = Math.max(1, totalBets - betsToCheck);
    
    console.log(`Checking bets ${startBetId} to ${totalBets}...`);
    
    for (let betId = startBetId; betId < totalBets; betId++) {
      try {
        const bet = await publicClient.readContract({
          address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'getBet',
          args: [BigInt(betId)],
        }) as any;
        
        if (bet && bet.bettor) {
          addresses.add(bet.bettor.toLowerCase());
        }
        
        // Small delay every 10 requests to avoid rate limiting
        if (betId % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.error(`Error fetching bet ${betId}:`, error);
      }
    }
    
    console.log(`✅ Found ${addresses.size} unique predictors from recent bets`);
    
    return Array.from(addresses);
    
  } catch (error) {
    console.error('❌ Error getting predictors from bet counter:', error);
    return [];
  }
}

// Remove the old alternative function - we only need one now

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
        
        // ✅ Use bet counter method only (more reliable for BSC testnet)
        const addresses = await getAllPredictorAddresses(publicClient);
        
        if (addresses.length === 0) {
          console.log('📭 No predictor addresses found');
          return [];
        }
        
        const leaderboardData: LeaderboardEntry[] = [];
        
        // ✅ Process all found addresses (already limited to 50 in getAllPredictorAddresses)
        console.log(`Processing ${addresses.length} predictor addresses...`);
        
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

                // Check if bet was won (reward > amount staked)
                if (bet.reward > bet.amount) {
                  correctPredictions++;
                  totalWon += bet.reward;
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

        // Filter users with < 3 predictions (lowered from 10 for testing)
        const qualified = leaderboardData.filter(
          entry => entry.totalPredictions >= 3
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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    retry: 1,
  });
}
/**
 * Hook to get leaderboard stats
 */
export function useLeaderboardStats() {
  const { data: leaderboard, isLoading } = useTopPredictors(100);

  return useQuery({
    queryKey: ['leaderboard-stats'],
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
    enabled: !!leaderboard &&isLoading,
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