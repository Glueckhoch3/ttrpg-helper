// Serialise the map <svg> to PNG (ADR-008). The image href is inlined so the canvas is not tainted.
async function toDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

export async function mapToPngBlob(svgEl, { width, height, maxSide = 4096 }) {
  const clone = svgEl.cloneNode(true)
  clone.querySelectorAll('[data-noexport]').forEach((n) => n.remove())
  for (const img of clone.querySelectorAll('image')) img.setAttribute('href', await toDataUrl(img.getAttribute('href')))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', width)
  clone.setAttribute('height', height)
  clone.removeAttribute('style')
  const svgText = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Rendering failed')); img.src = url })
    const k = Math.min(1, maxSide / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * k)
    canvas.height = Math.round(height * k)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}
