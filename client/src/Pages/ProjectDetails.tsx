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
  ArrowLeft,
  Sparkles,
  MessageSquare,
  XCircle
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useProject, useProjectMilestones } from "@/hooks/useProjects";
import { useMarket, usePlaceBet } from "@/hooks/usePredictions";
import { formatEther } from "viem";
import { useState } from "react";
import { useAccount, usePublicClient} from "wagmi";
import { updateUserStats } from "@/hooks/usePredictions";
import { ACTIVE_CONTRACTS, PREDICTION_MARKET_ABI } from '@/lib/contracts';
import ClaimRewardsSection from "@/components/ClaimRewardsSection";
import { Textarea } from "@/components/ui/textarea";



const ProjectDetail = () => {
  // const { writeContractAsync: createMarket, isPending: isCreatingMarket } = useWriteContract();
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [betAmount, setBetAmount] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(Number(id));
  const isProjectOwner = address && project && (project as any).owner?.toLowerCase() === address.toLowerCase();
  const { data: milestones, isLoading: milestonesLoading } = useProjectMilestones(Number(id));
  const { data: market } = useMarket(Number(id), selectedMilestone);
  const { placeBet, isPending, isConfirming, isSuccess, isError: betError } = usePlaceBet();

  const handlePlaceBet = async (predictYes: boolean) => {
    if (!betAmount || !id || Number(betAmount) < 0.01) {
      alert("Minimum bet amount is 0.01 BNB");
      return;
    }
    
    try {
      await placeBet(
        Number(id), 
        selectedMilestone,
        predictYes, 
        betAmount
      );
      
      // Update leaderboard stats
      if (address) {
        const amount = BigInt(Math.floor(Number(betAmount) * 1e18));
        updateUserStats(address, amount);
      }
      
      setBetAmount("");
    } catch (error: any) {
      console.error('❌ Bet failed:', error);
      
      // ✅ ADD BETTER ERROR MESSAGES
      const errorMsg = error.message || error.toString();
      
      if (errorMsg.includes('Market does not exist')) {
        alert('❌ Market not created yet.\n\nThis milestone needs a prediction market. Contact the project owner.');
      } else if (errorMsg.includes('Already bet')) {
        alert('❌ You already placed a bet on this milestone.\n\nYou can only bet once per milestone.');
      } else if (errorMsg.includes('insufficient funds')) {
        alert('❌ Insufficient BNB balance.\n\nYou need at least ' + betAmount + ' BNB plus gas fees.');
      } else if (errorMsg.includes('user rejected')) {
        alert('Transaction cancelled.');
      } else {
        alert(`❌ Transaction Failed:\n\n${errorMsg.substring(0, 200)}`);
      }
    }
  };

  // AI Analysis function
  const analyzeProject = async () => {
    if (!project) return;
    
    setLoadingAI(true);
    
    try {
      // For now, generate local analysis
      // Later, replace with actual API call to OpenAI
      const mockAnalysis = generateMockAnalysis(project as any, milestones as any);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAiAnalysis(mockAnalysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('Failed to generate AI analysis. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Mock AI analysis generator (replace with real API later)
  const generateMockAnalysis = (projectData: any, milestonesData: any[]) => {
    const fundingGoal = projectData.fundingGoal || 0n;
    const fundingRaised = projectData.totalFundsRaised || 0n;
    const fundingPercent = fundingGoal > 0n 
      ? Number((fundingRaised * 100n) / fundingGoal) 
      : 0;
    
    const milestonesCount = milestonesData?.length || 0;
    const completedMilestones = milestonesData?.filter((m: any) => m.isResolved && m.outcomeAchieved).length || 0;
    
    // Calculate success probability based on data
    let successProb = 50;
    if (fundingPercent > 70) successProb += 20;
    if (fundingPercent > 50) successProb += 10;
    if (completedMilestones > 0) successProb += 15;
    if (projectData.totalPredictions > 50) successProb += 10;
    
    successProb = Math.min(95, successProb);
    
    const riskLevel = successProb > 70 ? 'Low' : successProb > 50 ? 'Medium' : 'High';
    
    return `
## 📊 AI Project Analysis

### Success Probability: ${successProb}%

Based on current metrics, this project shows **${successProb > 70 ? 'strong' : successProb > 50 ? 'moderate' : 'weak'}** potential for success.

### 🎯 Risk Assessment: ${riskLevel}

**Key Factors:**
- **Funding Progress**: ${fundingPercent.toFixed(1)}% of goal achieved
- **Milestone Completion**: ${completedMilestones}/${milestonesCount} milestones completed
- **Community Interest**: ${projectData.totalPredictions || 0} active predictions
- **Category**: ${projectData.category} sector activity

### ✅ Strengths

1. **${fundingPercent > 50 ? 'Strong' : 'Growing'} Community Support**: The project has attracted ${projectData.totalPredictions || 0} predictors, indicating ${fundingPercent > 50 ? 'solid' : 'emerging'} market interest.

2. **${milestonesCount > 2 ? 'Well-Defined' : 'Clear'} Roadmap**: ${milestonesCount} milestones provide ${milestonesCount > 3 ? 'comprehensive' : 'clear'} development visibility.

3. **${projectData.category} Sector**: Currently a ${projectData.category === 'DeFi' ? 'high-activity' : 'growing'} blockchain sector with strong fundamentals.

### ⚠️ Considerations

1. **Funding Timeline**: ${fundingPercent < 30 ? 'Early stage - needs more traction' : fundingPercent < 70 ? 'Approaching funding goals but not yet secured' : 'Nearing completion of funding target'}

2. **Milestone Execution**: ${completedMilestones === 0 ? 'No milestones completed yet - track early progress carefully' : completedMilestones < milestonesCount / 2 ? 'Some milestones achieved - monitor ongoing delivery' : 'Strong track record of milestone completion'}

3. **Market Confidence**: ${projectData.totalPredictions < 20 ? 'Limited predictor activity - still building awareness' : projectData.totalPredictions < 100 ? 'Moderate community engagement' : 'High community engagement and confidence'}

### 💡 Recommendation

**${successProb > 70 ? 'STRONG BUY' : successProb > 50 ? 'BUY' : 'HOLD'}** - ${successProb > 70 ? 'This project shows strong fundamentals and high probability of milestone achievement.' : successProb > 50 ? 'This project has moderate potential. Consider betting on near-term milestones.' : 'This project is early stage. Monitor progress before significant investment.'}

${successProb > 70 ? '✅ Recommend betting YES on upcoming milestones' : successProb > 50 ? '⚖️ Consider smaller positions on near-term milestones' : '⏳ Wait for more data and milestone completion'}

### 🎲 Confidence Score: ${Math.round(successProb * 0.85)}%

*This analysis is based on on-chain data and market trends. Always do your own research and never invest more than you can afford to lose.*
    `.trim();
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
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Extract project data
  const projectData = project as any;
  const fundingGoal = projectData.fundingGoal || 0n;
  const fundingRaised = projectData.totalFundsRaised || 0n;
  const fundingPercentage = fundingGoal > 0n 
    ? Number((fundingRaised * 100n) / fundingGoal)
    : 0;

  // Parse milestones data
  const milestonesArray = (milestones as any[]) || [];

  // Calculate market stats if available
  // Handle different market data structures
  let yesPercentage = 50;
  let noPercentage = 50;

  if (market) {
    const m = market as any; // Cast to bypass TypeScript
    
    if (m.data?.yesPercentage !== undefined) {
      yesPercentage = m.data.yesPercentage;
      noPercentage = m.data.noPercentage;
    } else if (m.yesPercentage !== undefined) {
      yesPercentage = m.yesPercentage;
      noPercentage = m.noPercentage;
    } else if (Array.isArray(market)) {
      const totalYes = m[0] || 0n;
      const totalNo = m[1] || 0n;
      const total = totalYes + totalNo;
      
      if (total > 0n) {
        yesPercentage = Number((totalYes * 100n) / total);
        noPercentage = 100 - yesPercentage;
      }
    }
  }
  // const yesPercentage = marketData?.yesPercentage || 50;
  // const noPercentage = marketData?.noPercentage || 50;

  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {projectData.category || 'Uncategorized'}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {projectData.name || 'Untitled Project'}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                  {projectData.description || 'No description available'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Creator: {projectData.owner?.slice(0, 6)}...{projectData.owner?.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(Number(projectData.submissionDate) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Analysis Card */}
              <Card className="bg-gradient-card border-primary/50">
                <CardContent className="pt-6">
                  {!aiAnalysis ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="font-bold text-lg mb-2">AI Project Analysis</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        Get AI-powered insights on success probability, risk assessment, strengths, and recommendations
                      </p>
                      <Button 
                        onClick={analyzeProject} 
                        disabled={loadingAI}
                        variant="hero"
                        size="lg"
                      >
                        {loadingAI ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          AI Analysis
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setAiAnalysis(null)}
                        >
                          Refresh
                        </Button>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {aiAnalysis}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                      const isSelected = selectedMilestone === idx;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-border"
                          }`}
                          onClick={() => setSelectedMilestone(idx)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {milestone.isResolved ? (
                                <CheckCircle2 className="w-5 h-5 text-success mt-1" />
                              ) : (
                                <Clock className="w-5 h-5 text-warning mt-1" />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">
                                  {milestone.description || `Milestone ${idx + 1}`}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(Number(milestone.targetDate) * 1000).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {!milestone.isResolved && isSelected && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-success">
                                  {yesPercentage}%
                                </div>
                                <div className="text-xs text-muted-foreground">Confidence</div>
                              </div>
                            )}
                          </div>

                          {/* ✅ ADD THIS: Milestone Manager for Owner */}
                          {isSelected && isProjectOwner && !milestone.isResolved && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <MilestoneManagerInline
                                projectId={Number(id)}
                                milestone={milestone}
                                milestoneIndex={idx}
                              />
                            </div>
                          )}

                          {/* Betting Section */}
                          {!milestone.isResolved && isSelected && (
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
                                <>
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
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          {isPending ? 'Confirming...' : 'Processing...'}
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
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          {isPending ? 'Confirming...' : 'Processing...'}
                                        </>
                                      ) : (
                                        'Bet NO'
                                      )}
                                    </Button>
                                  </div>

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
                                </>
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
                          {projectData.description || 'No description available'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Status</h3>
                        <Badge>
                          {['Pending', 'Active', 'Completed', 'Cancelled'][projectData.status] || 'Unknown'}
                        </Badge>
                      </div>
                    </TabsContent>
                    <TabsContent value="team" className="mt-4">
                      <div>
                        <h3 className="font-semibold mb-2">Project Creator</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-background font-bold">
                            {projectData.owner?.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-mono text-sm">{projectData.owner}</p>
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
                      {fundingPercentage.toFixed(1)}% funded
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Target className="w-3 h-3" />
                        Predictors
                      </div>
                      <div className="text-2xl font-bold">{projectData.totalPredictions || 0}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Milestones
                      </div>
                      <div className="text-2xl font-bold">
                        {milestonesArray.length}
                      </div>
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

// Inline Milestone Manager Component
interface MilestoneManagerInlineProps {
  projectId: number;
  milestone: any;
  milestoneIndex: number;
}

function MilestoneManagerInline({ projectId, milestone, milestoneIndex }: MilestoneManagerInlineProps) {
  const [updateText, setUpdateText] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const publicClient = usePublicClient();
  
  const handlePostUpdate = async () => {
    if (!updateText.trim()) return;

    try {
      const updatesKey = `milestone_updates_${projectId}_${milestoneIndex}`;
      const existingUpdates = JSON.parse(localStorage.getItem(updatesKey) || '[]');
      
      existingUpdates.push({
        text: updateText,
        timestamp: Date.now(),
        proofUrl: proofUrl || null,
      });
      
      localStorage.setItem(updatesKey, JSON.stringify(existingUpdates));
      
      setUpdateText('');
      setProofUrl('');
      alert('✅ Update posted successfully!');
    } catch (error) {
      console.error('Error posting update:', error);
      alert('Failed to post update');
    }
  };

  const handleResolveMilestone = async (achieved: boolean) => {
    try {
      // Get market ID first
      const marketData = await publicClient?.readContract({
        address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarketByProject',
        args: [BigInt(projectId), BigInt(milestoneIndex)],
      } as any);

      if (!marketData) {
        alert('❌ Market not found for this milestone');
        return;
      }

      // TODO: Call contract to resolve market
      alert(`✅ Milestone would be resolved as ${achieved ? 'ACHIEVED' : 'FAILED'}`);
      alert('⚠️ Note: Contract integration pending - this is a placeholder');
      
    } catch (error: any) {
      console.error('Error resolving milestone:', error);
      alert(`Failed to resolve milestone: ${error.message}`);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-primary/5 border border-primary/30 rounded-lg">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Project Owner Controls
      </h4>
      
      <Textarea
        value={updateText}
        onChange={(e) => setUpdateText(e.target.value)}
        placeholder="Share progress updates with your community..."
        rows={3}
      />

      <input
        type="url"
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        placeholder="Proof URL (GitHub commit, screenshot, etc.)"
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
      />

      <div className="flex gap-2">
        <Button
          onClick={handlePostUpdate}
          disabled={!updateText.trim()}
          size="sm"
          className="flex-1"
        >
          Post Update
        </Button>

        <Button
          onClick={() => setShowResolve(!showResolve)}
          variant="outline"
          size="sm"
        >
          Resolve Milestone
        </Button>
      </div>

      {showResolve && (
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={() => handleResolveMilestone(true)}
            className="flex-1 bg-success hover:bg-success/80"
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Achieved
          </Button>
          <Button
            onClick={() => handleResolveMilestone(false)}
            variant="destructive"
            className="flex-1"
            size="sm"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Mark Failed
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;