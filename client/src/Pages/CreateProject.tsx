import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import { ACTIVE_CONTRACTS, PROJECT_REGISTRY_ABI, PREDICTION_MARKET_ABI } from "@/lib/contracts";
import { parseEther } from "viem";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const LISTING_FEE = "0.001"; // 0.001 BNB listing fee

const CreateProject = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    fundingGoal: "",
    logoUrl: "",
  });

  const [milestones, setMilestones] = useState([
    { description: "", targetDate: "" },
  ]);

  const [creationStep, setCreationStep] = useState<'idle' | 'creating-project' | 'creating-markets' | 'complete'>('idle');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [marketCreationProgress, setMarketCreationProgress] = useState({ current: 0, total: 0 });

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Log transaction errors
  useEffect(() => {
    if (isTxError && txError) {
      console.error("❌ Transaction receipt error:", txError);
      alert(
        `Transaction failed on-chain. Check console for details.\n\nView on BSCScan: https://testnet.bscscan.com/tx/${hash}`
      );
    }
  }, [isTxError, txError, hash]);

  const addMilestone = () => {
    if (milestones.length >= 3) {
      alert("Maximum 3 milestones to reduce gas costs");
      return;
    }
    setMilestones([...milestones, { description: "", targetDate: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length === 1) {
      alert("At least 1 milestone is required");
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  /**
   * ✅ NEW - Auto-create prediction markets after project creation
   */
  const createPredictionMarkets = async (projectId: number, projectOwner: string) => {
    if (!publicClient) {
      console.error("No public client available");
      return;
    }

    setCreationStep('creating-markets');
    setMarketCreationProgress({ current: 0, total: milestones.length });

    console.log(`🏗️ Creating ${milestones.length} prediction markets for project ${projectId}...`);

    for (let i = 0; i < milestones.length; i++) {
      try {
        console.log(`Creating market for milestone ${i}...`);
        
        // Calculate days until milestone
        const milestoneDate = new Date(milestones[i].targetDate);
        const now = new Date();
        const daysUntilMilestone = Math.max(
          7, // Minimum 7 days betting period
          Math.ceil((milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );

        const marketTx = await writeContractAsync({
          address: ACTIVE_CONTRACTS.PredictionMarket as `0x${string}`,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'createMarket',
          args: [
            BigInt(projectId),
            BigInt(i), // milestone index
            projectOwner as `0x${string}`,
            BigInt(Math.min(daysUntilMilestone, 365)) // Cap at 365 days
          ],
          gas: 300000n,
        } as any);

        console.log(`✅ Market ${i} created:`, marketTx);
        
        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: marketTx });
        
        setMarketCreationProgress({ current: i + 1, total: milestones.length });
        
        // Small delay between markets to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to create market for milestone ${i}:`, error);
        alert(`Warning: Failed to create prediction market for milestone ${i + 1}. You can create it manually later.`);
      }
    }

    setCreationStep('complete');
    console.log('✅ All prediction markets created successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setCreationStep('creating-project');
      
      // Limit milestones to 3
      if (milestones.length > 3) {
        alert("Maximum 3 milestones allowed to reduce gas costs");
        return;
      }

      // Validate all fields
      if (
        !formData.name ||
        !formData.description ||
        !formData.category ||
        !formData.fundingGoal
      ) {
        alert("Please fill in all required fields");
        setCreationStep('idle');
        return;
      }

      // Validate milestones
      for (const milestone of milestones) {
        if (!milestone.description || !milestone.targetDate) {
          alert("Please fill in all milestone fields");
          setCreationStep('idle');
          return;
        }
      }

      // Prepare milestone data
      const milestoneDescriptions = milestones.map((m) => m.description);
      const milestoneDates = milestones.map((m) =>
        BigInt(Math.floor(new Date(m.targetDate).getTime() / 1000))
      );

      // Validate future dates
      const now = Math.floor(Date.now() / 1000);
      for (const date of milestoneDates) {
        if (date <= now) {
          alert("All milestone dates must be in the future");
          setCreationStep('idle');
          return;
        }
      }

      // Calculate funding goal
      const fundingGoal = parseEther(formData.fundingGoal);

      console.log("📝 Submitting project...");

      // ✅ Create project
      const tx = await writeContractAsync({
        address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
        abi: PROJECT_REGISTRY_ABI,
        functionName: "submitProject",
        args: [
          formData.name,
          formData.description,
          formData.category,
          formData.logoUrl || "",
          fundingGoal,
          milestoneDescriptions,
          milestoneDates,
        ],
        value: parseEther(LISTING_FEE),
        gas: 1000000n,
      } as any);

      console.log("✅ Project transaction submitted:", tx);
      
      // Wait for project creation to be confirmed
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log("✅ Project creation confirmed:", receipt);

        // Parse the ProjectSubmitted event to get the project ID
        const projectSubmittedEvent = receipt.logs.find((log: any) => {
          try {
            // ProjectSubmitted event signature
            return log.topics[0] === '0x...' // You'll need to add the event signature
          } catch {
            return false;
          }
        });

        // For now, we'll fetch the total projects count and use that as the ID
        // In production, parse the event properly
        const totalProjects = await publicClient.readContract({
          address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
          abi: PROJECT_REGISTRY_ABI,
          functionName: 'getTotalProjects',
        } as any) as bigint;

        const projectId = Number(totalProjects);
        setCreatedProjectId(projectId);

        console.log(`🎉 Project created with ID: ${projectId}`);

        // ✅ NOW CREATE PREDICTION MARKETS
        await createPredictionMarkets(projectId, address);
      }

    } catch (error: any) {
      console.error("❌ Transaction failed:", error);
      setCreationStep('idle');

      const errorMsg = error.message || error.toString();

      if (errorMsg.includes("insufficient funds") || errorMsg.includes("exceeds balance")) {
        alert(
          `❌ Insufficient Balance\n\nYou need at least 0.15 tBNB:\n• 0.001 tBNB listing fee\n• ~0.05 tBNB for gas\n\nGet more from: https://testnet.bnbchain.org/faucet-smart`
        );
      } else if (errorMsg.includes("user rejected") || errorMsg.includes("User denied")) {
        alert("Transaction cancelled by user");
      } else {
        alert(`❌ Transaction Failed\n\n${errorMsg.substring(0, 200)}\n\nCheck browser console for details.`);
      }
    }
  };

  // Success state
  if (creationStep === 'complete' && createdProjectId) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Project Created Successfully! 🎉
            </h2>
            <p className="text-muted-foreground mb-4">
              Your project and {milestones.length} prediction markets have been created.
            </p>
            <div className="bg-primary/10 border border-primary/50 rounded-lg p-4 mb-8">
              <p className="text-sm font-medium">Project ID: {createdProjectId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                ✅ {milestones.length} prediction markets created
              </p>
              <p className="text-xs text-muted-foreground">
                Users can now place bets on your milestones!
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="hero" onClick={() => navigate(`/project/${createdProjectId}`)}>
                View Project
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Create Another
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state - Creating project or markets
  if (creationStep !== 'idle') {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            
            {creationStep === 'creating-project' && (
              <>
                <h2 className="text-3xl font-bold mb-4">Creating Project...</h2>
                <p className="text-muted-foreground">
                  Please confirm the transaction in your wallet
                </p>
              </>
            )}
            
            {creationStep === 'creating-markets' && (
              <>
                <h2 className="text-3xl font-bold mb-4">Creating Prediction Markets</h2>
                <p className="text-muted-foreground mb-4">
                  Setting up betting markets for your milestones...
                </p>
                <div className="bg-gray-800/50 rounded-lg p-6 max-w-md mx-auto">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {marketCreationProgress.current} / {marketCreationProgress.total}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Markets created
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(marketCreationProgress.current / marketCreationProgress.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  ⏳ This may take a few moments. Please don't close this window.
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to create a project.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Create New Project</h1>
            <p className="text-xl text-muted-foreground">
              Submit your project for community predictions and funding
            </p>
          </div>

          {/* Important Notice */}
          <Card className="bg-blue-500/10 border-blue-500/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">Prediction Markets Will Be Auto-Created</h3>
                  <p className="text-sm text-gray-300">
                    After creating your project, prediction markets will be automatically created for each milestone. 
                    This allows the community to bet on your success immediately!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card className="bg-gradient-card mb-6">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="DeFi Yield Optimizer"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your project..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="DeFi, NFT, Gaming..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="fundingGoal">Funding Goal (BNB) *</Label>
                    <Input
                      id="fundingGoal"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.fundingGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fundingGoal: e.target.value,
                        })
                      }
                      placeholder="10.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Milestones (Max 3)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                    disabled={milestones.length >= 3}
                  >
                    Add Milestone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border/50 rounded-lg space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Milestone {index + 1}</h3>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label>Description *</Label>
                      <Input
                        required
                        value={milestone.description}
                        onChange={(e) =>
                          updateMilestone(index, "description", e.target.value)
                        }
                        placeholder="Launch Beta on Testnet"
                      />
                    </div>

                    <div>
                      <Label>Target Date *</Label>
                      <Input
                        type="date"
                        required
                        value={milestone.targetDate}
                        onChange={(e) =>
                          updateMilestone(index, "targetDate", e.target.value)
                        }
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/10 border-primary/50 mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Listing Fee:</span>
                    <span>{LISTING_FEE} tBNB</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated Gas:</span>
                    <span>~0.005 tBNB</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Cost:</span>
                    <span>
                      ~{(parseFloat(LISTING_FEE) + 0.005).toFixed(3)} tBNB
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Make sure you have at least 0.02 tBNB in your wallet for project + markets
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="flex-1"
                disabled={isPending || isConfirming || creationStep !== 'idle'}
              >
                {creationStep !== 'idle' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Create Project + Markets (${LISTING_FEE} tBNB)`
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/projects")}
                disabled={creationStep !== 'idle'}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateProject;