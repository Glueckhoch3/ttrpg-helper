<script setup>
// Read-only view of a blueprint (or a public NPC): subtitle, stat list, text. All text is rendered as plain text.
defineProps({ data: { type: Object, required: true } })
</script>

<template>
  <div class="detail">
    <p v-if="data.subtitle" class="muted"><em>{{ data.subtitle }}</em></p>
    <dl v-if="data.stats?.length" class="stats">
      <template v-for="(s, i) in data.stats" :key="i">
        <dt>{{ s.title }}</dt>
        <dd>{{ s.value }}</dd>
      </template>
    </dl>
    <p v-if="data.body" class="pre">{{ data.body }}</p>
    <p v-if="!data.subtitle && !data.stats?.length && !data.body" class="muted">{{ $t('blueprints.empty') }}</p>
  </div>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: auto 1fr; gap: .2rem .8rem; margin: .4rem 0; }
.stats dt { font-weight: 600; }
.stats dd { margin: 0; }
.detail p { margin: .3rem 0; }
</style>
