import { useCallback, useState } from "react";
import { Upload, FileText, Check, X, FileSpreadsheet } from "lucide-react";
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
        accept=".csv"
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
          <p className="text-sm font-medium text-foreground">Upload CSV</p>
          <p className="text-xs text-muted-foreground">Drag or click</p>
        </div>
      </div>
    </div>
  );
}
