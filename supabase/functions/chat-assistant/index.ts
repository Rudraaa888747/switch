import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTS_CATALOG = [
  { id: 'men-1', name: 'Black Slim-Fit Cotton Shirt', price: 1299, category: 'men', colors: ['Black', 'Navy'], occasion: ['Casual', 'Office', 'Party'] },
  { id: 'men-2', name: 'White Formal Shirt', price: 1499, category: 'men', colors: ['White', 'Cream'], occasion: ['Formal', 'Office', 'Wedding'] },
  { id: 'men-3', name: 'Oversized Graphic T-Shirt', price: 999, category: 'men', colors: ['Black', 'White'], occasion: ['Casual', 'Streetwear'] },
  { id: 'men-4', name: 'Premium Denim Jacket', price: 2499, category: 'men', colors: ['Black'], occasion: ['Casual', 'Streetwear', 'Travel'] },
  { id: 'men-5', name: 'Casual Checked Shirt', price: 1199, category: 'men', colors: ['Blue Check', 'Red Check'], occasion: ['Casual', 'Weekend'] },
  { id: 'men-6', name: 'Oversized Hoodie', price: 1899, category: 'men', colors: ['Black'], occasion: ['Casual', 'Streetwear', 'Travel'] },
  { id: 'men-7', name: 'Premium Sneakers', price: 2499, category: 'men', colors: ['Black'], occasion: ['Casual', 'Sports', 'Streetwear'] },
  { id: 'women-1', name: 'Floral Summer Dress', price: 1799, category: 'women', colors: ['Floral Pink', 'Floral Blue'], occasion: ['Casual', 'Beach', 'Brunch'] },
  { id: 'women-2', name: 'Jeans', price: 1599, category: 'women', colors: ['Dark Blue', 'Black'], occasion: ['Casual', 'Office', 'Travel'] },
  { id: 'women-3', name: 'Elegant Cotton Kurti', price: 1299, category: 'women', colors: ['White', 'Navy'], occasion: ['Casual', 'Office', 'Festival'] },
  { id: 'women-4', name: 'Oversized Hoodie', price: 1999, category: 'women', colors: ['Pink', 'Grey'], occasion: ['Casual', 'Loungewear', 'Travel'] }
];

const SYSTEM_PROMPT = `You are Switch AI, a friendly shopping assistant. Always include product IDs like [PRODUCTS: id1, id2].`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Send as a single data line for the frontend to parse
    const sseResponse = `data: ${JSON.stringify({
      choices: [{ delta: { content: text } }]
    })}\n\ndata: [DONE]\n\n`;

    return new Response(sseResponse, { 
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" } 
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
