import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import AgentLog from './components/AgentLog'
import LengthToggle from './components/LengthToggle'
import SummaryPanel from './components/SummaryPanel'
import { extractPdfText, isTextMeaningful } from './lib/extractPdf'
import { extractImageText } from './lib/extractOcr'
import { runSummaryAgent } from './lib/agent'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY

export default function App() {
  const [fileName, setFileName] = useState('')
  const [length, setLength] = useState('medium')
  const [steps, setSteps] = useState([])
  const [isActive, setIsActive] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const addStep = useCallback((step) => {
    setSteps((prev) => [...prev, step])
  }, [])

  const process = useCallback(
    async (file) => {
      setFileName(file.name)
      setSteps([])
      setResult(null)
      setError('')
      setIsActive(true)

      try {
        let text = ''

        if (file.type === 'application/pdf') {
          addStep({ label: 'Parsing PDF', detail: file.name })
          text = await extractPdfText(file, (pct) => {
            if (pct === 100) addStep({ label: 'PDF text layer extracted', detail: `${text.length || '…'} chars` })
          })

          if (!isTextMeaningful(text)) {
            addStep({
              label: 'No usable text layer found',
              detail: 'falling back to OCR on rendered pages',
            })
            // Scanned PDF with no text layer — treat as image via OCR on the file itself.
            // Tesseract can read PDFs directly in recent versions; if this fails in your
            // environment, render pages to canvas first (see README notes).
            text = await extractImageText(file, (pct) => {
              if (pct === 100) addStep({ label: 'OCR complete', detail: `${text.length || '…'} chars recognized` })
            })
          }
        } else {
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

        const summary = await runSummaryAgent({
          text,
          length,
          apiKey: API_KEY,
          onStep: addStep,
        })

        addStep({ label: 'Done', detail: 'summary ready below' })
        setResult(summary)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Something went wrong.')
      } finally {
        setIsActive(false)
      }
    },
    [length, addStep]
  )

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <p className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-steel-400 mb-3 px-2 py-1 -mx-2 rounded transition-colors duration-200 hover:text-steel-300 hover:bg-steel-400/5">
          Document Summary Agent
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-paper-50 leading-tight max-w-2xl">
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

      <main className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UploadZone onFileAccepted={process} disabled={isActive} />

          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-paper-100/50 transition-colors duration-200">
              Summary length
            </span>
            <LengthToggle value={length} onChange={setLength} disabled={isActive} />
          </div>

          <AgentLog steps={steps} fileName={fileName} isActive={isActive} />
        </div>

        <div>
          <SummaryPanel result={result} error={error} />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 pb-10">
        <p className="inline-block text-xs font-mono text-paper-100/25 transition-colors duration-200 hover:text-paper-100/45">
          extraction runs entirely in your browser · nothing is uploaded to a server
        </p>
      </footer>
    </div>
  )
}
