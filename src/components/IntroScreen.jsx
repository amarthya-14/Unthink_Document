import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const RULER_TICKS = Array.from({ length: 12 })

export default function IntroScreen({ onScan }) {
  const wrapRef = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  // Very subtle parallax drift on the framing elements — depth without a
  // card that tilts. Brackets and grid shift a few px opposite the cursor.
  const shiftX = useSpring(useTransform(mx, [-0.5, 0.5], [10, -10]), { stiffness: 60, damping: 20 })
  const shiftY = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 60, damping: 20 })
  const beamX = useTransform(mx, [-0.5, 0.5], ['42%', '58%'])

  function handleMouseMove(e) {
    const rect = wrapRef.current.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleMouseLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="fixed inset-0 z-50 bg-ink-900 overflow-hidden select-none"
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
    >
      {/* faint blueprint grid, fills the whole viewport */}
      <motion.div
        style={{ x: shiftX, y: shiftY }}
        className="pointer-events-none absolute -inset-8 opacity-[0.05]"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(to right, #F6F3EC 1px, transparent 1px), linear-gradient(to bottom, #F6F3EC 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </motion.div>

      {/* ambient glow, off-center so it isn't just a centered blob */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(76,122,146,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_82%,rgba(201,162,39,0.08),transparent_40%)]" />

      {/* idle ambient scan beam, slowly breathing top to bottom while waiting */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brass-500/[0.05] to-transparent"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      {/* viewfinder corner brackets, framing the entire page like a scanner bed */}
      <motion.div style={{ x: shiftX, y: shiftY }} className="pointer-events-none absolute inset-0">
        {[
          { pos: 'top-6 left-6 sm:top-10 sm:left-10', rotate: 0 },
          { pos: 'top-6 right-6 sm:top-10 sm:right-10', rotate: 90 },
          { pos: 'bottom-6 right-6 sm:bottom-10 sm:right-10', rotate: 180 },
          { pos: 'bottom-6 left-6 sm:bottom-10 sm:left-10', rotate: 270 },
        ].map((c, i) => (
          <motion.svg
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className={`absolute ${c.pos} text-brass-500/70`}
            style={{ transform: `rotate(${c.rotate}deg)` }}
          >
            <path d="M2 12V4a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </motion.svg>
        ))}
      </motion.div>

      {/* left-edge ruler, reinforcing the "scanner bed" idea */}
      <div className="pointer-events-none hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 flex-col items-center gap-3 font-mono text-[10px] text-paper-100/20">
        {RULER_TICKS.map((_, i) => (
          <span key={i} className="w-px h-3 bg-paper-100/20" />
        ))}
      </div>

      {/* main content, filling the page rather than sitting in a small card */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-steel-400 mb-5"
        >
          Document Intake · Ready to Scan
        </motion.span>

        <div className="relative">
          {/* chromatic "misaligned scan" ghost layers converging into focus */}
          <motion.h1
            aria-hidden="true"
            initial={{ x: -14, y: 6, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 0.55 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 font-display text-[clamp(4rem,19vw,13rem)] leading-[0.9] tracking-tight text-steel-400 mix-blend-screen"
          >
            Scanline
          </motion.h1>
          <motion.h1
            aria-hidden="true"
            initial={{ x: 14, y: -6, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 0.45 }}
            transition={{ duration: 1, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 font-display text-[clamp(4rem,19vw,13rem)] leading-[0.9] tracking-tight text-brass-400 mix-blend-screen"
          >
            Scanline
          </motion.h1>

          {/* the real, crisp title */}
          <motion.h1
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              textShadow: [
                '0 0 90px rgba(217,184,74,0.25), 0 0 30px rgba(217,184,74,0.12)',
                '0 0 110px rgba(217,184,74,0.35), 0 0 36px rgba(217,184,74,0.18)',
                '0 0 90px rgba(217,184,74,0.25), 0 0 30px rgba(217,184,74,0.12)',
              ],
            }}
            transition={{
              opacity: { duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
              filter: { duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
              textShadow: { duration: 3.5, delay: 1.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative font-display text-[clamp(4rem,19vw,13rem)] leading-[0.9] tracking-tight text-paper-50"
          >
            Scanline
          </motion.h1>

          {/* scan line that sweeps once across the wordmark as it settles */}
          <motion.div
            initial={{ top: '-10%', opacity: 1 }}
            animate={{ top: '110%', opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.65, 0, 0.35, 1] }}
            className="pointer-events-none absolute inset-x-[-5%] h-[3px] bg-brass-300 shadow-[0_0_24px_6px_rgba(217,184,74,0.7)]"
          />
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
          className="h-px w-40 sm:w-56 bg-gradient-to-r from-transparent via-brass-500 to-transparent origin-center mt-6 mb-6"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="font-body text-[15px] sm:text-base text-paper-100/50 max-w-sm"
        >
          A single agent that reads, understands, and summarizes any document you hand it.
        </motion.p>

        <motion.button
          type="button"
          onClick={onScan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="group relative mt-10 px-8 py-3.5 rounded-[2px] font-mono text-xs uppercase tracking-[0.2em] text-paper-50 overflow-hidden border border-brass-500/40"
        >
          <span className="absolute inset-0 bg-brass-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
          <span className="relative flex items-center gap-2.5 group-hover:text-ink-950 transition-colors duration-200">
            Scan Now
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.button>
      </div>

      {/* moving x-position readout, ties the cursor to the "scanner head" metaphor */}
      <motion.div
        style={{ left: beamX }}
        className="pointer-events-none hidden sm:block absolute top-8 -translate-x-1/2 font-mono text-[10px] text-brass-500/40 tracking-widest"
      >
        SCAN·HEAD
      </motion.div>

      <button
        type="button"
        onClick={onScan}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-xs font-mono text-paper-100/25 hover:text-paper-100/50 transition-colors duration-200 underline underline-offset-4"
      >
        skip
      </button>
    </motion.div>
  )
}
