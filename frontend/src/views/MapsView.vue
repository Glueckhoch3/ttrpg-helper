<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const { t } = useI18n()
const maps = ref([])
const title = ref('')
const file = ref(null)
const error = ref('')
const SIZES = ['small', 'normal', 'large']
const readSize = () => { try { const v = localStorage.getItem('ttrpg.mapSize'); return SIZES.includes(v) ? v : 'normal' } catch { return 'normal' } }
const size = ref(readSize())
const setSize = (v) => { size.value = v; try { localStorage.setItem('ttrpg.mapSize', v) } catch { /* ignore */ } }
const toggle = async (m) => { error.value = ''; try { await api.post(`/maps/${m.id}/${m.unlocked ? 'lock' : 'unlock'}`) } catch (e) { error.value = e.message } }
useLive(['maps'], async () => { maps.value = await api.get('/maps') })

const imgSize = (f) => new Promise((res, rej) => {
  const u = URL.createObjectURL(f)
  const i = new Image()
  i.onload = () => { res({ w: i.naturalWidth, h: i.naturalHeight }); URL.revokeObjectURL(u) }
  i.onerror = () => rej(new Error(t('maps.notImage')))
  i.src = u
})
async function upload() {
  error.value = ''
  try {
    const { w, h } = await imgSize(file.value)
    const m = await api.upload(`/maps?title=${encodeURIComponent(title.value || file.value.name)}&w=${w}&h=${h}`, file.value)
    location.assign(`/maps/${m.id}`)
  } catch (e) { error.value = e.message }
}
</script>

<template>
  <h2>{{ $t('maps.title') }}</h2>
  <div class="card row">
    <InputText v-model="title" :placeholder="$t('maps.mapTitle')" />
    <input type="file" accept="image/png,image/jpeg,image/webp" @change="file = $event.target.files[0]" />
    <Button :label="$t('maps.upload')" :disabled="!file" @click="upload" />
    <span class="err">{{ error }}</span>
  </div>
  <div class="row" role="group" :aria-label="$t('maps.previewSize')" style="margin-bottom:.6rem">
    <span class="muted">{{ $t('maps.previewSize') }}</span>
    <Button v-for="v in SIZES" :key="v" size="small" :severity="size === v ? undefined : 'secondary'" :aria-pressed="size === v" :label="$t(`maps.${v}`)" @click="setSize(v)" />
  </div>
  <p v-if="!maps.length" class="muted">{{ $t('maps.none') }}</p>
  <div class="grid" :class="size">
    <div v-for="m in maps" :key="m.id" class="card tile">
      <router-link :to="`/maps/${m.id}`" style="text-decoration:none;color:inherit">
        <img :src="`/api/files/${m.image_file}`" :alt="m.title" />
        <div class="title">{{ m.unlocked ? '' : '🔒 ' }}{{ m.title }}</div>
      </router-link>
      <Button v-if="auth.token" size="small" text :icon="m.unlocked ? 'pi pi-lock' : 'pi pi-lock-open'" :label="m.unlocked ? $t('maps.lock') : $t('maps.unlock')" @click="toggle(m)" />
    </div>
  </div>
</template>

<style scoped>
/* normal: 5 per row on desktop, 2 on mobile; small shows more, large fewer */
.grid { --cols: 5; display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: .8rem; }
.grid.small { --cols: 8; }
.grid.large { --cols: 3; }
@media (max-width: 700px) {
  .grid { --cols: 2; }
  .grid.small { --cols: 3; }
  .grid.large { --cols: 1; }
}
.tile { margin: 0; min-width: 0; }
.tile img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.title { overflow-wrap: anywhere; margin-top: .25rem; }
</style>
