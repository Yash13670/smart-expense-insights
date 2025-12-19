import { useCallback, useState } from "react";
import { Upload, FileText, Check, X, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (csvData: string) => void;
  hasData: boolean;
}

export function FileUpload({ onUpload, hasData }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const processPDF = useCallback(async (base64: string, pdfName: string) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing PDF...",
        description: "Using AI to extract transactions. This may take a moment.",
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
            fileName: pdfName
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.csvData) {
        onUpload(data.csvData);
        setFileName(pdfName);
        toast({
          title: "✅ PDF parsed successfully",
          description: `Extracted ${data.transactionCount} transactions from your bank statement.`,
        });
      } else if (data.error?.includes("password") || data.error?.includes("unlock") || data.error?.includes("protected")) {
        // PDF is password protected - guide user to unlock it externally
        toast({
          title: "🔒 Password-Protected PDF",
          description: "Please unlock your PDF first at ilovepdf.com/unlock_pdf, then upload the unlocked version.",
          variant: "destructive",
        });
        setFileName(null);
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

      await processPDF(base64, file.name);
    } catch (error) {
      console.error("Error reading PDF:", error);
      toast({
        title: "Error reading file",
        description: "Could not read the PDF file.",
        variant: "destructive",
      });
      setFileName(null);
    }
  }, [processPDF, toast]);

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
  }, []);

  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 rounded-xl border border-primary/40 shadow-glow animate-pulse relative overflow-hidden">
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
        <div className="relative">
          <span className="text-sm font-medium text-foreground">Processing PDF</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
            Extracting transactions...
          </span>
        </div>
      </div>
    );
  }

  if (hasData && fileName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-success/15 to-primary/15 rounded-xl border border-success/40 animate-scale-in group hover:shadow-glow hover:border-success/60 transition-all duration-300">
        <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
        </div>
        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{fileName}</span>
        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center animate-pulse">
          <Check className="w-3 h-3 text-success" />
        </div>
        <button
          onClick={clearFile}
          className="ml-auto p-1.5 hover:bg-destructive/20 rounded-lg transition-all duration-300 hover:scale-110 group/close"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground group-hover/close:text-destructive transition-colors" />
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
        "relative border-2 border-dashed rounded-xl p-3 transition-all duration-300 cursor-pointer group overflow-hidden",
        isDragging
          ? "border-primary bg-primary/15 scale-[1.02] shadow-glow"
          : "border-border/60 hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 hover:shadow-lg"
      )}
    >
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 transition-opacity duration-500",
        isDragging && "opacity-100 animate-pulse"
      )} />
      
      <input
        type="file"
        accept=".csv,.pdf"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex items-center gap-3 relative">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
          isDragging 
            ? "bg-primary text-primary-foreground shadow-glow scale-110" 
            : "bg-secondary/80 group-hover:bg-primary/20 group-hover:scale-105"
        )}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Upload className={cn(
            "w-5 h-5 transition-all duration-300 relative z-10",
            isDragging 
              ? "text-primary-foreground animate-bounce" 
              : "text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5"
          )} />
        </div>
        <div className="transition-all duration-300 group-hover:translate-x-0.5">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            Upload Statement
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            <span>PDF or CSV</span>
          </p>
        </div>
      </div>
    </div>
  );
}