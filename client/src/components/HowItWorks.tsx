import { Target, TrendingUp, DollarSign, Award } from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "Browse Projects",
    description: "Discover early-stage projects with defined milestones and funding goals.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Make Predictions",
    description: "Stake BNB on whether projects will hit their milestones. Back your conviction.",
    color: "text-accent",
  },
  {
    icon: DollarSign,
    title: "Fund Winners",
    description: "Losing bets automatically fund winning projects. No money wasted.",
    color: "text-warning",
  },
  {
    icon: Award,
    title: "Earn Rewards",
    description: "Top predictors earn BNB rewards + early token allocations in funded projects.",
    color: "text-success",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to predict, profit, and fund the future
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-gradient-card border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-background">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="mb-6">
                <step.icon className={`w-12 h-12 ${step.color} group-hover:scale-110 transition-transform`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
