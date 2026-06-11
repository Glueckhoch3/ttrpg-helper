<!-- Holder for displaying NPCSummary Cards -->

<script setup>
import { inject } from 'vue';
import NPCSummary from './NPCSummary.vue';
import Button from 'primevue/button';

const adventureNPCs = inject('adventureNPCs');
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
  }
});
</script>

<template>
  <div class="npc-overview-header">
    <p>NPC Overview</p>
    <Button label="Add" icon="pi pi-plus" @click="props.onAddNpc()" />
  </div>
  <div v-if="adventureNPCs && adventureNPCs.length > 0">
    <NPCSummary
      v-for="(npc, npcIndex) in adventureNPCs"
      :key="npc.id || npc.name"
      :npc="npc"
      :npcIndex="npcIndex"
      :onSaveNpc="props.onSaveNpc"
      :onDeleteNpc="props.onDeleteNpc"
    ></NPCSummary>
  </div>
  <div v-else class="empty-state">
    <p>No NPCs available.</p>
    <Button label="Add NPC" icon="pi pi-plus" @click="props.onAddNpc()" />
  </div>
</template>

<style scoped>
.npc-overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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