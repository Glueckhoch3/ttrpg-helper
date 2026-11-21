<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { api, auth } from '@/lib/api'
import { useLive } from '@/lib/useLive'

const { t } = useI18n()
const props = defineProps({ id: String })
const s = ref(null)
const body = ref('')
const editing = ref(null)
const editBody = ref('')
const error = ref('')

useLive(['notes', 'sessions'], async () => { s.value = await api.get(`/sessions/${props.id}`) })

const run = async (fn) => { error.value = ''; try { await fn() } catch (e) { error.value = e.message } }
const add = () => run(async () => { await api.post(`/sessions/${props.id}/notes`, { author: auth.name, body: body.value }); body.value = '' })
const startEdit = (n) => { editing.value = n.id; editBody.value = n.body }
const saveEdit = (n) => run(async () => { await api.patch(`/notes/${n.id}`, { body: editBody.value }); editing.value = null })
const del = (n) => confirm(t('sessions.confirmNote')) && run(() => api.del(`/notes/${n.id}`))
const saveMeta = (field, v) => run(() => api.patch(`/sessions/${props.id}`, { [field]: v }))
const delAtt = (a) => confirm(t('sessions.confirmAttachment')) && run(() => api.del(`/attachments/${a.id}`))
const delSession = () => confirm(t('sessions.confirmSession')) && run(async () => { await api.del(`/sessions/${props.id}`); location.assign('/sessions') })
</script>

<template>
  <template v-if="s">
    <router-link to="/sessions">{{ $t('sessions.back') }}</router-link>
    <h2>#{{ s.number }} {{ s.title }} <span class="muted">{{ s.played_on }}</span></h2>
    <div class="card">
      <label class="muted">{{ $t('sessions.summary') }}</label>
      <Textarea :modelValue="s.summary" rows="3" fluid @change="saveMeta('summary', $event.target.value)" />
    </div>
    <div v-if="s.attachments.length" class="card">
      <strong>{{ $t('sessions.files') }}</strong>
      <div v-for="a in s.attachments" :key="a.id" style="margin:.5rem 0">
        <div class="row muted">{{ a.title }} <Button size="small" text severity="danger" icon="pi pi-trash" :label="$t('common.remove')" @click="delAtt(a)" /></div>
        <a :href="`/api/files/${a.file}`" target="_blank"><img v-if="a.kind === 'image'" :src="`/api/files/${a.file}`" style="max-width:100%;max-height:420px" /><span v-else>{{ $t('sessions.openPdf') }}</span></a>
      </div>
    </div>
    <h3>{{ $t('sessions.notes') }}</h3>
    <div v-for="n in s.notes" :key="n.id" class="card">
      <div class="muted">{{ n.author }} · {{ n.created_at }}<template v-if="n.updated_at"> {{ $t('sessions.edited') }}</template></div>
      <template v-if="editing === n.id">
        <Textarea v-model="editBody" rows="4" fluid />
        <div class="row"><Button size="small" :label="$t('common.save')" @click="saveEdit(n)" /><Button size="small" severity="secondary" :label="$t('common.cancel')" @click="editing = null" /></div>
      </template>
      <template v-else>
        <div class="pre">{{ n.body }}</div>
        <div class="row"><Button size="small" text :label="$t('common.edit')" @click="startEdit(n)" /><Button size="small" text severity="danger" :label="$t('common.delete')" @click="del(n)" /></div>
      </template>
    </div>
    <div class="card">
      <Textarea v-model="body" rows="4" fluid :placeholder="$t('sessions.notePlaceholder')" />
      <Button :label="$t('sessions.addNote')" :disabled="!body.trim()" @click="add" />
    </div>
    <p class="err">{{ error }}</p>
    <Button v-if="auth.token" severity="danger" text :label="$t('sessions.deleteSession')" @click="delSession" />
  </template>
</template>
