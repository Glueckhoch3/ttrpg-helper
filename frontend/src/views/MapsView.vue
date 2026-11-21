<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { api } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const { t } = useI18n()
const maps = ref([])
const title = ref('')
const file = ref(null)
const error = ref('')
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
  <div class="row" style="align-items:stretch">
    <router-link v-for="m in maps" :key="m.id" :to="`/maps/${m.id}`" class="card" style="text-decoration:none;color:inherit;width:220px">
      <img :src="`/api/files/${m.image_file}`" style="width:100%;height:140px;object-fit:cover" />
      <div>{{ m.title }}</div>
    </router-link>
  </div>
</template>
