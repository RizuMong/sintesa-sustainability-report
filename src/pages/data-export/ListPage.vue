<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText as="h1" size="h1">Data Export & Report</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingTop="8px" paddingBottom="24px" gap="6" maxWidth="480px">
      <MpBanner variant="info">
        <MpBannerDescription>Only Approved data can be exported (AC-78).</MpBannerDescription>
      </MpBanner>

      <MpFlex direction="column" gap="4">
        <MpFormControl id="data-export-period">
          <MpFormLabel>Period</MpFormLabel>
          <MpSelect v-model="filter.period" placeholder="All periods" is-full-width>
            <option value="">All periods</option>
            <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.year }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="data-export-entity">
          <MpFormLabel>Entity</MpFormLabel>
          <MpSelect v-model="filter.entity" placeholder="All entities" is-full-width>
            <option value="">All entities</option>
            <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="data-export-category" is-required>
          <MpFormLabel>Category</MpFormLabel>
          <MpSelect v-model="filter.category" placeholder="Select category" is-full-width>
            <option value="" disabled>Select category</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!filter.category" :is-loading="generateMutation.isPending.value" @click="onExport">
            Export
          </MpButton>
        </MpFlex>

        <MpBanner v-if="resultUrl" variant="info">
          <MpBannerDescription>
            Export ready.
            <MpButton variant="textLink" as="a" :href="resultUrl" target="_blank">Download</MpButton>
          </MpBannerDescription>
        </MpBanner>
      </MpFlex>

      <MpFlex v-if="history.length" direction="column" gap="2">
        <MpText size="label" weight="semiBold">Recent exports</MpText>
        <MpFlex v-for="item in history" :key="item.id" justifyContent="space-between" alignItems="center">
          <MpText size="label-small">{{ item.category }} · {{ item.period }} · {{ item.entity }}</MpText>
          <MpButton variant="textLink" as="a" :href="item.file_url" target="_blank">Download</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { MpFlex, MpText, MpButton, MpFormControl, MpFormLabel, MpSelect, MpBanner, MpBannerDescription, toast } from '@mekari/pixel3'
import { useGetMasterPeriod } from '@/services/master-period'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGenerateExport, useGetExportHistory } from '@/services/data-export'

const categories: ExportCategory[] = ['GRI Disclosure', 'SDG', 'Realization']

const { data: periodData } = useGetMasterPeriod()
const periods = computed(() => periodData.value ?? [])
const { data: entityData } = useGetMasterEntity()
const entities = computed(() => entityData.value ?? [])

const filter = reactive<{ period: string; entity: string; category: ExportCategory | '' }>({
  period: '',
  entity: '',
  category: '',
})
const resultUrl = ref('')

const generateMutation = useGenerateExport()
async function onExport() {
  if (!filter.category) return
  const result = await generateMutation.mutateAsync({
    period: filter.period || undefined,
    entity: filter.entity || undefined,
    category: filter.category,
  })
  resultUrl.value = result.url
  toast.notify({ id: 'data-export-generate', variant: 'success', title: 'Export generated.' })
}

// ponytail: export audit persisted backend-side; UI just shows the recent-export list from /v1/data-export/index if present
const { data: historyData } = useGetExportHistory()
const history = computed(() => historyData.value ?? [])
</script>
