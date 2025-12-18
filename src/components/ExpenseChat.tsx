import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import { FileUpload } from "./FileUpload";
import { Button } from "@/components/ui/button";
import { sampleCSV } from "@/data/sampleTransactions";
import { Sparkles, Database, IndianRupee, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  analysis?: {
    type: string;
    data: Record<string, unknown>;
  };
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
      title: "✅ Sample data loaded",
      description: "34 transactions in INR loaded. Try asking a question!",
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
        analysis: data.analysis,
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow animate-glow-pulse">
              <IndianRupee className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-success-foreground" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">AI Expense Assistant</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Powered by AI • Indian Rupees
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FileUpload onUpload={setCsvData} hasData={!!csvData} />
          {!csvData && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleData}
              className="gap-2 rounded-xl border-border/50 hover:border-primary/50 hover:bg-secondary transition-all interactive-btn"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Load Sample</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center animate-bounce">
                <span className="text-xs">🇮🇳</span>
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">
              Welcome! <span className="gradient-text">नमस्ते</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
              Upload your bank statement <strong className="text-foreground">PDF or CSV</strong> to get AI-powered insights about your spending in <strong className="text-foreground">Indian Rupees</strong>.
            </p>
            {csvData && (
              <div className="w-full max-w-lg animate-fade-in">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Try these questions</p>
                <QuickActions onSelect={analyzeExpenses} disabled={isLoading} />
              </div>
            )}
            {!csvData && (
              <div className="flex gap-3 animate-fade-in">
                <Button 
                  onClick={loadSampleData}
                  className="gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow interactive-btn"
                >
                  <Database className="w-4 h-4" />
                  Load Sample Data
                </Button>
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
                analysis={message.analysis}
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
        <div className="px-5 py-3 border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <QuickActions onSelect={analyzeExpenses} disabled={isLoading} />
        </div>
      )}

      {/* Input */}
      <div className="p-5 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <ChatInput
          onSend={analyzeExpenses}
          disabled={isLoading || !csvData}
          placeholder={csvData ? "Ask about your expenses in ₹..." : "Load data first to start chatting"}
        />
      </div>
    </div>
  );
}
