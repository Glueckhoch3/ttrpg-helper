<script setup>
import { computed, inject } from 'vue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()
const npcPaneUi = inject('npcPaneUi', null)
const isAdventureContentRoute = computed(() => Boolean(npcPaneUi?.isAdventureContentRoute?.value))
const isNpcPaneVisible = computed(() => Boolean(npcPaneUi?.isNpcPaneVisible?.value))

function goToOverview() {
  router.push('/overview')
}

function toggleNpcPane() {
  npcPaneUi?.toggleNpcPane?.()
}
</script>

<template>
  <nav class="navigation-bar" aria-label="Primary">
    <div class="navigation-bar__left">
      <Button
        label="Go to Overview"
        icon="pi pi-home"
        outlined
        severity="secondary"
        @click="goToOverview"
      />
    </div>

    <div class="navigation-bar__brand">
      <span class="navigation-bar__title">TTRPG Helper</span>
    </div>

    <div class="navigation-bar__right">
      <Button
        v-if="isAdventureContentRoute"
        :label="isNpcPaneVisible ? 'Hide NPCs' : 'Show NPCs'"
        :icon="isNpcPaneVisible ? 'pi pi-eye-slash' : 'pi pi-users'"
        outlined
        severity="secondary"
        :aria-label="isNpcPaneVisible ? 'Hide NPC pane' : 'Show NPC pane'"
        :aria-pressed="isNpcPaneVisible"
        @click="toggleNpcPane"
      />
    </div>
  </nav>
</template>

<style scoped>
.navigation-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: var(--app-nav-height, 5rem);
  z-index: 1000;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  box-sizing: border-box;
  padding: 0 1.25rem;
  background: var(--color-background, #111827);
  color: var(--color-text, #f9fafb);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.navigation-bar__left {
  justify-self: start;
}

.navigation-bar__brand {
  justify-self: center;
}

.navigation-bar__right {
  justify-self: end;
  min-height: 2.5rem;
}

.navigation-bar__title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}
</style>