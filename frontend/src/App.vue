<script setup>
import NavigationBar from './components/NavigationBar.vue';
</script>

<template>
  <NavigationBar></NavigationBar>
  <div class="app-content">
    <router-view />
  </div>
</template>

<style>
:root {
  --app-nav-height: 5rem;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

* {
  font-family: 'Roboto', sans-serif;
}

.app-content {
  margin-top: var(--app-nav-height);
  height: calc(100dvh - var(--app-nav-height));
  overflow: hidden;
}
</style>
