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

provide('adventureChapters', computed(() => adventureData.value?.chapters || []));
provide('adventureNPCs', computed(() => adventureData.value?.npcs || []));

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
    await mutateAdventure((adventure) => {
        adventure.chapters = Array.isArray(adventure.chapters) ? adventure.chapters : [];
        adventure.chapters.push(createChapterTemplate(adventure.chapters));
    });
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
    await mutateAdventure((adventure) => {
        const chapter = adventure.chapters?.[chapterIndex];
        if (!chapter) {
            throw new Error('Chapter not found');
        }

        chapter.encounters = Array.isArray(chapter.encounters) ? chapter.encounters : [];
        chapter.encounters.push(createEncounterTemplate(chapter.id, chapter.encounters));
    });
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
    await mutateAdventure((adventure) => {
        adventure.npcs = Array.isArray(adventure.npcs) ? adventure.npcs : [];
        adventure.npcs.push(createNpcTemplate(adventure.npcs));
    });
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
    height: 100vh;
    padding: 1rem;
    box-sizing: border-box;
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
    overflow-y: auto;
}

.spacer {
    margin-bottom: 1rem;
}

.right-pane {
    padding-left: 1rem;
}

.middle-pane, .right-pane {
    overflow-y: auto;
}
</style>