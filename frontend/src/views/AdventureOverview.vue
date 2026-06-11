<!-- View that holds AdventureSummary Components -->

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdventureSummary from '@/components/AdventureSummary.vue'
import Button from 'primevue/button'
import { getAllAdventures, saveFile } from '@/utils/api'
import { createAdventureFilename, createAdventureTemplate } from '@/utils/adventureTemplates.js'

const adventures = ref([])
const loading = ref(true)
const error = ref(null)
const creating = ref(false)
const createError = ref(null)
const router = useRouter()

onMounted(async () => {
  try {
    const result = await getAllAdventures()
    adventures.value = result?.adventures || []
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
})

async function handleCreateAdventure() {
  creating.value = true
  createError.value = null

  const template = createAdventureTemplate()
  const filename = createAdventureFilename(template.metadata.title)

  try {
    await saveFile(template, filename)
    adventures.value = [
      {
        filename,
        metadata: template.metadata
      },
      ...adventures.value.filter((adventure) => adventure.filename !== filename)
    ]
    router.push({
      name: 'adventure-content',
      params: {
        filename
      }
    })
  } catch (e) {
    createError.value = e.message || String(e)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="overview-page">
    <div class="overview-header">
      <p class="page-title">Adventure Overview</p>
      <Button
        label="Add Adventure"
        icon="pi pi-plus"
        :loading="creating"
        @click="handleCreateAdventure"
      />
    </div>
    <div v-if="createError" class="error">Error: {{ createError }}</div>
    <div v-if="loading">Loading adventures...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <AdventureSummary 
        v-for="adv in adventures" 
        :key="adv.filename" 
        :meta="adv.metadata"
        :filename="adv.filename"
      />
    </div>
  </div>
</template>

<style scoped>
.overview-page {
  padding: 1rem;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.error {
  color: var(--p-red-600, #dc3545);
  margin-bottom: 1rem;
}
</style>

<!-- <style scoped >
div {
  margin: 1em;
  border-style: solid;
  border-color: white;
}
</style> -->