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
* {
  font-family: 'Roboto', sans-serif;
}

.app-content {
  padding-top: 3.5rem;
}
</style>
