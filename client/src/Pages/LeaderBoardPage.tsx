import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/LeaderBoard";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Star, Loader2 } from "lucide-react";
import { useLeaderboardStats, useTopPredictors } from "@/hooks/usePredictions";

const LeaderboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useLeaderboardStats();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-warning" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Leaderboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Top predictors ranked by accuracy, volume, and total stake
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Top Predictor */}
            <Card className="bg-gradient-card border-warning/50">
              <CardContent className="pt-6">
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-warning" />
                  </div>
                ) : stats?.topPredictor ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Top Predictor</div>
                      <div className="text-xl font-bold">
                        {stats.topPredictor.displayName || truncateAddress(stats.topPredictor.address)}
                      </div>
                      <div className="text-xs text-success">{stats.topPredictor.winRate}% accuracy</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No predictions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Predictors */}
            <Card className="bg-gradient-card border-primary/50">
              <CardContent className="pt-6">
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Active Predictors</div>
                      <div className="text-xl font-bold">
                        {stats?.activePredictors || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Qualified users</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Staked */}
            <Card className="bg-gradient-card border-success/50">
              <CardContent className="pt-6">
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-success" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Staked</div>
                      <div className="text-xl font-bold">
                        {stats?.totalStaked || '0'} BNB
                      </div>
                      <div className="text-xs text-muted-foreground">Across all markets</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Leaderboard */}
          <Leaderboard limit={50} showTitle={false} />

          {/* How Rankings Work */}
          <Card className="bg-gradient-card mt-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <Star className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">How Rankings Work</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong>Reputation Score Formula:</strong>
                    </p>
                    <p className="pl-4">
                      • <strong>40%</strong> Prediction Accuracy (Win Rate)
                    </p>
                    <p className="pl-4">
                      • <strong>30%</strong> Prediction Volume (Total Predictions)
                    </p>
                    <p className="pl-4">
                      • <strong>30%</strong> Total Amount Staked
                    </p>
                    <p className="mt-4">
                      <strong>Requirements:</strong>
                    </p>
                    <p className="pl-4">
                      • Minimum <strong>10 predictions</strong> to qualify for leaderboard
                    </p>
                    <p className="pl-4">
                      • Rankings update automatically every <strong>5 minutes</strong>
                    </p>
                    <p className="pl-4">
                      • Only resolved predictions count toward accuracy
                    </p>
                    <p className="mt-4">
                      <strong>Rewards:</strong>
                    </p>
                    <p className="pl-4">
                      • Top predictors earn <strong>early token allocations</strong> when projects launch
                    </p>
                    <p className="pl-4">
                      • Exclusive access to <strong>premium prediction markets</strong>
                    </p>
                    <p className="pl-4">
                      • Special <strong>NFT badges</strong> for top 3 monthly predictors
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;