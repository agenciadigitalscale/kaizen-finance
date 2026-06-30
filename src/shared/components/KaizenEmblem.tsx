import { useId } from 'react'

// Emblema oficial do Kaizen — Cruz-Âncora + K (fé, esperança, Jesus).
// SVG vetorial, escalável. Use `ring={false}` para só o símbolo, sem o selo.
export default function KaizenEmblem({ size = 40, ring = true }: { size?: number; ring?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const go = `kzgo-${uid}`, goK = `kzgoK-${uid}`, ringg = `kzring-${uid}`

  return (
    <svg width={size} height={size} viewBox="-460 -460 920 920" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaizen">
      <defs>
        <linearGradient id={go} gradientUnits="userSpaceOnUse" x1="-170" y1="-250" x2="180" y2="210">
          <stop offset="0" stopColor="#FDE9A8" /><stop offset="0.45" stopColor="#F4B73C" /><stop offset="1" stopColor="#C77A12" />
        </linearGradient>
        <linearGradient id={goK} gradientUnits="userSpaceOnUse" x1="0" y1="-150" x2="130" y2="100">
          <stop offset="0" stopColor="#FFF1C2" /><stop offset="1" stopColor="#E8961A" />
        </linearGradient>
        <radialGradient id={ringg} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="420">
          <stop offset="0" stopColor="#F4B73C" /><stop offset="1" stopColor="#C77A12" />
        </radialGradient>
      </defs>

      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {ring && (
          <>
            <circle r="418" fill="#0A111C" stroke={`url(#${ringg})`} strokeWidth="6" opacity="0.95" />
            <circle r="376" stroke={`url(#${ringg})`} strokeWidth="2" opacity="0.4" />
            <circle cx="0" cy="-418" r="7" fill="#F4B73C" />
            <circle cx="0" cy="418" r="7" fill="#F4B73C" />
          </>
        )}
        {/* Cruz-Âncora (fé + esperança) */}
        <line x1="0" y1="-250" x2="0" y2="160" stroke={`url(#${go})`} strokeWidth="40" />
        <line x1="-92" y1="-150" x2="92" y2="-150" stroke={`url(#${go})`} strokeWidth="40" />
        <path d="M-168 60 Q0 250 168 60" stroke={`url(#${go})`} strokeWidth="40" />
        <path d="M-168 60 L-150 18 M-168 60 L-126 48" stroke={`url(#${go})`} strokeWidth="34" />
        <path d="M168 60 L150 18 M168 60 L126 48" stroke={`url(#${go})`} strokeWidth="34" />
        {/* K integrado */}
        <path d="M0 -30 L118 -150" stroke={`url(#${goK})`} strokeWidth="36" />
        <path d="M0 -30 L118 86" stroke={`url(#${goK})`} strokeWidth="36" />
      </g>
    </svg>
  )
}
