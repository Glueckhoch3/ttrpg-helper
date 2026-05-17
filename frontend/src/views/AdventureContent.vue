<!-- View that holds all the contents for an Adventure -->

<script setup>
import { ref, onMounted, provide, computed } from 'vue';
import AdventureMeta from '@/components/AdventureMeta.vue';
import ChapterOverview from '@/components/ChapterOverview.vue';
import NPCOverview from '@/components/NPCOverview.vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { getFile } from '@/utils/api.js';

const adventureData = ref(null);

provide('adventureChapters', computed(() => adventureData.value?.chapters));
provide('adventureNPCs', computed(() => adventureData.value?.npcs));

onMounted(async () => {
    try {
        const data = await getFile('testAdventure.json');
        adventureData.value = data;
        console.log("Fetched testAdventure.json", data);
    } catch (e) {
        console.error("Failed to fetch adventure", e);
    }
});
</script>

<template>
    <div class="adventure-content-wrapper">
        <Splitter class="adventure-layout-splitter">
            <!-- Left Pane: Meta + Chapters -->
            <SplitterPanel class="left-pane flex flex-col" :size="75" :minSize="30">
                <AdventureMeta :metadata="adventureData?.metadata"></AdventureMeta>
                <div class="spacer"></div>
                <ChapterOverview></ChapterOverview>
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