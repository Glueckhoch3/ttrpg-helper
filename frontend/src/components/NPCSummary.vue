<!-- Component to show short Summary of an NPC in the NPCOverview Sidebar -->

<script setup>
import { computed, ref, watch, defineProps } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';

// TODO: enable editing stats with editor/ picker primevue component

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
    }
});

const isEditing = ref(false);
const isSaving = ref(false);
const localError = ref('');
const draftNpc = ref({});

const statText = computed(() => JSON.stringify(props.npc?.stats || {}, null, 2));

function createDraftNpc() {
    return {
        id: props.npc?.id || '',
        name: props.npc?.name || '',
        backstory: props.npc?.backstory || '',
        motivation: props.npc?.motivation || '',
        stats: JSON.stringify(props.npc?.stats || {}, null, 2)
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

function startEdit() {
    localError.value = '';
    draftNpc.value = createDraftNpc();
    isEditing.value = true;
}

function clearStats() {
    draftNpc.value.stats = '{}';
}

async function saveNpc() {
    isSaving.value = true;
    localError.value = '';

    try {
        const statsValue = draftNpc.value.stats?.trim() ? JSON.parse(draftNpc.value.stats) : {};
        await props.onSaveNpc({
            npcIndex: props.npcIndex,
            npc: {
                id: draftNpc.value.id,
                name: draftNpc.value.name,
                backstory: draftNpc.value.backstory,
                motivation: draftNpc.value.motivation,
                stats: statsValue
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
    <Panel toggleable :collapsed="true" class="npc-card mb-4" v-if="props.npc">
        <!-- Custom Header Slot -->
        <template #header>
            <div class="npc-header flex flex-col w-full">
                <div class="npc-title-row">
                    <span class="font-bold text-lg npc-name">{{ props.npc.name }}</span>
                    <div class="npc-actions">
                        <Button
                            :label="isEditing ? 'Save' : 'Edit'"
                            icon="pi pi-pencil"
                            :loading="isSaving"
                            @click.stop="isEditing ? saveNpc() : startEdit()"
                        />
                        <Button
                            label="Delete"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            @click.stop="deleteNpc()"
                        />
                    </div>
                </div>
                
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
            <div v-if="isEditing" class="npc-editor">
                <div class="field">
                    <span class="field-label">Id</span>
                    <InputText v-model="draftNpc.id" />
                </div>
                <div class="field">
                    <span class="field-label">Name</span>
                    <InputText v-model="draftNpc.name" />
                </div>
                <div class="field">
                    <div class="field-header">
                        <span class="field-label">Stats</span>
                        <Button label="Clear Stats" severity="secondary" text @click="clearStats" />
                    </div>
                    <Textarea v-model="draftNpc.stats" rows="6" autoResize />
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
            <div v-else>
                <p><strong>Motivation:</strong> {{ props.npc.motivation }}</p>
                <p><strong>Backstory:</strong> {{ props.npc.backstory }}</p>
                <pre class="stats-pre"><strong>Stats:</strong> {{ statText }}</pre>
            </div>
            <p v-if="localError" class="error-text">{{ localError }}</p>
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

.npc-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.npc-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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

.npc-editor {
    display: grid;
    gap: 0.75rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.field-label {
    font-weight: 600;
}

.stats-pre {
    white-space: pre-wrap;
    margin: 0.5rem 0 0;
}

.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.75rem;
}
</style>