<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { api } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const sessions = ref([])
const title = ref('')
const error = ref('')
useLive(['sessions'], async () => { sessions.value = await api.get('/sessions') })

async function create() {
  error.value = ''
  try { await api.post('/sessions', { title: title.value, played_on: new Date().toISOString().slice(0, 10) }); title.value = '' } catch (e) { error.value = e.message }
}
</script>

<template>
  <h2>{{ $t('sessions.title') }}</h2>
  <div class="card row">
    <InputText v-model="title" :placeholder="$t('sessions.newTitle')" @keyup.enter="create" />
    <Button :label="$t('sessions.create')" :disabled="!title.trim()" @click="create" />
    <span class="err">{{ error }}</span>
  </div>
  <router-link v-for="s in sessions" :key="s.id" :to="`/sessions/${s.id}`" class="card" style="display:block;text-decoration:none;color:inherit">
    <strong>#{{ s.number }} {{ s.title }}</strong> <span class="muted">{{ s.played_on }}</span>
  </router-link>
  <p v-if="!sessions.length" class="muted">{{ $t('sessions.none') }}</p>
</template>
