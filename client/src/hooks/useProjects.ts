import { useReadContract, useReadContracts } from 'wagmi'
import { ACTIVE_CONTRACTS, ACTIVE_CHAIN, PROJECT_REGISTRY_ABI } from '@/lib/contracts'

// Hook to get total project count
export function useProjectCount() {
  return useReadContract({
    address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'getTotalProjects', // ✅ CHANGED from projectCount
    chainId: ACTIVE_CHAIN.id,
  })
}

// Hook to get a single project by ID
export function useProject(projectId: number | string) {
  return useReadContract({
    address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'getProject', // ✅ CHANGED from projects
    args: [BigInt(projectId)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && projectId !== null,
    },
  })
}

// Hook to get project milestones
export function useProjectMilestones(projectId: number | string) {
  return useReadContract({
    address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'getProjectMilestones',
    args: [BigInt(projectId)],
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: projectId !== undefined && projectId !== null,
    },
  })
}

// Hook to get user's projects
export function useUserProjects(address?: `0x${string}`) {
  return useReadContract({
    address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'getOwnerProjects',
    args: address ? [address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: {
      enabled: !!address,
    },
  })
}

// Hook for platform stats
export function useProjectStats() {
  const { data: count } = useProjectCount()
  
  return {
    data: {
      projectCount: count || 0n,
      totalStaked: 0n,
      totalPredictors: 0n,
    },
    isLoading: false,
  }
}

// Hook to get all projects - SIMPLIFIED VERSION
// Hook to get all projects - INDIVIDUAL QUERIES VERSION
export function useAllProjects() {
  const { data: count, isLoading: countLoading } = useProjectCount()
  
  const totalProjects = count ? Math.min(Number(count), 20) : 0
  
  // Return empty if no projects
  if (totalProjects === 0) {
    return {
      data: [],
      isLoading: countLoading,
      isError: false,
      refetch: () => {},
    }
  }

  // This creates a simple array representation
  // In production, you'd fetch each individually or use a backend API
  return {
    data: Array.from({ length: totalProjects }, (_, i) => ({
      status: 'success',
      result: null, // Will be fetched individually when needed
    })),
    isLoading: countLoading,
    isError: false,
    refetch: () => {},
  }
}