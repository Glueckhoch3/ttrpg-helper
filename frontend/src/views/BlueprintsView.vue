<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { api } from '@/lib/api'
import { useLive } from '@/lib/useLive'
import BlueprintDetail from '@/components/BlueprintDetail.vue'
import BlueprintImport from '@/components/BlueprintImport.vue'

const { t } = useI18n()
const KINDS = ['item', 'creature']
const MAX_STATS = 40
const list = ref([])
const kind = ref('item')
const query = ref('')
const error = ref('')
const importing = ref(false)
const open = ref(null) // full blueprint being viewed
const editing = ref(null) // draft being edited (id null = new)

const shown = computed(() => list.value.filter((b) => b.kind === kind.value && b.name.toLowerCase().includes(query.value.trim().toLowerCase())))
useLive(['blueprints'], async () => { list.value = await api.get('/blueprints') })
const run = async (fn) => { error.value = ''; try { await fn() } catch (e) { error.value = e.message } }

const toggle = (b) => run(async () => { open.value = open.value?.id === b.id ? null : await api.get(`/blueprints/${b.id}`) })
const blank = () => ({ id: null, kind: kind.value, name: '', subtitle: '', body: '', stats: [] })
const startEdit = (b) => { editing.value = JSON.parse(JSON.stringify(b)) }
const startNew = () => { editing.value = blank() }
const save = () => run(async () => {
  const d = editing.value
  const body = { name: d.name, subtitle: d.subtitle, body: d.body, stats: d.stats.filter((s) => s.title.trim()) }
  const saved = d.id ? await api.patch(`/blueprints/${d.id}`, body) : await api.post('/blueprints', { ...body, kind: d.kind })
  editing.value = null
  open.value = saved
})
const remove = (b) => confirm(t('blueprints.confirmDelete', { name: b.name })) && run(async () => { await api.del(`/blueprints/${b.id}`); if (open.value?.id === b.id) open.value = null })
</script>

<template>
  <h2>{{ $t('blueprints.title') }}</h2>
  <p class="muted">{{ $t('blueprints.hint') }}</p>
  <div class="row bar">
    <Button v-for="k in KINDS" :key="k" size="small" :severity="kind === k ? 'primary' : 'secondary'" :label="$t(`blueprints.${k}s`)" @click="kind = k; editing = null" />
    <span class="spacer" />
    <InputText v-model="query" size="small" :placeholder="$t('blueprints.search')" :aria-label="$t('blueprints.search')" />
    <Button size="small" icon="pi pi-upload" :label="$t('blueprints.import')" @click="importing = true" />
    <Button size="small" icon="pi pi-plus" :label="$t('blueprints.new')" @click="startNew" />
  </div>

  <div v-if="editing" class="card">
    <strong>{{ editing.id ? editing.name : `${$t('blueprints.new')} (${$t(`blueprints.kind.${editing.kind}`)})` }}</strong>
    <InputText v-model="editing.name" :placeholder="$t('blueprints.name')" maxlength="200" fluid />
    <InputText v-model="editing.subtitle" :placeholder="$t('blueprints.subtitle')" maxlength="200" fluid />
    <Textarea v-model="editing.body" rows="5" :placeholder="$t('blueprints.body')" maxlength="12000" fluid />
    <div v-for="(s, i) in editing.stats" :key="i" class="row">
      <InputText v-model="s.title" :placeholder="$t('blueprints.statTitle')" maxlength="40" size="small" />
      <InputText v-model="s.value" :placeholder="$t('blueprints.statValue')" maxlength="300" size="small" />
      <Button size="small" text severity="danger" icon="pi pi-trash" :aria-label="$t('common.delete')" @click="editing.stats.splice(i, 1)" />
    </div>
    <div class="row">
      <Button v-if="editing.stats.length < MAX_STATS" size="small" severity="secondary" icon="pi pi-plus" :label="$t('blueprints.addStat')" @click="editing.stats.push({ title: '', value: '' })" />
      <Button size="small" :label="$t('common.save')" :disabled="!editing.name.trim()" @click="save" />
      <Button size="small" severity="secondary" :label="$t('common.cancel')" @click="editing = null" />
    </div>
  </div>

  <p v-if="!shown.length" class="muted">{{ $t('blueprints.none') }}</p>
  <div v-for="b in shown" :key="b.id" class="card">
    <div class="row">
      <button class="title" :aria-expanded="open?.id === b.id" @click="toggle(b)">{{ open?.id === b.id ? '▾' : '▸' }} <strong>{{ b.name }}</strong> <span class="muted">{{ b.subtitle }}</span></button>
      <span class="spacer" />
      <Button size="small" text :label="$t('common.edit')" @click="open?.id === b.id ? startEdit(open) : run(async () => startEdit(await api.get(`/blueprints/${b.id}`)))" />
      <Button size="small" text severity="danger" :label="$t('common.delete')" @click="remove(b)" />
    </div>
    <BlueprintDetail v-if="open?.id === b.id" :data="open" />
  </div>
  <p class="err">{{ error }}</p>
  <BlueprintImport v-model:visible="importing" />
</template>

<style scoped>
.bar { margin-bottom: .8rem; }
.title { background: none; border: 0; color: inherit; font: inherit; cursor: pointer; text-align: left; padding: 0; }
</style>
