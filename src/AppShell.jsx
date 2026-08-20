import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IntroScreen from './components/IntroScreen'
import ScanSweep from './components/ScanSweep'
import App from './App'

export default function AppShell() {
  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const [stage, setStage] = useState(prefersReducedMotion ? 'app' : 'intro')

  const handleScan = useCallback(() => {
    if (prefersReducedMotion) {
      setStage('app')
    } else {
      setStage('scanning')
    }
  }, [prefersReducedMotion])

  return (
    <>
      <AnimatePresence mode="wait">
        {stage === 'intro' && <IntroScreen key="intro" onScan={handleScan} />}
        {stage === 'scanning' && <ScanSweep key="scan" onComplete={() => setStage('app')} />}
      </AnimatePresence>

      {stage === 'app' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <App />
        </motion.div>
      )}
    </>
  )
}
