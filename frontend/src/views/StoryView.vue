<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const { t } = useI18n()
const parts = ref([])
const error = ref('')
const draft = ref({ title: '', body: '' })
const editing = ref(null)
const edit = ref({ title: '', body: '' })
const gm = computed(() => !!auth.token)

useLive(['story'], async () => { parts.value = await api.get('/story') })
const run = async (fn) => { error.value = ''; try { await fn() } catch (e) { error.value = e.message } }

const add = () => run(async () => { await api.post('/story', draft.value); draft.value = { title: '', body: '' } })
const toggle = (p) => run(() => api.post(`/story/${p.id}/${p.unlocked ? 'lock' : 'unlock'}`))
const startEdit = (p) => { editing.value = p.id; edit.value = { title: p.title, body: p.body } }
const save = (p) => run(async () => { await api.patch(`/story/${p.id}`, edit.value); editing.value = null })
const del = (p) => confirm(t('story.confirmDelete', { title: p.title })) && run(() => api.del(`/story/${p.id}`))
const move = (i, d) => run(() => {
  const ids = parts.value.map((p) => p.id)
  ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
  return api.post('/story/reorder', { ids })
})
</script>

<template>
  <h2>{{ $t('story.title') }}</h2>
  <p v-if="!parts.length" class="muted">{{ $t('story.empty') }}<template v-if="!gm">{{ $t('story.emptyPlayer') }}</template></p>
  <div v-for="(p, i) in parts" :key="p.id" class="card" :style="!p.unlocked && { opacity: 0.8 }">
    <div class="row">
      <strong>{{ p.unlocked ? '📖' : '🔒' }} {{ i + 1 }}. {{ p.title }}</strong>
      <span class="spacer" />
      <template v-if="gm">
        <Button size="small" text icon="pi pi-arrow-up" :disabled="i === 0" @click="move(i, -1)" />
        <Button size="small" text icon="pi pi-arrow-down" :disabled="i === parts.length - 1" @click="move(i, 1)" />
        <Button size="small" :severity="p.unlocked ? 'secondary' : 'success'" :label="p.unlocked ? $t('story.lock') : $t('story.unlock')" @click="toggle(p)" />
        <Button size="small" text :label="$t('common.edit')" @click="startEdit(p)" />
        <Button size="small" text severity="danger" :label="$t('common.delete')" @click="del(p)" />
      </template>
    </div>
    <template v-if="editing === p.id">
      <InputText v-model="edit.title" fluid />
      <Textarea v-model="edit.body" rows="8" fluid />
      <div class="row"><Button size="small" :label="$t('common.save')" @click="save(p)" /><Button size="small" severity="secondary" :label="$t('common.cancel')" @click="editing = null" /></div>
    </template>
    <div v-else class="pre">{{ p.body }}</div>
  </div>
  <div v-if="gm" class="card">
    <strong>{{ $t('story.new') }}</strong>
    <InputText v-model="draft.title" :placeholder="$t('story.titlePlaceholder')" fluid />
    <Textarea v-model="draft.body" rows="6" fluid :placeholder="$t('story.bodyPlaceholder')" />
    <Button :label="$t('story.add')" :disabled="!draft.title.trim()" @click="add" />
  </div>
  <p class="err">{{ error }}</p>
</template>
