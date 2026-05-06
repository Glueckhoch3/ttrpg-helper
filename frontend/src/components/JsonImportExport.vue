<script>
import { saveFile, getFile } from '../utils/api.js'

export default {
  name: 'JsonImportExport',
  data() {
    return {
      jsonText: '{\n  "example": "value"\n}',
      filenameSave: '',
      filenameFetch: '',
      result: null,
      error: '',
      loading: false,
    }
  },
  methods: {
    ensureFilenameWithJson(name) {
      if (!name) return ''
      const trimmed = name.trim()
      return trimmed.toLowerCase().endsWith('.json') ? trimmed : trimmed + '.json'
    },
    handleSave() {
      this.error = ''
      this.result = null
      let parsed
      try {
        parsed = JSON.parse(this.jsonText)
      } catch (e) {
        this.error = 'Invalid JSON: ' + e.message
        return
      }
      this.loading = true
      const filename = this.ensureFilenameWithJson(this.filenameSave)
      saveFile(parsed, filename)
        .then(res => { this.result = res })
        .catch(err => { this.error = err.message || JSON.stringify(err) })
        .finally(() => { this.loading = false })
    },
    handleFetch() {
      this.error = ''
      this.result = null
      const filename = this.ensureFilenameWithJson(this.filenameFetch)
      if (!filename) {
        this.error = 'Please enter a filename to fetch.'
        return
      }
      this.loading = true
      getFile(filename)
        .then(res => { this.result = res })
        .catch(err => { this.error = err.message || JSON.stringify(err) })
        .finally(() => { this.loading = false })
    }
  }
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
