<script setup>
// import JsonImportExport from './components/JsonImportExport.vue'
import NavigationBar from './components/NavigationBar.vue';
</script>

<template>
  <div>
    <NavigationBar></NavigationBar>
  </div>
  <div>
    <router-view />
  </div>
</template>

<style>
/* div {
  padding-left: 1em;
  margin: 1em;
  border-style: solid;
  border-color: white;
} */
</style>
