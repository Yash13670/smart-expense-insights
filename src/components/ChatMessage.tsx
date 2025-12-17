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
        "flex gap-4 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110",
          isUser 
            ? "bg-gradient-to-br from-primary to-primary/80 shadow-glow" 
            : "bg-secondary border border-border/50"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Bot className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className={cn("max-w-[85%] space-y-3", isUser && "text-right")}>
        <div
          className={cn(
            "text-sm leading-relaxed",
            isUser ? "chat-bubble-user" : "chat-bubble-assistant"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="pulse-dot" style={{ animationDelay: "0ms" }} />
              <div className="pulse-dot" style={{ animationDelay: "200ms" }} />
              <div className="pulse-dot" style={{ animationDelay: "400ms" }} />
              <span className="text-xs text-muted-foreground ml-2">Analyzing...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
        
        {/* Interactive Charts */}
        {!isUser && analysis && !isLoading && (
          <SpendingChart analysis={analysis} />
        )}
      </div>
    </div>
  );
}
