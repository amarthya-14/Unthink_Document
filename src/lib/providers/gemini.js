/**
 * Gemini provider — uses function calling via the generateContent REST API.
 *
 * Google renames/retires Gemini model IDs frequently, so rather than
 * hardcode one version, this provider first asks the API which models the
 * current key actually has access to (ListModels), then tries candidates
 * in order — importantly, ANY failure (wrong model, rate limit, malformed
 * response) moves to the next candidate rather than aborting, so one bad
 * model doesn't take down the whole provider.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

const FALLBACK_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash',
].filter(Boolean)

let cachedModel = null

async function discoverModels(apiKey) {
  try {
    const res = await fetch(`${BASE}/models?key=${encodeURIComponent(apiKey)}`)
    if (!res.ok) return []
    const data = await res.json()

    return (data.models || [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          /flash/i.test(m.name) &&
          !/image|audio|tts|embedding/i.test(m.name)
      )
      .sort((a, b) => {
        const score = (m) => (/preview|lite/i.test(m.name) ? 1 : 0)
        return score(a) - score(b)
      })
      .map((m) => m.name.replace(/^models\//, ''))
  } catch {
    return []
  }
}

export async function callGemini({ apiKey, systemPrompt, userPrompt, functionSchema, onStep }) {
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    tools: [{ functionDeclarations: [functionSchema] }],
    toolConfig: {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [functionSchema.name] },
    },
    generationConfig: { temperature: 0.3, maxOutputTokens: 3072 },
  }

  const discovered = cachedModel ? [cachedModel] : await discoverModels(apiKey)
  const candidates = [...new Set([...discovered, ...FALLBACK_CANDIDATES])]

  let lastError = null

  for (const model of candidates) {
    const url = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 200)}`)
      }

      const data = await response.json()
      const call = data.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall

      if (!call || !call.args?.title || !call.args?.summary) {
        throw new Error('Gemini returned an incomplete summary (missing required fields).')
      }

      onStep?.({ label: 'Model responded', detail: model })
      cachedModel = model
      return call.args
    } catch (err) {
      lastError = err
      onStep?.({ label: 'Model unavailable, trying next', detail: `${model} — ${err.message.slice(0, 60)}` })
    }
  }

  throw new Error(
    `None of the Gemini models tried worked. Last error: ${lastError?.message || 'unknown'}. ` +
      `Check https://ai.google.dev/gemini-api/docs/models for current model IDs and set VITE_GEMINI_MODEL in .env to force one.`
  )
}
