import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Users, 
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useProject, useProjectMilestones } from "@/hooks/useProjects";
import { useMarket, usePlaceBet } from "@/hooks/usePredictions";
import { formatEther, parseEther } from "viem";
import { useState } from "react";
import { useAccount } from "wagmi";

const ProjectDetail = () => {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(0);
  
  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(Number(id));
  const { data: milestones, isLoading: milestonesLoading } = useProjectMilestones(Number(id));
  const { data: market } = useMarket(Number(id), selectedMilestone);
  const { placeBet, isPending, isConfirming, isSuccess, isError: betError } = usePlaceBet();

  const handlePlaceBet = async (predictYes: boolean) => {
    if (!betAmount || !id || Number(betAmount) < 0.01) {
      alert("Minimum bet amount is 0.01 BNB");
      return;
    }
    
    try {
      await placeBet(Number(id), selectedMilestone, predictYes, betAmount);
      setBetAmount(""); // Clear input after successful bet
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  };

  // Loading State
  if (projectLoading || milestonesLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading project details...</p>
        </main>
      </div>
    );
  }

  // Error State
  if (projectError || !project) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
            <p className="text-muted-foreground mb-8">
              The project you're looking for doesn't exist or hasn't been created yet.
            </p>
            <Link to="/projects">
              <Button variant="hero">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const projectData = project as any;
  
  // Extract project data from tuple
  const projectName = projectData[0];
  const creator = projectData[1];
  const description = projectData[2];
  const category = projectData[3];
  const fundingGoal = projectData[6];
  const fundingRaised = projectData[7];
  const status = projectData[8];
  const createdAt = projectData[9];

  const fundingPercentage = fundingGoal > 0n 
    ? Number((fundingRaised * 100n) / fundingGoal)
    : 0;

  // Parse milestones data
  const milestonesArray = (milestones as any[]) || [];

  // Calculate market stats if available
  let yesPercentage = 50;
  let noPercentage = 50;
  
  if (market) {
    const totalYes = market[0] || 0n;
    const totalNo = market[1] || 0n;
    const total = totalYes + totalNo;
    
    if (total > 0n) {
      yesPercentage = Number((totalYes * 100n) / total);
      noPercentage = 100 - yesPercentage;
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>

          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {projectName}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                  {description}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Creator: {creator?.slice(0, 6)}...{creator?.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(Number(createdAt) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Milestones */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Project Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {milestonesArray.length > 0 ? (
                    milestonesArray.map((milestone, idx) => {
                      const milestoneDescription = milestone[0];
                      const targetDate = milestone[1];
                      const fundingTarget = milestone[2];
                      const achieved = milestone[3];
                      
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedMilestone === idx
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-border"
                          }`}
                          onClick={() => setSelectedMilestone(idx)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {achieved ? (
                                <CheckCircle2 className="w-5 h-5 text-success mt-1" />
                              ) : (
                                <Clock className="w-5 h-5 text-warning mt-1" />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">
                                  {milestoneDescription || `Milestone ${idx + 1}`}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(Number(targetDate) * 1000).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {formatEther(fundingTarget)} BNB
                                  </div>
                                </div>
                              </div>
                            </div>
                            {!achieved && selectedMilestone === idx && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-success">
                                  {yesPercentage}%
                                </div>
                                <div className="text-xs text-muted-foreground">Confidence</div>
                              </div>
                            )}
                          </div>

                          {/* Betting Section - Only show for selected, unachieved milestone */}
                          {!achieved && selectedMilestone === idx && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <div className="flex gap-2 mb-3">
                                <div className="flex-1 bg-success/20 text-success px-3 py-2 rounded-lg text-sm font-medium text-center">
                                  YES: {yesPercentage}%
                                </div>
                                <div className="flex-1 bg-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm font-medium text-center">
                                  NO: {noPercentage}%
                                </div>
                              </div>
                              
                              {!isConnected ? (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                  Connect your wallet to place predictions
                                </p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  <Button 
                                    variant="default"
                                    size="sm" 
                                    className="w-full bg-success hover:bg-success/80"
                                    onClick={() => handlePlaceBet(true)}
                                    disabled={isPending || isConfirming || !betAmount}
                                  >
                                    {isPending || isConfirming ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isPending ? 'Approving...' : 'Processing...'}
                                      </>
                                    ) : (
                                      'Bet YES'
                                    )}
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => handlePlaceBet(false)}
                                    disabled={isPending || isConfirming || !betAmount}
                                  >
                                    {isPending || isConfirming ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isPending ? 'Approving...' : 'Processing...'}
                                      </>
                                    ) : (
                                      'Bet NO'
                                    )}
                                  </Button>
                                </div>
                              )}

                              {/* Success/Error Messages */}
                              {isSuccess && (
                                <p className="text-center text-sm text-success mt-2">
                                  ✅ Prediction placed successfully!
                                </p>
                              )}
                              {betError && (
                                <p className="text-center text-sm text-destructive mt-2">
                                  ❌ Failed to place prediction. Try again.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No milestones defined for this project yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info Tabs */}
              <Card className="bg-gradient-card">
                <CardContent className="pt-6">
                  <Tabs defaultValue="about">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="team">Team</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about" className="mt-4 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Project Vision</h3>
                        <p className="text-muted-foreground">
                          {description}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Status</h3>
                        <Badge variant={status === 0 ? "default" : status === 1 ? "secondary" : "outline"}>
                          {status === 0 ? 'Active' : status === 1 ? 'Completed' : 'Cancelled'}
                        </Badge>
                      </div>
                    </TabsContent>
                    <TabsContent value="team" className="mt-4">
                      <div>
                        <h3 className="font-semibold mb-2">Project Creator</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-background font-bold">
                            {creator?.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-mono text-sm">{creator}</p>
                            <p className="text-xs text-muted-foreground">Project Owner</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Make Prediction Card */}
              <Card className="bg-gradient-primary text-background border-0 shadow-glow">
                <CardHeader>
                  <CardTitle className="text-background">Place Your Prediction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Amount (BNB)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="bg-background/20 border-background/30 text-background placeholder:text-background/60"
                      min="0.01"
                      step="0.01"
                      disabled={!isConnected}
                    />
                    <div className="text-xs mt-1 text-background/80">
                      Min: 0.01 BNB
                    </div>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-background/80">
                      Connect your wallet to place predictions
                    </p>
                  )}
                  {isConnected && (
                    <p className="text-xs text-background/80">
                      Select a milestone above and click YES or NO to predict
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Funding Stats */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-lg">Funding Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-semibold">
                        {formatEther(fundingRaised)} / {formatEther(fundingGoal)} BNB
                      </span>
                    </div>
                    <Progress value={fundingPercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {fundingPercentage}% funded
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Target className="w-3 h-3" />
                        Milestones
                      </div>
                      <div className="text-2xl font-bold">{milestonesArray.length}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </div>
                      <div className="text-2xl font-bold">
                        {milestonesArray.filter((m: any) => m[3]).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Stats */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Market Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="secondary">{category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={status === 0 ? "default" : "secondary"}>
                        {status === 0 ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-semibold">
                        {new Date(Number(createdAt) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;