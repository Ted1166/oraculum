import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
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
  const { data: predictors, isLoading } = useTopPredictors(limit);

  // Mock data for demonstration (remove when backend is ready)
  const mockPredictors = [
    {
      address: "0x7a2e...f3c9",
      totalStaked: 100000000000000000n, // 10 BNB
      totalWon: 73000000000000000n, // 7.3 BNB
      winRate: 90,
      predictionCount: 45,
      rank: 1,
    },
    {
      address: "0x8b3f...a4d1",
      totalStaked: 85000000000000000n, // 8.5 BNB
      totalWon: 60000000000000000n, // 6 BNB
      winRate: 85,
      predictionCount: 38,
      rank: 2,
    },
    {
      address: "0x9c4e...b5e2",
      totalStaked: 75000000000000000n, // 7.5 BNB
      totalWon: 55000000000000000n, // 5.5 BNB
      winRate: 80,
      predictionCount: 32,
      rank: 3,
    },
    {
      address: "0x1d5f...c6f3",
      totalStaked: 65000000000000000n,
      totalWon: 45000000000000000n,
      winRate: 75,
      predictionCount: 28,
      rank: 4,
    },
    {
      address: "0x2e6g...d7g4",
      totalStaked: 55000000000000000n,
      totalWon: 38000000000000000n,
      winRate: 72,
      predictionCount: 24,
      rank: 5,
    },
    {
      address: "0x3f7h...e8h5",
      totalStaked: 48000000000000000n,
      totalWon: 32000000000000000n,
      winRate: 68,
      predictionCount: 20,
      rank: 6,
    },
    {
      address: "0x4g8i...f9i6",
      totalStaked: 42000000000000000n,
      totalWon: 28000000000000000n,
      winRate: 65,
      predictionCount: 18,
      rank: 7,
    },
    {
      address: "0x5h9j...g0j7",
      totalStaked: 38000000000000000n,
      totalWon: 24000000000000000n,
      winRate: 62,
      predictionCount: 15,
      rank: 8,
    },
    {
      address: "0x6i0k...h1k8",
      totalStaked: 32000000000000000n,
      totalWon: 19000000000000000n,
      winRate: 58,
      predictionCount: 12,
      rank: 9,
    },
    {
      address: "0x7j1l...i2l9",
      totalStaked: 28000000000000000n,
      totalWon: 16000000000000000n,
      winRate: 55,
      predictionCount: 10,
      rank: 10,
    },
  ];

  const displayPredictors = predictors.length > 0 ? predictors : mockPredictors.slice(0, limit);

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
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading leaderboard...</p>
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
          {displayPredictors.map((predictor) => (
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
                      {predictor.address}
                    </div>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {predictor.predictionCount}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Staked: </span>
                      <span className="font-semibold">{formatEther(predictor.totalStaked)} BNB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Won: </span>
                      <span className="font-semibold text-success">{formatEther(predictor.totalWon)} BNB</span>
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

        {/* Note about data source */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Rankings updated every 24 hours based on total predictions and accuracy
          </p>
        </div>
      </CardContent>
    </Card>
  );
};