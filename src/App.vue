<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePixelTheme } from '@mekari/pixel3-utils'
import { MpFlex, MpText, MpButton } from '@mekari/pixel3'
import { initOfficelessAuth, useOfficelessAuth } from '@/composables/useOfficelessAuth'

const route = useRoute()
const { setNextTheme } = usePixelTheme()

// single gate for every page — all routes render under this RouterView
initOfficelessAuth()
const { status } = useOfficelessAuth()

// the parent Officeless page mints a fresh token on load, so a full reload is the recovery
const reload = () => window.location.reload()

// token 2.4 only enabled on detail views (route meta) — keeps table views on the original design
watchEffect(() => {
  setNextTheme(Boolean(route.meta.nextTheme))
})
</script>

<template>
  <RouterView v-if="status === 'ok'" />

  <MpFlex
    v-else
    direction="column"
    align="center"
    justify="center"
    gap="3"
    minHeight="100vh"
    padding="24px"
    backgroundColor="background.stage"
  >
    <MpText as="h1" size="h2">
      {{ status === 'expired' ? 'Session expired' : '401 — Access denied' }}
    </MpText>
    <MpText color="text.secondary">
      {{
        status === 'expired'
          ? 'Your access token has expired. Reload the page to continue.'
          : 'This page can only be accessed from the Officeless app.'
      }}
    </MpText>
    <MpButton v-if="status === 'expired'" @click="reload">
      Reload
    </MpButton>
  </MpFlex>
</template>
