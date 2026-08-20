import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function IntroScreen({ onScan }) {
  const cardRef = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 160, damping: 18 })
  const glowX = useTransform(mx, [-0.5, 0.5], ['20%', '80%'])
  const glowY = useTransform(my, [-0.5, 0.5], ['20%', '80%'])

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleMouseLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900 overflow-hidden px-6"
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
    >
      {/* ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(76,122,146,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(201,162,39,0.06),transparent_45%)]" />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[300px] sm:w-[360px] aspect-[3/4] bg-paper-50 rounded-[3px] flex flex-col p-7 sm:p-9 shadow-[0_50px_100px_-25px_rgba(0,0,0,0.65)]"
      >
        {/* mouse-follow sheen */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[3px] opacity-60"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.5), transparent 45%)`
            ),
          }}
        />
        {/* subtle paper grain */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[3px] opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <span className="relative font-mono text-[10px] uppercase tracking-[0.25em] text-ink-800/40">
          Document Intake
        </span>

        <div className="relative flex-1 flex flex-col items-center justify-center text-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-brass-600 mb-4">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h1 className="font-display text-4xl sm:text-[44px] text-ink-900 tracking-tight">Scanline</h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-ink-800/55 max-w-[220px]">
            A single agent that reads, understands, and summarizes any document you hand it.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={onScan}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="relative group w-full py-3 rounded-[2px] bg-ink-900 text-paper-50 font-mono text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-brass-600 via-brass-500 to-brass-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative group-hover:text-ink-950 transition-colors duration-300">Scan Now</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="relative transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink-950"
          >
            <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </motion.div>

      <button
        type="button"
        onClick={onScan}
        className="absolute bottom-6 text-xs font-mono text-paper-100/25 hover:text-paper-100/50 transition-colors duration-200 underline underline-offset-4"
      >
        skip
      </button>
    </motion.div>
  )
}
