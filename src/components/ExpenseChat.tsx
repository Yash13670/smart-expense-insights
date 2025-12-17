import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import { FileUpload } from "./FileUpload";
import { Button } from "@/components/ui/button";
import { sampleCSV } from "@/data/sampleTransactions";
import { Sparkles, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ExpenseChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSampleData = () => {
    setCsvData(sampleCSV);
    toast({
      title: "Sample data loaded",
      description: "34 transactions loaded. Try asking a question!",
    });
  };

  const analyzeExpenses = async (question: string) => {
    if (!csvData) {
      toast({
        title: "No data loaded",
        description: "Please upload a CSV file or load sample data first.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ csvData, question }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze expenses");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error analyzing expenses:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze expenses",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error while analyzing your expenses. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-effect">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">AI Expense Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask questions about your spending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileUpload onUpload={setCsvData} hasData={!!csvData} />
          {!csvData && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleData}
              className="text-xs gap-1.5 rounded-lg"
            >
              <Database className="w-3.5 h-3.5" />
              Load Sample
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 glow-effect">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Welcome to AI Expense Assistant
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Upload your transaction CSV or load sample data, then ask questions about your spending patterns.
            </p>
            {csvData && (
              <div className="w-full max-w-md">
                <p className="text-xs text-muted-foreground mb-3">Try these questions:</p>
                <QuickActions onSelect={analyzeExpenses} disabled={isLoading} />
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && (
              <ChatMessage role="assistant" content="" isLoading />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && csvData && !isLoading && (
        <div className="px-4 py-2 border-t border-border">
          <QuickActions onSelect={analyzeExpenses} disabled={isLoading} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <ChatInput
          onSend={analyzeExpenses}
          disabled={isLoading || !csvData}
          placeholder={csvData ? "Ask about your expenses..." : "Load data first to start chatting"}
        />
      </div>
    </div>
  );
}
