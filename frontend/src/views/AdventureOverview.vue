<!-- View that holds AdventureSummary Components -->

<script setup>
import { ref, onMounted } from 'vue'
import AdventureSummary from '@/components/AdventureSummary.vue'
import { getAllAdventures } from '@/utils/api'

const adventures = ref([])
const loading = ref(true)
const error = ref(null)

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
</script>

<template>
  <div>
    <p>Adventure Overview</p>
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

<!-- <style scoped >
div {
  margin: 1em;
  border-style: solid;
  border-color: white;
}
</style> -->