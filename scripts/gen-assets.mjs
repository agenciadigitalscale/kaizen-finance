import sharp from 'sharp'
import { readFileSync } from 'node:fs'

// Rasteriza os SVGs-fonte para os PNGs que o @capacitor/assets consome.
async function render(svgPath, outPath, size) {
  const svg = readFileSync(svgPath)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outPath)
  console.log('✓', outPath, `${size}x${size}`)
}

await render('assets/icon.svg',   'assets/icon.png',         1024)
await render('assets/splash.svg', 'assets/splash.png',       2732)
await render('assets/splash.svg', 'assets/splash-dark.png',  2732)
console.log('Assets PNG gerados.')
