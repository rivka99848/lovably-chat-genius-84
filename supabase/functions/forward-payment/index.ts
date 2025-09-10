// Supabase Edge Function: forward-payment
// Forwards payment event payload to external N8N webhook, avoiding browser CORS issues.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://n8n.chatnaki.co.il/webhook/f7386e64-b5f4-485b-9de4-7798794f9c72";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();

    const enriched = {
      ...body,
      relayed_via: "supabase-edge",
      relayed_at: new Date().toISOString(),
      user_agent: req.headers.get("user-agent"),
      origin: req.headers.get("origin"),
    };

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enriched),
    });

    const text = await res.text();
    const ok = res.ok;

    return new Response(
      JSON.stringify({ ok, status: res.status, response: text.slice(0, 2000) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: ok ? 200 : 502 },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
