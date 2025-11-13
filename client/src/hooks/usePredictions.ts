import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { ACTIVE_CONTRACTS, ACTIVE_CHAIN, PREDICTION_MARKET_ABI } from '@/lib/contracts'
import { parseEther } from 'viem'

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

// Hook to get top predictors (leaderboard data)
export function useTopPredictors(limit: number = 10) {
  // Mock data for demonstration - TODO: Replace with backend API or subgraph
  const mockPredictors = [
    {
      address: "0x7a2e...f3c9",
      totalStaked: 10000000000000000000n, // 10 BNB
      totalWon: 7300000000000000000n, // 7.3 BNB
      winRate: 90,
      predictionCount: 45,
      rank: 1,
    },
    {
      address: "0x8b3f...a4d1",
      totalStaked: 8500000000000000000n,
      totalWon: 6000000000000000000n,
      winRate: 85,
      predictionCount: 38,
      rank: 2,
    },
    {
      address: "0x9c4e...b5e2",
      totalStaked: 7500000000000000000n,
      totalWon: 5500000000000000000n,
      winRate: 80,
      predictionCount: 32,
      rank: 3,
    },
    {
      address: "0x1d5f...c6f3",
      totalStaked: 6500000000000000000n,
      totalWon: 4500000000000000000n,
      winRate: 75,
      predictionCount: 28,
      rank: 4,
    },
    {
      address: "0x2e6g...d7g4",
      totalStaked: 5500000000000000000n,
      totalWon: 3800000000000000000n,
      winRate: 72,
      predictionCount: 24,
      rank: 5,
    },
    {
      address: "0x3f7h...e8h5",
      totalStaked: 4800000000000000000n,
      totalWon: 3200000000000000000n,
      winRate: 68,
      predictionCount: 20,
      rank: 6,
    },
    {
      address: "0x4g8i...f9i6",
      totalStaked: 4200000000000000000n,
      totalWon: 2800000000000000000n,
      winRate: 65,
      predictionCount: 18,
      rank: 7,
    },
    {
      address: "0x5h9j...g0j7",
      totalStaked: 3800000000000000000n,
      totalWon: 2400000000000000000n,
      winRate: 62,
      predictionCount: 15,
      rank: 8,
    },
    {
      address: "0x6i0k...h1k8",
      totalStaked: 3200000000000000000n,
      totalWon: 1900000000000000000n,
      winRate: 58,
      predictionCount: 12,
      rank: 9,
    },
    {
      address: "0x7j1l...i2l9",
      totalStaked: 2800000000000000000n,
      totalWon: 1600000000000000000n,
      winRate: 55,
      predictionCount: 10,
      rank: 10,
    },
  ];
  
  return {
    data: mockPredictors.slice(0, limit),
    isLoading: false,
  }
}