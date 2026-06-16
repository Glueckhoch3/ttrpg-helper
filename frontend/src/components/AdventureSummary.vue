<!-- Used for displaying the Metadata of an Adventure on the AdventureOverview View -->

<script setup>
import Card from 'primevue/card'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  meta: {
    type: Object,
    required: true
  },
  filename: {
    type: String,
    required: true
  }
})

function openAdventure() {
  router.push({
    name: 'adventure-content',
    params: {
      filename: props.filename
    }
  })
}
</script>

<template>
  <div>
    <Card
      v-if="meta"
      class="adventure-card"
      style="width:25rem; height: 15rem; overflow:hidden"
      @click="openAdventure"
    >
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
    </Card>

    <p v-else>No metadata provided…</p>
  </div>
</template>

<style scoped>
.adventure-card {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.adventure-card:hover {
  background-color: var(--p-content-hover-background, var(--p-surface-800, #e9ecef));
}

.adventure-card:focus-visible {
  outline: 2px solid var(--p-primary-color, #14b8a6);
  outline-offset: 2px;
}
</style>

<!-- <style scoped >
div {
  margin: 1em;
}
</style> -->