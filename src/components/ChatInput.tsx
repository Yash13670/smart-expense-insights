import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Ask about your expenses..." }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={cn(
        "relative flex items-center gap-2 p-1 rounded-2xl transition-all duration-300",
        isFocused 
          ? "bg-secondary/80 shadow-glow ring-2 ring-primary/30" 
          : "bg-input border border-border"
      )}>
        <div className="flex-1 flex items-center gap-2 px-3">
          <Sparkles className={cn(
            "w-4 h-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          className={cn(
            "px-4 py-2 rounded-xl transition-all duration-300 interactive-btn",
            input.trim() 
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
