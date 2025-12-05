import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StepResult {
  stepId: number;
  status: "done" | "skipped" | "cant-do";
  followUpAnswer?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptom, vehicle, stepResults, generateResult } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleContext = vehicle
      ? `Vehicle: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.year})`
      : "No specific vehicle selected";

    if (generateResult && stepResults) {
      // Generate final diagnosis results
      const resultPrompt = `You are an automotive diagnostic expert. Based on the user's symptom and their completed diagnostic steps, provide a final diagnosis.

Symptom: ${symptom}
${vehicleContext}

Step results:
${stepResults.map((r: StepResult) => `- Step ${r.stepId}: ${r.status}${r.followUpAnswer ? ` (Answer: ${r.followUpAnswer})` : ""}`).join("\n")}

Respond with a JSON object (no markdown, just raw JSON) in this exact format:
{
  "result": {
    "likelyCauses": [
      { "cause": "Description of cause", "probability": "high" | "medium" | "low" }
    ],
    "safetyLevel": "safe" | "caution" | "critical",
    "nextActions": ["Action 1", "Action 2", "Action 3"],
    "mechanicSummary": "A brief summary to show the mechanic, including symptom, vehicle info, and key findings from the diagnostic steps."
  }
}

Rules:
- List 2-4 likely causes, ordered by probability
- Be honest about uncertainty
- Safety level should reflect actual risk
- Next actions should be practical and safe
- Mechanic summary should be concise but complete`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: resultPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("Failed to generate results");
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate diagnostic steps
    const stepsPrompt = `You are an automotive diagnostic expert creating a guided diagnosis checklist. The user has described a vehicle issue, and you need to create safe, step-by-step diagnostic checks.

Symptom: ${symptom}
${vehicleContext}

Create a diagnostic checklist. Respond with a JSON object (no markdown, just raw JSON) in this exact format:
{
  "contextSummary": "Brief context summary, e.g., 'Front brake noise at low speed, no warning lights'",
  "steps": [
    {
      "id": 1,
      "title": "Short title",
      "purpose": "One sentence explaining why this step matters",
      "instructions": ["Instruction 1", "Instruction 2"],
      "type": "safety" | "visual" | "listen" | "interaction" | "photo" | "workshop",
      "followUpQuestion": "Optional yes/no question after completing, e.g., 'Did you notice any fluid under the car?'"
    }
  ]
}

Rules:
1. Generate 4-7 steps maximum
2. Start with safety checks, then observations, then simple interactions
3. NEVER include dangerous actions (no jacking, wheel removal, touching hot parts)
4. Use simple language, no jargon
5. Each step should be safe for a regular car owner
6. End with a workshop-prep step summarizing what to tell the mechanic
7. Step types:
   - "safety": Environment and safety checks
   - "visual": Looking for leaks, wear, damage
   - "listen": Sound-based checks
   - "interaction": Simple safe actions (pump brake, turn steering)
   - "photo": Request specific photos/videos
   - "workshop": Final summary for mechanic visit
8. Include relevant follow-up questions for key steps`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: stepsPrompt }],
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
      throw new Error("Failed to generate diagnosis");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
