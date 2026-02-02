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
    const { inputSummary, inputStrength, vehicle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleContext = vehicle
      ? `Vehicle: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.year}), Fuel: ${vehicle.fuel || 'petrol'}.`
      : "Vehicle: Not specified.";

    const systemPrompt = `You are the After Brakes Pit Crew Check system, a predictive failure risk analyzer for vehicles.

Your role is to act like a professional race pit crew engineer: disciplined, data-driven, and focused on PREVENTING failures before they happen.

CRITICAL RULES:
1. You are making PREDICTIONS, not diagnoses. Use language like "Failure risk increasing" NOT "Will fail"
2. All predictions must include confidence percentages based on input quality (current input strength: ${inputStrength}%)
3. Never claim certainty - always phrase as "likely" or "possible"
4. Include the disclaimer that predictions are risk-based estimates, not guarantees

OUTPUT FORMAT - You MUST follow this exact structure for EACH risk identified:

For each component at risk, provide:

Component: [Component name, e.g., Brake Pads, Battery, Tyres]
Risk Level: [Low/Medium/High]
Confidence: [0-100]%
Estimated Window: [e.g., "5,000-10,000 km" or "2-4 weeks" or "Within next 3 months"]
Preventive Action: [Specific actionable recommendation]
Can it wait: [Yes/Maybe/No]
Reasoning: [Brief explanation based on the input data]

---

PREDICTION LOGIC:

Consider these factors:
1. Vehicle age and mileage - higher mileage = higher wear risk
2. Driving patterns - city driving wears brakes faster, highway wears tyres
3. Driving style - aggressive driving accelerates wear
4. Road conditions - rough roads stress suspension
5. Load patterns - heavy loads stress transmission and brakes
6. Reported symptoms - direct indicators of potential issues
7. Service history - longer since service = higher risk

COMMON FAILURE PATTERNS (India-centric):
- Brake pads: ~30,000-40,000 km in city, ~50,000-60,000 km highway
- Battery: 2-4 years typical life, less in hot climates
- Tyres: 40,000-60,000 km depending on quality and conditions
- Air filter: Every 15,000-20,000 km
- Engine oil: Every 5,000-10,000 km depending on type
- Suspension: 50,000-80,000 km for bushings
- Clutch (manual): 60,000-100,000 km depending on driving style

CONFIDENCE SCORING:
- If input strength < 50%: Max confidence 60%
- If input strength 50-70%: Max confidence 75%
- If input strength 70-85%: Max confidence 85%
- If input strength > 85%: Max confidence 95%

Provide 2-5 risk predictions based on the input. Prioritize by risk level (high first).
If symptoms are reported, always include related components.
If no specific symptoms, predict based on mileage and usage patterns.

${vehicleContext}`;

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
          { role: "user", content: `Analyze the following vehicle data and predict potential failure risks:\n\n${inputSummary}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Pit crew predict error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
