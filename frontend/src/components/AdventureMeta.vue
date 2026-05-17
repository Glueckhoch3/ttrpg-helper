<!-- diplays the Adventures Metadata in the AdventureContent Component -->

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    metadata: {
        type: Object,
        default: () => ({})
    }
});
</script>

<template>
    <div class="adventure-meta">
        <h2>{{ props.metadata?.title || 'Unknown Adventure' }}</h2>
        <p v-if="props.metadata?.author"><strong>By:</strong> {{ props.metadata.author }}</p>
        <p v-if="props.metadata?.version"><strong>Version:</strong> {{ props.metadata.version }}</p>
        <p v-if="props.metadata?.summary" class="summary">{{ props.metadata.summary }}</p>
    </div>
</template>

<style scoped>
.adventure-meta {
  margin: 1em;
  padding: 1em;
  border-style: solid;
  border-width: 1px;
  border-radius: 8px;
  border-color: var(--p-content-border-color, #dee2e6);
  background-color: var(--p-content-background, #fff);
  color: var(--p-text-color, #333);
}

h2 {
    margin-top: 0;
}

.summary {
    margin-top: 1rem;
    font-style: italic;
}
</style>