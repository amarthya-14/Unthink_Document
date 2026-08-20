/**
 * Groq provider — OpenAI-compatible tool calling, Llama models.
 * Kept as an alternative to Gemini: faster inference, but generally
 * produces slightly less polished summaries on the free-tier models.
 */

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

const MODEL_CANDIDATES = [
  import.meta.env.VITE_GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'openai/gpt-oss-20b',
].filter(Boolean)

export async function callGroq({ apiKey, systemPrompt, userPrompt, functionSchema, onStep }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const tool = { type: 'function', function: functionSchema }

  let lastError = null

  for (const model of MODEL_CANDIDATES) {
    const response = await fetch(ENDPOINT, {
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
      }),
    })

    if (response.ok) {
      const data = await response.json()
      onStep?.({ label: 'Model responded', detail: model })
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
      if (!toolCall) throw new Error('Agent did not return a structured summary. Try again.')
      return JSON.parse(toolCall.function.arguments)
    }

    const errBody = await response.text().catch(() => '')
    const isModelIssue = response.status === 404 || /model_not_found|does not exist/i.test(errBody)

    if (!isModelIssue) {
      throw new Error(`Groq API error (${response.status}): ${errBody.slice(0, 200)}`)
    }

    lastError = `${model} unavailable (${response.status})`
    onStep?.({ label: 'Model unavailable, trying next', detail: model })
  }

  throw new Error(
    `None of the configured Groq models are available on this key. Last error: ${lastError}.`
  )
}
