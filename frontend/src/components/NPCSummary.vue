<!-- Component to show short Summary of an NPC in the NPCOverview Sidebar -->

<script setup>
import { ref, watch, defineProps } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';

const props = defineProps({
    npc: {
        type: Object,
        required: true
    },
    npcIndex: {
        type: Number,
        required: true
    },
    onSaveNpc: {
        type: Function,
        required: true
    },
    onDeleteNpc: {
        type: Function,
        required: true
    },
    autoStartEditToken: {
        type: Number,
        default: 0
    },
    panelControlSignal: {
        type: Object,
        default: null
    },
    focusSignal: {
        type: Object,
        default: null
    }
});

const isEditing = ref(false);
const isSaving = ref(false);
const isPanelCollapsed = ref(true);
const localError = ref('');
const draftNpc = ref({});

function createDraftNpc() {
    return {
        name: props.npc?.name || '',
        backstory: props.npc?.backstory || '',
        motivation: props.npc?.motivation || '',
        stats: { ...props.npc?.stats }
    };
}

watch(
    () => props.npc,
    () => {
        if (!isEditing.value) {
            draftNpc.value = createDraftNpc();
        }
    },
    { immediate: true }
);

watch(
    () => props.autoStartEditToken,
    (token) => {
        if (token > 0 && !isEditing.value) {
            startEdit();
        }
    }
);

watch(
    () => props.panelControlSignal?.token,
    (token) => {
        if (!token || !props.panelControlSignal?.action) {
            return;
        }

        if (props.panelControlSignal.action === 'expand') {
            isPanelCollapsed.value = false;
            return;
        }

        if (props.panelControlSignal.action === 'collapse') {
            isPanelCollapsed.value = true;
        }
    }
);

watch(
    () => props.focusSignal?.token,
    (token) => {
        if (!token || !props.focusSignal?.npcId) {
            return;
        }

        if (String(props.focusSignal.npcId) === String(props.npc?.id || '')) {
            isPanelCollapsed.value = false;
        }
    }
);

function startEdit() {
    localError.value = '';
    draftNpc.value = createDraftNpc();
    isPanelCollapsed.value = false;
    isEditing.value = true;
}

// Derive a short display label from a stat key (e.g. "strength" → "STR")
function statLabel(key) {
    return key.slice(0, 3).toUpperCase();
}

async function saveNpc() {
    isSaving.value = true;
    localError.value = '';

    try {
        await props.onSaveNpc({
            npcIndex: props.npcIndex,
            npc: {
                id: props.npc?.id || '',
                name: draftNpc.value.name,
                backstory: draftNpc.value.backstory,
                motivation: draftNpc.value.motivation,
                stats: { ...draftNpc.value.stats }
            }
        });
        isEditing.value = false;
    } catch (e) {
        localError.value = e?.message || 'Failed to save NPC.';
    } finally {
        isSaving.value = false;
    }
}

async function deleteNpc() {
    if (!globalThis.confirm(`Delete NPC ${props.npc?.id || ''}?`)) {
        return;
    }

    localError.value = '';
    try {
        await props.onDeleteNpc(props.npcIndex);
    } catch (e) {
        localError.value = e?.message || 'Failed to delete NPC.';
    }
}
</script>

<template>
    <Panel v-model:collapsed="isPanelCollapsed" toggleable class="npc-card mb-4" v-if="props.npc">
        <!-- Custom Header Slot -->
        <template #header>
            <div class="npc-header flex flex-col w-full">
                <div class="npc-title-row">
                    <span class="font-bold text-lg npc-name" :title="props.npc.name">{{ props.npc.name }}</span>
                    <div class="npc-actions">
                        <Button
                            :icon="isEditing ? 'pi pi-check' : 'pi pi-pencil'"
                            :aria-label="isEditing ? 'Save NPC' : 'Edit NPC'"
                            :loading="isSaving"
                            @click.stop="isEditing ? saveNpc() : startEdit()"
                        />
                        <Button
                            icon="pi pi-trash"
                            aria-label="Delete NPC"
                            severity="danger"
                            outlined
                            @click.stop="deleteNpc()"
                        />
                    </div>
                </div>

                <!-- Stats Row: shown directly under the name while just displaying -->
                <div v-if="!isEditing" class="stats-row text-xs">
                    <span
                        v-for="[key, value] in Object.entries(props.npc.stats || {})"
                        :key="key"
                        :title="key"
                        class="stat"
                    >
                        {{ statLabel(key) }}: {{ value }}
                    </span>
                </div>
            </div>
        </template>

        <!-- Expandable Content Slot -->
        <div class="npc-details text-sm">
            <div v-if="isEditing" class="npc-editor">
                <div class="field">
                    <span class="field-label">Name</span>
                    <InputText v-model="draftNpc.name" />
                </div>
                <div class="field">
                    <span class="field-label">Stats</span>
                    <div class="stats-editor-grid">
                        <div
                            v-for="[key] in Object.entries(draftNpc.stats || {})"
                            :key="key"
                            class="stat-input-field"
                        >
                            <label :for="`stat-${key}`" class="stat-input-label">{{ key }}</label>
                            <InputNumber
                                :inputId="`stat-${key}`"
                                v-model="draftNpc.stats[key]"
                                :min="0"
                                :max="99"
                                showButtons
                                buttonLayout="horizontal"
                                incrementButtonIcon="pi pi-plus"
                                decrementButtonIcon="pi pi-minus"
                            />
                        </div>
                    </div>
                </div>
                <div class="field">
                    <span class="field-label">Motivation</span>
                    <Textarea v-model="draftNpc.motivation" rows="3" autoResize />
                </div>
                <div class="field">
                    <span class="field-label">Backstory</span>
                    <Textarea v-model="draftNpc.backstory" rows="4" autoResize />
                </div>
            </div>
            <div v-else class="npc-view">
                <p><strong>Motivation:</strong> {{ props.npc.motivation }}</p>
                <p><strong>Backstory:</strong> {{ props.npc.backstory }}</p>
            </div>
            <p v-if="localError" class="error-text">{{ localError }}</p>
        </div>
    </Panel>
</template>

<style scoped>
.npc-card {
    margin-bottom: 1rem;
}

.npc-card :deep(.p-panel-header) {
    align-items: flex-start;
    gap: 0.75rem;
}

.npc-card :deep(.p-panel-header > :first-child) {
    flex: 1;
    min-width: 0;
}

.npc-header {
    width: 100%;
    gap: 0.75rem;
}

.npc-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: nowrap;
    width: 100%;
}

.npc-actions {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
    margin-left: 0.5rem;
    flex: 0 0 auto;
}

.npc-name {
    display: inline-block;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    gap: 0.5rem;
    margin-top: 0.25rem;
    width: 100%;
    /* color: var(--p-text-color-secondary, #6c757d); */
}

.stat {
    background-color: var(--p-surface-800, #e9ecef);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    white-space: nowrap;
    text-align: center;
}

/* Editor layout */
.npc-editor {
    display: grid;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-weight: 600;
}

.stats-editor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
}

.stat-input-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
}

.stat-input-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--p-text-color-secondary, #6c757d);
    text-transform: capitalize;
}

/* Keep the InputNumber (with +/- buttons) inside its grid cell */
.stat-input-field :deep(.p-inputnumber) {
    width: 100%;
}

.stat-input-field :deep(.p-inputnumber-input) {
    width: 100%;
    min-width: 0;
    text-align: center;
}

/* Read-only view */
.npc-view p {
    margin: 0.5rem 0;
    line-height: 1.5;
}

.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.75rem;
}
</style>
