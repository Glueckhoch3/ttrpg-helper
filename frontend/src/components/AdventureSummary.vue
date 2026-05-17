<!-- Used for displaying the Metadata of an Adventure on the AdventureOverview View -->

<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import { defineProps } from 'vue'

const props = defineProps({
  meta: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div>
    <Card v-if="meta" style="width:25rem; height: 15rem; overflow:hidden">
      <template #title>
        {{ meta.title }}
      </template>
      <template #subtitle>
        {{ meta.id }}
      </template>
      <template #content>
        <p class="m-0" v-if="meta.summary">{{ meta.summary }}</p>
        <p class="m-0 text-muted" v-else>No summary available.</p>
      </template>
      <template #footer>
        <Button label="TEST" />
      </template>
    </Card>

    <p v-else>No metadata provided…</p>
  </div>
</template>

<!-- <style scoped >
div {
  margin: 1em;
}
</style> -->