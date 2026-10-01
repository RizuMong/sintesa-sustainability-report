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
          <FilterSelect v-model="filter.period" :options="periods.map((p) => ({ value: p.id, label: String(p.year) }))" placeholder="All periods" />
        </MpFormControl>

        <MpFormControl id="data-export-entity">
          <MpFormLabel>Entity</MpFormLabel>
          <FilterSelect v-model="filter.entity" :options="entities.map((e) => ({ value: e.id, label: e.name }))" placeholder="All entities" />
        </MpFormControl>

        <MpFormControl id="data-export-category" is-required>
          <MpFormLabel>Category</MpFormLabel>
          <FilterSelect v-model="filter.category" :options="categories.map((c) => ({ value: c, label: c }))" placeholder="Select category" />
        </MpFormControl>

        <MpFlex gap="2">
          <MpButton variant="secondary" :is-disabled="!filter.period && !filter.entity && !filter.category" @click="onClear">Clear filters</MpButton>
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
import { MpFlex, MpText, MpButton, MpFormControl, MpFormLabel, MpBanner, MpBannerDescription, toast } from '@mekari/pixel3'
import FilterSelect from '@/components/FilterSelect.vue'
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
function onClear() {
  filter.period = ''
  filter.entity = ''
  filter.category = ''
}

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
