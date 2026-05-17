<!-- Holder for an Accordeon of all the Chapters in the Adventure -->

<script setup>
import { inject } from 'vue';
import ChapterContent from './ChapterContent.vue';
import EncounterContent from './EncounterContent.vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

const adventureChapters = inject('adventureChapters');
</script>

<template>
    <div class="chapter-overview">
        <h3>Chapters</h3>
        <Accordion multiple class="w-full">
            <AccordionPanel v-for="chapter in adventureChapters" :key="chapter.id || chapter.title" :value="chapter.id || chapter.title">
                <AccordionHeader>
                    {{ chapter.title }}
                </AccordionHeader>
                <AccordionContent>
                    <div class="chapter-details">
                        <div class="chapter-half">
                            <ChapterContent :story="chapter.story"></ChapterContent>
                        </div>
                        <div class="chapter-half">
                            <EncounterContent :encounters="chapter.encounters"></EncounterContent>
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