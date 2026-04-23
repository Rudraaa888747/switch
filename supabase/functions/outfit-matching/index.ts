import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { selectedProduct, allProducts } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const systemPrompt = `Return matching product IDs in JSON: { "matchingIds": ["id1"], "reasoning": "..." }`;
    const userPrompt = `Selected: ${JSON.stringify(selectedProduct)}. Catalog: ${JSON.stringify(allProducts.filter((p: any) => p.id !== selectedProduct.id))}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return new Response(jsonMatch ? jsonMatch[0] : JSON.stringify({ error: "No JSON" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});