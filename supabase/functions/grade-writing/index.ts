import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    const { exam, answers } = await req.json()

    const prompt = `
You are an English examiner.

Grade writing tasks strictly using CEFR levels (A1–C2).

Return ONLY valid JSON:

{
  "writingScores": [
    {
      "taskId": number,
      "score": number (0-5),
      "level": "A1|A2|B1|B2|C1|C2",
      "feedback": string
    }
  ],
  "totalScore": number
}

RULES:
- Be strict
- Consider grammar, vocabulary, coherence, task completion
- Output ONLY JSON, no markdown, no text
- Max score per task = 5

TASKS:
${exam.writingTasks
  .map(
    (t: any) => `
Task ${t.taskId}: ${t.taskContent}
Answer: ${answers.writing[t.taskId] || ""}
`
  )
  .join("\n")}
`

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    )

    const aiData = await aiRes.json()

    const text =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text

    const parsed = JSON.parse(text)

    return new Response(
      JSON.stringify({
        writingScore: parsed.totalScore,
        breakdown: parsed.writingScores,
        mcqScore: 0, // optional later merge
      }),
      {
        headers: { ...cors, "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: cors }
    )
  }
})