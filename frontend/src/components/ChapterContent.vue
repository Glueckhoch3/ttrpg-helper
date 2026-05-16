<!-- displays contents of a Chapter -->

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    story: {
        type: String,
        default: ''
    }
});
</script>

<template>
    <div class="chapter-content">
        <p v-if="props.story" class="story-text">{{ props.story }}</p>
        <p v-else class="empty-text">No story content available.</p>
    </div>
</template>

<style scoped>
.chapter-content {
  padding: 0.5rem 0;
}
.story-text {
    line-height: 1.6;
    margin: 0;
}
.empty-text {
    font-style: italic;
    color: var(--p-text-color-secondary, #6c757d);
}
</style>