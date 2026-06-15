<!-- Component to display the Content of an Encounter -->

<script setup>
import { computed, inject, nextTick, reactive, ref, unref, watch } from 'vue';
import Button from 'primevue/button';
import Editor from 'primevue/editor';
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import { buildNpcHref, parseNpcHref, replaceSingleNpcLinkInHtml } from '@/utils/richText.js';

const props = defineProps({
    encounters: {
        type: Array,
        default: () => []
    },
    chapterIndex: {
        type: Number,
        required: true
    },
    chapterId: {
        type: String,
        default: ''
    },
    newEncounterSignal: {
        type: Object,
        default: null
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
const encounterItemRefs = ref({});
const injectedAdventureNPCs = inject('adventureNPCs', []);
const adventureNPCs = computed(() => {
    const npcs = unref(injectedAdventureNPCs);
    return Array.isArray(npcs) ? npcs : [];
});
const requestNpcFocus = inject('requestNpcFocus', () => {});
const linkInsertPopoverRef = ref(null);
const brokenLinkPopoverRef = ref(null);
const activeInsertKey = ref('');
const brokenLinkError = ref('');
const brokenLinkTarget = ref(null);
const brokenLinkContext = ref({ encounter: null, index: -1, container: null });
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

function setEncounterItemRef(key, element) {
    if (!element) {
        return;
    }

    encounterItemRefs.value[String(key)] = element;
}

function ensureEncounterState(encounter, index) {
    const key = getEncounterKey(encounter, index);
    if (!editState[key]) {
        editState[key] = {
            isEditing: false,
            isSaving: false,
            draft: {
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
                id: encounter?.id || '',
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

function renderDescription(value) {
    return (value || '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
}

function openInsertPopover(event, encounter, index) {
    if (!adventureNPCs.value.length) {
        return;
    }

    activeInsertKey.value = getEncounterKey(encounter, index);
    linkInsertPopoverRef.value?.toggle(event);
}

function appendNpcLinkToHtml(sourceHtml, npc) {
    const href = buildNpcHref(npc?.id);
    const label = String(npc?.name ?? '').trim();
    const normalizedHtml = String(sourceHtml ?? '').trim();
    if (!href || !label) {
        return normalizedHtml;
    }

    if (typeof document === 'undefined') {
        const base = normalizedHtml || '<p></p>';
        return `${base}<p><a href="${href}">${label}</a></p>`;
    }

    const container = document.createElement('div');
    container.innerHTML = normalizedHtml || '<p></p>';

    let paragraph = container.querySelector('p:last-of-type');
    if (!paragraph) {
        paragraph = document.createElement('p');
        container.appendChild(paragraph);
    }

    if (paragraph.textContent?.trim()) {
        paragraph.appendChild(document.createTextNode(' '));
    }

    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    anchor.textContent = label;
    paragraph.appendChild(anchor);

    return container.innerHTML;
}

function insertNpcLink(npc) {
    const state = editState[activeInsertKey.value];
    if (!state) {
        return;
    }

    state.draft.description = appendNpcLinkToHtml(state.draft.description, npc);
    linkInsertPopoverRef.value?.hide();
}

function linkDescriptor(anchorElement, containerElement) {
    if (!anchorElement || !containerElement) {
        return null;
    }

    const href = anchorElement.getAttribute('href') || '';
    const text = anchorElement.textContent || '';
    let occurrence = -1;
    let matchCount = -1;
    const allAnchors = containerElement.querySelectorAll('a[href]');
    for (const anchor of allAnchors) {
        const anchorHref = anchor.getAttribute('href') || '';
        const anchorText = anchor.textContent || '';
        if (anchorHref !== href || anchorText !== text) {
            continue;
        }

        matchCount += 1;
        if (anchor === anchorElement) {
            occurrence = matchCount;
            break;
        }
    }

    if (occurrence < 0) {
        return null;
    }

    return { href, text, occurrence };
}

function handleRenderedDescriptionClick(event, encounter, index) {
    const anchorElement = event.target?.closest?.('a[href]');
    if (!anchorElement) {
        return;
    }

    const npcId = parseNpcHref(anchorElement.getAttribute('href'));
    if (!npcId) {
        return;
    }

    event.preventDefault();
    const targetNpc = adventureNPCs.value.find((npc) => String(npc?.id || '') === npcId);
    if (targetNpc) {
        requestNpcFocus(targetNpc.id);
        return;
    }

    const containerElement = event.currentTarget;
    const descriptor = linkDescriptor(anchorElement, containerElement);
    if (!descriptor) {
        return;
    }

    brokenLinkError.value = 'Referenced NPC no longer exists. Choose a replacement.';
    brokenLinkTarget.value = descriptor;
    brokenLinkContext.value = {
        encounter,
        index,
        container: containerElement
    };
    brokenLinkPopoverRef.value?.show(event);
}

async function replaceBrokenEncounterLink(npc) {
    const descriptor = brokenLinkTarget.value;
    const encounter = brokenLinkContext.value?.encounter;
    const encounterIndex = brokenLinkContext.value?.index;
    if (!descriptor || !encounter || !Number.isInteger(encounterIndex) || encounterIndex < 0) {
        return;
    }

    const previousDescription = encounter?.description || '';
    const nextDescription = replaceSingleNpcLinkInHtml(previousDescription, descriptor, npc);
    if (nextDescription === previousDescription) {
        brokenLinkPopoverRef.value?.hide();
        return;
    }

    try {
        await props.onSaveEncounter({
            chapterIndex: props.chapterIndex,
            encounterIndex,
            encounter: {
                id: encounter?.id || '',
                type: encounter?.type || '',
                description: nextDescription
            }
        });
        brokenLinkPopoverRef.value?.hide();
        brokenLinkTarget.value = null;
        brokenLinkError.value = '';
    } catch (e) {
        const state = ensureEncounterState(encounter, encounterIndex);
        state.error = e?.message || 'Failed to update NPC link.';
    }
}

watch(
    () => props.newEncounterSignal?.token,
    async (token) => {
        if (!token || !props.newEncounterSignal) {
            return;
        }

        if (props.newEncounterSignal.chapterId !== props.chapterId) {
            return;
        }

        await nextTick();

        const encounterIndex = (props.encounters || []).findIndex(
            (encounter) => encounter?.id === props.newEncounterSignal.encounterId
        );

        if (encounterIndex < 0) {
            return;
        }

        const encounter = props.encounters[encounterIndex];
        startEdit(encounter, encounterIndex);

        await nextTick();
        const key = getEncounterKey(encounter, encounterIndex);
        encounterItemRefs.value[String(key)]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
);
</script>

<template>
    <div class="encounter-content">
        <div class="encounter-header-row" v-if="props.encounters && props.encounters.length > 0">
            <h4>Encounters</h4>
            <Button icon="pi pi-plus" aria-label="Add encounter" @click="props.onAddEncounter()" />
        </div>
        <ul v-if="props.encounters && props.encounters.length > 0">
            <li
                v-for="row in encounterRows"
                :key="row.encounter.id || row.index"
                :ref="(element) => setEncounterItemRef(getEncounterKey(row.encounter, row.index), element)"
            >
                <div class="encounter-header">
                    <div class="encounter-headline">
                        <span class="encounter-type">{{ row.encounter.type }}</span>
                    </div>
                    <div class="encounter-actions">
                        <Button
                            :icon="row.state.isEditing ? 'pi pi-check' : 'pi pi-pencil'"
                            :aria-label="row.state.isEditing ? 'Save encounter' : 'Edit encounter'"
                            :loading="row.state.isSaving"
                            @click="row.state.isEditing ? saveEncounter(row.encounter, row.index) : startEdit(row.encounter, row.index)"
                        />
                        <Button
                            icon="pi pi-trash"
                            aria-label="Delete encounter"
                            severity="danger"
                            outlined
                            @click="deleteEncounter(row.encounter, row.index)"
                        />
                    </div>
                </div>
                <div v-if="row.state.isEditing" class="encounter-editor">
                    <div class="field">
                        <span class="field-label">Type</span>
                        <InputText v-model="row.state.draft.type" />
                    </div>
                    <div class="field field-full">
                        <span class="field-label">Description</span>
                        <Editor
                            v-model="row.state.draft.description"
                            editorStyle="height: 180px"
                        >
                            <template #toolbar>
                                <span class="ql-formats">
                                    <button class="ql-bold"></button>
                                    <button class="ql-italic"></button>
                                    <button class="ql-underline"></button>
                                </span>
                                <span class="ql-formats">
                                    <select class="ql-color"></select>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-list" value="ordered"></button>
                                    <button class="ql-list" value="bullet"></button>
                                </span>
                                <span class="ql-formats">
                                    <button
                                        class="npc-link-toolbar-button"
                                        type="button"
                                        :disabled="!adventureNPCs.length"
                                        aria-label="Insert NPC link"
                                        @mousedown.prevent
                                        @click="(event) => openInsertPopover(event, row.encounter, row.index)"
                                    >
                                        NPC
                                    </button>
                                </span>
                            </template>
                        </Editor>
                    </div>
                </div>
                <div v-else>
                    <div
                        v-if="row.encounter.description"
                        class="encounter-description"
                        v-html="renderDescription(row.encounter.description)"
                        @click="(event) => handleRenderedDescriptionClick(event, row.encounter, row.index)"
                    ></div>
                    <p v-else class="encounter-description empty-text">No encounter description available.</p>
                </div>
                <p v-if="row.state.error" class="error-text">{{ row.state.error }}</p>
            </li>
        </ul>
        <div v-else class="empty-state">
            <p class="empty-text">No encounters available.</p>
            <Button icon="pi pi-plus" aria-label="Add encounter" @click="props.onAddEncounter()" />
        </div>
        <Popover ref="linkInsertPopoverRef">
            <div class="npc-link-picker">
                <p class="npc-link-picker-title">Select NPC to link</p>
                <div v-if="adventureNPCs.length" class="npc-link-picker-list">
                    <Button
                        v-for="npc in adventureNPCs"
                        :key="npc.id || npc.name"
                        type="button"
                        text
                        class="npc-link-picker-item"
                        @click="insertNpcLink(npc)"
                    >
                        {{ npc.name || npc.id }}
                    </Button>
                </div>
                <p v-else class="empty-text">No NPCs available to link.</p>
            </div>
        </Popover>
        <Popover ref="brokenLinkPopoverRef">
            <div class="npc-link-picker">
                <p v-if="brokenLinkError" class="picker-error">{{ brokenLinkError }}</p>
                <p class="npc-link-picker-title">Pick replacement NPC</p>
                <div v-if="adventureNPCs.length" class="npc-link-picker-list">
                    <Button
                        v-for="npc in adventureNPCs"
                        :key="`replace-${npc.id || npc.name}`"
                        type="button"
                        text
                        class="npc-link-picker-item"
                        @click="replaceBrokenEncounterLink(npc)"
                    >
                        {{ npc.name || npc.id }}
                    </Button>
                </div>
                <p v-else class="empty-text">No NPCs available.</p>
            </div>
        </Popover>
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
    font-size: 1rem;
    line-height: 1.6;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}
.encounter-description :deep(p) {
    margin: 0 0 0.75rem;
}
.encounter-description :deep(p:last-child) {
    margin-bottom: 0;
}

.encounter-description :deep(a) {
    text-decoration: underline;
}

:deep(.p-editor-content .ql-editor) {
    font-size: 1rem;
    line-height: 1.6;
}

:deep(.p-editor-content .ql-editor p) {
    margin: 0 0 0.75rem;
}

:deep(.p-editor-content .ql-editor p:last-child) {
    margin-bottom: 0;
}

:deep(.p-editor-content .ql-editor ol li[data-list='ordered']) {
    list-style-type: decimal;
}

:deep(.p-editor-content .ql-editor ol li[data-list='bullet']) {
    list-style-type: disc;
}

:deep(.p-editor-content .ql-editor li .ql-ui) {
    display: none;
}

:deep(.p-editor-content .ql-editor li::before) {
    content: none;
}

.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.5rem;
}

.npc-link-picker {
    display: grid;
    gap: 0.5rem;
    min-width: 14rem;
}

.npc-link-picker-title {
    margin: 0;
    font-weight: 600;
}

.npc-link-picker-list {
    display: grid;
    gap: 0.25rem;
}

.npc-link-picker-item {
    justify-content: flex-start;
}

.picker-error {
    margin: 0;
    color: var(--p-red-600, #dc3545);
    font-size: 0.9rem;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
</style>