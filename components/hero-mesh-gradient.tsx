'use client'

import { useEffect, useState } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'

// MeshGradient parses colors in JS (hex/rgb/hsl only — no CSS variables), so
// the palette has to be swapped from the client once the theme is known.
const LIGHT_COLORS = ['#9c99ff', '#ffffff', '#ffffff', '#fa99ff']
const DARK_COLORS = ['#3a2f7a', '#14151d', '#14151d', '#4a2350']

/**
 * Resolves the effective theme the same way globals.css does: an explicit
 * `.dark` / `.light` class wins, otherwise follow `prefers-color-scheme`.
 */
function useIsDark() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const root = document.documentElement

    const sync = () => {
      setIsDark(
        root.classList.contains('dark') ||
          (!root.classList.contains('light') && media.matches),
      )
    }

    sync()
    media.addEventListener('change', sync)
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => {
      media.removeEventListener('change', sync)
      observer.disconnect()
    }
  }, [])

  return isDark
}

export function HeroMeshGradient({ className }: { className?: string }) {
  const isDark = useIsDark()

  return (
    <MeshGradient
      colors={isDark ? DARK_COLORS : LIGHT_COLORS}
      distortion={1}
      swirl={0.2}
      grainMixer={0}
      grainOverlay={0}
      speed={1}
      rotation={90}
      className={className}
    />
  )
}
