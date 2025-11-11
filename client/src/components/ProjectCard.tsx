import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  fundingGoal: string;
  fundingRaised: string;
  fundingPercentage: number;
  nextMilestone: string;
  nextMilestoneDate: string;
  totalPredictions: string;
  confidence: number;
}

export const ProjectCard = ({
  id,
  name,
  description,
  category,
  fundingGoal,
  fundingRaised,
  fundingPercentage,
  nextMilestone,
  nextMilestoneDate,
  totalPredictions,
  confidence,
}: ProjectCardProps) => {
  return (
    <Card className="group hover:shadow-card transition-all hover:border-primary/50 bg-gradient-card">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              {category}
            </Badge>
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Confidence</div>
            <div className={`text-2xl font-bold ${confidence > 60 ? 'text-success' : confidence > 40 ? 'text-warning' : 'text-destructive'}`}>
              {confidence}%
            </div>
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-semibold">{fundingRaised} / {fundingGoal}</span>
          </div>
          <Progress value={fundingPercentage} className="h-2" />
        </div>

        {/* Next Milestone */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Target className="w-5 h-5 text-accent mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Next Milestone</div>
            <div className="text-sm text-muted-foreground">{nextMilestone}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {nextMilestoneDate}
            </div>
          </div>
        </div>

        {/* Predictions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            {totalPredictions} predictions
          </div>
          <Link to={`/project/${id}`}>
            <Button variant="hero" size="sm">
              Predict Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
