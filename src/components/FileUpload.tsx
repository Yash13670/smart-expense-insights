import { useCallback, useState } from "react";
import { Upload, FileText, Check, X, FileSpreadsheet, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUpload: (csvData: string) => void;
  hasData: boolean;
}

export function FileUpload({ onUpload, hasData }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPDF, setPendingPDF] = useState<{ base64: string; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onUpload(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, [onUpload]);

  const processPDFWithPassword = useCallback(async (base64: string, pdfName: string, pdfPassword?: string) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing PDF...",
        description: pdfPassword ? "Unlocking and extracting transactions..." : "Using AI to extract transactions. This may take a moment.",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf-statement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            pdfBase64: base64,
            fileName: pdfName,
            password: pdfPassword
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.csvData) {
        onUpload(data.csvData);
        setFileName(pdfName);
        setPendingPDF(null);
        setPassword("");
        toast({
          title: "✅ PDF parsed successfully",
          description: `Extracted ${data.transactionCount} transactions from your bank statement.`,
        });
      } else if (data.error?.includes("password") || data.error?.includes("encrypted")) {
        // PDF is password protected, show password input
        setPendingPDF({ base64, name: pdfName });
        setFileName(pdfName);
        toast({
          title: "🔒 Password Required",
          description: "This PDF is password-protected. Enter your password below.",
        });
      } else {
        throw new Error(data.error || "Failed to extract transactions from PDF");
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "PDF Processing Failed",
        description: error instanceof Error ? error.message : "Could not extract transactions from PDF",
        variant: "destructive",
      });
      setFileName(null);
      setPendingPDF(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload, toast]);

  const handlePDFFile = useCallback(async (file: File) => {
    setFileName(file.name);
    
    try {
      // Convert PDF to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      bytes.forEach(byte => binary += String.fromCharCode(byte));
      const base64 = btoa(binary);

      // First try without password
      await processPDFWithPassword(base64, file.name);
    } catch (error) {
      console.error("Error reading PDF:", error);
      toast({
        title: "Error reading file",
        description: "Could not read the PDF file.",
        variant: "destructive",
      });
      setFileName(null);
    }
  }, [processPDFWithPassword, toast]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!pendingPDF || !password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter the PDF password.",
        variant: "destructive",
      });
      return;
    }
    await processPDFWithPassword(pendingPDF.base64, pendingPDF.name, password.trim());
  }, [pendingPDF, password, processPDFWithPassword, toast]);

  const handleFile = useCallback((file: File) => {
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isCSV = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");

    if (isPDF) {
      handlePDFFile(file);
    } else if (isCSV) {
      handleCSVFile(file);
    } else if (isExcel) {
      toast({
        title: "Excel not supported yet",
        description: "Please save your Excel file as CSV, or upload the PDF bank statement instead.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF bank statement or CSV file.",
        variant: "destructive",
      });
    }
  }, [handleCSVFile, handlePDFFile, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setPendingPDF(null);
    setPassword("");
  }, []);

  // Show password input dialog
  if (pendingPDF) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-lg animate-scale-in min-w-[280px]">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="w-5 h-5" />
          <span className="font-semibold text-sm">Password Protected PDF</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter password (usually FirstName + DOB like AMIT01011990)
        </p>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter PDF password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handlePasswordSubmit}
            disabled={!password.trim() || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Unlock & Process"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearFile}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl border border-primary/30 animate-pulse">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-sm text-foreground">Processing PDF...</span>
      </div>
    );
  }

  if (hasData && fileName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl border border-primary/30 animate-scale-in">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground truncate max-w-[120px]">{fileName}</span>
        <Check className="w-4 h-4 text-primary" />
        <button
          onClick={clearFile}
          className="ml-auto p-1 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-3 transition-all cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/10 scale-105"
          : "border-border hover:border-primary/50 hover:bg-secondary/30"
      )}
    >
      <input
        type="file"
        accept=".csv,.pdf"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
          isDragging ? "bg-primary text-primary-foreground" : "bg-secondary group-hover:bg-primary/20"
        )}>
          <Upload className={cn(
            "w-5 h-5 transition-colors",
            isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Upload Statement</p>
          <p className="text-xs text-muted-foreground">PDF (password-protected OK) or CSV</p>
        </div>
      </div>
    </div>
  );
}
