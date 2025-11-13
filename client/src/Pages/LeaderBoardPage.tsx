import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/LeaderBoard";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Star } from "lucide-react";

const LeaderboardPage = () => {
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
              Top predictors ranked by accuracy and total predictions
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-card border-warning/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Top Predictor</div>
                    <div className="text-xl font-bold">0x7a2e...f3c9</div>
                    <div className="text-xs text-success">90% accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Predictors</div>
                    <div className="text-xl font-bold">1,234</div>
                    <div className="text-xs text-muted-foreground">This month</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-success/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                    <div className="text-xl font-bold">485.7 BNB</div>
                    <div className="text-xs text-muted-foreground">Across all markets</div>
                  </div>
                </div>
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
                      • Rankings are calculated based on prediction accuracy, total predictions made, and total amount staked
                    </p>
                    <p>
                      • Top predictors earn exclusive rewards and early token allocations when projects launch
                    </p>
                    <p>
                      • Rankings update every 24 hours based on resolved predictions
                    </p>
                    <p>
                      • Minimum 10 predictions required to appear on the leaderboard
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