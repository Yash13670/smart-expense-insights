import { ExpenseChat } from "@/components/ExpenseChat";
import { StatsCard } from "@/components/StatsCard";
import { IndianRupee, ShieldCheck, Zap, Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Finance Analysis</span>
            <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-accent/20 text-accent font-semibold">BETA</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight">
            AI Expense <span className="gradient-text">Assistant</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            Upload your bank transactions and ask natural language questions.
            Get instant insights powered by AI in <strong className="text-foreground">₹ Indian Rupees</strong>.
          </p>
        </header>

        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatsCard
            title="Smart Analysis"
            value="100%"
            subtitle="Calculation accuracy"
            icon={Brain}
            trend="up"
            delay={100}
          />
          <StatsCard
            title="Currency"
            value="₹ INR"
            subtitle="Indian Rupees"
            icon={IndianRupee}
            trend="neutral"
            delay={200}
          />
          <StatsCard
            title="AI Powered"
            value="Instant"
            subtitle="Real-time insights"
            icon={Zap}
            trend="up"
            delay={300}
          />
          <StatsCard
            title="Privacy"
            value="100%"
            subtitle="Data stays secure"
            icon={ShieldCheck}
            trend="up"
            delay={400}
          />
        </div>

        {/* Main chat interface */}
        <div
          className="glass-card-elevated overflow-hidden animate-scale-in opacity-0 h-[78svh] min-h-[460px] sm:h-[calc(100dvh-360px)] sm:min-h-[520px] lg:min-h-[550px]"
          style={{ 
            animationDelay: "500ms",
            animationFillMode: "forwards"
          }}
        >
          <ExpenseChat />
        </div>

        {/* Footer */}
        <footer className="mt-5 sm:mt-6 text-center animate-fade-in" style={{ animationDelay: "600ms" }}>
          <p className="text-xs text-muted-foreground">
            Built for hackathons • No data stored on servers • AI explanations only • Made with ❤️ in India
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
