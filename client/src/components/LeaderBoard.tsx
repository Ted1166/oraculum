import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Loader2 } from "lucide-react";
import { formatEther } from "viem";
import { useTopPredictors } from "@/hooks/usePredictions";

interface LeaderboardProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export const Leaderboard = ({ 
  limit = 10, 
  showTitle = true,
  className = "" 
}: LeaderboardProps) => {
  const { data: predictors, isLoading, error } = useTopPredictors(limit);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-warning";
    if (rank === 2) return "text-muted-foreground";
    if (rank === 3) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-warning/30 to-warning/10 border-warning/50";
    if (rank === 2) return "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5 border-muted-foreground/30";
    if (rank === 3) return "bg-gradient-to-br from-amber-600/20 to-amber-600/5 border-amber-600/30";
    return "bg-gradient-card border-border/30";
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className={`bg-gradient-card ${className}`}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top Predictors
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-gradient-card ${className}`}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top Predictors
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Failed to load leaderboard</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictors || predictors.length === 0) {
    return (
      <Card className={`bg-gradient-card ${className}`}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top Predictors
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No predictors yet</p>
            <p className="text-xs text-muted-foreground">
              Be the first to make predictions and claim your spot!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-card ${className}`}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Top Predictors
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {predictors.map((predictor) => (
            <div
              key={predictor.address}
              className={`relative overflow-hidden rounded-lg border p-4 transition-all hover:border-primary/50 ${getRankBg(predictor.rank)}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  predictor.rank <= 3 
                    ? 'bg-gradient-primary text-background shadow-lg' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {predictor.rank <= 3 ? (
                    <Trophy className={`w-5 h-5 ${getRankColor(predictor.rank)}`} />
                  ) : (
                    predictor.rank
                  )}
                </div>

                {/* Predictor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-mono font-semibold truncate">
                      {predictor.displayName || truncateAddress(predictor.address)}
                    </div>
                    {predictor.displayName && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(predictor.address)}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {predictor.totalPredictions}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div>
                      <span className="text-muted-foreground">Staked: </span>
                      <span className="font-semibold">{formatEther(predictor.totalStaked)} BNB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Won: </span>
                      <span className="font-semibold text-success">{formatEther(predictor.totalWon)} BNB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score: </span>
                      <span className="font-semibold text-warning">{predictor.reputationScore}</span>
                    </div>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-success font-bold text-lg">
                    <TrendingUp className="w-4 h-4" />
                    {predictor.winRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
              </div>

              {/* Rank indicator for top 3 */}
              {predictor.rank <= 3 && (
                <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 bg-gradient-primary opacity-20" />
              )}
            </div>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Rankings calculated from on-chain prediction data • Updates every 5 minutes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};