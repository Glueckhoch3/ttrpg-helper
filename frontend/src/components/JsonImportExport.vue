<script setup>
import { ref } from 'vue'
import { saveFile, getFile } from '../utils/api.js'

const jsonText = ref('{\n  "example": "value"\n}')
const filenameSave = ref('')
const filenameFetch = ref('')
const result = ref(null)
const error = ref('')
const loading = ref(false)

function ensureFilenameWithJson(name) {
  if (!name) return ''
  const trimmed = name.trim()
  return trimmed.toLowerCase().endsWith('.json') ? trimmed : trimmed + '.json'
}

function handleSave() {
  error.value = ''
  result.value = null
  let parsed
  try {
    parsed = JSON.parse(jsonText.value)
  } catch (e) {
    error.value = 'Invalid JSON: ' + e.message
    return
  }
  loading.value = true
  const filename = ensureFilenameWithJson(filenameSave.value)
  saveFile(parsed, filename)
    .then(res => { result.value = res })
    .catch(err => { error.value = err.message || JSON.stringify(err) })
    .finally(() => { loading.value = false })
}

function handleFetch() {
  error.value = ''
  result.value = null
  const filename = ensureFilenameWithJson(filenameFetch.value)
  if (!filename) {
    error.value = 'Please enter a filename to fetch.'
    return
  }
  loading.value = true
  getFile(filename)
    .then(res => { result.value = res })
    .catch(err => { error.value = err.message || JSON.stringify(err) })
    .finally(() => { loading.value = false })
}
</script>

<template>
  <div class="json-import-export">
    <section class="panel">
      <h2>Save JSON</h2>
      <label class="row">Filename: <input v-model="filenameSave" placeholder="filename" /></label>
      <textarea v-model="jsonText" rows="10" class="json-input"></textarea>
      <div class="actions">
        <button @click="handleSave" :disabled="loading">Save</button>
      </div>
    </section>

    <section class="panel">
      <h2>Fetch JSON</h2>
      <label class="row">Filename: <input v-model="filenameFetch" placeholder="filename to fetch" /></label>
      <div class="actions">
        <button @click="handleFetch" :disabled="loading">Fetch</button>
      </div>
    </section>

    <section class="panel">
      <h2>Result</h2>
      <pre v-if="result" class="result">{{ JSON.stringify(result, null, 2) }}</pre>
      <div v-else class="muted">No result yet.</div>
      <div v-if="error" class="error">{{ error }}</div>
    </section>
  </div>
</template>

<style scoped>
.json-import-export { max-width: 900px; margin: 16px auto; font-family: system-ui, Arial; }
.panel { background: #fff; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px; border-radius: 6px }
.json-input { width: 100%; font-family: monospace; font-size: 13px; }
.actions { margin-top: 8px }
.result { background: #111827; color: #e5e7eb; padding: 12px; border-radius: 4px; overflow: auto }
.error { color: #b91c1c; margin-top: 8px }
.muted { color: #6b7280 }
.row { display: block; margin-bottom: 8px }
input { margin-left: 8px }
</style>
