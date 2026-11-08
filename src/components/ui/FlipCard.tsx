import { motion, useReducedMotion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Carte retournable. Le recto pose une question ou une accroche, le verso révèle.
 * Accessible : un vrai bouton, état annoncé, contenu du verso masqué aux lecteurs
 * d'écran tant qu'il n'est pas révélé.
 */
export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  label,
  className = '',
  minHeight = 260,
}: {
  front: ReactNode
  back: ReactNode
  flipped: boolean
  onFlip: () => void
  label: string
  className?: string
  minHeight?: number
}) {
  const reduce = useReducedMotion()
  const backRef = useRef<HTMLDivElement>(null)
  const frontBtn = useRef<HTMLButtonElement>(null)
  const interacted = useRef(false)
  useEffect(() => {
    if (!interacted.current) return
    // Le focus suit la face visible (sinon il serait perdu sur une face inerte).
    if (flipped) backRef.current?.focus()
    else frontBtn.current?.focus()
  }, [flipped])
  const flip = () => {
    interacted.current = true
    onFlip()
  }
  return (
    <div className={`relative [perspective:1400px] ${className}`} style={{ minHeight }}>
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ minHeight }}
        animate={reduce ? { opacity: 1 } : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div
          className={`absolute inset-0 flex flex-col rounded-[22px] [backface-visibility:hidden] ${reduce && flipped ? 'invisible' : ''}`}
          inert={flipped}
        >
          {front}
          <button ref={frontBtn} type="button" onClick={flip} aria-expanded={flipped} className="absolute inset-0 rounded-[22px]" aria-label={label} />
        </div>
        <div
          className={`absolute inset-0 flex flex-col overflow-auto rounded-[22px] [backface-visibility:hidden] ${reduce ? (flipped ? '' : 'invisible') : '[transform:rotateY(180deg)]'}`}
          inert={!flipped}
          ref={backRef}
          tabIndex={-1}
        >
          {back}
          {flipped && (
            <button type="button" onClick={flip} className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/8 hover:bg-ink/15" aria-label="Retourner la carte">
              <RotateCcw size={17} aria-hidden />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
