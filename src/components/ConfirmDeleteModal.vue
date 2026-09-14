<template>
  <MpModal :is-open="isOpen" size="md" @close="emit('close')">
    <MpModalContent>
      <MpModalHeader>
        {{ title }}
        <MpModalCloseButton />
      </MpModalHeader>
      <MpModalBody>
        <MpText size="label">{{ message }}</MpText>
      </MpModalBody>
      <MpModalFooter>
        <MpButtonGroup>
          <MpButton variant="ghost" @click="emit('close')">Cancel</MpButton>
          <MpButton :variant="confirmVariant" @click="emit('confirm')">{{
            confirmLabel
          }}</MpButton>
        </MpButtonGroup>
      </MpModalFooter>
    </MpModalContent>
    <MpModalOverlay />
  </MpModal>
</template>

<script setup lang="ts">
import {
  MpText,
  MpButton,
  MpButtonGroup,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
} from '@mekari/pixel3'

withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    message: string
    // GROU-659 — the same dialog confirms a non-destructive "Revise Submission"; the defaults keep
    // every existing delete call site byte-identical.
    confirmLabel?: string
    confirmVariant?: 'primary' | 'secondary' | 'danger'
  }>(),
  { confirmLabel: 'Delete', confirmVariant: 'danger' },
)
const emit = defineEmits<{ confirm: []; close: [] }>()
</script>
