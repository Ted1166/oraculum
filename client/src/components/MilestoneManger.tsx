import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, MessageSquare, Upload, Loader2 } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { ACTIVE_CONTRACTS, PROJECT_REGISTRY_ABI, PREDICTION_MARKET_ABI } from '@/lib/contracts';

interface MilestoneManagerProps {
  projectId: number;
  milestone: any;
  milestoneIndex: number;
  isOwner: boolean;
}

export function MilestoneManager({ projectId, milestone, milestoneIndex, isOwner }: MilestoneManagerProps) {
  const [updateText, setUpdateText] = useState('');
  const publicClient = usePublicClient();
  const [showResolve, setShowResolve] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  
  const { writeContractAsync: resolveMilestone, isPending: isResolving } = useWriteContract();
  const { writeContractAsync: resolveMarket, isPending: isResolvingMarket } = useWriteContract();

  // Post update to milestone
  const handlePostUpdate = async () => {
    if (!updateText.trim()) return;

    try {
      // Store update in localStorage (in production, use a backend)
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

  // Resolve milestone as achieved or failed
  const handleResolveMilestone = async (achieved: boolean) => {
    if (!isOwner) {
      alert('Only the project owner can resolve milestones');
      return;
    }

    try {
      // 1. Resolve milestone in ProjectRegistry
      await resolveMilestone({
        address: ACTIVE_CONTRACTS.ProjectRegistry,
        abi: PROJECT_REGISTRY_ABI,
        functionName: 'resolveMilestone',
        args: [
          BigInt(projectId),
          BigInt(milestone.id),
          achieved
        ],
      }as any);

      // 2. Resolve prediction market
      // First get the market ID
      const marketId = await publicClient.readContract({
        address: ACTIVE_CONTRACTS.PredictionMarket,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'projectMilestoneMarket',
        args: [BigInt(projectId), BigInt(milestoneIndex)],
      }as any);

      if (marketId && marketId !== 0n) {
        await resolveMarket({
          address: ACTIVE_CONTRACTS.PredictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'resolveMarket',
          args: [marketId, achieved],
        }as any);
      }

      alert(`✅ Milestone resolved as ${achieved ? 'ACHIEVED' : 'FAILED'}`);
      setShowResolve(false);
    } catch (error: any) {
      console.error('Error resolving milestone:', error);
      alert(`Failed to resolve milestone: ${error.message}`);
    }
  };

  return (
    <Card className="bg-gradient-card border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {milestone.isResolved ? (
              milestone.outcomeAchieved ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
            {milestone.description}
          </CardTitle>
          <Badge variant={milestone.isResolved ? "default" : "secondary"}>
            {milestone.isResolved 
              ? (milestone.outcomeAchieved ? 'Achieved' : 'Failed')
              : 'In Progress'
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Target Date: {new Date(Number(milestone.targetDate) * 1000).toLocaleDateString()}</p>
          {milestone.isResolved && (
            <p>Resolved: {new Date(Number(milestone.resolutionDate) * 1000).toLocaleDateString()}</p>
          )}
        </div>

        {/* Owner Actions */}
        {isOwner && !milestone.isResolved && (
          <div className="space-y-3 p-4 bg-primary/5 border border-primary/30 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Post Update
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
                <Upload className="w-4 h-4 mr-2" />
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
                  disabled={isResolving || isResolvingMarket}
                  className="flex-1 bg-success hover:bg-success/80"
                  size="sm"
                >
                  {isResolving || isResolvingMarket ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Achieved
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleResolveMilestone(false)}
                  disabled={isResolving || isResolvingMarket}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  {isResolving || isResolvingMarket ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark as Failed
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Updates Feed */}
        <MilestoneUpdatesFeed projectId={projectId} milestoneIndex={milestoneIndex} />
      </CardContent>
    </Card>
  );
}

// Component to display milestone updates
function MilestoneUpdatesFeed({ projectId, milestoneIndex }: { projectId: number; milestoneIndex: number }) {
  const [updates, setUpdates] = useState<any[]>([]);

  React.useEffect(() => {
    const updatesKey = `milestone_updates_${projectId}_${milestoneIndex}`;
    const stored = localStorage.getItem(updatesKey);
    if (stored) {
      setUpdates(JSON.parse(stored).reverse());
    }
  }, [projectId, milestoneIndex]);

  if (updates.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No updates yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Updates</h4>
      {updates.map((update, idx) => (
        <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
          <p className="mb-2">{update.text}</p>
          {update.proofUrl && (
            <a 
              href={update.proofUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              📎 View Proof
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(update.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}