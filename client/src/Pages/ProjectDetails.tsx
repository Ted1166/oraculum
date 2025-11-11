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
  ArrowRight 
} from "lucide-react";
import { useParams } from "react-router-dom";

// Mock data - replace with actual smart contract data
const mockProject = {
  id: "1",
  name: "DeFi Yield Optimizer",
  description: "Auto-compound yields across multiple protocols with optimal gas efficiency and risk management. Our platform analyzes real-time APYs and automatically moves funds to maximize returns while managing risk.",
  category: "DeFi",
  fundingGoal: "100 BNB",
  fundingRaised: "67 BNB",
  fundingPercentage: 67,
  totalPredictions: "234",
  totalVolume: "45.8 BNB",
  milestones: [
    {
      id: 1,
      title: "Smart Contract Development",
      status: "completed",
      date: "Nov 15, 2025",
      confidence: 100,
    },
    {
      id: 2,
      title: "Launch Beta on Testnet",
      status: "active",
      date: "Dec 15, 2025",
      confidence: 73,
      yesBets: "32.4 BNB",
      noBets: "13.4 BNB",
    },
    {
      id: 3,
      title: "Security Audit Complete",
      status: "upcoming",
      date: "Jan 10, 2026",
      confidence: 0,
    },
    {
      id: 4,
      title: "Mainnet Launch",
      status: "upcoming",
      date: "Feb 1, 2026",
      confidence: 0,
    },
  ],
};

const ProjectDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {mockProject.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {mockProject.name}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                  {mockProject.description}
                </p>
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
                  {mockProject.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`p-4 rounded-xl border transition-all ${
                        milestone.status === "active"
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-success mt-1" />
                          ) : milestone.status === "active" ? (
                            <Clock className="w-5 h-5 text-warning mt-1" />
                          ) : (
                            <Target className="w-5 h-5 text-muted-foreground mt-1" />
                          )}
                          <div>
                            <h3 className="font-semibold mb-1">{milestone.title}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {milestone.date}
                            </div>
                          </div>
                        </div>
                        {milestone.status === "active" && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-success">
                              {milestone.confidence}%
                            </div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        )}
                      </div>

                      {milestone.status === "active" && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex gap-2 mb-3">
                            <div className="flex-1 bg-success/20 text-success px-3 py-2 rounded-lg text-sm font-medium text-center">
                              YES: {milestone.yesBets}
                            </div>
                            <div className="flex-1 bg-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm font-medium text-center">
                              NO: {milestone.noBets}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="success" size="sm" className="w-full">
                              Bet YES
                            </Button>
                            <Button variant="destructive" size="sm" className="w-full">
                              Bet NO
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Additional Info Tabs */}
              <Card className="bg-gradient-card">
                <CardContent className="pt-6">
                  <Tabs defaultValue="about">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="team">Team</TabsTrigger>
                      <TabsTrigger value="predictions">Predictions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about" className="mt-4 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Project Vision</h3>
                        <p className="text-muted-foreground">
                          Our goal is to democratize yield optimization in DeFi by making advanced
                          strategies accessible to everyone. We're building a platform that automatically
                          manages your assets across multiple protocols to maximize returns.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Technology Stack</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Solidity</Badge>
                          <Badge variant="outline">React</Badge>
                          <Badge variant="outline">Web3.js</Badge>
                          <Badge variant="outline">BNB Chain</Badge>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="team" className="mt-4">
                      <p className="text-muted-foreground">Team information coming soon...</p>
                    </TabsContent>
                    <TabsContent value="predictions" className="mt-4">
                      <p className="text-muted-foreground">Prediction history coming soon...</p>
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
                      className="bg-background/20 border-background/30 text-background placeholder:text-background/60"
                      min="0.01"
                      step="0.01"
                    />
                    <div className="text-xs mt-1 text-background/80">
                      Min: 0.01 BNB
                    </div>
                  </div>
                  <Button variant="secondary" size="lg" className="w-full">
                    Connect Wallet to Predict
                  </Button>
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
                        {mockProject.fundingRaised} / {mockProject.fundingGoal}
                      </span>
                    </div>
                    <Progress value={mockProject.fundingPercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Users className="w-3 h-3" />
                        Predictors
                      </div>
                      <div className="text-2xl font-bold">{mockProject.totalPredictions}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <DollarSign className="w-3 h-3" />
                        Volume
                      </div>
                      <div className="text-2xl font-bold">{mockProject.totalVolume}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Predictors */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Top Predictors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((rank) => (
                      <div key={rank} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-background">
                          {rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">0x7a2e...f3c9</div>
                          <div className="text-xs text-muted-foreground">
                            {(10 - rank * 2).toFixed(1)} BNB staked
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {95 - rank * 5}% accuracy
                        </Badge>
                      </div>
                    ))}
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