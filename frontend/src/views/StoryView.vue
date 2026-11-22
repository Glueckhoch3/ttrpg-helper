<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import StoryForm from '@/components/StoryForm.vue'
import StoryPart from '@/components/StoryPart.vue'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const MAX_DEPTH = 2 // keep in sync with backend/lib/story.js; the tree itself supports more layers
const route = useRoute()
const parts = ref([])
const npcs = ref([])
const maps = ref([])
const error = ref('')
const adding = ref(false)
const draft = ref({})
const gm = computed(() => !!auth.token)

const tree = computed(() => {
  const m = new Map()
  for (const p of parts.value) { const k = p.parent_id ?? null; if (!m.has(k)) m.set(k, []); m.get(k).push(p) }
  return m
})
const roots = computed(() => tree.value.get(null) ?? [])

useLive(['story', 'npcs', 'maps'], async () => {
  parts.value = await api.get('/story')
  if (gm.value) [npcs.value, maps.value] = await Promise.all([api.get('/npcs'), api.get('/maps')])
  await nextTick()
  document.getElementById(`story-${route.query.part}`)?.scrollIntoView({ block: 'start' })
})
const startAdd = () => { draft.value = { title: '', location: '', body: '', npc_ids: [], map_id: null }; adding.value = true }
const add = async () => {
  error.value = ''
  try { await api.post('/story', draft.value); adding.value = false } catch (e) { error.value = e.message }
}
</script>

<template>
  <h2>{{ $t('story.title') }}</h2>
  <p v-if="!parts.length" class="muted">{{ $t('story.empty') }}<template v-if="!gm">{{ $t('story.emptyPlayer') }}</template></p>
  <StoryPart v-for="(p, i) in roots" :key="p.id" :part="p" :index="i" :siblings="roots" :children="tree" :gm="gm" :npcs="npcs" :maps="maps" :max-depth="MAX_DEPTH" :number="`${i + 1}.`" @error="error = $event" />
  <div v-if="gm" class="card">
    <Button v-if="!adding" icon="pi pi-plus" :label="$t('story.new')" @click="startAdd" />
    <template v-else>
      <strong>{{ $t('story.new') }}</strong>
      <StoryForm v-model="draft" :npcs="npcs" :maps="maps" :submit-label="$t('story.add')" @submit="add" @cancel="adding = false" />
    </template>
  </div>
  <p class="err">{{ error }}</p>
</template>
