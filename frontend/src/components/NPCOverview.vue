<!-- Holder for displaying NPCSummary Cards -->

<script setup>
import { inject } from 'vue';
import NPCSummary from './NPCSummary.vue';

const adventureNPCs = inject('adventureNPCs');
</script>

<template>
    <p>NPC Overview</p>
    <NPCSummary v-for="npc in adventureNPCs" :key="npc.id || npc.name" :npc="npc"></NPCSummary>
</template>

<!-- <style scoped >
div {
  margin: 1em;
  border-style: solid;
  border-color: white;
}
</style> -->