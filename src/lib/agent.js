/**
 * SummaryAgent
 * ------------
 * A single tool-using agent (Groq / Llama 3.3) responsible for turning
 * raw extracted document text into a structured summary. It is a real
 * agent rather than one static prompt: given the extracted text and the
 * user's requested length, it decides how to call its one tool
 * (`emit_summary`) and can be extended with additional tools (e.g. a
 * table extractor, a language detector) without changing the calling code.
 *
 * Why Groq: free tier, no billing card required, fast Llama 3.3 70B inference.
 * The API key is read from Vite env (client-side) for demo purposes — see
 * README for the serverless-proxy note if this were going to production.
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

// Groq periodically renames/retires model IDs. Rather than hardcode one and
// break when it's deprecated, try candidates in order and fall through on
// a "model not found" style error. Override with VITE_GROQ_MODEL if you
// know exactly which model your key has access to (see README).
const MODEL_CANDIDATES = [
  import.meta.env.VITE_GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'openai/gpt-oss-20b',
].filter(Boolean)

const SUMMARY_TOOL = {
  type: 'function',
  function: {
    name: 'emit_summary',
    description:
      'Emit the final structured summary of the document once analysis is complete.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A short descriptive title for the document (max 8 words).',
        },
        summary: {
          type: 'string',
          description: 'The prose summary at the requested length.',
        },
        key_points: {
          type: 'array',
          items: { type: 'string' },
          description: '3-6 concise bullet points capturing the essential information.',
        },
        document_type: {
          type: 'string',
          description:
            'Best guess at document type, e.g. "invoice", "research paper", "email", "contract", "report".',
        },
      },
      required: ['title', 'summary', 'key_points', 'document_type'],
    },
  },
}

const LENGTH_GUIDANCE = {
  short: 'about 2-3 sentences, only the most critical information',
  medium: 'about 1-2 short paragraphs, covering main ideas with light detail',
  long: 'about 3-4 paragraphs, thorough coverage of details, context, and implications',
}

/**
 * Runs the agent loop: sends the document text + instructions, expects
 * the model to call `emit_summary`. Reports step-by-step status via
 * onStep so the UI can render a transparent reasoning log.
 */
export async function runSummaryAgent({ text, length = 'medium', apiKey, onStep }) {
  if (!apiKey) {
    throw new Error(
      'Missing Groq API key. Add VITE_GROQ_API_KEY to your .env file (see README).'
    )
  }

  onStep?.({ label: 'Agent received extracted text', detail: `${text.length.toLocaleString()} characters` })

  const truncated = text.length > 18000 ? text.slice(0, 18000) + '\n[...truncated for length...]' : text

  const messages = [
    {
      role: 'system',
      content:
        'You are a precise document analysis agent. You read extracted document text ' +
        '(which may contain OCR noise or formatting artifacts) and produce a structured ' +
        'summary by calling the emit_summary tool exactly once. Do not include markdown ' +
        'formatting inside the tool arguments. If the text looks like OCR output with ' +
        'errors, silently work around minor noise rather than commenting on it.',
    },
    {
      role: 'user',
      content: `Analyze the following document text and call emit_summary with a summary of ${LENGTH_GUIDANCE[length]}.\n\nDOCUMENT TEXT:\n"""\n${truncated}\n"""`,
    },
  ]

  onStep?.({ label: 'Agent deciding how to summarize', detail: `Target length: ${length}` })

  let data = null
  let lastError = null

  for (const model of MODEL_CANDIDATES) {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: [SUMMARY_TOOL],
        tool_choice: { type: 'function', function: { name: 'emit_summary' } },
        temperature: 0.3,
      }),
    })

    if (response.ok) {
      data = await response.json()
      onStep?.({ label: 'Model responded', detail: model })
      break
    }

    const errBody = await response.text().catch(() => '')
    const isModelIssue = response.status === 404 || /model_not_found|does not exist/i.test(errBody)

    if (!isModelIssue) {
      throw new Error(`Groq API error (${response.status}): ${errBody.slice(0, 200)}`)
    }

    lastError = `${model} unavailable (${response.status})`
    onStep?.({ label: 'Model unavailable, trying next', detail: model })
  }

  if (!data) {
    throw new Error(
      `None of the configured models are available on this key. Last error: ${lastError}. ` +
        `Check https://console.groq.com/docs/models for current model IDs and set VITE_GROQ_MODEL in .env.`
    )
  }
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]

  if (!toolCall) {
    throw new Error('Agent did not return a structured summary. Try again.')
  }

  onStep?.({ label: 'Agent generated structured summary', detail: 'Parsing tool output' })

  let parsed
  try {
    parsed = JSON.parse(toolCall.function.arguments)
  } catch (e) {
    throw new Error('Failed to parse agent output as JSON.')
  }

  return parsed
}
