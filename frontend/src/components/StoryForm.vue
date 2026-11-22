<script setup>
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'

// Fields shared by story snippets and scenarios: title, location, NPCs, description, map.
const draft = defineModel({ type: Object, required: true })
defineProps({ npcs: Array, maps: Array, submitLabel: String })
defineEmits(['submit', 'cancel'])
</script>

<template>
  <div class="form">
    <InputText v-model="draft.title" :placeholder="$t('story.titlePlaceholder')" fluid />
    <InputText v-model="draft.location" :placeholder="$t('story.location')" fluid />
    <MultiSelect v-model="draft.npc_ids" :options="npcs" option-label="name" option-value="id" display="chip" filter :placeholder="$t('story.npcs')" :empty-message="$t('story.noNpcs')" fluid />
    <Select v-model="draft.map_id" :options="maps" option-label="title" option-value="id" show-clear :placeholder="$t('story.map')" fluid />
    <Textarea v-model="draft.body" rows="6" fluid :placeholder="$t('story.bodyPlaceholder')" />
    <div class="row">
      <Button size="small" :label="submitLabel" :disabled="!draft.title.trim()" @click="$emit('submit')" />
      <Button size="small" severity="secondary" :label="$t('common.cancel')" @click="$emit('cancel')" />
    </div>
  </div>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: .5rem; }
</style>
