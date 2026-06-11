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
.app-content {
  padding-top: 3.5rem;
}
</style>
