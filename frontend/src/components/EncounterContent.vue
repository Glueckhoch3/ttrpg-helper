<!-- Component to display the Content of an Encounter -->

<script setup>
import { reactive } from 'vue';
import Editor from 'primevue/editor';

const props = defineProps({
    encounters: {
        type: Array,
        default: () => []
    },
    onSaveEncounter: {
        type: Function,
        required: true
    }
});

const editState = reactive({});

function getEncounterKey(encounter, index) {
    return encounter?.id || `encounter-${index}`;
}

function ensureEncounterState(encounter, index) {
    const key = getEncounterKey(encounter, index);
    if (!editState[key]) {
        editState[key] = {
            isEditing: false,
            isSaving: false,
            draft: encounter?.description || '',
            error: ''
        };
    }
    return editState[key];
}

function startEdit(encounter, index) {
    const state = ensureEncounterState(encounter, index);
    state.error = '';
    state.draft = encounter?.description || '';
    state.isEditing = true;
}

async function saveEncounter(encounter, index) {
    const state = ensureEncounterState(encounter, index);
    state.isSaving = true;
    state.error = '';
    try {
        await props.onSaveEncounter({
            encounterIndex: index,
            description: state.draft
        });
        state.isEditing = false;
    } catch (e) {
        state.error = e?.message || 'Failed to save encounter.';
    } finally {
        state.isSaving = false;
    }
}
</script>

<template>
    <div class="encounter-content">
        <h4 v-if="props.encounters && props.encounters.length > 0">Encounters</h4>
        <ul v-if="props.encounters && props.encounters.length > 0">
            <li v-for="(encounter, encounterIndex) in props.encounters" :key="encounter.id || encounterIndex">
                <div class="encounter-header">
                    <span class="encounter-type">{{ encounter.type }}</span>
                    <button
                        type="button"
                        @click="ensureEncounterState(encounter, encounterIndex).isEditing ? saveEncounter(encounter, encounterIndex) : startEdit(encounter, encounterIndex)"
                        :disabled="ensureEncounterState(encounter, encounterIndex).isSaving"
                    >
                        {{ ensureEncounterState(encounter, encounterIndex).isEditing ? 'Save' : 'Edit' }}
                    </button>
                </div>
                <Editor
                    v-if="ensureEncounterState(encounter, encounterIndex).isEditing"
                    v-model="ensureEncounterState(encounter, encounterIndex).draft"
                    :readonly="!ensureEncounterState(encounter, encounterIndex).isEditing"
                    editorStyle="height: 180px"
                />
                <p v-else class="encounter-description">{{ encounter.description }}</p>
                <p v-if="ensureEncounterState(encounter, encounterIndex).error" class="error-text">
                    {{ ensureEncounterState(encounter, encounterIndex).error }}
                </p>
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
</style>