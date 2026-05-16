<!-- Used for displaying the Metadata of an Adventure on the AdventureOverview View -->

<script>
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import { getAdventureMetadata } from '@/utils/api'

export default {
  name: 'AdventureSummary',
  components: { Card },
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const meta = ref(null)

    onMounted(async () => {
      try {
        
        //TODO change backend to require id?
        const result = await getAdventureMetadata('Triefenhain')
        meta.value = result?.metadata ?? result
      } catch (e) {
        error.value = e.message || String(e)
      } finally {
        loading.value = false
      }
    })

    return { loading, error, meta }
  }
}
</script>

<template>
  <div>
    <Card v-if="!loading && meta" style="width:25rem; height: 15rem;overflow:hidden">
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

    <p v-else-if="loading">Loading adventure metadata…</p>
    <p v-else class="error">Error: {{ error }}</p>
  </div>
</template>

<!-- <style scoped >
div {
  margin: 1em;
}
</style> -->