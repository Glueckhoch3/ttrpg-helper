<script setup>
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'
import { npcDialog } from '@/lib/npcDialog'

const npc = ref(null)
const error = ref('')
const gm = computed(() => !!auth.token)
const visible = computed({ get: () => npcDialog.id !== null, set: (v) => { if (!v) npcDialog.id = null } })

const load = async () => {
  if (npcDialog.id === null) return
  error.value = ''
  try { npc.value = await api.get(`/npcs/${npcDialog.id}`) } catch (e) { npc.value = null; error.value = e.message }
}
watch(() => npcDialog.id, (id) => { npc.value = null; if (id !== null) load() })
useLive(['npcs', 'story'], load)
const hp = async (d) => { try { npc.value = await api.patch(`/npcs/${npc.value.id}`, { hp: npc.value.hp + d }) } catch (e) { error.value = e.message } }
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="npc?.name ?? $t('npcs.title')" :style="{ width: 'min(28rem, 95vw)' }" dismissable-mask>
    <template v-if="npc">
      <p v-if="npc.description" class="pre">{{ npc.description }}</p>
      <p v-else class="muted">{{ $t('npcs.noInfo') }}</p>
      <div v-if="gm" class="row">
        <strong>{{ $t('npcs.hp') }}</strong>
        <Button size="small" label="−" :aria-label="$t('npcs.hpDown')" @click="hp(-1)" />
        <span class="hpv">{{ npc.hp }}</span>
        <Button size="small" label="+" :aria-label="$t('npcs.hpUp')" @click="hp(1)" />
        <span class="muted">{{ $t('npcs.gmOnly') }}</span>
      </div>
      <dl v-if="npc.stats.length" class="stats">
        <template v-for="(s, i) in npc.stats" :key="i">
          <dt>{{ s.title }}<span v-if="gm && !s.visible" class="muted"> ({{ $t('npcs.gmOnly') }})</span></dt>
          <dd>{{ s.value }}</dd>
        </template>
      </dl>
      <p v-if="gm && npc.gm_notes" class="muted pre">{{ npc.gm_notes }}</p>
    </template>
    <p class="err">{{ error }}</p>
  </Dialog>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: auto 1fr; gap: .25rem 1rem; margin: .5rem 0; }
.stats dt { font-weight: 600; } .stats dd { margin: 0; }
.hpv { min-width: 2.5rem; text-align: center; font-weight: 700; }
</style>
