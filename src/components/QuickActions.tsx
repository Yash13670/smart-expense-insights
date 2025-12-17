import { Button } from "@/components/ui/button";
import { suggestedQuestions } from "@/data/sampleTransactions";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestedQuestions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className={cn(
            "text-xs bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50",
            "transition-all duration-300 rounded-full px-4 py-2 h-auto",
            "hover:shadow-glow hover:scale-105 active:scale-95",
            "animate-fade-in opacity-0",
            `stagger-${index + 1}`
          )}
          style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
