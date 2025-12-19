import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  delay?: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className, delay = 0 }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "glass-card p-5 stat-card animate-scale-in opacity-0 group cursor-default relative overflow-hidden",
        "hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-500 ease-out",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Decorative corner accent */}
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium group-hover:text-primary/70 transition-colors duration-300">{title}</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1.5 group-hover:gradient-text transition-all duration-300">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-1.5 font-medium transition-all duration-300",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-glow transition-all duration-500 relative overflow-hidden">
          {/* Icon shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Icon className="w-6 h-6 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
