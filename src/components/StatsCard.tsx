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
        "glass-card p-4 stat-card animate-scale-in opacity-0 group hover:scale-105 transition-transform cursor-default",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{title}</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1 group-hover:gradient-text transition-all">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
