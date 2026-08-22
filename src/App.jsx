import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import UploadZone from './components/UploadZone'
import AgentLog from './components/AgentLog'
import Stepper from './components/Stepper'
import LengthToggle from './components/LengthToggle'
import SummaryPanel from './components/SummaryPanel'
import { extractPdfText, isTextMeaningful } from './lib/extractPdf'
import { extractImageText } from './lib/extractOcr'
import { runSummaryAgent } from './lib/agent'

const LARGE_FILE_BYTES = 15 * 1024 * 1024 // 15MB — client-side OCR/parsing gets noticeably slower past this

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function App() {
  const [fileName, setFileName] = useState('')
  const [length, setLength] = useState('medium')
  const [steps, setSteps] = useState([])
  const [phase, setPhase] = useState('idle') // idle | extract | ocr | summarize | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const progressRef = useRef(null)
  const summaryRef = useRef(null)
  const lastReportedPct = useRef(0)

  const isActive = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  const addStep = useCallback((step) => {
    setSteps((prev) => [...prev, step])
  }, [])

  // Auto-scroll: bring the progress section into view once processing
  // starts (matters most on mobile, where panels stack vertically), then
  // bring the finished summary into view once it's ready.
  useEffect(() => {
    if (phase === 'extract') {
      setTimeout(() => progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
    if (phase === 'done') {
      setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [phase])

  const process = useCallback(
    async (file) => {
      setFileName(file.name)
      setSteps([])
      setResult(null)
      setError('')
      setPhase('extract')
      lastReportedPct.current = 0

      if (file.size > LARGE_FILE_BYTES) {
        addStep({
          label: 'Large file detected',
          detail: `${(file.size / (1024 * 1024)).toFixed(1)}MB — this may take a bit longer`,
        })
      }

      try {
        let text = ''

        if (file.type === 'application/pdf') {
          addStep({ label: 'Parsing PDF', detail: file.name })
          text = await extractPdfText(file, (pct, pageNum, totalPages) => {
            // Report every ~20% instead of only at completion, so large
            // multi-page PDFs show visible progress instead of looking stuck.
            if (pct - lastReportedPct.current >= 20 || pct === 100) {
              lastReportedPct.current = pct
              addStep({
                label: pct === 100 ? 'PDF text layer extracted' : 'Extracting PDF pages',
                detail: totalPages > 1 ? `page ${pageNum} of ${totalPages} · ${pct}%` : `${pct}%`,
              })
            }
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
        const summary = await runSummaryAgent({ text, length, onStep: addStep })

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
    <div className="min-h-screen flex flex-col relative">
      {/* faint grid, echoing the intro screen for visual continuity */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #F6F3EC 1px, transparent 1px), linear-gradient(to bottom, #F6F3EC 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

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
            gemini · auto-fallback
          </span>
        </div>
      </div>

      <motion.header
        variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 w-full"
      >
        <motion.p
          variants={item}
          className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-steel-400 mb-3 px-2 py-1 -mx-2 rounded transition-colors duration-200 hover:text-steel-300 hover:bg-steel-400/5"
        >
          Document Summary Agent
        </motion.p>
        <motion.h1 variants={item} className="font-display text-3xl sm:text-5xl text-paper-50 leading-tight max-w-2xl">
          Feed it a document.
          <br />
          Watch the agent read it.
        </motion.h1>
        <motion.div
          variants={item}
          className="h-px w-28 bg-gradient-to-r from-brass-500 to-transparent mt-5 mb-5 origin-left"
        />
        <motion.p variants={item} className="text-paper-100/50 font-body max-w-xl text-[15px]">
          Upload a PDF or a scanned image. A single agent extracts the text,
          falls back to OCR when needed, and reasons its way to a summary —
          you can watch each step happen below.
        </motion.p>
      </motion.header>

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid md:grid-cols-2 gap-6 w-full flex-1"
      >
        <div className="space-y-6 min-w-0">
          <motion.div variants={item}>
            <UploadZone onFileAccepted={process} disabled={isActive} />
          </motion.div>

          <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-body text-paper-100/50 transition-colors duration-200">
              Summary length
            </span>
            <LengthToggle value={length} onChange={setLength} disabled={isActive} />
          </motion.div>

          <div ref={progressRef} className="scroll-mt-20 space-y-6">
            {phase !== 'idle' && (
              <div className="rounded-lg border border-ink-700 bg-ink-800/60 px-4 sm:px-6 py-5 animate-[fadeIn_0.3s_ease-out]">
                <Stepper phase={phase} />
              </div>
            )}

            <motion.div variants={item}>
              <AgentLog steps={steps} fileName={fileName} isActive={isActive} />
            </motion.div>
          </div>
        </div>

        <motion.div ref={summaryRef} variants={item} className="min-w-0 scroll-mt-20">
          <SummaryPanel result={result} error={error} isLoading={phase === 'summarize'} />
        </motion.div>
      </motion.main>

      <footer className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-10 w-full">
        <p className="inline-block text-xs font-mono text-paper-100/25 transition-colors duration-200 hover:text-paper-100/45">
          extraction runs entirely in your browser · nothing is uploaded to a server
        </p>
      </footer>
    </div>
  )
}
