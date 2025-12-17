import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-foreground" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] text-sm leading-relaxed",
          isUser ? "chat-bubble-user" : "chat-bubble-assistant"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <div className="pulse-dot" style={{ animationDelay: "0ms" }} />
            <div className="pulse-dot" style={{ animationDelay: "150ms" }} />
            <div className="pulse-dot" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
