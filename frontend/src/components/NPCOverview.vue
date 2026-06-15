<!-- Holder for displaying NPCSummary Cards -->

<script setup>
import { computed, inject, unref } from 'vue';
import NPCSummary from './NPCSummary.vue';
import Button from 'primevue/button';

const injectedAdventureNPCs = inject('adventureNPCs', []);
const adventureNPCs = computed(() => {
  const npcs = unref(injectedAdventureNPCs);
  return Array.isArray(npcs) ? npcs : [];
});
const props = defineProps({
  onAddNpc: {
    type: Function,
    required: true
  },
  onSaveNpc: {
    type: Function,
    required: true
  },
  onDeleteNpc: {
    type: Function,
    required: true
  },
  newNpcSignal: {
    type: Object,
    default: null
  }
});

function npcAutoEditToken(npc) {
  if (!props.newNpcSignal?.token || !npc?.id) {
    return 0;
  }

  return props.newNpcSignal.npcId === npc.id ? props.newNpcSignal.token : 0;
}
</script>

<template>
  <div class="npc-overview">
    <div class="npc-overview-header">
      <p>NPC Overview</p>
      <Button icon="pi pi-plus" aria-label="Add NPC" @click="props.onAddNpc()" />
    </div>
    <div v-if="adventureNPCs && adventureNPCs.length > 0" class="npc-list-scroll">
      <div
        v-for="(npc, npcIndex) in adventureNPCs"
        :key="npc.id || npc.name"
        class="npc-item"
        :data-npc-id="npc.id || undefined"
      >
        <NPCSummary
          :npc="npc"
          :npcIndex="npcIndex"
          :autoStartEditToken="npcAutoEditToken(npc)"
          :onSaveNpc="props.onSaveNpc"
          :onDeleteNpc="props.onDeleteNpc"
        ></NPCSummary>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>No NPCs available.</p>
      <Button icon="pi pi-plus" aria-label="Add NPC" @click="props.onAddNpc()" />
    </div>
  </div>
</template>

<style scoped>
.npc-overview {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.npc-overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.npc-list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
</style>

<!-- <style scoped >
div {
  margin: 1em;
  border-style: solid;
  border-color: white;
}
</style> -->