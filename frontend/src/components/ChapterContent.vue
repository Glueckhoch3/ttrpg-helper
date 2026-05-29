<!-- displays contents of a Chapter -->

<script setup>
import { ref, watch } from 'vue';
import Editor from 'primevue/editor';

const props = defineProps({
    story: {
        type: String,
        default: ''
    },
    onSaveStory: {
        type: Function,
        required: true
    }
});
const isEditing = ref(false);
const isSaving = ref(false);
const draftStory = ref(props.story);
const localError = ref('');

watch(
    () => props.story,
    (newStory) => {
        if (!isEditing.value) {
            draftStory.value = newStory || '';
        }
    }
);

function handleEdit() {
    localError.value = '';
    draftStory.value = props.story || '';
    isEditing.value = true;
}

async function handleSave() {
    isSaving.value = true;
    localError.value = '';
    try {
        await props.onSaveStory(draftStory.value);
        isEditing.value = false;
    } catch (e) {
        localError.value = e?.message || 'Failed to save chapter story.';
    } finally {
        isSaving.value = false;
    }
}
</script>

<template>
    <div class="chapter-content">
        <div class="actions">
            <button
                type="button"
                @click="isEditing ? handleSave() : handleEdit()"
                :disabled="isSaving"
            >
                {{ isEditing ? 'Save' : 'Edit' }}
            </button>
        </div>

        <Editor
            v-if="isEditing"
            v-model="draftStory"
            editorStyle="height: 220px"
        />

        <p v-else-if="props.story" class="story-text">{{ props.story }}</p>
        <p v-else class="empty-text">No story content available.</p>
        <p v-if="localError" class="error-text">{{ localError }}</p>
    </div>
</template>

<style scoped>
.chapter-content {
  padding: 0.5rem 0;
}
.actions {
    margin-bottom: 0.75rem;
}
.story-text {
    line-height: 1.6;
    margin: 0;
}
.empty-text {
    font-style: italic;
    color: var(--p-text-color-secondary, #6c757d);
}
.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.75rem;
}
</style>