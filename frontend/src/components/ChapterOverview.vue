<!-- Holder for an Accordeon of all the Chapters in the Adventure -->

<script setup>
import { computed, inject, nextTick, ref, unref, watch } from 'vue';
import ChapterContent from './ChapterContent.vue';
import EncounterContent from './EncounterContent.vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Button from 'primevue/button';

const injectedAdventureChapters = inject('adventureChapters', []);
const adventureChapters = computed(() => {
    const chapters = unref(injectedAdventureChapters);
    return Array.isArray(chapters) ? chapters : [];
});
const activeChapters = ref([]);

const props = defineProps({
    onAddChapter: {
        type: Function,
        required: true
    },
    onDeleteChapter: {
        type: Function,
        required: true
    },
    onSaveChapter: {
        type: Function,
        required: true
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
    },
    newChapterSignal: {
        type: Object,
        default: null
    },
    newEncounterSignal: {
        type: Object,
        default: null
    }
});

function chapterValue(chapter) {
    return chapter?.id || chapter?.title;
}

function chapterAutoEditToken(chapter) {
    if (!props.newChapterSignal?.token || !chapter?.id) {
        return 0;
    }

    return props.newChapterSignal.chapterId === chapter.id ? props.newChapterSignal.token : 0;
}

watch(
    () => props.newChapterSignal?.token,
    async (token) => {
        if (!token || !props.newChapterSignal?.chapterId) {
            return;
        }

        const chapter = adventureChapters.value.find((item) => item?.id === props.newChapterSignal.chapterId);
        if (!chapter) {
            return;
        }

        const value = chapterValue(chapter);
        if (!activeChapters.value.includes(value)) {
            activeChapters.value = [...activeChapters.value, value];
        }

        await nextTick();
        const panel = globalThis.document?.getElementById(`chapter-panel-${props.newChapterSignal.chapterId}`);
        panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
);
</script>

<template>
    <div class="chapter-overview">
        <div class="overview-header">
            <h3>Chapters</h3>
            <Button icon="pi pi-plus" aria-label="Add chapter" @click="props.onAddChapter()" />
        </div>
        <Accordion v-model:value="activeChapters" multiple class="w-full">
            <AccordionPanel
                v-for="(chapter, chapterIndex) in adventureChapters"
                :key="chapter.id || chapter.title"
                :id="chapter.id ? `chapter-panel-${chapter.id}` : undefined"
                :value="chapterValue(chapter)"
            >
                <AccordionHeader>
                    {{ chapter.title }}
                </AccordionHeader>
                <AccordionContent>
                    <div class="chapter-details">
                        <div class="chapter-half">
                            <ChapterContent
                                :chapter="chapter"
                                :autoStartEditToken="chapterAutoEditToken(chapter)"
                                :onSaveChapter="(chapterDraft) => props.onSaveChapter({ chapterIndex, chapter: chapterDraft })"
                                :onDeleteChapter="() => props.onDeleteChapter(chapterIndex)"
                            ></ChapterContent>
                        </div>
                        <div class="chapter-half">
                            <EncounterContent
                                :encounters="chapter.encounters"
                                :chapterIndex="chapterIndex"
                                :chapterId="chapter.id || ''"
                                :newEncounterSignal="props.newEncounterSignal"
                                :onAddEncounter="() => props.onAddEncounter({ chapterIndex })"
                                :onSaveEncounter="({ encounterIndex, encounter }) => props.onSaveEncounter({ chapterIndex, encounterIndex, encounter })"
                                :onDeleteEncounter="({ encounterIndex }) => props.onDeleteEncounter({ chapterIndex, encounterIndex })"
                            ></EncounterContent>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
    </div>
</template>

<style scoped>
.chapter-overview {
        margin: 1em;
}

.overview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
}

h3 {
    margin-top: 0;
    margin-bottom: 1rem;
}

.chapter-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
.chapter-half {
    flex: 1;
    min-width: 200px;
}
</style>