import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import AgentLog from './components/AgentLog'
import Stepper from './components/Stepper'
import LengthToggle from './components/LengthToggle'
import SummaryPanel from './components/SummaryPanel'
import { extractPdfText, isTextMeaningful } from './lib/extractPdf'
import { extractImageText } from './lib/extractOcr'
import { runSummaryAgent } from './lib/agent'

const PROVIDER = import.meta.env.VITE_AI_PROVIDER === 'groq' ? 'groq' : 'gemini'
const API_KEY =
  PROVIDER === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_GEMINI_API_KEY

export default function App() {
  const [fileName, setFileName] = useState('')
  const [length, setLength] = useState('medium')
  const [steps, setSteps] = useState([])
  const [phase, setPhase] = useState('idle') // idle | extract | ocr | summarize | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const isActive = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  const addStep = useCallback((step) => {
    setSteps((prev) => [...prev, step])
  }, [])

  const process = useCallback(
    async (file) => {
      setFileName(file.name)
      setSteps([])
      setResult(null)
      setError('')
      setPhase('extract')

      try {
        let text = ''

        if (file.type === 'application/pdf') {
          addStep({ label: 'Parsing PDF', detail: file.name })
          text = await extractPdfText(file, (pct) => {
            if (pct === 100) addStep({ label: 'PDF text layer extracted', detail: `${text.length || '…'} chars` })
          })

          if (!isTextMeaningful(text)) {
            setPhase('ocr')
            addStep({
              label: 'No usable text layer found',
              detail: 'falling back to OCR on rendered pages',
            })
            text = await extractImageText(file, (pct) => {
              if (pct === 100) addStep({ label: 'OCR complete', detail: `${text.length || '…'} chars recognized` })
            })
          }
        } else {
          setPhase('ocr')
          addStep({ label: 'Running OCR on image', detail: file.name })
          text = await extractImageText(file, (pct) => {
            if (pct === 100) addStep({ label: 'OCR complete', detail: `${text.length || '…'} chars recognized` })
          })
        }

        if (!isTextMeaningful(text)) {
          throw new Error(
            'Could not extract readable text from this document. Try a clearer scan or a different file.'
          )
        }

        setPhase('summarize')
        const summary = await runSummaryAgent({
          text,
          length,
          apiKey: API_KEY,
          provider: PROVIDER,
          onStep: addStep,
        })

        addStep({ label: 'Done', detail: 'summary ready below' })
        setResult(summary)
        setPhase('done')
      } catch (err) {
        console.error(err)
        setError(err.message || 'Something went wrong.')
        setPhase('error')
      }
    },
    [length, addStep]
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky top bar */}
      <div className="safe-top sticky top-0 z-20 backdrop-blur-md bg-ink-900/80 border-b border-ink-700/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brass-500">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[15px] text-paper-50 tracking-tight">Scanline</span>
          </div>
          <span className="hidden sm:inline text-[11px] font-mono text-paper-100/30 uppercase tracking-wider">
            {PROVIDER === 'groq' ? 'groq · llama' : 'gemini 2.5 flash'}
          </span>
        </div>
      </div>

      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 w-full">
        <p className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-steel-400 mb-3 px-2 py-1 -mx-2 rounded transition-colors duration-200 hover:text-steel-300 hover:bg-steel-400/5">
          Document Summary Agent
        </p>
        <h1 className="font-display text-3xl sm:text-5xl text-paper-50 leading-tight max-w-2xl">
          Feed it a document.
          <br />
          Watch the agent read it.
        </h1>
        <p className="mt-4 text-paper-100/50 font-body max-w-xl text-[15px]">
          Upload a PDF or a scanned image. A single agent extracts the text,
          falls back to OCR when needed, and reasons its way to a summary —
          you can watch each step happen below.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid md:grid-cols-2 gap-6 w-full flex-1">
        <div className="space-y-6 min-w-0">
          <UploadZone onFileAccepted={process} disabled={isActive} />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-body text-paper-100/50 transition-colors duration-200">
              Summary length
            </span>
            <LengthToggle value={length} onChange={setLength} disabled={isActive} />
          </div>

          {phase !== 'idle' && (
            <div className="rounded-lg border border-ink-700 bg-ink-800/60 px-4 sm:px-6 py-5 animate-[fadeIn_0.3s_ease-out]">
              <Stepper phase={phase} />
            </div>
          )}

          <AgentLog steps={steps} fileName={fileName} isActive={isActive} />
        </div>

        <div className="min-w-0">
          <SummaryPanel result={result} error={error} isLoading={phase === 'summarize'} />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 w-full">
        <p className="inline-block text-xs font-mono text-paper-100/25 transition-colors duration-200 hover:text-paper-100/45">
          extraction runs entirely in your browser · nothing is uploaded to a server
        </p>
      </footer>
    </div>
  )
}
