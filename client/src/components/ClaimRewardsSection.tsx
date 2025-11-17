import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2, CheckCircle2, XCircle, Clock, Gift } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { useClaimRewards, useBet } from '@/hooks/usePredictions';
import { formatEther } from 'viem';
import { ACTIVE_CONTRACTS, PREDICTION_MARKET_ABI } from '@/lib/contracts';

interface ClaimableReward {
  betId: number;
  projectName: string;
  milestoneDescription: string;
  amount: bigint;
  reward: bigint;
  profit: bigint;
  predictedYes: boolean;
  marketResolved: boolean;
  wonBet: boolean;
}

export default function ClaimRewardsSection() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { claimRewards, isPending, isSuccess } = useClaimRewards();
  const [claimableBets, setClaimableBets] = useState<ClaimableReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingBetId, setClaimingBetId] = useState<number | null>(null);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchClaimableBets = async () => {
      try {
        setLoading(true);
        
        // Get user's bet IDs
        const betIds = await publicClient.readContract({
          address: ACTIVE_CONTRACTS.PredictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'getUserBets',
          args: [address],
        }as any) as bigint[];

        const claimable: ClaimableReward[] = [];

        for (const betId of betIds) {
          const bet = await publicClient.readContract({
            address: ACTIVE_CONTRACTS.PredictionMarket,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'getBet',
            args: [betId],
          }as any) as any;

          // Get market details
          const market = await publicClient.readContract({
            address: ACTIVE_CONTRACTS.PredictionMarket,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'getMarket',
            args: [bet.marketId],
          }as any) as any;

          // Check if bet is claimable
          if (
            market.isResolved && 
            !bet.claimed && 
            bet.predictedYes === market.outcome &&
            bet.reward > 0n
          ) {
            claimable.push({
              betId: Number(betId),
              projectName: `Project #${market.projectId}`,
              milestoneDescription: `Milestone #${market.milestoneIndex + 1}`,
              amount: bet.amount,
              reward: bet.reward,
              profit: bet.reward - bet.amount,
              predictedYes: bet.predictedYes,
              marketResolved: market.isResolved,
              wonBet: bet.predictedYes === market.outcome,
            }as any);
          }
        }

        setClaimableBets(claimable);
      } catch (error) {
        console.error('Error fetching claimable bets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimableBets();
  }, [address, publicClient, isSuccess]);

  const handleClaim = async (betId: number) => {
    try {
      setClaimingBetId(betId);
      await claimRewards(betId);
      
      // Remove claimed bet from list
      setClaimableBets(prev => prev.filter(bet => bet.betId !== betId));
    } catch (error: any) {
      alert(error.message || 'Failed to claim rewards');
    } finally {
      setClaimingBetId(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading claimable rewards...</p>
        </CardContent>
      </Card>
    );
  }

  if (claimableBets.length === 0) {
    return (
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-warning" />
            Claimable Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-2">No rewards to claim yet</p>
          <p className="text-xs text-muted-foreground">
            Win predictions to earn rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalClaimable = claimableBets.reduce((sum, bet) => sum + bet.reward, 0n);
  const totalProfit = claimableBets.reduce((sum, bet) => sum + bet.profit, 0n);

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-warning" />
          Claimable Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Total Claimable</span>
            <span className="text-2xl font-bold text-success">
              {parseFloat(formatEther(totalClaimable)).toFixed(4)} BNB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Profit</span>
            <span className="font-semibold text-success">
              +{parseFloat(formatEther(totalProfit)).toFixed(4)} BNB
            </span>
          </div>
        </div>

        {/* Individual Rewards */}
        <div className="space-y-3">
          {claimableBets.map((bet) => (
            <div
              key={bet.betId}
              className="p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{bet.projectName}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {bet.milestoneDescription}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="default"
                      className={bet.predictedYes ? "bg-success" : "bg-destructive"}
                    >
                      {bet.predictedYes ? "YES" : "NO"}
                    </Badge>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-medium">Won</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Staked</div>
                  <div className="font-semibold">
                    {parseFloat(formatEther(bet.amount)).toFixed(4)} BNB
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Reward</div>
                  <div className="font-semibold text-success">
                    {parseFloat(formatEther(bet.reward)).toFixed(4)} BNB
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Profit</div>
                  <div className="font-semibold text-success">
                    +{parseFloat(formatEther(bet.profit)).toFixed(4)} BNB
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleClaim(bet.betId)}
                disabled={isPending && claimingBetId === bet.betId}
                className="w-full"
                variant="hero"
              >
                {isPending && claimingBetId === bet.betId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Reward
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}