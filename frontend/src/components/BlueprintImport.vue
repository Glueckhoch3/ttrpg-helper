<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { api } from '@/lib/api'

// Import menu (Issue #4): format (from the backend registry, max. three) -> kind + file -> pick entries -> import.
// The backend parses; this component only reads the file as JSON and forwards it (preview, then commit).
const { t } = useI18n()
const visible = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['imported'])
const MAX = 1000
const formats = ref([])
const format = ref(null)
const kind = ref(null)
const parsed = ref(null)
const preview = ref(null)
const picked = ref(new Set())
const error = ref('')
const info = ref('')
const busy = ref(false)

const current = computed(() => formats.value.find((f) => f.id === format.value))
const kindOptions = computed(() => (current.value?.kinds ?? []).map((k) => ({ v: k, l: t(`blueprints.kind.${k}`) })))
const fresh = computed(() => (preview.value?.entries ?? []).filter((e) => !e.duplicate))

watch(visible, async (v) => {
  if (!v) return
  reset()
  try { formats.value = await api.get('/import/formats'); pickFormat(formats.value[0]?.id) } catch (e) { error.value = e.message }
})
function reset() { parsed.value = null; preview.value = null; picked.value = new Set(); error.value = ''; info.value = '' }
function pickFormat(id) {
  format.value = id
  kind.value = formats.value.find((f) => f.id === id)?.kinds[0] ?? null
  reset()
}
const setKind = (k) => { kind.value = k; if (parsed.value) runPreview() }

async function onFile(e) {
  const file = e.target.files[0]
  reset()
  if (!file) return
  try { parsed.value = JSON.parse(await file.text()) } catch { error.value = t('import.notJson'); return }
  await runPreview()
}
async function runPreview() {
  busy.value = true
  error.value = ''
  try {
    preview.value = await api.post('/import/preview', { format: format.value, kind: kind.value, data: parsed.value })
    picked.value = new Set(fresh.value.slice(0, MAX).map((x) => x.index))
  } catch (e) { preview.value = null; error.value = e.message } finally { busy.value = false }
}
function toggle(i) {
  const s = new Set(picked.value)
  if (s.has(i)) s.delete(i); else if (s.size < MAX) s.add(i)
  picked.value = s
}
const selectAll = () => { picked.value = new Set(fresh.value.slice(0, MAX).map((x) => x.index)) }
async function run() {
  busy.value = true
  error.value = ''
  try {
    const r = await api.post('/import', { format: format.value, kind: kind.value, data: parsed.value, indexes: [...picked.value] })
    info.value = t('import.done', r)
    emit('imported')
    parsed.value = null; preview.value = null; picked.value = new Set()
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="$t('import.title')" :style="{ width: 'min(42rem, 96vw)' }">
    <h4>{{ $t('import.step1') }}</h4>
    <div class="formats" role="radiogroup" :aria-label="$t('import.step1')">
      <label v-for="f in formats" :key="f.id" class="fmt" :class="{ on: f.id === format }">
        <input type="radio" name="fmt" :value="f.id" :checked="f.id === format" @change="pickFormat(f.id)" />
        <span><strong>{{ f.label }}</strong><br /><span class="muted">{{ f.description }}</span></span>
      </label>
    </div>

    <template v-if="current">
      <h4>{{ $t('import.step2') }}</h4>
      <div class="row">
        <label>{{ $t('import.kind') }}
          <Select :model-value="kind" :options="kindOptions" option-label="l" option-value="v" @update:model-value="setKind" />
        </label>
        <label>{{ $t('import.file') }} <input type="file" accept=".json,application/json" @change="onFile" /></label>
      </div>
    </template>

    <template v-if="preview">
      <h4>{{ $t('import.step3') }}</h4>
      <p class="muted">{{ $t('import.found', { n: preview.entries.length, dup: preview.entries.length - fresh.length, skipped: preview.skipped }) }}</p>
      <div class="row">
        <Button size="small" severity="secondary" :label="$t('import.selectAll')" @click="selectAll" />
        <Button size="small" severity="secondary" :label="$t('import.selectNone')" @click="picked = new Set()" />
        <span v-if="fresh.length > MAX" class="muted">{{ $t('import.limit', { n: MAX }) }}</span>
      </div>
      <ul class="entries">
        <li v-for="e in preview.entries" :key="e.index">
          <label :class="{ dup: e.duplicate }">
            <input type="checkbox" :checked="picked.has(e.index)" :disabled="e.duplicate" @change="toggle(e.index)" />
            {{ e.name }} <span class="muted">{{ e.subtitle }}<template v-if="e.duplicate"> · {{ $t('import.duplicate') }}</template></span>
          </label>
        </li>
      </ul>
      <Button :label="$t('import.run', { n: picked.size })" :disabled="!picked.size || busy" @click="run" />
    </template>
    <p v-if="info" role="status">{{ info }}</p>
    <p class="err" role="alert">{{ error }}</p>
  </Dialog>
</template>

<style scoped>
.formats { display: flex; flex-direction: column; gap: .4rem; }
.fmt { display: flex; gap: .6rem; align-items: flex-start; border: var(--app-bw) solid var(--app-border); border-radius: 8px; padding: .5rem .7rem; cursor: pointer; }
.fmt.on { border-color: var(--app-accent); outline: 2px solid var(--app-accent); }
.entries { list-style: none; padding: 0; margin: .5rem 0; max-height: 40vh; overflow: auto; border: var(--app-bw) solid var(--app-border); border-radius: 8px; }
.entries li { padding: .2rem .6rem; }
.entries label { display: flex; gap: .5rem; align-items: baseline; }
.dup { opacity: .6; }
h4 { margin: .8rem 0 .4rem; }
</style>
