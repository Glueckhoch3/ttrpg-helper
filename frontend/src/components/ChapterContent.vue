<!-- displays contents of a Chapter -->

<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Editor from 'primevue/editor';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { cloneValue } from '@/utils/adventureTemplates.js';

const props = defineProps({
    chapter: {
        type: Object,
        default: () => ({})
    },
    onSaveChapter: {
        type: Function,
        required: true
    },
    onDeleteChapter: {
        type: Function,
        required: true
    },
    autoStartEditToken: {
        type: Number,
        default: 0
    }
});
const isEditing = ref(false);
const isSaving = ref(false);
const draftChapter = ref({});
const localError = ref('');
const renderedStory = computed(() =>
    (props.chapter?.story || '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ')
);
function createDraftChapter() {
    return cloneValue({
        title: props.chapter?.title || '',
        summary: props.chapter?.summary || '',
        story: props.chapter?.story || '',
        encounters: Array.isArray(props.chapter?.encounters) ? props.chapter.encounters : []
    });
}

watch(
    () => props.chapter,
    () => {
        if (!isEditing.value) {
            draftChapter.value = createDraftChapter();
        }
    },
    { immediate: true }
);

watch(
    () => props.autoStartEditToken,
    (token) => {
        if (token > 0 && !isEditing.value) {
            handleEdit();
        }
    }
);

function handleEdit() {
    localError.value = '';
    draftChapter.value = createDraftChapter();
    isEditing.value = true;
}

async function handleSave() {
    isSaving.value = true;
    localError.value = '';
    try {
        await props.onSaveChapter({ ...draftChapter.value });
        isEditing.value = false;
    } catch (e) {
        localError.value = e?.message || 'Failed to save chapter.';
    } finally {
        isSaving.value = false;
    }
}

async function handleDelete() {
    if (!globalThis.confirm(`Delete chapter ${props.chapter?.id || ''}?`)) {
        return;
    }

    localError.value = '';
    try {
        await props.onDeleteChapter();
    } catch (e) {
        localError.value = e?.message || 'Failed to delete chapter.';
    }
}
</script>

<template>
    <div class="chapter-content">
        <div class="actions">
            <Button
                :icon="isEditing ? 'pi pi-check' : 'pi pi-pencil'"
                :aria-label="isEditing ? 'Save chapter' : 'Edit chapter'"
                :loading="isSaving"
                @click="isEditing ? handleSave() : handleEdit()"
            />
            <Button
                icon="pi pi-trash"
                aria-label="Delete chapter"
                severity="danger"
                outlined
                @click="handleDelete()"
            />
        </div>

        <div v-if="isEditing" class="editor-grid">
            <div class="field">
                <span class="field-label">Id</span>
                <InputText :modelValue="props.chapter?.id || ''" readonly disabled />
            </div>
            <div class="field">
                <span class="field-label">Title</span>
                <InputText v-model="draftChapter.title" />
            </div>
            <div class="field field-full">
                <span class="field-label">Summary</span>
                <Textarea v-model="draftChapter.summary" rows="3" autoResize />
            </div>
            <div class="field field-full">
                <span class="field-label">Story</span>
                <Editor
                    v-model="draftChapter.story"
                    editorStyle="height: 220px"
                />
            </div>
        </div>

        <div v-else>
            <p v-if="props.chapter?.title" class="chapter-title">{{ props.chapter.title }}</p>
            <p v-if="props.chapter?.summary" class="summary-text">{{ props.chapter.summary }}</p>
            <div v-if="props.chapter?.story" class="story-text" v-html="renderedStory"></div>
            <p v-else class="empty-text">No story content available.</p>
        </div>
        <p v-if="localError" class="error-text">{{ localError }}</p>
    </div>
</template>

<style scoped>
.chapter-content {
  padding: 0.5rem 0;
}
.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.editor-grid {
    display: grid;
    gap: 0.75rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.field-label {
    font-weight: 600;
}

.field-full {
    grid-column: 1 / -1;
}

.chapter-title {
    margin: 0 0 0.5rem;
    font-weight: 700;
}

.summary-text {
    margin: 0 0 0.75rem;
    font-style: italic;
}
.story-text {
    line-height: 1.6;
    margin: 0;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}
.story-text :deep(p) {
    margin: 0 0 0.75rem;
}
.story-text :deep(p:last-child) {
    margin-bottom: 0;
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