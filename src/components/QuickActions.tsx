import { Button } from "@/components/ui/button";
import { suggestedQuestions } from "@/data/sampleTransactions";

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
          className="text-xs bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50 transition-all rounded-full px-3 py-1 h-auto"
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
