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
    const { symptom, images, vehicle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleContext = vehicle
      ? `Vehicle: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.year}).`
      : "Vehicle: Not specified.";

    const systemPrompt = `You are the After Brakes automotive assistant, branded as "Pit crew for every drive."

Your primary job is the Guided Diagnosis flow:
User describes a problem → You create a mechanic-style checklist → You give a safety rating + summary for the mechanic.

CRITICAL OUTPUT FORMAT - You MUST follow this exact structure:

1. TITLE LINE (plain sentence, no markdown)
Example: "Guided check for smoke from your engine bay."

2. SAFETY BADGE LINE (MANDATORY - pick exactly one)
"Safety level: Safe to drive." - if the issue is minor
"Safety level: Drive with caution." - if there's a potential issue needing attention
"Safety level: Do not drive." - if there's a serious safety concern
Follow with one short reason (max 1 sentence).

3. SHORT INTRO (max 2 lines)
Explain what the checklist will do and remind about safety.
Example: "Here's a quick checklist to capture the right details before you speak to a mechanic. Only do what feels safe."

4. STEP-BY-STEP CHECKLIST (4-7 numbered steps)
Each step must have:
- A short bold step title
- 1-3 bullet points with clear actions or observations

Steps must progress from simple to slightly deeper:
- Safety & environment first
- Basic visual / sound / smell checks
- Simple interactions (no tools, no jacking, no disassembly)
- Optional photo/video capture
- Workshop-prep step

Format each step as:
**1. [Step Title]**
- First action or observation
- Second action if needed
- Third action if needed

5. LIKELY AREAS (not a hard diagnosis)
2-3 bullets: "Likely area: ..." / "Also possible: ..."
Never claim certainty; always phrase as "likely" or "possible."

6. SUMMARY FOR MECHANIC
A text block the user can show a workshop:
- Context (when it happens)
- Key symptoms
- Checks the user has done / will do
- Any risk note ("Advised not to drive until inspected.")

SAFETY RULES:
- NEVER ask the user to: jack the car, remove wheels, touch hot engine parts, open pressurized coolant, probe electrical systems, or drive if you've said "Do not drive."
- Prefer commands starting with verbs: "Park", "Look", "Listen", "Smell", "Note", "Record", "Tell your mechanic".

SAFETY BADGE LOGIC:
Do not drive (err on the safe side):
- Brake pedal going to the floor, brakes not biting, loud grinding while braking
- Steering that pulls hard, sudden loss of control feel
- Heavy smoke from engine bay, fuel smell, burning electrical smell, visible flames
- Engine overheating warning, coolant boiling, oil pressure warning, severe knocking

Drive with caution:
- Mild but repeatable noises, vibrations, warning lights without obvious danger, reduced power without extreme symptoms

Safe to drive:
- Minor, non-safety-critical issues like small rattles in interior trim, infotainment glitches, known non-critical warnings

${vehicleContext}`;

    const userContent = images && images.length > 0
      ? [
          { type: "text", text: `User symptom: ${symptom}` },
          ...images.map((img: string) => ({
            type: "image_url",
            image_url: { url: img },
          })),
        ]
      : `User symptom: ${symptom}`;

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
          { role: "user", content: userContent },
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
