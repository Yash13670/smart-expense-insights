import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { SpendingChart } from "./SpendingChart";

interface AnalysisData {
  categories?: Array<{ category: string; amount: number; percentage: number }>;
  topCategories?: Array<{ category: string; amount: number; percentage: number }>;
  totalSpending?: number;
  monthlyTotal?: number;
  weeklyTotal?: number;
  dailyAvg?: number;
  transactionCount?: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  analysis?: {
    type: string;
    data: AnalysisData;
  };
}

export function ChatMessage({ role, content, isLoading, analysis }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-4 animate-slide-up group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative overflow-hidden",
          isUser 
            ? "bg-gradient-to-br from-primary to-primary/70 shadow-glow" 
            : "bg-gradient-to-br from-secondary to-secondary/80 border border-border/30 hover:border-primary/30"
        )}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground relative z-10" />
        ) : (
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary relative z-10 group-hover:animate-pulse" />
        )}
      </div>
      <div className={cn("max-w-[92%] sm:max-w-[85%] space-y-3", isUser && "text-right")}>
        <div
          className={cn(
            "text-sm leading-relaxed transition-all duration-300 hover:shadow-lg",
            isUser ? "chat-bubble-user" : "chat-bubble-assistant"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-3 py-2 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-muted-foreground animate-pulse">Analyzing your expenses...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
        
        {/* Interactive Charts */}
        {!isUser && analysis && !isLoading && (
          <div className="animate-fade-in">
            <SpendingChart analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}
