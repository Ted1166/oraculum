import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Wallet,
  Trophy,
  Target,
  Loader2,
  Calendar,
  ArrowUpRight,
  Gift,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount, usePublicClient } from "wagmi";
import { useUserBets, useClaimRewards } from "@/hooks/usePredictions";
import { useAllProjects } from "@/hooks/useProjects";
import { formatEther } from "viem";
import { useState, useEffect } from "react";
import { ACTIVE_CONTRACTS, PREDICTION_MARKET_ABI } from "@/lib/contracts";
import ClaimRewardsSection from "@/components/ClaimRewardsSection";

const Dashboard = () => {
  // ✅ ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL LOGIC
  const { address, isConnected } = useAccount();
  const { data: userBets, isLoading } = useUserBets();
  const { data: allProjects } = useAllProjects();
  const { claimRewards, isPending: isClaiming, isSuccess: claimSuccess } = useClaimRewards();
  const publicClient = usePublicClient();
  
  // State hooks
  const [displayName, setDisplayName] = useState("");
  const [betsDetails, setBetsDetails] = useState<any[]>([]);

  // ✅ Effect to load display name
  useEffect(() => {
    if (address) {
      const profileKey = `predict_fund_profile_${address}`;
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          setDisplayName(profile.displayName || "");
        } catch {}
      }
    }
  }, [address]);

  // ✅ Effect to fetch bet details
  useEffect(() => {
    const fetchBetDetails = async () => {
      if (!userBets || !publicClient) return;
      
      const betIds = userBets as bigint[];
      const details = [];
      
      for (const betId of betIds) {
        try {
          const bet = await publicClient.readContract({
            address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'getBet',
            args: [betId],
          } as any);
          details.push(bet);
        } catch (error) {
          console.error(`Error fetching bet ${betId}:`, error);
        }
      }
      
      setBetsDetails(details);
    };
    
    fetchBetDetails();
  }, [userBets, publicClient]);

  // ✅ NOW WE CAN DO CONDITIONAL RENDERING
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Early return AFTER all hooks
  if (!isConnected || !address) {
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

  // Calculate stats
  const totalStaked = betsDetails.reduce((sum: bigint, bet: any) => sum + bet.amount, 0n);
  const activeBets = betsDetails.filter((bet: any) => !bet.claimed);
  const completedBets = betsDetails.filter((bet: any) => bet.claimed);
  
  // Calculate total won (sum of claimed bets)
  const totalWon = completedBets.reduce((sum, bet) => sum + bet.reward, 0n);
  
  // Calculate win rate
  const winRate = betsDetails.length > 0 
    ? Math.round((completedBets.length / betsDetails.length) * 100)
    : 0;

  // Calculate reputation score using same formula as leaderboard
  const totalStakedBNB = parseFloat(formatEther(totalStaked));
  const accuracyScore = winRate * 100 * 0.4;
  const volumeScore = Math.min(betsDetails.length * 10, 1000) * 0.3;
  const stakeScore = Math.min(totalStakedBNB * 5, 500) * 0.3;
  const reputationScore = Math.round(accuracyScore + volumeScore + stakeScore);

  // Get project details for each bet
  const getBetDetails = (bet: any) => {
    const project = allProjects?.find((p: any) => Number(p.id) === Number(bet.marketId));
    return {
      projectId: Number(bet.marketId),
      projectName: project?.name || `Project #${bet.marketId}`,
      milestoneIndex: 0, // You may need to get this from the market
      amount: bet.amount,
      predictedYes: bet.predictedYes,
      claimed: bet.claimed,
      reward: bet.reward,
    };
  };

  // Format active predictions with project details
  const activePredictions = activeBets.map(getBetDetails);
  const completedPredictions = completedBets.map(getBetDetails);

  const handleClaim = async (betId: number) => {
    try {
      await claimRewards(betId);
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome, {displayName || truncateAddress(address)}
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
                  {parseFloat(formatEther(totalStaked)).toFixed(4)} BNB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {betsDetails.length} predictions
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
                  {parseFloat(formatEther(totalWon)).toFixed(4)} BNB
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
                <Link to="/leaderboard">
                  <p className="text-xs text-primary hover:underline mt-1 cursor-pointer">
                    View Leaderboard
                  </p>
                </Link>
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
              <TabsTrigger value="active">
                Active Predictions ({activeBets.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History ({completedBets.length})
              </TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Active Predictions Tab */}
            <TabsContent value="active" className="space-y-4">
              {activePredictions.length > 0 ? (
                activePredictions.map((prediction, index) => (
                  <Card key={index} className="bg-gradient-card hover:border-primary/50 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left Section - Project Info */}
                        <div className="flex-1">
                          <Link to={`/project/${prediction.projectId}`}>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-2">
                              {prediction.projectName}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mb-4">
                            Milestone #{prediction.milestoneIndex + 1}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                              <div className="font-semibold">
                                {parseFloat(formatEther(prediction.amount)).toFixed(4)} BNB
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Position</div>
                              <Badge 
                                variant={prediction.predictedYes ? "default" : "secondary"}
                                className={prediction.predictedYes ? "bg-success" : "bg-destructive"}
                              >
                                {prediction.predictedYes ? "YES" : "NO"}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Status</div>
                              <Badge variant="outline">Active</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Action */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-3">
                          <Link to={`/project/${prediction.projectId}`}>
                            <Button variant="outline" size="sm">
                              View Project
                              <ArrowUpRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
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
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {completedPredictions.length > 0 ? (
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Completed Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {completedPredictions.map((prediction, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-success/20">
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <div className="font-semibold">{prediction.projectName}</div>
                              <div className="text-sm text-muted-foreground">
                                Milestone #{prediction.milestoneIndex + 1}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={prediction.predictedYes ? "default" : "secondary"}
                                  className={prediction.predictedYes ? "bg-success text-xs" : "bg-destructive text-xs"}
                                >
                                  {prediction.predictedYes ? "YES" : "NO"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Staked: {parseFloat(formatEther(prediction.amount)).toFixed(4)} BNB
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-success">
                            Claimed ✓
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-card">
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No completed predictions yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <ClaimRewardsSection/>
              {/* <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-warning" />
                    Claimable Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedBets.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Total Rewards Available</span>
                          <span className="text-2xl font-bold text-success">
                            {parseFloat(formatEther(totalWon)).toFixed(4)} BNB
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From {completedBets.length} winning predictions
                        </p>
                      </div>
                      
                      <div className="text-center py-8">
                        <Trophy className="w-16 h-16 text-warning mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Congratulations! 🎉</h3>
                        <p className="text-muted-foreground mb-6">
                          You've won {completedBets.length} predictions! Keep making accurate predictions to earn more.
                        </p>
                        <Link to="/projects">
                          <Button variant="hero">
                            Make More Predictions
                            <ArrowUpRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-warning mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold mb-2">No Rewards Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Win predictions to earn rewards! Top predictors also earn early token allocations.
                      </p>
                      <Link to="/projects">
                        <Button variant="hero">
                          Browse Projects
                          <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;