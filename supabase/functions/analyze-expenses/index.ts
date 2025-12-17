import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface AnalysisResult {
  type: string;
  data: Record<string, unknown>;
  summary: string;
}

// Format currency in Indian Rupees
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Parse CSV data into transactions
function parseCSV(csvData: string): Transaction[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('merchant') || h.includes('name'));
  const categoryIdx = headers.findIndex(h => h.includes('category'));
  const amountIdx = headers.findIndex(h => h.includes('amount'));
  
  const transactions: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length >= Math.max(dateIdx, descIdx, categoryIdx, amountIdx) + 1) {
      const amount = parseFloat(values[amountIdx]);
      if (!isNaN(amount)) {
        transactions.push({
          date: values[dateIdx] || '',
          description: values[descIdx] || '',
          category: values[categoryIdx] || 'Other',
          amount: Math.abs(amount),
        });
      }
    }
  }
  
  return transactions;
}

// Analyze expenses based on intent
function analyzeExpenses(transactions: Transaction[], intent: string): AnalysisResult {
  const lowerIntent = intent.toLowerCase();
  
  // Total spending
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  // Sort categories by spending
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);
  
  // Date range analysis
  const dates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()));
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Last 7 days spending
  const last7Days = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= sevenDaysAgo && d <= now;
  });
  const last7DaysTotal = last7Days.reduce((sum, t) => sum + t.amount, 0);
  
  // Monthly spending
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= thirtyDaysAgo && d <= now;
  });
  const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Determine response based on intent
  if (lowerIntent.includes('total') || lowerIntent.includes('overall') || lowerIntent.includes('all time')) {
    return {
      type: 'total',
      data: {
        totalSpending: totalSpending,
        transactionCount: transactions.length,
        avgTransaction: Math.round(totalSpending / transactions.length),
      },
      summary: `Total spending: ${formatINR(totalSpending)} across ${transactions.length} transactions. Average transaction: ${formatINR(totalSpending / transactions.length)}.`
    };
  }
  
  if (lowerIntent.includes('month') || lowerIntent.includes('30 day') || lowerIntent.includes('this month')) {
    return {
      type: 'monthly',
      data: {
        monthlyTotal: monthlyTotal,
        transactionCount: monthlyTransactions.length,
        dailyAvg: Math.round(monthlyTotal / 30),
      },
      summary: `Monthly spending (last 30 days): ${formatINR(monthlyTotal)} across ${monthlyTransactions.length} transactions. Daily average: ${formatINR(monthlyTotal / 30)}.`
    };
  }
  
  if (lowerIntent.includes('week') || lowerIntent.includes('7 day') || lowerIntent.includes('last week')) {
    return {
      type: 'weekly',
      data: {
        weeklyTotal: last7DaysTotal,
        transactionCount: last7Days.length,
        dailyAvg: Math.round(last7DaysTotal / 7),
        transactions: last7Days.slice(0, 10).map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category
        })),
      },
      summary: `Last 7 days spending: ${formatINR(last7DaysTotal)} across ${last7Days.length} transactions. Daily average: ${formatINR(last7DaysTotal / 7)}.`
    };
  }
  
  if (lowerIntent.includes('category') || lowerIntent.includes('breakdown') || lowerIntent.includes('categories')) {
    const categoryData = sortedCategories.map(([cat, amount]) => ({
      category: cat,
      amount: amount,
      percentage: Math.round((amount / totalSpending) * 100),
    }));
    
    return {
      type: 'category',
      data: { categories: categoryData, totalSpending: totalSpending },
      summary: `Category breakdown: ${sortedCategories.slice(0, 5).map(([cat, amt]) => `${cat}: ${formatINR(amt)} (${Math.round((amt/totalSpending)*100)}%)`).join(', ')}.`
    };
  }
  
  if (lowerIntent.includes('top') || lowerIntent.includes('highest') || lowerIntent.includes('most')) {
    const top3 = sortedCategories.slice(0, 3);
    return {
      type: 'top',
      data: {
        topCategories: top3.map(([cat, amount]) => ({
          category: cat,
          amount: amount,
          percentage: Math.round((amount / totalSpending) * 100),
        })),
        totalSpending: totalSpending,
      },
      summary: `Top 3 spending categories: ${top3.map(([cat, amt], i) => `${i+1}. ${cat}: ${formatINR(amt)}`).join(', ')}.`
    };
  }
  
  if (lowerIntent.includes('insight') || lowerIntent.includes('overspend') || lowerIntent.includes('advice') || lowerIntent.includes('suggest')) {
    const topCategory = sortedCategories[0];
    const topCategoryPercentage = topCategory ? Math.round((topCategory[1] / totalSpending) * 100) : 0;
    const dailyAvg = Math.round(monthlyTotal / 30);
    
    return {
      type: 'insight',
      data: {
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1], percentage: topCategoryPercentage } : null,
        monthlyTotal: monthlyTotal,
        dailyAvg: dailyAvg,
        weeklyTotal: last7DaysTotal,
        categories: sortedCategories.slice(0, 5).map(([cat, amt]) => ({ category: cat, amount: amt, percentage: Math.round((amt/totalSpending)*100) })),
        transactionCount: transactions.length,
      },
      summary: `Spending insight: Your highest category is ${topCategory?.[0] || 'N/A'} at ${formatINR(topCategory?.[1] || 0)} (${topCategoryPercentage}% of total). Monthly: ${formatINR(monthlyTotal)}, Weekly: ${formatINR(last7DaysTotal)}, Daily avg: ${formatINR(dailyAvg)}.`
    };
  }
  
  // Default: provide overview
  return {
    type: 'overview',
    data: {
      totalSpending: totalSpending,
      monthlyTotal: monthlyTotal,
      weeklyTotal: last7DaysTotal,
      transactionCount: transactions.length,
      topCategories: sortedCategories.slice(0, 5).map(([cat, amt]) => ({ category: cat, amount: amt, percentage: Math.round((amt/totalSpending)*100) })),
    },
    summary: `Overview: Total spending ${formatINR(totalSpending)}, Monthly ${formatINR(monthlyTotal)}, Weekly ${formatINR(last7DaysTotal)}. Top categories: ${sortedCategories.slice(0, 3).map(([cat]) => cat).join(', ')}.`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, question } = await req.json();
    
    if (!csvData || !question) {
      return new Response(
        JSON.stringify({ error: 'Missing csvData or question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing CSV data...');
    const transactions = parseCSV(csvData);
    console.log(`Parsed ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid transactions found in CSV data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing expenses for question:', question);
    const analysis = analyzeExpenses(transactions, question);
    console.log('Analysis result:', analysis);

    // Get AI explanation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a personal finance AI assistant for Indian users. Your job is to explain expense data clearly and provide actionable insights.

RULES:
- Use ONLY the provided transaction summary data - never invent numbers
- Always use Indian Rupee (₹) symbol for all currency values
- Keep responses friendly, clear, and concise (2-4 sentences)
- If the data shows high spending in a category, provide a helpful observation
- Use Indian context (mention UPI, common Indian spending patterns if relevant)
- Do not make assumptions about data you don't have
- Be encouraging and helpful`;

    const userPrompt = `User question: "${question}"

Transaction analysis summary:
${analysis.summary}

Detailed data:
${JSON.stringify(analysis.data, null, 2)}

Please provide a helpful, friendly response based on this data. Use ₹ for currency.`;

    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please check your credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const explanation = aiData.choices?.[0]?.message?.content || analysis.summary;

    return new Response(
      JSON.stringify({
        response: explanation,
        analysis: analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-expenses:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
