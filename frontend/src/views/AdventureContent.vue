<!-- View that holds all the contents for an Adventure -->

<script setup>
import { ref, provide, computed, watch } from 'vue';
import AdventureMeta from '@/components/AdventureMeta.vue';
import ChapterOverview from '@/components/ChapterOverview.vue';
import NPCOverview from '@/components/NPCOverview.vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { getFile, saveFile } from '@/utils/api.js';
import {
    cloneValue,
    createChapterTemplate,
    createEncounterTemplate,
    createNpcTemplate
} from '@/utils/adventureTemplates.js';

const props = defineProps({
    filename: {
        type: String,
        required: true
    }
});

const adventureData = ref(null);
const loading = ref(false);
const error = ref(null);
const actionError = ref(null);
const newChapterSignal = ref({ token: 0, chapterId: '' });
const newEncounterSignal = ref({ token: 0, chapterId: '', encounterId: '' });
const newNpcSignal = ref({ token: 0, npcId: '' });
const focusedNpcSignal = ref({ token: 0, npcId: '' });

provide('adventureChapters', computed(() => adventureData.value?.chapters || []));
provide('adventureNPCs', computed(() => adventureData.value?.npcs || []));
provide('requestNpcFocus', requestNpcFocus);

function requestNpcFocus(npcId) {
    const normalizedNpcId = String(npcId ?? '').trim();
    if (!normalizedNpcId) {
        return;
    }

    focusedNpcSignal.value = {
        token: focusedNpcSignal.value.token + 1,
        npcId: normalizedNpcId
    };
}

async function loadAdventure(filename) {
    loading.value = true;
    error.value = null;
    actionError.value = null;
    try {
        const data = await getFile(filename);
        adventureData.value = data;
        console.log(`Fetched ${filename}`, data);
    } catch (e) {
        adventureData.value = null;
        error.value = e?.message || String(e);
        console.error("Failed to fetch adventure", e);
    } finally {
        loading.value = false;
    }
}

watch(
    () => props.filename,
    (filename) => {
        loadAdventure(filename);
    },
    { immediate: true }
);

async function persistAdventure() {
    await saveFile(adventureData.value, props.filename);
}

async function mutateAdventure(mutator) {
    if (!adventureData.value) {
        throw new Error('Adventure not loaded');
    }

    const previousAdventure = cloneValue(adventureData.value);
    mutator(adventureData.value);

    try {
        await persistAdventure();
        actionError.value = null;
    } catch (e) {
        adventureData.value = previousAdventure;
        actionError.value = e?.message || 'Failed to save adventure.';
        throw e;
    }
}

async function saveMetadata(metadataDraft) {
    await mutateAdventure((adventure) => {
        adventure.metadata = {
            ...adventure.metadata,
            ...metadataDraft
        };
    });
}

async function addChapter() {
    let createdChapter = null;

    await mutateAdventure((adventure) => {
        adventure.chapters = Array.isArray(adventure.chapters) ? adventure.chapters : [];
        createdChapter = createChapterTemplate(adventure.chapters);
        adventure.chapters.push(createdChapter);
    });

    if (createdChapter?.id) {
        newChapterSignal.value = {
            token: newChapterSignal.value.token + 1,
            chapterId: createdChapter.id
        };
    }
}

async function saveChapter({ chapterIndex, chapter }) {
    await mutateAdventure((adventure) => {
        const currentChapter = adventure.chapters?.[chapterIndex];
        if (!Array.isArray(adventure.chapters) || !currentChapter) {
            throw new Error('Chapter not found');
        }

        adventure.chapters[chapterIndex] = {
            ...chapter,
            id: currentChapter.id
        };
    });
}

async function deleteChapter(chapterIndex) {
    await mutateAdventure((adventure) => {
        if (!Array.isArray(adventure.chapters) || !adventure.chapters[chapterIndex]) {
            throw new Error('Chapter not found');
        }

        adventure.chapters.splice(chapterIndex, 1);
    });
}

async function addEncounter({ chapterIndex }) {
    let createdEncounter = null;
    let chapterId = '';

    await mutateAdventure((adventure) => {
        const chapter = adventure.chapters?.[chapterIndex];
        if (!chapter) {
            throw new Error('Chapter not found');
        }

        chapter.encounters = Array.isArray(chapter.encounters) ? chapter.encounters : [];
        chapterId = chapter.id || '';
        createdEncounter = createEncounterTemplate(chapter.id, chapter.encounters);
        chapter.encounters.push(createdEncounter);
    });

    if (createdEncounter?.id && chapterId) {
        newEncounterSignal.value = {
            token: newEncounterSignal.value.token + 1,
            chapterId,
            encounterId: createdEncounter.id
        };
    }
}

