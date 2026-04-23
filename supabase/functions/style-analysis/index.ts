import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageBase64 } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const systemPrompt = `Analyze style in JSON: { "skinTone": "...", "bodyStructure": "...", "styleCategory": "...", "colorPalette": ["#hex1"], "recommendations": ["tip1"] }`;
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
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
