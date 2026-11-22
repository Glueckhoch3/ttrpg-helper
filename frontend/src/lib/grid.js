// Grid geometry in image pixel space. `cell_px` = cell width (square: side, hex: flat-to-flat of a pointy-top hex).
const SQRT3 = Math.sqrt(3)

export function cellCenter(map, col, row) {
  const s = map.cell_px
  if (map.grid_type === 'hex') {
    const R = s / SQRT3
    return { x: map.offset_x + s * (col + 0.5 * (row & 1)) + s / 2, y: map.offset_y + R + 1.5 * R * row }
  }
  return { x: map.offset_x + (col + 0.5) * s, y: map.offset_y + (row + 0.5) * s }
}

// Centre of a size x size block of cells whose top-left cell is (col,row): size 2 = 4 cells, size 3 = 9 cells.
export function blockCenter(map, col, row, size = 1) {
  let x = 0, y = 0
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) { const c = cellCenter(map, col + i, row + j); x += c.x; y += c.y }
  return { x: x / (size * size), y: y / (size * size) }
}

export function pointToCell(map, x, y) {
  const s = map.cell_px
  if (map.grid_type !== 'hex') return { col: Math.floor((x - map.offset_x) / s), row: Math.floor((y - map.offset_y) / s) }
  const R = s / SQRT3
  const r0 = Math.round((y - map.offset_y - R) / (1.5 * R))
  let best = null
  for (let row = r0 - 1; row <= r0 + 1; row++) {
    const c0 = Math.round((x - map.offset_x - s / 2) / s - 0.5 * (row & 1))
    for (let col = c0 - 1; col <= c0 + 1; col++) {
      const c = cellCenter(map, col, row)
      const d = (c.x - x) ** 2 + (c.y - y) ** 2
      if (!best || d < best.d) best = { col, row, d }
    }
  }
  return { col: best.col, row: best.row }
}

export function hexPoints(cx, cy, s) {
  const R = s / SQRT3
  return [30, 90, 150, 210, 270, 330].map((deg) => {
    const a = (Math.PI / 180) * deg
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

// Cells covering the image (with margin), as {col,row,x,y}
export function visibleCells(map) {
  const out = []
  const s = map.cell_px
  const R = map.grid_type === 'hex' ? s / SQRT3 : s
  const rowH = map.grid_type === 'hex' ? 1.5 * R : s
  const rows = Math.ceil(map.img_h / rowH) + 2
  const cols = Math.ceil(map.img_w / s) + 2
  for (let row = -1; row < rows; row++)
    for (let col = -1; col < cols; col++) out.push({ col, row, ...cellCenter(map, col, row) })
  return out
}

export const formatElevation = (e) => (e > 0 ? `+${e}` : `${e}`)
