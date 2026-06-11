<!-- Component to display the Content of an Encounter -->

<script setup>
import { computed, reactive } from 'vue';
import Button from 'primevue/button';
import Editor from 'primevue/editor';
import InputText from 'primevue/inputtext';
import { richTextToDisplayText } from '@/utils/richText.js';

const props = defineProps({
    encounters: {
        type: Array,
        default: () => []
    },
    chapterIndex: {
        type: Number,
        required: true
    },
    onAddEncounter: {
        type: Function,
        required: true
    },
    onSaveEncounter: {
        type: Function,
        required: true
    },
    onDeleteEncounter: {
        type: Function,
        required: true
    }
});

const editState = reactive({});
const encounterRows = computed(() =>
    (props.encounters || []).map((encounter, index) => ({
        encounter,
        index,
        state: ensureEncounterState(encounter, index)
    }))
);

function getEncounterKey(encounter, index) {
    return encounter?.id || `encounter-${index}`;
}

function ensureEncounterState(encounter, index) {
    const key = getEncounterKey(encounter, index);
    if (!editState[key]) {
        editState[key] = {
            isEditing: false,
            isSaving: false,
            draft: {
                id: encounter?.id || '',
                type: encounter?.type || '',
                description: encounter?.description || ''
            },
            error: ''
        };
    }
    return editState[key];
}

function startEdit(encounter, index) {
    const state = ensureEncounterState(encounter, index);
    state.error = '';
    state.draft = {
        id: encounter?.id || '',
        type: encounter?.type || '',
        description: encounter?.description || ''
    };
    state.isEditing = true;
}

async function saveEncounter(encounter, index) {
    const state = ensureEncounterState(encounter, index);
    state.isSaving = true;
    state.error = '';
    try {
        await props.onSaveEncounter({
            chapterIndex: props.chapterIndex,
            encounterIndex: index,
            encounter: {
                ...state.draft
            }
        });
        state.isEditing = false;
    } catch (e) {
        state.error = e?.message || 'Failed to save encounter.';
    } finally {
        state.isSaving = false;
    }
}

async function deleteEncounter(encounter, index) {
    if (!globalThis.confirm(`Delete encounter ${encounter?.id || ''}?`)) {
        return;
    }

    const state = ensureEncounterState(encounter, index);
    state.error = '';
    try {
        await props.onDeleteEncounter({
            chapterIndex: props.chapterIndex,
            encounterIndex: index
        });
    } catch (e) {
        state.error = e?.message || 'Failed to delete encounter.';
    }
}

function displayDescription(value) {
    return richTextToDisplayText(value);
}
</script>

<template>
    <div class="encounter-content">
        <div class="encounter-header-row" v-if="props.encounters && props.encounters.length > 0">
            <h4>Encounters</h4>
            <Button label="Add" icon="pi pi-plus" @click="props.onAddEncounter()" />
        </div>
        <ul v-if="props.encounters && props.encounters.length > 0">
            <li v-for="row in encounterRows" :key="row.encounter.id || row.index">
                <div class="encounter-header">
                    <div class="encounter-headline">
                        <span class="encounter-id">{{ row.encounter.id }}</span>
                        <span class="encounter-type">{{ row.encounter.type }}</span>
                    </div>
                    <div class="encounter-actions">
                        <Button
                            :label="row.state.isEditing ? 'Save' : 'Edit'"
                            icon="pi pi-pencil"
                            :loading="row.state.isSaving"
                            @click="row.state.isEditing ? saveEncounter(row.encounter, row.index) : startEdit(row.encounter, row.index)"
                        />
                        <Button
                            label="Delete"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            @click="deleteEncounter(row.encounter, row.index)"
                        />
                    </div>
                </div>
                <div v-if="row.state.isEditing" class="encounter-editor">
                    <div class="field">
                        <span class="field-label">Id</span>
                        <InputText v-model="row.state.draft.id" />
                    </div>
                    <div class="field">
                        <span class="field-label">Type</span>
                        <InputText v-model="row.state.draft.type" />
                    </div>
                    <div class="field field-full">
                        <span class="field-label">Description</span>
                        <Editor
                            v-model="row.state.draft.description"
                            editorStyle="height: 180px"
                        />
                    </div>
                </div>
                <div v-else>
                    <p class="encounter-id-line">{{ row.encounter.id }}</p>
                    <p class="encounter-description">{{ displayDescription(row.encounter.description) }}</p>
                </div>
                <p v-if="row.state.error" class="error-text">{{ row.state.error }}</p>
            </li>
        </ul>
        <div v-else class="empty-state">
            <p class="empty-text">No encounters available.</p>
            <Button label="Add Encounter" icon="pi pi-plus" @click="props.onAddEncounter()" />
        </div>
    </div>
</template>

<style scoped>
.encounter-content {
    padding: 0.5rem 0;
}

.encounter-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.encounter-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.encounter-headline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.encounter-id,
.encounter-id-line {
    font-size: 0.85rem;
    color: var(--p-text-color-secondary, #6c757d);
}

.encounter-id-line {
    margin: 0 0 0.35rem;
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
.encounter-editor {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
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
.encounter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}
.encounter-type {
    font-weight: bold;
    text-transform: capitalize;
}
.encounter-description {
    margin: 0;
}
.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.5rem;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
</style>