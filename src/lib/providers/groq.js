/**
 * Groq provider — OpenAI-compatible tool calling, Llama/OSS models.
 *
 * Like Gemini, Groq's available model IDs shift over time, so this
 * provider discovers which chat-capable models the current key actually
 * has access to before falling back to a hardcoded list, and — critically
 * — moves to the next candidate on ANY failure (bad model, rate limit, or
 * an incomplete/malformed tool call from a weaker model) rather than
 * aborting on the first one that doesn't match a specific error pattern.
 */

const BASE = 'https://api.groq.com/openai/v1'

const FALLBACK_CANDIDATES = [
  import.meta.env.VITE_GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
].filter(Boolean)

let cachedModel = null

async function discoverModels(apiKey) {
  try {
    const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) return []
    const data = await res.json()

    return (data.data || [])
      .map((m) => m.id)
      .filter((id) => !/whisper|tts|guard|embedding|vision/i.test(id))
      // Prefer larger/more capable models first for better structured output.
      .sort((a, b) => {
        const score = (id) => (/70b|120b|maverick/i.test(id) ? 0 : /8b|20b|scout/i.test(id) ? 1 : 2)
        return score(a) - score(b)
      })
  } catch {
    return []
  }
}

export async function callGroq({ apiKey, systemPrompt, userPrompt, functionSchema, onStep }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const tool = { type: 'function', function: functionSchema }

  const discovered = cachedModel ? [cachedModel] : await discoverModels(apiKey)
  const candidates = [...new Set([...discovered, ...FALLBACK_CANDIDATES])]

  let lastError = null

  for (const model of candidates) {
    try {
      const response = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          tools: [tool],
          tool_choice: { type: 'function', function: { name: functionSchema.name } },
          temperature: 0.3,
          max_tokens: 2048,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`Groq API error (${response.status}): ${errBody.slice(0, 200)}`)
      }

      const data = await response.json()
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]

      if (!toolCall) throw new Error('Model did not return a tool call.')

      let args
      try {
        args = JSON.parse(toolCall.function.arguments)
      } catch {
        throw new Error('Model returned malformed JSON.')
      }

      if (!args.title || !args.summary) {
        throw new Error('Model returned an incomplete summary (missing required fields).')
      }

      onStep?.({ label: 'Model responded', detail: model })
      cachedModel = model
      return args
    } catch (err) {
      lastError = err
      onStep?.({ label: 'Model unavailable, trying next', detail: `${model} — ${err.message.slice(0, 60)}` })
    }
  }

  throw new Error(`None of the Groq models tried worked. Last error: ${lastError?.message || 'unknown'}.`)
}
