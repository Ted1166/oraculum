import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEther } from "viem";

export interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  fundingGoal: bigint;
  fundingRaised: bigint;
  totalPredictions: bigint;
  confidence: number;
}

export const ProjectCard = ({
  id,
  name,
  description,
  category,
  fundingGoal,
  fundingRaised,
  totalPredictions,
  confidence,
}: ProjectCardProps) => {
  const fundingPercentage = fundingGoal > 0n 
    ? Number((fundingRaised * 100n) / fundingGoal)
    : 0;

  return (
    <Card className="bg-gradient-card hover:border-primary/50 transition-all group">
      <CardContent className="pt-6 space-y-4">
        {/* Category Badge */}
        <Badge variant="secondary" className="mb-2">
          {category}
        </Badge>

        {/* Project Title */}
        <Link to={`/project/${id}`}>
          <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-muted-foreground line-clamp-2 min-h-[3rem]">
          {description}
        </p>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-semibold">
              {formatEther(fundingRaised)} / {formatEther(fundingGoal)} BNB
            </span>
          </div>
          <Progress value={fundingPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="font-bold text-success text-lg">{confidence}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Predictors</div>
              <div className="font-bold text-lg">{Number(totalPredictions)}</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link to={`/project/${id}`}>
          <Button variant="hero" size="lg" className="w-full mt-4">
            Predict Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};