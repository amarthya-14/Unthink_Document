/**
 * Gemini provider — uses function calling via the generateContent REST API.
 *
 * Google renames/retires Gemini model IDs frequently (2.5 -> 3.5 -> 3.6 -> 3.7
 * Flash, all within a few months), so rather than hardcode one version and
 * have it break every time Google ships a new one, this provider first asks
 * the API which models the current key actually has access to (ListModels),
 * picks the best available Flash-family model, and caches that choice for
 * the session. If listing fails for any reason, it falls back to trying a
 * short list of recent candidates in order.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

const FALLBACK_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter(Boolean)

let cachedModel = null

async function discoverModel(apiKey) {
  if (cachedModel) return cachedModel

  try {
    const res = await fetch(`${BASE}/models?key=${encodeURIComponent(apiKey)}`)
    if (!res.ok) throw new Error('list models failed')
    const data = await res.json()

    const candidates = (data.models || [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          /flash/i.test(m.name) &&
          !/image|audio|tts|embedding/i.test(m.name)
      )
      // Prefer non-preview, non-lite models first (better quality), then anything left.
      .sort((a, b) => {
        const score = (m) => (/preview|lite/i.test(m.name) ? 1 : 0)
        return score(a) - score(b)
      })

    if (candidates.length > 0) {
      // name looks like "models/gemini-3.6-flash" — strip the prefix.
      cachedModel = candidates[0].name.replace(/^models\//, '')
      return cachedModel
    }
  } catch {
    // fall through to hardcoded candidates
  }

  return null
}

export async function callGemini({ apiKey, systemPrompt, userPrompt, functionSchema, onStep }) {
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    tools: [{ functionDeclarations: [functionSchema] }],
    toolConfig: {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [functionSchema.name] },
    },
    generationConfig: { temperature: 0.3 },
  }

  const discovered = await discoverModel(apiKey)
  const candidates = discovered ? [discovered, ...FALLBACK_CANDIDATES] : FALLBACK_CANDIDATES

  let lastError = null

  for (const model of [...new Set(candidates)]) {
    const url = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      const call = data.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall
      if (!call) throw new Error('Gemini did not return a structured summary. Try again.')
      onStep?.({ label: 'Model responded', detail: model })
      cachedModel = model
      return call.args
    }

    const errBody = await response.text().catch(() => '')
    const isModelIssue = response.status === 404 || /not found|no longer available|not supported/i.test(errBody)

    if (!isModelIssue) {
      throw new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 200)}`)
    }

    lastError = `${model} unavailable (${response.status})`
    onStep?.({ label: 'Model unavailable, trying next', detail: model })
  }

  throw new Error(
    `None of the Gemini models tried are available on this key. Last error: ${lastError}. ` +
      `Check https://ai.google.dev/gemini-api/docs/models for current model IDs and set VITE_GEMINI_MODEL in .env to force one.`
  )
}
