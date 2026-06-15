<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavigationBar from './components/NavigationBar.vue';

const NPC_PANE_BREAKPOINT = 1024;
const route = useRoute();
const isSmallViewport = ref(false);
const isNpcPaneOpen = ref(true);
const isAdventureContentRoute = computed(() => route.name === 'adventure-content');
const isNpcPaneVisible = computed(() => isNpcPaneOpen.value);

function updateViewportState() {
  if (typeof globalThis.window === 'undefined') {
    return;
  }

  isSmallViewport.value = globalThis.window.innerWidth < NPC_PANE_BREAKPOINT;
}

function toggleNpcPane() {
  if (!isAdventureContentRoute.value) {
    return;
  }

  isNpcPaneOpen.value = !isNpcPaneOpen.value;
}

function openNpcPane() {
  if (!isAdventureContentRoute.value) {
    return;
  }

  isNpcPaneOpen.value = true;
}

function closeNpcPane() {
  if (!isAdventureContentRoute.value) {
    return;
  }

  isNpcPaneOpen.value = false;
}

watch(isSmallViewport, (smallViewport, wasSmallViewport) => {
  if (smallViewport === wasSmallViewport) {
    return;
  }

  isNpcPaneOpen.value = !smallViewport;
});

onMounted(() => {
  updateViewportState();
  globalThis.window?.addEventListener('resize', updateViewportState);
});

onBeforeUnmount(() => {
  globalThis.window?.removeEventListener('resize', updateViewportState);
});

provide('npcPaneUi', {
  isAdventureContentRoute,
  isSmallViewport,
  isNpcPaneOpen,
  isNpcPaneVisible,
  toggleNpcPane,
  openNpcPane,
  closeNpcPane,
  npcPaneBreakpoint: NPC_PANE_BREAKPOINT
});
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
