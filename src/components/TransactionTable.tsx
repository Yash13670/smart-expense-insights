import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface TransactionTableProps {
  csvData: string;
  isOpen: boolean;
  onToggle: () => void;
}

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Shopping": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Transport": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Entertainment": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Utilities": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Healthcare": "bg-red-500/20 text-red-300 border-red-500/30",
  "Education": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Investment": "bg-green-500/20 text-green-300 border-green-500/30",
  "Transfer": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Other": "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

function parseCSVToTransactions(csvData: string): Transaction[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  const transactions: Transaction[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 4) {
      const amount = parseFloat(values[3].replace(/[₹,]/g, ''));
      if (!isNaN(amount) && amount > 0) {
        transactions.push({
          date: values[0],
          description: values[1],
          category: values[2] || 'Other',
          amount: amount,
        });
      }
    }
  }

  return transactions;
}

export function TransactionTable({ csvData, isOpen, onToggle }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const transactions = parseCSVToTransactions(csvData);
  
  const filteredTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (!csvData) return null;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-foreground truncate">
            Transaction History
          </span>
          <Badge variant="secondary" className="text-[10px] sm:text-xs whitespace-nowrap">
            {transactions.length} transactions
          </Badge>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border/50">
          <div className="p-3 sm:p-4 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[380px] sm:max-h-[400px] overflow-auto">
            <Table className="min-w-[640px]">
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow key={index} className="border-border/20 hover:bg-muted/20">
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.date}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${categoryColors[transaction.category] || categoryColors['Other']}`}
                      >
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-foreground">
                      ₹{transaction.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 sm:p-4 border-t border-border/30 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {searchTerm ? `${filteredTransactions.length} of ${transactions.length}` : `${transactions.length}`} transactions
              </span>
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Total: ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
