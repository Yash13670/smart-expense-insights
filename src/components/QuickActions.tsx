import { Button } from "@/components/ui/button";
import { suggestedQuestions } from "@/data/sampleTransactions";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {suggestedQuestions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className={cn(
            "text-xs font-medium bg-gradient-to-r from-secondary/60 to-secondary/40 border-border/40",
            "transition-all duration-300 rounded-full px-4 py-2.5 h-auto relative overflow-hidden group shrink-0",
            "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
            "hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0",
            "animate-fade-in opacity-0",
            `stagger-${index + 1}`
          )}
          style={{ animationDelay: `${index * 0.08}s`, animationFillMode: "forwards" }}
        >
          {/* Hover gradient overlay */}
          <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Shimmer effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative z-10 group-hover:text-primary transition-colors duration-300">{question}</span>
        </Button>
      ))}
    </div>
  );
}
