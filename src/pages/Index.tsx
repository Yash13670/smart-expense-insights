import { ExpenseChat } from "@/components/ExpenseChat";
import { StatsCard } from "@/components/StatsCard";
import { Wallet, TrendingUp, CreditCard, PieChart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">AI-Powered Analysis</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
            AI Expense <span className="gradient-text">Assistant</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your transactions and ask natural language questions about your spending habits.
            Get instant insights powered by AI.
          </p>
        </header>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatsCard
            title="Smart Analysis"
            value="100%"
            subtitle="Calculation accuracy"
            icon={TrendingUp}
            trend="up"
          />
          <StatsCard
            title="Categories"
            value="Auto"
            subtitle="Detected from CSV"
            icon={PieChart}
            trend="neutral"
          />
          <StatsCard
            title="Questions"
            value="∞"
            subtitle="Ask anything"
            icon={Wallet}
            trend="neutral"
          />
          <StatsCard
            title="Privacy"
            value="100%"
            subtitle="Data stays local"
            icon={CreditCard}
            trend="up"
          />
        </div>

        {/* Main chat interface */}
        <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
          <ExpenseChat />
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Built for hackathon demos • No data stored on servers • AI explanations only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
