/**
 * Gemini provider — uses Gemini 2.5 Flash via REST with function calling.
 * Free tier: no billing card required, ~1M token context, function calling
 * supported. Generally produces noticeably better structured summaries
 * than smaller open models, which is why it's the default provider.
 */

const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function callGemini({ apiKey, systemPrompt, userPrompt, functionSchema }) {
  const url = `${ENDPOINT}?key=${encodeURIComponent(apiKey)}`

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    tools: [{ functionDeclarations: [functionSchema] }],
    toolConfig: {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [functionSchema.name] },
    },
    generationConfig: { temperature: 0.3 },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    const err = new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 200)}`)
    err.status = response.status
    err.raw = errBody
    throw err
  }

  const data = await response.json()
  const call = data.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall

  if (!call) {
    throw new Error('Gemini did not return a structured summary. Try again.')
  }

  // Gemini returns args as a parsed object already, unlike Groq/OpenAI-style
  // providers which return a JSON string.
  return call.args
}
