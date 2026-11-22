<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import { THEME_IDS, themeChoice, setTheme } from '@/themes'
import { useI18n } from 'vue-i18n'
import { auth, setName, setToken, loginGm, checkSession, joinGroup, leaveGroup } from '@/lib/api'

const { t } = useI18n()
const themeOptions = THEME_IDS.map((id) => ({ id, label: t(`theme.${id}`) }))
const nameInput = ref(auth.name)
const groupPw = ref('')
const showGm = ref(false)
const pin = ref('')
const error = ref('')

onMounted(checkSession)

async function join() {
  error.value = ''
  try { await joinGroup(nameInput.value.trim(), groupPw.value); groupPw.value = '' } catch (e) { error.value = e.message }
}
async function gmLogin() {
  error.value = ''
  try { await loginGm(pin.value); showGm.value = false; pin.value = '' } catch (e) { error.value = e.message }
}
</script>

<template>
  <div v-if="auth.member === null" class="join">{{ $t('join.loading') }}</div>
  <div v-else-if="!auth.member || !auth.name" class="join">
    <h1>🎲 {{ $t('app.title') }}</h1>
    <p>{{ $t('join.who') }}</p>
    <InputText v-model="nameInput" :placeholder="$t('join.name')" maxlength="60" autofocus />
    <Password v-model="groupPw" :feedback="false" :placeholder="$t('join.password')" input-class="w-full" @keyup.enter="join" />
    <Button :label="$t('join.submit')" :disabled="!nameInput.trim() || !groupPw" @click="join" />
    <span class="err">{{ error }}</span>
  </div>
  <template v-else>
    <header class="nav">
      <strong>🎲 {{ $t('app.title') }}</strong>
      <router-link to="/sessions">{{ $t('nav.sessions') }}</router-link>
      <router-link to="/story">{{ $t('nav.story') }}</router-link>
      <router-link to="/maps">{{ $t('nav.maps') }}</router-link>
      <router-link v-if="auth.token" to="/npcs">{{ $t('nav.npcs') }}</router-link>
      <span class="spacer" />
      <Select :model-value="themeChoice" :options="themeOptions" option-label="label" option-value="id" size="small" :aria-label="$t('theme.label')" :title="$t('theme.label')" @update:model-value="setTheme" />
      <span>{{ auth.name }}<template v-if="auth.token"> · {{ $t('nav.gm') }}</template></span>
      <Button v-if="auth.token" size="small" severity="secondary" :label="$t('nav.leaveGm')" @click="setToken('')" />
      <Button v-else size="small" severity="secondary" :label="$t('nav.gmLogin')" @click="showGm = !showGm" />
      <Button size="small" text :label="$t('nav.changeName')" @click="setName('')" />
      <Button size="small" text :label="$t('nav.logout')" @click="leaveGroup" />
    </header>
    <div v-if="showGm && !auth.token" class="gm">
      <Password v-model="pin" :feedback="false" :placeholder="$t('gm.pin')" @keyup.enter="gmLogin" />
      <Button :label="$t('gm.unlock')" @click="gmLogin" />
      <span class="err">{{ error }}</span>
    </div>
    <main><router-view /></main>
  </template>
</template>

<style>
body { margin: 0; font-family: system-ui, sans-serif; background: var(--app-bg); color: var(--app-text); }
a { color: var(--app-accent); }
input[type=range], input[type=file] { accent-color: var(--app-accent); }
.nav { display: flex; gap: 1rem; align-items: center; padding: .6rem 1rem; background: var(--app-panel); border-bottom: 3px solid var(--app-accent); flex-wrap: wrap; }
.nav a { text-decoration: none; color: var(--app-text); font-weight: 600; padding-bottom: 2px; }
.nav a:hover { text-decoration: underline; }
.nav a.router-link-active { border-bottom: 3px solid var(--app-accent); color: var(--app-accent); }
.spacer { flex: 1; }
:focus-visible { outline: 3px solid var(--app-accent); outline-offset: 2px; }
.gm { padding: .6rem 1rem; display: flex; gap: .5rem; align-items: center; background: var(--app-warn); }
main { padding: 1rem; max-width: 1400px; margin: 0 auto; }
.join { max-width: 22rem; margin: 15vh auto; display: flex; flex-direction: column; gap: .8rem; text-align: center; }
.err { color: var(--app-danger); }
.card { background: var(--app-panel); border: var(--app-bw) solid var(--app-border); border-radius: 8px; padding: .8rem 1rem; margin-bottom: .8rem; }
.row { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.pre { white-space: pre-wrap; }
.muted { color: var(--app-muted); font-size: .85rem; }
</style>
