'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Car, Calendar, Zap } from 'lucide-react'

interface Props {
  spotCount: number
  eventCount: number
  hasContent: boolean
}

export default function ScrollHero({ spotCount, eventCount, hasContent }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()

  // Everything fades + tilts backward as you scroll away
  const opacity  = useTransform(scrollY, [0, 480], [1, 0])
  const scale    = useTransform(scrollY, [0, 480], [1, 0.86])
  const rotateX  = useTransform(scrollY, [0, 480], [0, 16])

  // Parallax depths
  const yContent = useTransform(scrollY, [0, 480], [0, -110])
  const yGlow    = useTransform(scrollY, [0, 480], [0, -50])
  const yLines   = useTransform(scrollY, [0, 480], [0, -25])

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center text-center pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden"
      style={{ perspective: '1400px' }}
    >
      {/* ── Glow layer (slowest) ─────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: yGlow }}
      >
        {/* Central headlight bloom */}
        <div
          className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.05) 40%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />
        <div
          className="absolute top-[25%] left-[20%] w-72 h-72 rounded-full blob-1"
          style={{ background: 'rgba(249,115,22,0.07)', filter: 'blur(70px)' }}
        />
        <div
          className="absolute top-[45%] right-[18%] w-56 h-56 rounded-full blob-2"
          style={{ background: 'rgba(251,146,60,0.06)', filter: 'blur(60px)' }}
        />
      </motion.div>

      {/* ── Speed lines (mid depth) ──────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: yLines }}
        aria-hidden
      >
        <SpeedLines />
      </motion.div>

      {/* ── Main content (3D tilt + parallax) ───────────────── */}
      <motion.div
        className="relative z-10 flex flex-col items-center w-full"
        style={{
          y: yContent,
          scale,
          rotateX,
          opacity,
          transformOrigin: 'center 30%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium px-4 py-2 rounded-full mb-8 tracking-widest uppercase"
          style={{
            background: 'rgba(249,115,22,0.10)',
            color: '#FB923C',
            border: '1px solid rgba(249,115,22,0.22)',
          }}
        >
          <Zap className="w-3 h-3" />
          For car enthusiasts · by car enthusiasts
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-[-0.03em] mb-6"
        >
          <span className="gradient-text block">Spot.</span>
          <span className="shimmer-text block">Share.</span>
          <span className="gradient-text block">Celebrate.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl max-w-md mx-auto mb-10 leading-relaxed"
          style={{ color: '#8C8680' }}
        >
          Log every car you spot, track their worth, and find car meetups near you.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/spots/new" className="btn-primary text-base px-8 py-3.5">
            <Car className="w-5 h-5" />
            Log a Spot
          </Link>
          <Link href="/events" className="btn-secondary text-base px-8 py-3.5">
            <Calendar className="w-5 h-5" />
            Browse Events
          </Link>
        </motion.div>

        {/* Stats */}
        {hasContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex items-center gap-10 mt-12"
          >
            {[
              { label: 'Spots logged',    val: spotCount },
              { label: 'Events upcoming', val: eventCount },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-[#F5F0EB] tracking-tight">{val}</span>
                <span className="text-[11px] font-mono text-[#8C8680] uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}

function SpeedLines() {
  const lines = Array.from({ length: 22 }, (_, i) => {
    const angle   = (i / 22) * 360
    const rad     = (angle * Math.PI) / 180
    const inner   = 0.06
    const outer   = inner + 0.24 + (i % 5) * 0.07
    const cx = 0.5, cy = 0.44
    return {
      x1: cx + Math.cos(rad) * inner,
      y1: cy + Math.sin(rad) * inner,
      x2: cx + Math.cos(rad) * outer,
      y2: cy + Math.sin(rad) * outer,
      opacity: 0.035 + (i % 4) * 0.012,
    }
  })

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="xMidYMid slice"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke={`rgba(249,115,22,${l.opacity})`}
          strokeWidth="0.0012"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
