<!-- Component to show short Summary of an NPC in the NPCOverview Sidebar -->

<script setup>
import { defineProps } from 'vue';
import Panel from 'primevue/panel';

const props = defineProps({
    npc: {
        type: Object,
        required: true
    }
});
</script>

<template>
    <Panel toggleable :collapsed="true" class="npc-card mb-4" v-if="props.npc">
        <!-- Custom Header Slot -->
        <template #header>
            <div class="npc-header flex flex-col w-full">
                <!-- Name -->
                <span class="font-bold text-lg npc-name">{{ props.npc.name }}</span>
                
                <!-- Stats Row -->
                <div class="stats-row flex flex-wrap gap-2 text-xs" style="color: var(--p-text-color-secondary, #6c757d);">
                    <span title="Health" class="stat">HP: {{ props.npc.stats?.health }}</span>
                    <span title="Strength" class="stat">STR: {{ props.npc.stats?.strength }}</span>
                    <span title="Dexterity" class="stat">DEX: {{ props.npc.stats?.dexterity }}</span>
                    <span title="Intelligence" class="stat">INT: {{ props.npc.stats?.intelligence }}</span>
                    <span title="Wisdom" class="stat">WIS: {{ props.npc.stats?.wisdom }}</span>
                    <span title="Charisma" class="stat">CHA: {{ props.npc.stats?.charisma }}</span>
                </div>
            </div>
        </template>
        
        <!-- Expandable Content Slot -->
        <div class="npc-details text-sm">
            <p><strong>Motivation:</strong> {{ props.npc.motivation }}</p>
            <p><strong>Backstory:</strong> {{ props.npc.backstory }}</p>
        </div>
    </Panel>
</template>

<style scoped>
.npc-card {
    margin-bottom: 1rem;
}
.npc-header {
    margin-right: 1rem; /* Space between header content and toggle button */
}
.npc-name {
    margin-bottom: 0.5rem;
    display: inline-block;
}
.stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.stat {
    background-color: var(--p-surface-200, #e9ecef);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    white-space: nowrap;
}
.npc-details p {
    margin: 0.5rem 0;
    line-height: 1.5;
}
</style>