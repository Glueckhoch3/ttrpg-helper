<!-- Holder for an Accordeon of all the Chapters in the Adventure -->

<script setup>
import { defineProps } from 'vue';
import ChapterContent from './ChapterContent.vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

const props = defineProps({
    chapters: {
        type: Array,
        default: () => []
    }
});
</script>

<template>
    <div class="chapter-overview">
        <h3>Chapters</h3>
        <Accordion multiple class="w-full">
            <AccordionPanel v-for="chapter in props.chapters" :key="chapter.id || chapter.title" :value="chapter.id || chapter.title">
                <AccordionHeader>
                    {{ chapter.title }}
                </AccordionHeader>
                <AccordionContent>
                    <ChapterContent :story="chapter.story"></ChapterContent>
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
</style>