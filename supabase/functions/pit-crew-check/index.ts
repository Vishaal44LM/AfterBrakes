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
    const {
      vehicle,
      mileage,
      usagePattern,
      lastServiceDate,
      lastServiceMileage,
      avgDailyDistance,
      drivingStyle,
      roadCondition,
      loadPattern,
      symptoms,
      additionalNotes,
      inputScore,
      inputStrength,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reject weak input strength
    if (inputScore < 70) {
      return new Response(
        JSON.stringify({ error: "Input strength too low. Please complete more details." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build vehicle context
    const vehicleContext = vehicle
      ? `Vehicle: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.year}), Fuel: ${vehicle.fuel || 'petrol'}, Mileage: ${mileage} km.`
      : `Vehicle: Not specified, Mileage: ${mileage} km.`;

    // Build usage context
    const usageContext = `
Driving Pattern: ${usagePattern} driving
Average Daily Distance: ${avgDailyDistance} km
Driving Style: ${drivingStyle}
Road Conditions: ${roadCondition}
Typical Load: ${loadPattern}
Last Service: ${lastServiceDate ? `Date: ${lastServiceDate}` : `At ${lastServiceMileage} km`}`;

    // Build symptoms context
    const symptomsContext = symptoms && symptoms.length > 0
      ? `Reported Symptoms:\n${symptoms.map((s: any) => 
          `- ${s.label}: ${s.frequency} frequency, ${s.severity} severity, occurs during: ${s.conditions.join(', ') || 'various conditions'}`
        ).join('\n')}`
      : "No specific symptoms reported.";

    const systemPrompt = `You are the Pit Crew Check AI - a professional automotive risk prediction engine for After Brakes.

CORE PRINCIPLE:
You predict FUTURE vehicle failure risks, not current diagnoses. Think like a race engineer briefing before a race - disciplined, data-driven, preventive.

3-LAYER PREDICTION ENGINE:

LAYER 1 - VEHICLE INTELLIGENCE (Static Knowledge):
- Known failure patterns for this specific make/model/year
- Common weak components for this vehicle
- Mileage-based wear expectations
- India-centric assumptions (climate, road quality, fuel quality)

LAYER 2 - USER REALITY (Dynamic Weighting):
- Driving behavior (${drivingStyle} style affects component wear)
- Maintenance discipline (service interval adherence)
- Road conditions (${roadCondition} roads accelerate suspension/tire wear)
- Load patterns (${loadPattern} affects drivetrain stress)
- Current symptoms as early warning indicators

LAYER 3 - PREDICTIVE ANALYSIS:
- Cross-reference symptoms with known failure progressions
- Calculate probability based on mileage + behavior + symptoms
- Estimate time/distance windows for risk escalation

CRITICAL OUTPUT FORMAT - You MUST return EXACTLY this structured format:

For EACH component at risk (provide 3-6 predictions), use this exact format:

---
Component: [Component Name]
Risk Level: [High/Medium/Low]
Confidence: [50-95]%
Time Window: [e.g., "Within 3,000-5,000 km" or "Within 1-2 months"]
Action: [Specific preventive action in one sentence]
Can Wait: [Yes/No]
Reason: [One sentence explaining why this component is at risk based on the data]
---

PREDICTION RULES:

1. NEVER say "Will fail" - use "Risk increasing" or "Failure risk elevated"
2. Only predict if confidence > 50%
3. High Risk = Safety-critical OR confidence > 80% with severe symptoms
4. Medium Risk = Notable wear pattern OR moderate symptoms
5. Low Risk = Preventive monitoring recommended

RISK ASSESSMENT PRIORITIES (India-centric):
- Brake system: Heavy traffic = more brake wear
- Suspension: Rough roads = accelerated bushing/shock wear
- Clutch: City driving + aggressive style = faster clutch wear
- Battery: Extreme heat + frequent short trips = reduced life
- Cooling system: High ambient temps + traffic = radiator/thermostat stress
- Tires: Road quality + load = uneven wear patterns

INPUT CONTEXT:
${vehicleContext}
${usageContext}

${symptomsContext}

${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Input Strength Score: ${inputScore}/100 (${inputStrength})

Based on all this data, provide your failure risk predictions. Be specific, professional, and preventive-focused. Always include at least 3 component predictions even if input has no symptoms (use baseline wear predictions for the vehicle/mileage).`;

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
          { role: "user", content: "Generate the failure risk timeline predictions based on the provided vehicle and usage data." },
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
    console.error("Pit crew check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
