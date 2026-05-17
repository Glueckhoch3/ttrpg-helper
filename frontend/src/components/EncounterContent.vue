<!-- Component to display the Content of an Encounter -->

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    encounters: {
        type: Array,
        default: () => []
    }
});
</script>

<template>
    <div class="encounter-content">
        <h4 v-if="props.encounters && props.encounters.length > 0">Encounters</h4>
        <ul v-if="props.encounters && props.encounters.length > 0">
            <li v-for="encounter in props.encounters" :key="encounter.id">
                <span class="encounter-type">{{ encounter.type }}</span>: {{ encounter.description }}
            </li>
        </ul>
        <p v-else class="empty-text">No encounters available.</p>
    </div>
</template>

<style scoped>
.encounter-content {
    padding: 0.5rem 0;
}
.empty-text {
    font-style: italic;
    color: var(--p-text-color-secondary, #6c757d);
}
h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
}
li {
    margin-bottom: 0.5rem;
}
.encounter-type {
    font-weight: bold;
    text-transform: capitalize;
}
</style>