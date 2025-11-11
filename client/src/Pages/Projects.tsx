import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

// Mock data - replace with actual data from smart contracts
const mockProjects = [
  {
    id: "1",
    name: "DeFi Yield Optimizer",
    description: "Auto-compound yields across multiple protocols with optimal gas efficiency and risk management.",
    category: "DeFi",
    fundingGoal: "100 BNB",
    fundingRaised: "67 BNB",
    fundingPercentage: 67,
    nextMilestone: "Launch Beta on Testnet",
    nextMilestoneDate: "Dec 15, 2025",
    totalPredictions: "234",
    confidence: 73,
  },
  {
    id: "2",
    name: "NFT Marketplace v2",
    description: "Next-gen NFT platform with dynamic royalties, fractional ownership, and cross-chain support.",
    category: "NFT",
    fundingGoal: "150 BNB",
    fundingRaised: "42 BNB",
    fundingPercentage: 28,
    nextMilestone: "Complete Smart Contract Audit",
    nextMilestoneDate: "Dec 10, 2025",
    totalPredictions: "189",
    confidence: 58,
  },
  {
    id: "3",
    name: "Gaming DAO Platform",
    description: "Community-owned gaming ecosystem with play-to-earn mechanics and governance tokens.",
    category: "Gaming",
    fundingGoal: "200 BNB",
    fundingRaised: "125 BNB",
    fundingPercentage: 62,
    nextMilestone: "Alpha Game Release",
    nextMilestoneDate: "Dec 20, 2025",
    totalPredictions: "567",
    confidence: 82,
  },
  {
    id: "4",
    name: "AI Trading Bot",
    description: "Machine learning powered trading bot with risk management and portfolio optimization.",
    category: "AI",
    fundingGoal: "80 BNB",
    fundingRaised: "25 BNB",
    fundingPercentage: 31,
    nextMilestone: "Complete Backtesting",
    nextMilestoneDate: "Dec 8, 2025",
    totalPredictions: "156",
    confidence: 45,
  },
  {
    id: "5",
    name: "Social DeFi Network",
    description: "Decentralized social platform where engagement earns rewards and governance power.",
    category: "Social",
    fundingGoal: "120 BNB",
    fundingRaised: "88 BNB",
    fundingPercentage: 73,
    nextMilestone: "Launch MVP",
    nextMilestoneDate: "Dec 18, 2025",
    totalPredictions: "412",
    confidence: 68,
  },
  {
    id: "6",
    name: "Cross-Chain Bridge",
    description: "Secure and fast bridge for transferring assets between BNB Chain and other networks.",
    category: "Infrastructure",
    fundingGoal: "250 BNB",
    fundingRaised: "180 BNB",
    fundingPercentage: 72,
    nextMilestone: "Security Audit Complete",
    nextMilestoneDate: "Dec 12, 2025",
    totalPredictions: "678",
    confidence: 89,
  },
];

const Projects = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Projects
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse projects, make predictions, and fund the future
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10 bg-muted/50 border-border/50"
              />
            </div>
            <Button variant="outline" size="lg">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Projects;