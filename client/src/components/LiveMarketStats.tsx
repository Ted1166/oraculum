import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { useMarket } from "@/hooks/usePredictions";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

interface LiveMarketStatsProps {
  projectId: number;
  milestoneIndex: number;
  className?: string;
}

export const LiveMarketStats = ({ 
  projectId, 
  milestoneIndex,
  className = "" 
}: LiveMarketStatsProps) => {
  const marketResult = useMarket(projectId, milestoneIndex);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousYes, setPreviousYes] = useState<number>(50);

  // Extract market data safely
  const market = marketResult.data as any;
  const isLoading = marketResult.isLoading;

  // Animate when data changes
  useEffect(() => {
    if (market && typeof market === 'object' && 'yesPercentage' in market) {
      if (market.yesPercentage !== previousYes) {
        setIsUpdating(true);
        setPreviousYes(market.yesPercentage);
        
        const timeout = setTimeout(() => {
          setIsUpdating(false);
        }, 1000);

        return () => clearTimeout(timeout);
      }
    }
  }, [market?.yesPercentage, previousYes]);

  if (isLoading || !market || typeof market !== 'object') {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading market data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safely extract values with defaults
  const totalYes = market.totalYes || 0n;
  const totalNo = market.totalNo || 0n;
  const yesPercentage = market.yesPercentage || 50;
  const noPercentage = market.noPercentage || 50;
  const resolved = market.resolved || false;
  const outcome = market.outcome || false;
  
  const totalVolume = totalYes + totalNo;
  const yesChange = yesPercentage - previousYes;

  return (
    <Card className={`bg-gradient-card border-border/50 ${className} ${isUpdating ? 'animate-pulse' : ''}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Live Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Live Market Data</span>
            </div>
            {isUpdating && (
              <Badge variant="secondary" className="text-xs">
                Updating...
              </Badge>
            )}
          </div>

          {/* Market Odds */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-success">
                  {yesPercentage}%
                </div>
                {yesChange > 0 && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="w-3 h-3" />
                    +{yesChange.toFixed(1)}%
                  </div>
                )}
                {yesChange < 0 && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <TrendingDown className="w-3 h-3" />
                    {yesChange.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-destructive">
                  {noPercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Volume Stats */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <DollarSign className="w-3 h-3" />
                Total Volume
              </div>
              <div className="font-bold">{formatEther(totalVolume)} BNB</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" />
                Predictors
              </div>
              <div className="font-bold">
                {/* TODO: Get actual predictor count */}
                --
              </div>
            </div>
          </div>

          {/* Market Status */}
          {resolved && (
            <div className="pt-3 border-t border-border/50">
              <Badge variant={outcome ? "default" : "secondary"} className="w-full justify-center">
                Market Resolved: {outcome ? 'YES' : 'NO'} Won
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};