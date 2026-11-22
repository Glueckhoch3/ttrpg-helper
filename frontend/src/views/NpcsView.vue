<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { api } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const { t } = useI18n()
const npcs = ref([])
const error = ref('')
const draft = ref({ name: '', description: '' })
const editing = ref(null)
const edit = ref({ name: '', description: '' })
useLive(['npcs'], async () => { npcs.value = await api.get('/npcs') })
const run = async (fn) => { error.value = ''; try { await fn() } catch (e) { error.value = e.message } }
const add = () => run(async () => { await api.post('/npcs', draft.value); draft.value = { name: '', description: '' } })
const startEdit = (n) => { editing.value = n.id; edit.value = { name: n.name, description: n.description } }
const save = (n) => run(async () => { await api.patch(`/npcs/${n.id}`, edit.value); editing.value = null })
const del = (n) => confirm(t('npcs.confirmDelete', { name: n.name })) && run(() => api.del(`/npcs/${n.id}`))
</script>

<template>
  <h2>{{ $t('npcs.title') }}</h2>
  <p class="muted">{{ $t('npcs.hint') }}</p>
  <p v-if="!npcs.length" class="muted">{{ $t('npcs.none') }}</p>
  <div v-for="n in npcs" :key="n.id" class="card">
    <template v-if="editing === n.id">
      <InputText v-model="edit.name" fluid />
      <Textarea v-model="edit.description" rows="4" fluid />
      <div class="row"><Button size="small" :label="$t('common.save')" :disabled="!edit.name.trim()" @click="save(n)" /><Button size="small" severity="secondary" :label="$t('common.cancel')" @click="editing = null" /></div>
    </template>
    <template v-else>
      <div class="row"><strong>👤 {{ n.name }}</strong><span class="spacer" />
        <Button size="small" text :label="$t('common.edit')" @click="startEdit(n)" />
        <Button size="small" text severity="danger" :label="$t('common.delete')" @click="del(n)" /></div>
      <div class="pre">{{ n.description }}</div>
    </template>
  </div>
  <div class="card">
    <strong>{{ $t('npcs.new') }}</strong>
    <InputText v-model="draft.name" :placeholder="$t('npcs.name')" fluid />
    <Textarea v-model="draft.description" rows="3" fluid :placeholder="$t('npcs.description')" />
    <Button :label="$t('npcs.add')" :disabled="!draft.name.trim()" @click="add" />
  </div>
  <p class="err">{{ error }}</p>
</template>
