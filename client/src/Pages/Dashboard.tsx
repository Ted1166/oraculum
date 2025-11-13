import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Trophy,
  Target,
  Loader2,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserBets } from "@/hooks/usePredictions";
import { formatEther } from "viem";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const { data: userBets, isLoading } = useUserBets();

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center py-12">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your wallet to view your dashboard
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const betsArray = (userBets as any[]) || [];
  const totalStaked = betsArray.reduce((sum, bet) => sum + bet[2], 0n);
  const activeBets = betsArray.filter(bet => !bet[4]); // Not claimed
  const completedBets = betsArray.filter(bet => bet[4]); // Claimed
  
  // Mock data for stats (replace with real calculations later)
  const totalWon = totalStaked > 0n ? totalStaked * 7n / 10n : 0n; // 70% of staked for demo
  const winRate = completedBets.length > 0 ? 73 : 0;
  const reputationScore = 847;
  const globalRank = 42;

  // Mock active predictions with detailed info
  const mockActivePredictions = [
    {
      id: 0,
      name: "DeFi Yield Optimizer",
      milestone: "Launch Beta on Testnet",
      stake: "2.5",
      position: "YES",
      odds: 73,
      daysLeft: 8,
      potentialReturn: "3.2",
      status: "winning",
    },
    {
      id: 1,
      name: "Gaming DAO Platform",
      milestone: "Alpha Game Release",
      stake: "1.8",
      position: "YES",
      odds: 82,
      daysLeft: 13,
      potentialReturn: "2.1",
      status: "winning",
    },
    {
      id: 2,
      name: "AI Trading Bot",
      milestone: "Complete Backtesting",
      stake: "1.2",
      position: "NO",
      odds: 45,
      daysLeft: 1,
      potentialReturn: "1.8",
      status: "losing",
    },
  ];

  // Mock recent activity
  const recentActivity = [
    {
      id: 1,
      type: "win",
      project: "Cross-Chain Bridge",
      milestone: "Security Audit",
      amount: "+3.4 BNB",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "loss",
      project: "Social DeFi Network",
      milestone: "Beta Launch",
      amount: "-0.8 BNB",
      time: "1 day ago",
    },
    {
      id: 3,
      type: "placed",
      project: "NFT Marketplace v2",
      milestone: "Smart Contract Audit",
      amount: "2.0 BNB",
      time: "2 days ago",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your predictions, earnings, and reputation
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Staked */}
            <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Staked
                </CardTitle>
                <Wallet className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {betsArray.length > 0 ? `${formatEther(totalStaked)} BNB` : '0 BNB'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {betsArray.length} predictions
                </p>
              </CardContent>
            </Card>

            {/* Total Won */}
            <Card className="bg-gradient-card border-border/50 hover:border-success/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Won
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {totalWon > 0n ? `${formatEther(totalWon)} BNB` : '0 BNB'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {winRate}% win rate
                </p>
              </CardContent>
            </Card>

            {/* Reputation Score */}
            <Card className="bg-gradient-card border-border/50 hover:border-warning/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reputation Score
                </CardTitle>
                <Trophy className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reputationScore}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rank #{globalRank} globally
                </p>
              </CardContent>
            </Card>

            {/* Active Predictions */}
            <Card className="bg-gradient-primary text-background border-0 shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Predictions
                </CardTitle>
                <Target className="w-4 h-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeBets.length}</div>
                <Link to="/projects">
                  <Button variant="secondary" size="sm" className="mt-2 w-full">
                    Make More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Predictions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Active Predictions Tab */}
            <TabsContent value="active" className="space-y-4">
              {mockActivePredictions.length > 0 ? (
                mockActivePredictions.map((prediction) => (
                  <Card key={prediction.id} className="bg-gradient-card hover:border-primary/50 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left Section - Project Info */}
                        <div className="flex-1">
                          <Link to={`/project/${prediction.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-2">
                              {prediction.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mb-4">
                            {prediction.milestone}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                              <div className="font-semibold">{prediction.stake} BNB</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Position</div>
                              <Badge 
                                variant={prediction.position === "YES" ? "default" : "secondary"}
                                className={prediction.position === "YES" ? "bg-success" : "bg-destructive"}
                              >
                                {prediction.position}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Current Odds</div>
                              <div className="font-semibold">{prediction.odds}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Days Left</div>
                              <div className="font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {prediction.daysLeft}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Returns */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-3">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Potential Return</div>
                            <div className={`text-xl font-bold ${
                              prediction.status === 'winning' ? 'text-success' : 'text-destructive'
                            }`}>
                              {prediction.potentialReturn} BNB
                            </div>
                          </div>
                          {prediction.status === 'winning' ? (
                            <div className="flex items-center gap-1 text-success text-sm font-medium">
                              <TrendingUp className="w-4 h-4" />
                              Winning
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                              <TrendingDown className="w-4 h-4" />
                              Losing
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gradient-card">
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No active predictions yet</p>
                    <Link to="/projects">
                      <Button variant="hero">
                        Browse Projects
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'win' ? 'bg-success/20' : 
                            activity.type === 'loss' ? 'bg-destructive/20' : 
                            'bg-primary/20'
                          }`}>
                            {activity.type === 'win' ? (
                              <TrendingUp className="w-5 h-5 text-success" />
                            ) : activity.type === 'loss' ? (
                              <TrendingDown className="w-5 h-5 text-destructive" />
                            ) : (
                              <Target className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{activity.project}</div>
                            <div className="text-sm text-muted-foreground">{activity.milestone}</div>
                            <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${
                          activity.type === 'win' ? 'text-success' : 
                          activity.type === 'loss' ? 'text-destructive' : 
                          'text-foreground'
                        }`}>
                          {activity.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Your Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-warning mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Earn Token Allocations</h3>
                    <p className="text-muted-foreground mb-6">
                      Top predictors earn early token allocations when projects launch.
                      Keep predicting to unlock rewards!
                    </p>
                    <Link to="/projects">
                      <Button variant="hero">
                        Browse Projects
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;