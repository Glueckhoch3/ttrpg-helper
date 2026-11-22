<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import StoryForm from './StoryForm.vue'
import { api } from '@/lib/api'

// One story part (snippet or scenario); renders its children recursively. Depth is capped by the backend (MAX_DEPTH).
const props = defineProps({
  part: Object, depth: { type: Number, default: 1 }, index: Number, siblings: Array,
  children: Object, gm: Boolean, npcs: Array, maps: Array, maxDepth: Number, number: String,
})
const emit = defineEmits(['error'])
const { t } = useI18n()
const mode = ref(null) // 'edit' | 'add'
const draft = ref({})
const kids = computed(() => props.children.get(props.part.id) ?? [])
const label = computed(() => (props.depth === 1 ? t('story.snippet') : t('story.scenario')))

const run = async (fn) => { try { await fn() } catch (e) { emit('error', e.message) } }
const blank = () => ({ title: '', location: '', body: '', npc_ids: [], map_id: null })
const startEdit = () => { draft.value = { title: props.part.title, location: props.part.location, body: props.part.body, npc_ids: props.part.npcs.map((n) => n.id), map_id: props.part.map_id }; mode.value = 'edit' }
const startAdd = () => { draft.value = blank(); mode.value = 'add' }
const submit = () => run(async () => {
  if (mode.value === 'edit') await api.patch(`/story/${props.part.id}`, draft.value)
  else await api.post('/story', { ...draft.value, parent_id: props.part.id })
  mode.value = null
})
const toggle = () => run(() => api.post(`/story/${props.part.id}/${props.part.unlocked ? 'lock' : 'unlock'}`))
const toggleMap = () => run(() => api.post(`/maps/${props.part.map.id}/${props.part.map.unlocked ? 'lock' : 'unlock'}`))
const del = () => confirm(t('story.confirmDelete', { title: props.part.title })) && run(() => api.del(`/story/${props.part.id}`))
const move = (d) => run(() => {
  const ids = props.siblings.map((p) => p.id)
  ;[ids[props.index], ids[props.index + d]] = [ids[props.index + d], ids[props.index]]
  return api.post('/story/reorder', { ids, parent_id: props.part.parent_id })
})
</script>

<template>
  <div :id="`story-${part.id}`" class="card part" :class="{ nested: depth > 1, locked: !part.unlocked }">
    <div class="row">
      <strong>{{ part.unlocked ? '📖' : '🔒' }} {{ number }} {{ part.title }}</strong>
      <span class="muted">{{ label }}</span>
      <span class="spacer" />
      <template v-if="gm">
        <Button size="small" text icon="pi pi-arrow-up" :aria-label="$t('story.moveUp')" :disabled="index === 0" @click="move(-1)" />
        <Button size="small" text icon="pi pi-arrow-down" :aria-label="$t('story.moveDown')" :disabled="index === siblings.length - 1" @click="move(1)" />
        <Button size="small" :severity="part.unlocked ? 'secondary' : undefined" :icon="part.unlocked ? 'pi pi-lock' : 'pi pi-lock-open'" :label="part.unlocked ? $t('story.lock') : $t('story.unlock')" @click="toggle" />
        <Button size="small" text :label="$t('common.edit')" @click="startEdit" />
        <Button size="small" text severity="danger" :label="$t('common.delete')" @click="del" />
      </template>
    </div>
    <StoryForm v-if="mode === 'edit'" v-model="draft" :npcs="npcs" :maps="maps" :submit-label="$t('common.save')" @submit="submit" @cancel="mode = null" />
    <template v-else>
      <div v-if="part.location" class="muted">📍 {{ part.location }}</div>
      <div v-if="part.npcs.length" class="muted">👤 {{ part.npcs.map((n) => n.name).join(', ') }}</div>
      <div v-if="part.map" class="row">
        🗺️
        <router-link v-if="part.map.unlocked" :to="`/maps/${part.map.id}`">{{ part.map.title }}</router-link>
        <span v-else>{{ part.map.title }} <span class="muted">({{ $t('story.mapLocked') }})</span></span>
        <Button v-if="gm" size="small" text :icon="part.map.unlocked ? 'pi pi-lock' : 'pi pi-lock-open'" :label="part.map.unlocked ? $t('story.lockMap') : $t('story.unlockMap')" @click="toggleMap" />
      </div>
      <div class="pre">{{ part.body }}</div>
    </template>
    <div v-if="gm && depth < maxDepth && mode !== 'add'" class="row"><Button size="small" text icon="pi pi-plus" :label="$t('story.addScenario')" @click="startAdd" /></div>
    <StoryForm v-if="mode === 'add'" v-model="draft" :npcs="npcs" :maps="maps" :submit-label="$t('story.add')" @submit="submit" @cancel="mode = null" />
    <StoryPart v-for="(c, i) in kids" :key="c.id" :part="c" :depth="depth + 1" :index="i" :siblings="kids" :children="children" :gm="gm" :npcs="npcs" :maps="maps" :max-depth="maxDepth" :number="`${number}${i + 1}.`" @error="emit('error', $event)" />
  </div>
</template>

<style scoped>
.part.nested { margin-left: 1.25rem; border-left: 3px solid var(--app-accent); }
.part.locked { opacity: .8; }
</style>
