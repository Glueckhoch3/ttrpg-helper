<script setup>
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToOverview() {
  router.push('/overview')
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

    <div class="navigation-bar__right" aria-hidden="true"></div>
  </nav>
</template>

<style scoped>
.navigation-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
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