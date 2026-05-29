<!-- View that holds all the contents for an Adventure -->

<script setup>
import { ref, provide, computed, watch } from 'vue';
import AdventureMeta from '@/components/AdventureMeta.vue';
import ChapterOverview from '@/components/ChapterOverview.vue';
import NPCOverview from '@/components/NPCOverview.vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { getFile, saveFile } from '@/utils/api.js';

const props = defineProps({
    filename: {
        type: String,
        required: true
    }
});

const adventureData = ref(null);
const loading = ref(false);
const error = ref(null);
const saveError = ref(null);

provide('adventureChapters', computed(() => adventureData.value?.chapters));
provide('adventureNPCs', computed(() => adventureData.value?.npcs));

async function loadAdventure(filename) {
    loading.value = true;
    error.value = null;
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
    saveError.value = null;
    await saveFile(adventureData.value, props.filename);
}

async function saveChapterStory({ chapterIndex, story }) {
    if (!adventureData.value?.chapters?.[chapterIndex]) {
        throw new Error('Chapter not found');
    }

    const chapter = adventureData.value.chapters[chapterIndex];
    const previousStory = chapter.story;
    chapter.story = story;

    try {
        await persistAdventure();
    } catch (e) {
        chapter.story = previousStory;
        saveError.value = e?.message || String(e);
        throw e;
    }
}

async function saveEncounterDescription({ chapterIndex, encounterIndex, description }) {
    const encounter = adventureData.value?.chapters?.[chapterIndex]?.encounters?.[encounterIndex];
    if (!encounter) {
        throw new Error('Encounter not found');
    }

    const previousDescription = encounter.description;
    encounter.description = description;

    try {
        await persistAdventure();
    } catch (e) {
        encounter.description = previousDescription;
        saveError.value = e?.message || String(e);
        throw e;
    }
}
</script>

<template>
    <div class="adventure-content-wrapper">
        <div v-if="loading" class="status-message">Loading adventure...</div>
        <div v-else-if="error" class="status-message error">Error: {{ error }}</div>
        <div v-else-if="saveError" class="status-message error">Save failed: {{ saveError }}</div>
        <Splitter class="adventure-layout-splitter">
            <!-- Left Pane: Meta + Chapters -->
            <SplitterPanel class="left-pane flex flex-col" :size="75" :minSize="30">
                <AdventureMeta :metadata="adventureData?.metadata"></AdventureMeta>
                <div class="spacer"></div>
                <ChapterOverview
                    :onSaveStory="saveChapterStory"
                    :onSaveEncounter="saveEncounterDescription"
                ></ChapterOverview>
            </SplitterPanel>
            
            <!-- Right side containing Middle and Right Panes -->
            <SplitterPanel class="right-pane" :size="25" :minSize="25">
                <NPCOverview></NPCOverview>
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