async function saveEncounter({ chapterIndex, encounterIndex, encounter }) {
    await mutateAdventure((adventure) => {
        const chapter = adventure.chapters?.[chapterIndex];
        const currentEncounter = chapter?.encounters?.[encounterIndex];
        if (!chapter || !currentEncounter) {
            throw new Error('Encounter not found');
        }

        chapter.encounters[encounterIndex] = {
            ...encounter,
            id: currentEncounter.id
        };
    });
}

async function deleteEncounter({ chapterIndex, encounterIndex }) {
    await mutateAdventure((adventure) => {
        const chapter = adventure.chapters?.[chapterIndex];
        if (!chapter || !chapter.encounters?.[encounterIndex]) {
            throw new Error('Encounter not found');
        }

        chapter.encounters.splice(encounterIndex, 1);
    });
}

async function addNpc() {
    let createdNpc = null;

    await mutateAdventure((adventure) => {
        adventure.npcs = Array.isArray(adventure.npcs) ? adventure.npcs : [];
        createdNpc = createNpcTemplate(adventure.npcs);
        adventure.npcs.push(createdNpc);
    });

    if (createdNpc?.id) {
        newNpcSignal.value = {
            token: newNpcSignal.value.token + 1,
            npcId: createdNpc.id
        };
    }
}

async function saveNpc({ npcIndex, npc }) {
    await mutateAdventure((adventure) => {
        const currentNpc = adventure.npcs?.[npcIndex];
        if (!Array.isArray(adventure.npcs) || !currentNpc) {
            throw new Error('NPC not found');
        }

        adventure.npcs[npcIndex] = {
            ...npc,
            id: currentNpc.id
        };
    });
}

async function deleteNpc(npcIndex) {
    await mutateAdventure((adventure) => {
        if (!Array.isArray(adventure.npcs) || !adventure.npcs[npcIndex]) {
            throw new Error('NPC not found');
        }

        adventure.npcs.splice(npcIndex, 1);
    });
}
</script>

<template>
    <div class="adventure-content-wrapper">
        <div v-if="loading" class="status-message">Loading adventure...</div>
        <div v-else-if="error" class="status-message error">Error: {{ error }}</div>
        <div v-else-if="actionError" class="status-message error">Error: {{ actionError }}</div>
        <Splitter class="adventure-layout-splitter">
            <!-- Left Pane: Meta + Chapters -->
            <SplitterPanel class="left-pane flex flex-col" :size="75" :minSize="30">
                <AdventureMeta
                    :metadata="adventureData?.metadata"
                    :onSaveMetadata="saveMetadata"
                ></AdventureMeta>
                <div class="spacer"></div>
                <ChapterOverview
                    :newChapterSignal="newChapterSignal"
                    :newEncounterSignal="newEncounterSignal"
                    :onAddChapter="addChapter"
                    :onDeleteChapter="deleteChapter"
                    :onSaveChapter="saveChapter"
                    :onAddEncounter="addEncounter"
                    :onSaveEncounter="saveEncounter"
                    :onDeleteEncounter="deleteEncounter"
                ></ChapterOverview>
            </SplitterPanel>
            
            <!-- Right side containing Middle and Right Panes -->
            <SplitterPanel class="right-pane" :size="25" :minSize="25">
                <NPCOverview
                    :newNpcSignal="newNpcSignal"
                    :focusedNpcSignal="focusedNpcSignal"
                    :onAddNpc="addNpc"
                    :onSaveNpc="saveNpc"
                    :onDeleteNpc="deleteNpc"
                ></NPCOverview>
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<style scoped>
.adventure-content-wrapper {
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
    overflow: hidden;
}

.status-message {
    margin-bottom: 1rem;
}

.status-message.error {
    color: var(--p-red-600, #dc3545);
}

.adventure-layout-splitter, .nested-splitter {
    height: 100%;
    width: 100%;
    border: none;
}

.left-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
}

.spacer {
    margin-bottom: 1rem;
}

.right-pane {
    display: flex;
    flex-direction: column;
    padding-left: 1rem;
    min-height: 0;
    overflow: hidden;
}

.middle-pane, .right-pane {
    overflow-y: hidden;
}
</style>