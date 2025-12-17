import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { categoryColors } from "@/data/sampleTransactions";
import { IndianRupee, TrendingUp, Trophy } from "lucide-react";

interface AnalysisData {
  categories?: Array<{ category: string; amount: number; percentage: number }>;
  topCategories?: Array<{ category: string; amount: number; percentage: number }>;
  totalSpending?: number;
  monthlyTotal?: number;
  weeklyTotal?: number;
  dailyAvg?: number;
  transactionCount?: number;
}

interface SpendingChartProps {
  analysis: {
    type: string;
    data: AnalysisData;
  };
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border rounded-lg px-3 py-2 shadow-elevated">
        <p className="text-xs font-medium text-foreground">{data.category || data.name}</p>
        <p className="text-sm font-bold text-primary">{formatINR(data.amount || data.value)}</p>
        {data.percentage && (
          <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
        )}
      </div>
    );
  }
  return null;
};

export function SpendingChart({ analysis }: SpendingChartProps) {
  const { type, data } = analysis;

  // Category breakdown - Pie Chart
  if (type === "category" && data.categories) {
    const chartData = data.categories.map(cat => ({
      name: cat.category,
      value: cat.amount,
      percentage: cat.percentage,
      fill: categoryColors[cat.category] || "#6b7280",
    }));

    return (
      <div className="glass-card p-4 animate-scale-in mt-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <h4 className="font-display font-semibold text-sm">Category Breakdown</h4>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-2">
            {chartData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 group cursor-pointer">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
                <span className="text-xs font-medium text-foreground">{formatINR(item.value)}</span>
                <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Top categories - Bar Chart
  if (type === "top" && data.topCategories) {
    const chartData = data.topCategories.map((cat, idx) => ({
      category: cat.category,
      amount: cat.amount,
      percentage: cat.percentage,
      fill: categoryColors[cat.category] || "#6b7280",
      rank: idx + 1,
    }));

    return (
      <div className="glass-card p-4 animate-scale-in mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <h4 className="font-display font-semibold text-sm">Top Spending Categories</h4>
        </div>
        <div className="space-y-3">
          {chartData.map((item, idx) => (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${idx === 0 ? 'text-warning' : idx === 1 ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    #{item.rank}
                  </span>
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                </div>
                <span className="text-sm font-bold text-primary">{formatINR(item.amount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.fill,
                    boxShadow: `0 0 10px ${item.fill}50`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Insight view with stats
  if (type === "insight" && data.categories) {
    const categories = data.categories;
    
    return (
      <div className="glass-card p-4 animate-scale-in mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center animate-glow-pulse">
            <IndianRupee className="w-4 h-4 text-primary" />
          </div>
          <h4 className="font-display font-semibold text-sm">Spending Insights</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Monthly</p>
            <p className="text-lg font-bold gradient-text">{formatINR(data.monthlyTotal as number)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Weekly</p>
            <p className="text-lg font-bold text-foreground">{formatINR(data.weeklyTotal as number)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Daily Avg</p>
            <p className="text-lg font-bold text-foreground">{formatINR(data.dailyAvg as number)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {categories.slice(0, 4).map((cat, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryColors[cat.category] || "#6b7280" }}
              />
              <span className="text-xs text-muted-foreground flex-1">{cat.category}</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${cat.percentage}%`,
                    backgroundColor: categoryColors[cat.category] || "#6b7280"
                  }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-16 text-right">{formatINR(cat.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Overview with mini chart
  if (type === "overview" && data.topCategories) {
    const categories = data.topCategories as any[];
    
    return (
      <div className="glass-card p-4 animate-scale-in mt-2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-xl font-bold gradient-text">{formatINR(data.totalSpending as number)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl font-bold text-foreground">{data.transactionCount}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {categories.map((cat, idx) => (
            <div 
              key={idx}
              className="flex-1 h-8 rounded-lg transition-transform hover:scale-105 cursor-pointer"
              style={{ 
                backgroundColor: categoryColors[cat.category] || "#6b7280",
                opacity: 1 - (idx * 0.15)
              }}
              title={`${cat.category}: ${formatINR(cat.amount)}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
