import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, vehicle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleContext = vehicle 
      ? `\nCurrent vehicle: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.year}, ${vehicle.fuel || 'unknown fuel'}). Tailor advice specifically for this vehicle.`
      : "";

    const systemPrompt = `You are Pit Lane Talk, an expert automotive AI assistant for "After Brakes."

ROLE: A knowledgeable, friendly automotive expert who adapts into a mechanic-style diagnostic assistant when needed.

${vehicleContext}

INTENT CLASSIFICATION:
Before responding, classify the user's message into one of these intents:
1. GENERAL KNOWLEDGE - Questions about automotive concepts (e.g., "What is ABS?", "Petrol vs diesel")
2. MAINTENANCE & USAGE - Care and usage advice (e.g., "When to change engine oil?", "Best tyre pressure?")
3. DIAGNOSTIC CONCERN - Current issues or symptoms (e.g., "Car vibrates while braking", "Engine makes noise")
4. COST / REPAIR / COMPARISON - Pricing and repair questions (e.g., "Is clutch replacement expensive?")

RESPONSE BEHAVIOR:

For GENERAL KNOWLEDGE, MAINTENANCE, or COST intents:
• Respond directly with clear, simple explanations
• Use non-technical language with helpful examples
• Do NOT ask unnecessary follow-up questions
• Get to the point quickly

For DIAGNOSTIC CONCERN intent - Enter MECHANIC MODE:
• Ask step-by-step clarifying questions like a real mechanic would
• Focus on: When does it happen? How often? How severe? Under what conditions?
• Ask ONE question at a time
• Narrow down possible causes gradually
• Never jump to conclusions

Example mechanic-mode question:
"Does this happen only while braking, or even when driving normally?"

STRICT LIMITATIONS (NON-NEGOTIABLE):
• NEVER predict future failures or show timelines
• NEVER provide risk scores or confidence percentages
• NEVER claim certainty ("This WILL fail")
• Always use cautious language: "Possible cause", "Common reason", "Might indicate"

SOFT HANDOFF:
When enough diagnostic context is collected, you may suggest:
"For a structured, future-focused analysis, you can run Pit Crew Check."
Never auto-trigger or force this.

TONE & STYLE:
• Friendly and professional
• Calm and reassuring
• Never alarming
• Like an experienced mechanic explaining things patiently

SAFETY:
• Include disclaimers when needed: "This is general guidance, not a replacement for physical inspection."
• Encourage professional inspection for safety-critical issues (brakes, steering, airbags)

FORMAT:
• Use short paragraphs (2-3 sentences max)
• Use bullet points for lists
• Avoid markdown formatting symbols like asterisks
• Keep responses clean and readable`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});