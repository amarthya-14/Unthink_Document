const STAGES = [
  { key: 'upload', label: 'Upload' },
  { key: 'extract', label: 'Extract' },
  { key: 'summarize', label: 'Summarize' },
  { key: 'done', label: 'Done' },
]

/**
 * phase: 'idle' | 'extract' | 'ocr' | 'summarize' | 'done' | 'error'
 * 'ocr' is treated as part of the 'extract' visual stage.
 */
export default function Stepper({ phase }) {
  const phaseToStageIndex = {
    idle: -1,
    extract: 1,
    ocr: 1,
    summarize: 2,
    done: 3,
    error: -1,
  }
  const activeIndex = phaseToStageIndex[phase] ?? -1

  return (
    <div className="flex items-center" aria-label="Processing progress">
      {STAGES.map((stage, i) => {
        const isComplete = phase === 'done' ? true : i < activeIndex || (i === 0 && activeIndex >= 0)
        const isActive = i === activeIndex && phase !== 'done'
        const isPending = !isComplete && !isActive

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  relative w-7 h-7 rounded-full flex items-center justify-center
                  text-[11px] font-mono transition-all duration-300
                  ${isComplete ? 'bg-brass-500 text-ink-950' : ''}
                  ${isActive ? 'bg-steel-500 text-paper-50 ring-4 ring-steel-500/20' : ''}
                  ${isPending ? 'bg-ink-800 text-paper-100/30 border border-ink-700' : ''}
                `}
              >
                {isComplete ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-steel-500/40" />
                )}
              </div>
              <span
                className={`text-[11px] font-mono transition-colors duration-300 ${
                  isActive ? 'text-steel-400' : isComplete ? 'text-brass-500/80' : 'text-paper-100/25'
                }`}
              >
                {stage.label}
              </span>
            </div>

            {i < STAGES.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 bg-ink-700 relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-brass-500 transition-transform duration-500 ease-out origin-left ${
                    i < activeIndex || phase === 'done' ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
