<script setup>
import { ref, computed, watch } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import { api } from '@/lib/api'
import { useLive } from '@/lib/useLive'
import BlueprintDetail from '@/components/BlueprintDetail.vue'

// Sidebar for a marker (Issue #4): one collapsible bar per linked NPC / creature / item showing its name;
// the content is fetched when a bar is opened.
const props = defineProps({ token: { type: Object, required: true } })
const bars = computed(() => [
  ...(props.token.npc ? [{ key: `npc:${props.token.npc.id}`, kind: 'npc', url: `/npcs/${props.token.npc.id}`, name: props.token.npc.name }] : []),
  ...(props.token.creature ? [{ key: `creature:${props.token.creature.id}`, kind: 'creature', url: `/blueprints/${props.token.creature.id}`, name: props.token.creature.name }] : []),
  ...props.token.items.map((i) => ({ key: `item:${i.id}`, kind: 'item', url: `/blueprints/${i.id}`, name: i.name })),
])
const open = ref([])
const cache = ref({})
const errors = ref({})

async function fetchBar(key) {
  const bar = bars.value.find((b) => b.key === key)
  if (!bar) return
  try {
    const d = await api.get(bar.url)
    // NPCs have a public `description` and (for the GM) hidden stats; show only what players would see
    cache.value[key] = bar.kind === 'npc' ? { body: d.description, stats: d.stats.filter((s) => s.visible === undefined || s.visible) } : d
    delete errors.value[key]
  } catch (e) { errors.value[key] = e.message }
}
// deep: the accordion may mutate the array in place
watch(open, (keys) => keys.filter((k) => !(k in cache.value)).forEach(fetchBar), { deep: true })
// another marker selected: start collapsed
watch(() => props.token.id, () => { open.value = []; cache.value = {}; errors.value = {} })
useLive(['blueprints', 'npcs'], () => { cache.value = {}; open.value.forEach(fetchBar) })
const icon = { npc: '👤', creature: '🐉', item: '🎒' }
</script>

<template>
  <Accordion v-if="bars.length" v-model:value="open" multiple>
    <AccordionPanel v-for="b in bars" :key="b.key" :value="b.key">
      <AccordionHeader>{{ icon[b.kind] }} {{ b.name }}</AccordionHeader>
      <AccordionContent>
        <BlueprintDetail v-if="cache[b.key]" :data="cache[b.key]" />
        <p v-else-if="errors[b.key]" class="err">{{ errors[b.key] }}</p>
        <p v-else class="muted">{{ $t('common.loading') }}</p>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>
