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

// Auto-categorize based on description/narration
function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  
  // Food & Dining
  if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('domino') || 
      desc.includes('mcdonald') || desc.includes('kfc') || desc.includes('pizza') ||
      desc.includes('cafe') || desc.includes('restaurant') || desc.includes('food') ||
      desc.includes('starbucks') || desc.includes('eat') || desc.includes('barbeque')) {
    return 'Food & Dining';
  }
  
  // Shopping
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') ||
      desc.includes('ajio') || desc.includes('nykaa') || desc.includes('croma') ||
      desc.includes('shop') || desc.includes('store') || desc.includes('mall') ||
      desc.includes('mart') || desc.includes('retail')) {
    return 'Shopping';
  }
  
  // Transportation
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('rapido') ||
      desc.includes('petrol') || desc.includes('diesel') || desc.includes('fuel') ||
      desc.includes('ioc') || desc.includes('bpcl') || desc.includes('hp') ||
      desc.includes('metro') || desc.includes('irctc') || desc.includes('railway')) {
    return 'Transportation';
  }
  
  // Groceries
  if (desc.includes('dmart') || desc.includes('bigbazaar') || desc.includes('big bazaar') ||
      desc.includes('reliance fresh') || desc.includes('more') || desc.includes('grocer') ||
      desc.includes('supermarket') || desc.includes('vegetable') || desc.includes('kirana')) {
    return 'Groceries';
  }
  
  // Utilities
  if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') ||
      desc.includes('internet') || desc.includes('broadband') || desc.includes('mobile') ||
      desc.includes('recharge') || desc.includes('bill') || desc.includes('jio') ||
      desc.includes('airtel') || desc.includes('vi ')) {
    return 'Utilities';
  }
  
  // Entertainment
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime') ||
      desc.includes('hotstar') || desc.includes('pvr') || desc.includes('inox') ||
      desc.includes('cinema') || desc.includes('movie') || desc.includes('game') ||
      desc.includes('play')) {
    return 'Entertainment';
  }
  
  // Health
  if (desc.includes('pharmacy') || desc.includes('medical') || desc.includes('hospital') ||
      desc.includes('doctor') || desc.includes('apollo') || desc.includes('medplus') ||
      desc.includes('health') || desc.includes('gym') || desc.includes('fit')) {
    return 'Health & Fitness';
  }
  
  // UPI/Transfers
  if (desc.includes('upi') || desc.includes('paytm') || desc.includes('phonepe') ||
      desc.includes('gpay') || desc.includes('transfer') || desc.includes('neft') ||
      desc.includes('imps') || desc.includes('rtgs')) {
    return 'UPI/Transfers';
  }
  
  return 'Other';
}

// Parse CSV values handling quoted fields with embedded commas/newlines
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
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
  return values;
}

// Parse CSV data into transactions (supports multiple formats)
function parseCSV(csvData: string): Transaction[] {
  // Normalize line endings and handle multi-line quoted values
  const normalizedData = csvData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by lines but preserve quoted content with newlines
  const rawLines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (const char of normalizedData) {
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) rawLines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) rawLines.push(currentLine);
  
  // Find header line (skip account info lines)
  let headerLineIndex = 0;
  for (let i = 0; i < rawLines.length; i++) {
    const lower = rawLines[i].toLowerCase();
    if (lower.includes('date') && (lower.includes('amount') || lower.includes('withdrawal') || lower.includes('debit') || lower.includes('narration'))) {
      headerLineIndex = i;
      break;
    }
  }
  
  const headers = parseCSVLine(rawLines[headerLineIndex]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
  console.log('Detected headers:', headers);
  
  // Find column indices
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('narration') || h.includes('description') || h.includes('merchant') || h.includes('particulars') || h.includes('remark'));
  const categoryIdx = headers.findIndex(h => h.includes('category'));
  
  // Amount column - check for withdrawal/debit columns (bank statement format) or general amount
  const withdrawalIdx = headers.findIndex(h => h.includes('withdrawal') || h.includes('debit') || h.includes('dr'));
  const depositIdx = headers.findIndex(h => h.includes('deposit') || h.includes('credit') || h.includes('cr'));
  const amountIdx = headers.findIndex(h => h === 'amount' || (h.includes('amount') && !h.includes('withdrawal') && !h.includes('deposit')));
  
  console.log('Column indices - date:', dateIdx, 'desc:', descIdx, 'withdrawal:', withdrawalIdx, 'deposit:', depositIdx, 'amount:', amountIdx);
  
  const transactions: Transaction[] = [];
  
  for (let i = headerLineIndex + 1; i < rawLines.length; i++) {
    const values = parseCSVLine(rawLines[i]).map(v => v.replace(/['"]/g, '').trim());
    
    if (values.length < 2) continue;
    
    // Get date
    const dateStr = dateIdx >= 0 && values[dateIdx] ? values[dateIdx] : '';
    if (!dateStr) continue;
    
    // Get description
    const description = descIdx >= 0 && values[descIdx] ? values[descIdx].replace(/\n/g, ' ') : '';
    
    // Get amount - prefer withdrawal column for expenses, or use general amount
    let amount = 0;
    if (withdrawalIdx >= 0 && values[withdrawalIdx]) {
      const parsed = parseFloat(values[withdrawalIdx].replace(/[^\d.-]/g, ''));
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }
    if (amount === 0 && amountIdx >= 0 && values[amountIdx]) {
      const parsed = parseFloat(values[amountIdx].replace(/[^\d.-]/g, ''));
      if (!isNaN(parsed)) amount = Math.abs(parsed);
    }
    
    if (amount === 0) continue;
    
    // Get or auto-detect category
    let category = categoryIdx >= 0 && values[categoryIdx] ? values[categoryIdx] : '';
    if (!category) {
      category = categorizeTransaction(description);
    }
    
    // Parse date - handle DD-MM-YYYY format
    let parsedDate = dateStr;
    const ddmmyyyy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) {
      parsedDate = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }
    
    transactions.push({
      date: parsedDate,
      description: description || 'Transaction',
      category: category,
      amount: amount,
    });
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
