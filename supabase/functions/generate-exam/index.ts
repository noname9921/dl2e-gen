import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("🔥 Function hit")

    // 1. read body safely
    const raw = await req.text()

    if (!raw || raw.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // 2. parse JSON safely
    let config
    try {
      config = JSON.parse(raw)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", raw }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    console.log("✅ CONFIG:", config)

    const readingCount = Math.floor(config.questionAmount * 0.5)
    const listeningCount = Math.floor(config.questionAmount * 0.5)

    // 3. prompt
    const prompt = `
You are a strict JSON generator for a DL2E exam system.

ABSOLUTE RULES:
- Output MUST be valid JSON
- Output MUST start with { and end with }
- Do NOT include markdown
- Do NOT include explanations
- Do NOT include any extra text before or after JSON
- You must NOT include any extra resources like images for reading and listening section
- Do NOT reference pictures, images, photos, diagrams, illustrations, emojis, icons, or external media
- Do NOT write phrases like:
  "(picture of a cat)"
  "(image of an apple)"
  "(see photo)"
  "(look at the image)"
- Every question must be fully answerable using text only

SCHEMA:
{
  "testId": "${config.testId}",

  "readingQuestions": [
    {
      "questionId": number,
      "questionContent": string,
      "questionVNMContent": string,
      "answers": [string, string, string, string],
      "correctAnswer": string
    }
  ],

  "listeningQuestions": [
    {
      "questionId": number,
      "questionContent": string,
      "questionVNMContent": string,
      "answers": [string, string, string, string],
      "correctAnswer": string,
      "ttsText": string
    }
  ],

  "writingTasks": [
    {
      "taskId": number,
      "taskContent": string,
      "taskVNMContent": string
    }
  ]
}

REQUIREMENTS:
- readingQuestions length = ${readingCount}
- listeningQuestions length = ${listeningCount}
- writingTasks length = ${config.wrTaskAmount}
- difficulty = ${config.testDifficulty}

OUTPUT ONLY JSON.
`

    // 4. Gemini request
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    )

    // 5. handle API failure properly
    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.log("❌ GEMINI FAILED:", errText)

      return new Response(
        JSON.stringify({
          error: "Gemini API failed",
          details: errText,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    const aiData = await aiRes.json()
    console.log("🤖 GEMINI RAW:", aiData)

    // 6. extract safely
    const candidate = aiData?.candidates?.[0]

    const content =
      candidate?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("") ?? null

    if (!content) {
      return new Response(
        JSON.stringify({
          error: "Gemini returned empty content",
          raw: aiData,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    // 7. parse final JSON
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "AI returned invalid JSON",
          raw: content,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    // 8. success
    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    })
  } catch (err) {
    console.error("💥 CRASH:", err)

    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})