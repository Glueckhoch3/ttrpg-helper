<!-- View that holds AdventureSummary Components -->

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdventureSummary from '@/components/AdventureSummary.vue'
import Card from 'primevue/card'
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
  if (creating.value) {
    return
  }

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
    </div>
    <div v-if="createError" class="error">Error: {{ createError }}</div>
    <div v-if="loading">Loading adventures...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="adventure-grid">
      <Card
        class="adventure-card add-adventure-card"
        role="button"
        tabindex="0"
        aria-label="Add adventure"
        @click="handleCreateAdventure"
        @keydown.enter.prevent="handleCreateAdventure"
        @keydown.space.prevent="handleCreateAdventure"
      >
        <template #title>
          <span class="add-card-title">Add Adventure</span>
        </template>
        <template #subtitle>
          Create a new campaign file
        </template>
        <template #content>
          <p class="add-card-content">
            {{ creating ? 'Creating adventure...' : 'Start from a fresh template and open it immediately.' }}
          </p>
        </template>
      </Card>
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
  justify-content: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.adventure-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.adventure-card {
  width: 25rem;
  height: 15rem;
  overflow: hidden;
}

.add-adventure-card {
  cursor: pointer;
  border: 1px dashed var(--p-primary-color, #14b8a6);
}

.add-adventure-card:focus-visible {
  outline: 2px solid var(--p-primary-color, #14b8a6);
  outline-offset: 2px;
}

.add-card-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.add-card-title::before {
  content: '+';
  font-size: 1.2rem;
  font-weight: 700;
}

.add-card-content {
  margin: 0;
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