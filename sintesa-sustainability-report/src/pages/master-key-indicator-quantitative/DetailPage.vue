<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-key-indicator-quantitative">
            Master Key Indicator — Quantitative
          </MpButton>
          <MpText as="h1" size="h1">{{ record?.name ?? 'Loading...' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="record" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">
        Delete
      </MpButton>
    </MpFlex>

    <MpFlex
      direction="column"
      flex="1"
      backgroundColor="background.stage"
      borderTopWidth="1px"
      borderLeftWidth="1px"
      borderColor="border.default"
      roundedTopLeft="md"
      padding="24px"
    >
      <MpFlex v-if="isLoading" direction="column" gap="3">
        <MpSkeleton v-for="i in 4" :key="i" height="24px" width="400px" />
      </MpFlex>

      <MpFlex v-else-if="record" direction="column" gap="6" maxWidth="640px">
        <MpFlex gap="6">
          <MpFormControl id="mki-name" is-required flex="1">
            <MpFormLabel>Name</MpFormLabel>
            <MpInput v-model="form.name" />
          </MpFormControl>
          <MpFormControl id="mki-code" is-required flex="1">
            <MpFormLabel>Code</MpFormLabel>
            <MpInput v-model="form.code" />
          </MpFormControl>
        </MpFlex>

        <MpFormControl id="mki-category" is-required>
          <MpFormLabel>Category</MpFormLabel>
          <MpInput v-model="form.category" />
        </MpFormControl>

        <MpFormControl id="mki-unit">
          <MpFormLabel>Unit</MpFormLabel>
          <MpInput v-model="form.unit" />
        </MpFormControl>

        <MpFlex>
          <MpButton @click="saveEdit">Update</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="isConfirmingDelete" size="md" @close="isConfirmingDelete = false">
      <MpModalContent>
        <MpModalHeader>
          Delete this indicator?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText size="label">This will permanently remove the indicator. This action cannot be undone.</MpText>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="isConfirmingDelete = false">Cancel</MpButton>
            <MpButton variant="danger" @click="confirmDelete">Delete</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpInput,
  MpFormControl,
  MpFormLabel,
  MpSkeleton,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
} from '@mekari/pixel3'
import { masterKeyIndicatorQuantitativeApi } from '@/services/master-key-indicator-quantitative.api'
import type { MasterKeyIndicatorQuantitative } from '@/types'

const route = useRoute()
const router = useRouter()

const record = ref<MasterKeyIndicatorQuantitative>()
const isLoading = ref(true)
const isConfirmingDelete = ref(false)
const form = reactive({ name: '', code: '', category: '', unit: '' })

onMounted(load)

watch(record, (value) => {
  if (!value) return
  form.name = value.name
  form.code = value.code
  form.category = value.category
  form.unit = value.unit
})

async function load() {
  isLoading.value = true
  record.value = await masterKeyIndicatorQuantitativeApi.get(route.params.id as string)
  isLoading.value = false
}

async function saveEdit() {
  if (!record.value) return
  await masterKeyIndicatorQuantitativeApi.update(record.value.id, { ...form })
  await load()
}

async function confirmDelete() {
  if (!record.value) return
  await masterKeyIndicatorQuantitativeApi.remove(record.value.id)
  isConfirmingDelete.value = false
  router.push('/master-key-indicator-quantitative')
}
</script>
