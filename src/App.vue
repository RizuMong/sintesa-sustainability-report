<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePixelTheme } from '@mekari/pixel3-utils'

const route = useRoute()
const { setNextTheme } = usePixelTheme()

// token 2.4 only enabled on detail views (route meta) — keeps table views on the original design
watchEffect(() => {
  setNextTheme(Boolean(route.meta.nextTheme))
})
</script>

<template>
  <RouterView />
</template>
