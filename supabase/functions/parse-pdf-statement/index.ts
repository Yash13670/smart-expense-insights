import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, fileName } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing PDF:', fileName);

    // Decode base64 PDF
    const pdfBytes = decode(pdfBase64);
    console.log('PDF size:', pdfBytes.length, 'bytes');

    // Use Lovable AI with vision to extract transaction data from PDF
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create a prompt for the AI to extract transactions
    const extractionPrompt = `You are a bank statement parser. Extract ALL transactions from this bank statement PDF.

For each transaction, extract:
- date (in YYYY-MM-DD format)
- description/narration (the merchant or transaction description)
- amount (the withdrawal/debit amount as a positive number - ONLY extract expenses/debits, not credits/deposits)
- category (auto-categorize based on the description)

Categories to use:
- Food & Dining (restaurants, food delivery, cafes)
- Shopping (Amazon, Flipkart, retail stores)
- Transportation (Uber, Ola, petrol, metro)
- Groceries (DMart, BigBazaar, supermarkets)
- Utilities (electricity, internet, mobile recharge)
- Entertainment (Netflix, movies, subscriptions)
- Health & Fitness (pharmacy, gym, medical)
- UPI/Transfers (generic UPI payments)
- Other (anything else)

Return ONLY a valid JSON array of transactions in this exact format:
[
  {"date": "2024-12-01", "description": "Swiggy Food Order", "amount": 450, "category": "Food & Dining"},
  {"date": "2024-12-02", "description": "Amazon Purchase", "amount": 1299, "category": "Shopping"}
]

Important:
- Extract ONLY debit/withdrawal transactions (expenses)
- Skip credit/deposit transactions
- Convert DD-MM-YYYY or DD/MM/YYYY dates to YYYY-MM-DD format
- Amount should be a number without currency symbols
- If you cannot extract any transactions, return an empty array []`;

    console.log('Calling Lovable AI for PDF extraction...');

    // Send PDF as base64 image to Gemini (it can process PDFs)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: extractionPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content || '[]';
    console.log('AI response:', extractedText.substring(0, 500));

    // Parse the JSON from AI response
    let transactions = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    console.log('Extracted', transactions.length, 'transactions');

    // Convert to CSV format for compatibility with existing analyze-expenses function
    if (transactions.length > 0) {
      const csvLines = ['Date,Description,Category,Amount'];
      for (const t of transactions) {
        const date = t.date || '';
        const desc = (t.description || '').replace(/,/g, ' ').replace(/"/g, "'");
        const category = t.category || 'Other';
        const amount = t.amount || 0;
        csvLines.push(`${date},"${desc}",${category},${amount}`);
      }
      const csvData = csvLines.join('\n');

      return new Response(
        JSON.stringify({
          success: true,
          csvData,
          transactionCount: transactions.length,
          transactions,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Could not extract transactions from this PDF. Please ensure it\'s a valid bank statement.',
        csvData: '',
        transactionCount: 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to process PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
