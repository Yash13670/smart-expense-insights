import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (csvData: string) => void;
  hasData: boolean;
}

export function FileUpload({ onUpload, hasData }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onUpload(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, [onUpload]);

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

  if (hasData && fileName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground truncate max-w-[150px]">{fileName}</span>
        <Check className="w-4 h-4 text-primary" />
        <button
          onClick={clearFile}
          className="ml-auto p-1 hover:bg-secondary rounded transition-colors"
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
        "relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-secondary/30"
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-2 text-center">
        <Upload className={cn(
          "w-6 h-6 transition-colors",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
        <div>
          <p className="text-sm font-medium text-foreground">Upload CSV</p>
          <p className="text-xs text-muted-foreground">Drag & drop or click</p>
        </div>
      </div>
    </div>
  );
}
