<script setup></script>

<template>
  <nav class="navigation-bar" aria-label="Primary">
    <div class="navigation-bar__brand">
      <span class="navigation-bar__title">TTRPG Helper</span>
    </div>

    <router-link class="navigation-bar__button" to="/overview">
      Go to Overview
    </router-link>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-background, #111827);
  color: var(--color-text, #f9fafb);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.navigation-bar__title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.navigation-bar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--color-accent, #f8fafc);
  color: var(--color-background, #111827);
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.navigation-bar__button:hover,
.navigation-bar__button:focus-visible {
  background: var(--color-accent-hover, #e5e7eb);
  transform: translateY(-1px);
}
</style>