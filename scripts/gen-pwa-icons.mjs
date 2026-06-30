import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const ICON = 'assets/icon.svg'

// Ícone normal (fundo já escuro) — para "any" e apple-touch
async function plain(out, size) {
  await sharp(readFileSync(ICON), { density: 384 }).resize(size, size, { fit: 'cover' }).png().toFile(out)
  console.log('✓', out, `${size}x${size}`)
}

// Maskable — o símbolo precisa caber na "zona segura" (~80%): reduz e centraliza no fundo
async function maskable(out, size) {
  const inner = Math.round(size * 0.66)
  const logo = await sharp(readFileSync(ICON), { density: 384 }).resize(inner, inner, { fit: 'contain', background: '#060A0E' }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#060A0E' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png().toFile(out)
  console.log('✓', out, `${size}x${size} (maskable)`)
}

await plain('public/pwa-192.png', 192)
await plain('public/pwa-512.png', 512)
await plain('public/apple-touch-icon.png', 180)
await maskable('public/pwa-maskable-512.png', 512)
console.log('Ícones PWA gerados.')
