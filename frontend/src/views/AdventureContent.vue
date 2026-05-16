<!-- View that holds all the contents for an Adventure -->

<script setup>
import { ref, onMounted } from 'vue';
import AdventureMeta from '@/components/AdventureMeta.vue';
import ChapterOverview from '@/components/ChapterOverview.vue';
import EncounterContent from '@/components/EncounterContent.vue';
import NPCOverview from '@/components/NPCOverview.vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { getFile } from '@/utils/api.js';

const adventureData = ref(null);

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
            <SplitterPanel class="left-pane flex flex-col" :size="25" :minSize="15">
                <AdventureMeta></AdventureMeta>
                <ChapterOverview></ChapterOverview>
            </SplitterPanel>
            
            <!-- Right side containing Middle and Right Panes -->
            <SplitterPanel :size="75" :minSize="30">
                <Splitter layout="horizontal" class="nested-splitter w-full h-full">
                    <!-- Middle Pane: Encounters -->
                    <SplitterPanel class="middle-pane" :size="65" :minSize="30">
                        <EncounterContent></EncounterContent>
                    </SplitterPanel>
                    
                    <!-- Right Pane: NPCs -->
                    <SplitterPanel class="right-pane" :size="35" :minSize="15">
                        <NPCOverview></NPCOverview>
                    </SplitterPanel>
                </Splitter>
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

.middle-pane, .right-pane {
    overflow-y: auto;
}
</style>