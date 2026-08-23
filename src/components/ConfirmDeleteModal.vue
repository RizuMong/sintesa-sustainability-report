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
          <MpButton variant="danger" @click="emit('confirm')">Delete</MpButton>
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

defineProps<{ isOpen: boolean; title: string; message: string }>()
const emit = defineEmits<{ confirm: []; close: [] }>()
</script>
