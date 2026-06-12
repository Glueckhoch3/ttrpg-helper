<!-- diplays the Adventures Metadata in the AdventureContent Component -->

<script setup>
import { ref, watch, defineProps} from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const props = defineProps({
    metadata: {
        type: Object,
        default: () => ({})
    },
    onSaveMetadata: {
        type: Function,
        required: true
    }
});

const isEditing = ref(false);
const isSaving = ref(false);
const localError = ref('');
const draftMetadata = ref({});

function cloneMetadata() {
    return {
        id: props.metadata?.id || '',
        title: props.metadata?.title || '',
        version: props.metadata?.version || '',
        author: props.metadata?.author || '',
        summary: props.metadata?.summary || ''
    };
}

watch(
    () => props.metadata,
    () => {
        if (!isEditing.value) {
            draftMetadata.value = cloneMetadata();
        }
    },
    { immediate: true }
);

function startEdit() {
    localError.value = '';
    draftMetadata.value = cloneMetadata();
    isEditing.value = true;
}

async function saveMetadata() {
    isSaving.value = true;
    localError.value = '';

    try {
        await props.onSaveMetadata({ ...draftMetadata.value});
        isEditing.value = false;
    } catch (e) {
        localError.value = e?.message || 'Failed to save metadata.';
    } finally {
        isSaving.value = false;
    }
}
</script>

<template>
    <div class="adventure-meta">
        <div class="header-row">
            <h2>{{ props.metadata?.title || 'Unknown Adventure' }}</h2>
            <Button
                :label="isEditing ? 'Save' : 'Edit Metadata'"
                icon="pi pi-pencil"
                :loading="isSaving"
                @click="isEditing ? saveMetadata() : startEdit()"
            />
        </div>

        <div v-if="isEditing" class="editor-grid">
            <div class="field">
                <span class="field-label">Id</span>
                <InputText v-model="draftMetadata.id" />
            </div>
            <div class="field">
                <span class="field-label">Title</span>
                <InputText v-model="draftMetadata.title" />
            </div>
            <div class="field">
                <span class="field-label">Version</span>
                <InputText v-model="draftMetadata.version" />
            </div>
            <div class="field">
                <span class="field-label">Author</span>
                <InputText v-model="draftMetadata.author" />
            </div>
            <div class="field field-full">
                <span class="field-label">Summary</span>
                <Textarea v-model="draftMetadata.summary" rows="4" autoResize />
            </div>
        </div>

        <div v-else class="metadata-preview">
            <p v-if="props.metadata?.author"><strong>By:</strong> {{ props.metadata.author }}</p>
            <p v-if="props.metadata?.version"><strong>Version:</strong> {{ props.metadata.version }}</p>
            <p v-if="props.metadata?.summary" class="summary">{{ props.metadata.summary }}</p>
        </div>

        <p v-if="localError" class="error-text">{{ localError }}</p>
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

.header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.editor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

.summary {
    margin-top: 1rem;
    font-style: italic;
}

.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.75rem;
}
</style>