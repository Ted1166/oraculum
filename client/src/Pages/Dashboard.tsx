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
  DollarSign,
  ArrowUpRight
} from "lucide-react";
import { Link } from "react-router-dom";

const mockUserStats = {
  totalStaked: "12.4 BNB",
  totalWon: "8.7 BNB",
  activePredictions: 5,
  winRate: 73,
  rank: 42,
  reputationScore: 847,
};

const mockActivePredictions = [
  {
    id: "1",
    projectName: "DeFi Yield Optimizer",
    milestone: "Launch Beta on Testnet",
    amount: "2.5 BNB",
    position: "YES",
    currentOdds: "73%",
    potentialReturn: "3.2 BNB",
    status: "winning",
    daysLeft: 8,
  },
  {
    id: "2",
    projectName: "Gaming DAO Platform",
    milestone: "Alpha Game Release",
    amount: "1.8 BNB",
    position: "YES",
    currentOdds: "82%",
    potentialReturn: "2.1 BNB",
    status: "winning",
    daysLeft: 13,
  },
  {
    id: "3",
    projectName: "AI Trading Bot",
    milestone: "Complete Backtesting",
    amount: "1.2 BNB",
    position: "NO",
    currentOdds: "45%",
    potentialReturn: "1.8 BNB",
    status: "losing",
    daysLeft: 1,
  },
];

const mockRecentActivity = [
  {
    id: "1",
    type: "win",
    projectName: "Cross-Chain Bridge",
    milestone: "Security Audit",
    amount: "+3.4 BNB",
    date: "2 hours ago",
  },
  {
    id: "2",
    type: "loss",
    projectName: "Social DeFi Network",
    milestone: "Beta Launch",
    amount: "-0.8 BNB",
    date: "1 day ago",
  },
  {
    id: "3",
    type: "placed",
    projectName: "NFT Marketplace v2",
    milestone: "Smart Contract Audit",
    amount: "2.0 BNB",
    date: "2 days ago",
  },
];

const Dashboard = () => {
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
            <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Staked
                </CardTitle>
                <Wallet className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockUserStats.totalStaked}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {mockUserStats.activePredictions} predictions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:border-success/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Won
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{mockUserStats.totalWon}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mockUserStats.winRate}% win rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:border-warning/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reputation Score
                </CardTitle>
                <Trophy className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockUserStats.reputationScore}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rank #{mockUserStats.rank} globally
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary text-background border-0 shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Predictions
                </CardTitle>
                <Target className="w-4 h-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockUserStats.activePredictions}</div>
                <Link to="/projects">
                  <Button variant="secondary" size="sm" className="mt-2 w-full">
                    Make More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Predictions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {mockActivePredictions.map((prediction) => (
                <Card key={prediction.id} className="bg-gradient-card hover:border-primary/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <Link to={`/project/${prediction.id}`}>
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                                {prediction.projectName}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">{prediction.milestone}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                            <div className="font-semibold">{prediction.amount}</div>
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
                            <div className="font-semibold">{prediction.currentOdds}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Days Left</div>
                            <div className="font-semibold">{prediction.daysLeft} days</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex lg:flex-col items-center lg:items-end gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Potential Return</div>
                          <div className={`text-xl font-bold ${prediction.status === 'winning' ? 'text-success' : 'text-destructive'}`}>
                            {prediction.potentialReturn}
                          </div>
                        </div>
                        {prediction.status === 'winning' ? (
                          <div className="flex items-center gap-1 text-success text-sm">
                            <TrendingUp className="w-4 h-4" />
                            Winning
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive text-sm">
                            <TrendingDown className="w-4 h-4" />
                            Losing
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0 last:pb-0">
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
                              <DollarSign className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{activity.projectName}</div>
                            <div className="text-sm text-muted-foreground">{activity.milestone}</div>
                            <div className="text-xs text-muted-foreground mt-1">{activity.date}</div>
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