<script setup>
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'
import { cellCenter, pointToCell, hexPoints, visibleCells, formatElevation } from '@/lib/grid'
import { mapToPngBlob } from '@/lib/exportMap'

const { t } = useI18n()
const props = defineProps({ id: String })
const map = ref(null)
const tokens = ref([])
const sessions = ref([])
const selectedId = ref(null)
const svg = ref(null)
const drag = reactive({ id: null, x: 0, y: 0 })
const error = ref('')
const info = ref('')
const exportSession = ref(null)

const PALETTE = [
  ['🧙', 'player'], ['🐉', 'dragon'], ['👹', 'monster'], ['🐺', 'beast'], ['💀', 'undead'],
  ['📦', 'object'], ['🗝️', 'key'], ['⚔️', 'weapon'], ['🏰', 'landmark'], ['🌲', 'tree'], ['⛰️', 'mountain'], ['🕳️', 'pit'], ['🔥', 'hazard'], ['●', 'marker'],
]
const GRIDS = computed(() => ['square', 'hex', 'none'].map((v) => ({ l: t(`map.${v}`), v })))
const COLORS = ['#d32f2f', '#1976d2', '#388e3c', '#f9a825', '#7b1fa2', '#212121', '#ffffff']

const selected = computed(() => tokens.value.find((x) => x.id === selectedId.value))
// selected symbol is drawn last = on top
const ordered = computed(() => [...tokens.value].sort((a, b) => (a.id === selectedId.value) - (b.id === selectedId.value)))
const stackSize = computed(() => (selected.value ? tokens.value.filter((x) => x.col === selected.value.col && x.row === selected.value.row).length : 0))
const cells = computed(() => (map.value && map.value.grid_type !== 'none' ? visibleCells(map.value) : []))
const imageUrl = computed(() => `/api/files/${map.value.image_file}`)

async function load() {
  const m = await api.get(`/maps/${props.id}`)
  tokens.value = m.tokens
  map.value = Object.assign(map.value || {}, m)
}
useLive(['maps', 'tokens'], () => { if (drag.id === null) load().catch((e) => { error.value = e.message }) })
api.get('/sessions').then((s) => { sessions.value = s; exportSession.value = s[0]?.id ?? null })

const run = async (fn) => { error.value = ''; try { await fn() } catch (e) { error.value = e.message } }

// --- grid calibration (local while sliding, saved on change) ---
const setGrid = (k, v) => { map.value[k] = v }
const saveGrid = () => run(() => api.patch(`/maps/${props.id}`, {
  grid_type: map.value.grid_type, cell_px: Number(map.value.cell_px), offset_x: Number(map.value.offset_x), offset_y: Number(map.value.offset_y),
}))

// --- tokens ---
const pos = (t) => (drag.id === t.id ? { x: drag.x, y: drag.y } : cellCenter(map.value, t.col, t.row))
const radius = (t) => (t.size * map.value.cell_px) * 0.42
const addToken = (symbol) => run(async () => {
  const c = pointToCell(map.value, map.value.img_w / 2, map.value.img_h / 2)
  const t = await api.post(`/maps/${props.id}/tokens`, { symbol, col: c.col, row: c.row, label: symbol === '🧙' ? auth.name : '' })
  selectedId.value = t.id
  await load()
})
const updateToken = (t, fields) => run(async () => { Object.assign(t, fields); await api.patch(`/tokens/${t.id}`, fields) })
const removeToken = (t) => run(async () => { await api.del(`/tokens/${t.id}`); selectedId.value = null; await load() })

function svgPoint(e) {
  const p = svg.value.createSVGPoint()
  p.x = e.clientX; p.y = e.clientY
  return p.matrixTransform(svg.value.getScreenCTM().inverse())
}
// Stacked symbols: clicking the same field again selects the next symbol underneath (cycle).
let press = null
const stackAt = (tk) => tokens.value.filter((x) => x.col === tk.col && x.row === tk.row).sort((a, b) => a.id - b.id)
function down(e, tk) {
  const stack = stackAt(tk)
  const sel = stack.find((x) => x.id === selectedId.value)
  const target = sel ?? tk
  press = { target, stack, wasSelected: !!sel }
  selectedId.value = target.id
  Object.assign(drag, cellCenter(map.value, target.col, target.row), { id: target.id })
  e.currentTarget.setPointerCapture(e.pointerId)
}
function move(e) {
  if (drag.id === null) return
  const p = svgPoint(e)
  drag.x = p.x; drag.y = p.y
}
async function up() {
  if (drag.id === null) return
  const tk = tokens.value.find((x) => x.id === drag.id)
  const c = pointToCell(map.value, drag.x, drag.y)
  drag.id = null
  if (!tk) return
  if (c.col !== tk.col || c.row !== tk.row) await updateToken(tk, c)
  else if (press?.wasSelected && press.stack.length > 1) {
    const { stack } = press
    selectedId.value = stack[(stack.findIndex((x) => x.id === tk.id) + 1) % stack.length].id
  }
}

