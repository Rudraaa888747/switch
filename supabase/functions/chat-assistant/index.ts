import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5000",
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

type IncomingMessage = {
  role: "assistant" | "user" | string;
  content: string;
};

type ChatRequestBody = {
  messages?: IncomingMessage[];
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Verify caller JWT — reject anonymous requests
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env missing");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = req.headers.get("x-forwarded-for") || user.id;
    if (clientIp !== "unknown") {
      const now = Date.now();
      const record = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + WINDOW_MS };
      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + WINDOW_MS;
      }
      record.count++;
      rateLimitMap.set(clientIp, record);
      
      if (record.count > RATE_LIMIT) {
        console.warn(JSON.stringify({ type: 'RATE_LIMIT_EXCEEDED', clientIp, count: record.count }));
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    const { messages } = (await req.json()) as ChatRequestBody;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    // Read catalog with the user's JWT (RLS-enforced), never SERVICE_ROLE
    const { data: products } = await userClient
      .from("products")
      .select("id, name, price, original_price, category, subcategory, colors, sizes, occasion, description, is_new, is_trending, rating, image_url, discount")
      .limit(500);

    const productCatalog = (products || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      discount: p.discount,
      category: p.category,
      subcategory: p.subcategory,
      colors: p.colors,
      sizes: p.sizes,
      occasion: p.occasion,
      is_new: p.is_new,
      is_trending: p.is_trending,
      rating: p.rating,
      description: p.description ? (p.description as string).substring(0, 120) : '',
      image_url: p.image_url,
    }));

    const catalogJson = JSON.stringify(productCatalog);

    const SYSTEM_PROMPT = `You are Switch AI, a luxury fashion shopping assistant for Switch fashion store.

AVAILABLE PRODUCTS CATALOG: ${catalogJson}

IMPORTANT RULES:
1. When recommending products, ALWAYS include product IDs in this exact format at the END of your response:
[PRODUCTS: id1, id2, id3]
2. ONLY recommend products that exist in the catalog above — never invent products
3. You CAN search and filter by: color, size, category, gender (men/women), price range, style, occasion, subcategory, and tags
4. If a user asks about a specific color, size, or price — filter the catalog accordingly
5. For requests like "black oversized hoodies", "white polo t-shirts", "best shirts under ₹1500", "women's casual wear" — find matching products from the catalog
6. Use formatPrice(price) style for prices: ₹1,499
7. Be helpful, concise, and friendly
8. If no products match exactly, suggest the closest alternatives from the catalog
9. Use emojis occasionally to be engaging
10. When user asks "show" or "find" or "recommend" — always respond with specific products`;

    const safeMessages = Array.isArray(messages) ? messages : [];
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
              ...safeMessages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content ?? '' }],
              })),
            ],
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const latencyMs = Date.now() - startTime;
    console.log(JSON.stringify({ 
      type: 'AI_USAGE_METRIC', 
      status: 'success', 
      latencyMs, 
      messagesCount: safeMessages.length 
    }));

    const sseResponse = `data: ${JSON.stringify({
      choices: [{ delta: { content: text } }]
    })}\n\ndata: [DONE]\n\n`;

    return new Response(sseResponse, { 
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" } 
    });
  } catch (error) {
    console.error(JSON.stringify({ 
      type: 'AI_USAGE_METRIC', 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }));
    console.error("Chat assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
