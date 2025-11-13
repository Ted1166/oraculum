import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { ACTIVE_CONTRACTS, PROJECT_REGISTRY_ABI } from "@/lib/contracts";
import { parseEther } from "viem";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

const CreateProject = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    fundingGoal: "",
    imageUrl: "",
    websiteUrl: "",
  });

  const [milestones, setMilestones] = useState([
    { description: "", targetDate: "", fundingTarget: "" }
  ]);

  const [estimatedGas, setEstimatedGas] = useState<string>("~0.01");

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const estimatedGasCost = () => {
    const baseCost = 0.003;
    const perMilestone = 0.002;
    const total = baseCost + (milestones.length * perMilestone);
    return total.toFixed(4);
  };

  useEffect(() => {
    setEstimatedGas(estimatedGasCost());
  }, [milestones.length]);

  const addMilestone = () => {
    setMilestones([...milestones, { description: "", targetDate: "", fundingTarget: "" }]);
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
        alert("Please connect your wallet first");
        return;
    }

    try {
        // Limit to MAX 3 milestones to reduce gas
        if (milestones.length > 3) {
        alert("Please limit to 3 milestones to reduce gas costs");
        return;
        }

        // Prepare milestone data
        const milestoneDescriptions = milestones.map(m => m.description);
        const milestoneDates = milestones.map(m => 
        Math.floor(new Date(m.targetDate).getTime() / 1000)
        );
        const milestoneFunding = milestones.map(m => 
        parseEther(m.fundingTarget || "0")
        );

        // Call submitProject with optimized gas
        await writeContractAsync({
        address: ACTIVE_CONTRACTS.ProjectRegistry as `0x${string}`,
        abi: PROJECT_REGISTRY_ABI,
        functionName: 'submitProject',
        args: [
            formData.name,
            formData.description,
            formData.category,
            formData.imageUrl || "", // Ensure no undefined values
            formData.websiteUrl || "",
            parseEther(formData.fundingGoal),
            milestoneDescriptions,
            milestoneDates,
            milestoneFunding,
        ],
        gas: 3000000n, // ✅ Reduced from 5M to 3M
        } as any);
    } catch (error: any) {
        console.error("Failed to create project:", error);
        
        // Better error messages
        if (error.message?.includes('insufficient funds')) {
        alert("Insufficient funds for gas. Get more tBNB from: https://testnet.bnbchain.org/faucet-smart");
        } else if (error.message?.includes('user rejected')) {
        alert("Transaction cancelled");
        } else {
        alert("Failed to create project. Check console for details.");
        }
    }
    };

  if (isSuccess) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Project Created Successfully! 🎉</h2>
            <p className="text-muted-foreground mb-8">
              Your project has been submitted to the blockchain.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="hero" onClick={() => navigate('/projects')}>
                View Projects
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="DeFi Yield Optimizer"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="DeFi, NFT, Gaming..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="fundingGoal">Funding Goal (ETH) *</Label>
                    <Input
                      id="fundingGoal"
                      type="number"
                      step="0.01"
                      required
                      value={formData.fundingGoal}
                      onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                      placeholder="10.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Milestones</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                    Add Milestone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border border-border/50 rounded-lg space-y-4">
                    <h3 className="font-semibold">Milestone {index + 1}</h3>
                    
                    <div>
                      <Label>Description *</Label>
                      <Input
                        required
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Launch Beta on Testnet"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Target Date *</Label>
                        <Input
                          type="date"
                          required
                          value={milestone.targetDate}
                          onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Funding Target (ETH) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={milestone.fundingTarget}
                          onChange={(e) => updateMilestone(index, 'fundingTarget', e.target.value)}
                          placeholder="2.0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

             {/*CARD*/}
            <Card className="bg-warning/10 border-warning/50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="text-warning">⚠️</div>
                  <div>
                    <p className="font-semibold">Estimated Gas Cost</p>
                    <p className="text-sm text-muted-foreground">
                      ~{estimatedGas} tBNB ({milestones.length} milestone{milestones.length !== 1 ? 's' : ''})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit to 1-3 milestones to save gas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="flex-1"
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isPending ? 'Confirming...' : 'Creating...'}
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/projects')}
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