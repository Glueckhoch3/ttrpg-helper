<!-- displays contents of a Chapter -->

<script setup>
import { computed, inject, ref, unref, watch } from 'vue';
import Button from 'primevue/button';
import Editor from 'primevue/editor';
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import Textarea from 'primevue/textarea';
import { cloneValue } from '@/utils/adventureTemplates.js';
import { buildNpcHref, parseNpcHref, replaceSingleNpcLinkInHtml } from '@/utils/richText.js';

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
const injectedAdventureNPCs = inject('adventureNPCs', []);
const adventureNPCs = computed(() => {
    const npcs = unref(injectedAdventureNPCs);
    return Array.isArray(npcs) ? npcs : [];
});
const requestNpcFocus = inject('requestNpcFocus', () => {});
const linkInsertPopoverRef = ref(null);
const brokenLinkPopoverRef = ref(null);
const storyContainerRef = ref(null);
const brokenLinkError = ref('');
const brokenLinkTarget = ref(null);
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

function toggleLinkInsertPopover(event) {
    if (!adventureNPCs.value.length) {
        return;
    }

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
    draftChapter.value.story = appendNpcLinkToHtml(draftChapter.value.story, npc);
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

function handleRenderedStoryClick(event) {
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

    const descriptor = linkDescriptor(anchorElement, storyContainerRef.value);
    if (!descriptor) {
        return;
    }

    brokenLinkError.value = 'Referenced NPC no longer exists. Choose a replacement.';
    brokenLinkTarget.value = descriptor;
    brokenLinkPopoverRef.value?.show(event);
}

async function replaceBrokenStoryLink(npc) {
    const target = brokenLinkTarget.value;
    if (!target) {
        return;
    }

    const nextStory = replaceSingleNpcLinkInHtml(props.chapter?.story || '', target, npc);
    if (nextStory === (props.chapter?.story || '')) {
        brokenLinkPopoverRef.value?.hide();
        return;
    }

    try {
        await props.onSaveChapter({
            title: props.chapter?.title || '',
            summary: props.chapter?.summary || '',
            story: nextStory,
            encounters: Array.isArray(props.chapter?.encounters) ? props.chapter.encounters : []
        });
        brokenLinkPopoverRef.value?.hide();
        brokenLinkTarget.value = null;
        brokenLinkError.value = '';
    } catch (e) {
        localError.value = e?.message || 'Failed to update NPC link.';
    }
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
                                @click="toggleLinkInsertPopover"
                            >
                                NPC
                            </button>
                        </span>
                    </template>
                </Editor>
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
            </div>
        </div>

        <div v-else>
            <p v-if="props.chapter?.title" class="chapter-title">{{ props.chapter.title }}</p>
            <p v-if="props.chapter?.summary" class="summary-text">{{ props.chapter.summary }}</p>
            <div
                v-if="props.chapter?.story"
                ref="storyContainerRef"
                class="story-text"
                v-html="renderedStory"
                @click="handleRenderedStoryClick"
            ></div>
            <p v-else class="empty-text">No story content available.</p>
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
                            @click="replaceBrokenStoryLink(npc)"
                        >
                            {{ npc.name || npc.id }}
                        </Button>
                    </div>
                    <p v-else class="empty-text">No NPCs available.</p>
                </div>
            </Popover>
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
    font-size: 1rem;
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

.story-text :deep(a) {
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

.empty-text {
    font-style: italic;
    color: var(--p-text-color-secondary, #6c757d);
}
.error-text {
    color: var(--p-red-600, #dc3545);
    margin-top: 0.75rem;
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
</style>