// --- export ---
const exportName = () => `${map.value.title.replace(/[^\w-]+/g, '_')}.png`
async function render() {
  selectedId.value = null
  await new Promise((r) => setTimeout(r, 0))
  return mapToPngBlob(svg.value, { width: map.value.img_w, height: map.value.img_h })
}
const download = () => run(async () => {
  const blob = await render()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = exportName(); a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
})
const attach = () => run(async () => {
  info.value = ''
  const blob = await render()
  await api.upload(`/sessions/${exportSession.value}/attachments?title=${encodeURIComponent(map.value.title + ' – ' + new Date().toLocaleString())}`, blob)
  info.value = t('map.attached')
})
</script>

<template>
  <template v-if="map">
    <router-link to="/maps">{{ $t('maps.back') }}</router-link>
    <h2>{{ map.title }}</h2>
    <div class="layout">
      <div class="stage">
        <svg ref="svg" :viewBox="`0 0 ${map.img_w} ${map.img_h}`" @pointermove="move" @pointerup="up" @pointerdown.self="selectedId = null">
          <image :href="imageUrl" x="0" y="0" :width="map.img_w" :height="map.img_h" />
          <g v-if="map.grid_type === 'square'" stroke="#000" stroke-opacity=".45" :stroke-width="Math.max(1, map.cell_px / 40)" fill="none" pointer-events="none">
            <rect v-for="c in cells" :key="`${c.col}_${c.row}`" :x="c.x - map.cell_px / 2" :y="c.y - map.cell_px / 2" :width="map.cell_px" :height="map.cell_px" />
          </g>
          <g v-else-if="map.grid_type === 'hex'" stroke="#000" stroke-opacity=".45" :stroke-width="Math.max(1, map.cell_px / 40)" fill="none" pointer-events="none">
            <polygon v-for="c in cells" :key="`${c.col}_${c.row}`" :points="hexPoints(c.x, c.y, map.cell_px)" />
          </g>
          <g v-for="t in ordered" :key="t.id" style="cursor:grab;touch-action:none" @pointerdown.stop="down($event, t)">
            <circle :cx="pos(t).x" :cy="pos(t).y" :r="radius(t)" :fill="t.color" fill-opacity=".35" :stroke="t.color" :stroke-width="t.id === selectedId ? map.cell_px / 10 : map.cell_px / 25" />
            <text :x="pos(t).x" :y="pos(t).y" text-anchor="middle" dominant-baseline="central" :font-size="radius(t) * 1.3">{{ t.symbol }}</text>
            <text v-if="t.label" :x="pos(t).x" :y="pos(t).y + radius(t) + map.cell_px * 0.3" text-anchor="middle" :font-size="map.cell_px * 0.3" font-weight="bold" fill="#fff" stroke="#000" :stroke-width="map.cell_px * 0.08" paint-order="stroke">{{ t.label }}</text>
            <g v-if="t.elevation !== 0">
              <circle :cx="pos(t).x + radius(t) * 0.85" :cy="pos(t).y - radius(t) * 0.85" :r="map.cell_px * 0.2" :fill="t.elevation > 0 ? '#1565c0' : '#6d4c41'" stroke="#fff" :stroke-width="map.cell_px / 40" />
              <text :x="pos(t).x + radius(t) * 0.85" :y="pos(t).y - radius(t) * 0.85" text-anchor="middle" dominant-baseline="central" :font-size="map.cell_px * 0.2" fill="#fff" font-weight="bold">{{ formatElevation(t.elevation) }}</text>
            </g>
          </g>
        </svg>
      </div>

      <aside>
        <div class="card">
          <strong>{{ $t('map.grid') }}</strong>
          <div class="row"><Select :modelValue="map.grid_type" :options="GRIDS" optionLabel="l" optionValue="v" @update:modelValue="setGrid('grid_type', $event); saveGrid()" /></div>
          <template v-if="map.grid_type !== 'none'">
            <label class="muted">{{ $t('map.cellSize') }}: {{ Math.round(map.cell_px) }}</label>
            <input type="range" min="10" :max="Math.max(map.img_w, map.img_h) / 4" step="1" :value="map.cell_px" @input="setGrid('cell_px', +$event.target.value)" @change="saveGrid" />
            <label class="muted">{{ $t('map.offsetX') }}: {{ Math.round(map.offset_x) }}</label>
            <input type="range" :min="-map.cell_px" :max="map.cell_px" step="1" :value="map.offset_x" @input="setGrid('offset_x', +$event.target.value)" @change="saveGrid" />
            <label class="muted">{{ $t('map.offsetY') }}: {{ Math.round(map.offset_y) }}</label>
            <input type="range" :min="-map.cell_px" :max="map.cell_px" step="1" :value="map.offset_y" @input="setGrid('offset_y', +$event.target.value)" @change="saveGrid" />
          </template>
        </div>

        <div class="card">
          <strong>{{ $t('map.addSymbol') }}</strong>
          <div class="palette"><button v-for="[s, n] in PALETTE" :key="s" :title="$t(`map.symbols.${n}`)" @click="addToken(s)">{{ s }}</button></div>
        </div>

        <div v-if="selected" class="card">
          <strong>{{ $t('map.editSymbol') }}</strong>
          <InputText :modelValue="selected.label" :placeholder="$t('map.label')" maxlength="60" fluid @change="updateToken(selected, { label: $event.target.value })" />
          <InputText :modelValue="selected.symbol" maxlength="8" fluid @change="updateToken(selected, { symbol: $event.target.value })" />
          <div v-if="stackSize > 1" class="muted">{{ $t('map.stack', { n: stackSize }) }}</div>
          <div class="row">{{ $t('map.elevation') }}
            <Button size="small" label="−" @click="updateToken(selected, { elevation: selected.elevation - 1 })" />
            <input type="number" :value="selected.elevation" style="width:4.5rem" @change="updateToken(selected, { elevation: Math.trunc(+$event.target.value) || 0 })" />
            <Button size="small" label="+" @click="updateToken(selected, { elevation: selected.elevation + 1 })" />
          </div>
          <div class="row">{{ $t('map.size') }}
            <Button v-for="n in [1, 2, 3]" :key="n" size="small" :severity="selected.size === n ? 'primary' : 'secondary'" :label="`${n}`" @click="updateToken(selected, { size: n })" />
          </div>
          <div class="row"><button v-for="c in COLORS" :key="c" class="sw" :style="{ background: c, outline: selected.color === c ? '2px solid #000' : 'none' }" @click="updateToken(selected, { color: c })" /></div>
          <InputText :modelValue="selected.note" :placeholder="$t('map.note')" maxlength="500" fluid @change="updateToken(selected, { note: $event.target.value })" />
          <Button size="small" severity="danger" :label="$t('common.remove')" @click="removeToken(selected)" />
        </div>

        <div class="card">
          <strong>{{ $t('map.export') }}</strong>
          <div class="row"><Button size="small" :label="$t('map.download')" @click="download" /></div>
          <div class="row">
            <Select v-model="exportSession" :options="sessions" optionValue="id" :optionLabel="(s) => `#${s.number} ${s.title}`" :placeholder="$t('map.session')" />
            <Button size="small" :label="$t('map.attach')" :disabled="!exportSession" @click="attach" />
          </div>
          <span class="muted">{{ info }}</span>
        </div>
        <p class="err">{{ error }}</p>
      </aside>
    </div>
  </template>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 1rem; align-items: start; }
.stage { background: #222; border-radius: 8px; overflow: auto; }
svg { display: block; width: 100%; height: auto; user-select: none; }
aside .card { display: flex; flex-direction: column; gap: .4rem; }
.palette { display: flex; flex-wrap: wrap; gap: .3rem; }
.palette button { font-size: 1.4rem; width: 2.4rem; height: 2.4rem; cursor: pointer; border: 1px solid #ccc; border-radius: 6px; background: #fff; }
.sw { width: 1.6rem; height: 1.6rem; border: 1px solid #888; border-radius: 50%; cursor: pointer; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
