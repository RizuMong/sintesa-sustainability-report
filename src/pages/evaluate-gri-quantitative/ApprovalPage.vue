<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingY="24px"
      backgroundColor="background.surface"
    >
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Evaluate GRI Quantitative</MpText>
        <MpText as="h1" size="h1">Approval</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="4">
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else-if="pendingItems.length">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Indikator</MpTableCell>
                <MpTableCell scope="col">Requestor</MpTableCell>
                <MpTableCell scope="col">Periode</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col" :class="css({ textAlign: 'right' })">Aksi</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in pendingItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.indicator }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.requestor }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.period }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" type="information">{{ row.status }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row" :class="css({ textAlign: 'right' })">
                  <MpPopover :id="`approval-action-${row.id}`" placement="bottom-end" use-portal>
                    <MpPopoverTrigger>
                      <MpButton variant="secondary" right-icon="chevrons-down" aria-label="Row actions" />
                    </MpPopoverTrigger>
                    <MpPopoverContent>
                      <MpPopoverList>
                        <MpPopoverListItem @click="goToDetail(row.id)">View detail</MpPopoverListItem>
                        <MpPopoverListItem @click="decide(row.id, 'approved')">Approve</MpPopoverListItem>
                        <MpPopoverListItem @click="decide(row.id, 'rejected')">Reject</MpPopoverListItem>
                      </MpPopoverList>
                    </MpPopoverContent>
                  </MpPopover>
                </MpTableCell>
              </MpTableRow>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>
      </template>

      <MpFlex v-else direction="column" alignItems="center" gap="4" paddingY="20">
        <MpImage
          src="https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png"
          alt="empty state illustration"
          layout="fixed"
          :width="200"
          :height="160"
          object-fit="contain"
          :is-show-loading="false"
        />
        <MpFlex direction="column" alignItems="center" gap="1">
          <MpText size="h3" weight="semiBold">No evaluation waiting for approval</MpText>
          <MpText size="label" color="text.secondary">Submitted evaluations will show up here.</MpText>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpBadge,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpPopover,
  MpPopoverTrigger,
  MpPopoverContent,
  MpPopoverList,
  MpPopoverListItem,
  css,
} from '@mekari/pixel3'
import { useCrud } from '@/composables/useCrud'
import { evaluateGriQuantitativeApi } from '@/services/evaluate-gri-quantitative.api'
import type { EvaluationGriQuantitative } from '@/types'

const router = useRouter()
const { items, loading: isLoading, fetchAll, update } = useCrud<EvaluationGriQuantitative>(
  evaluateGriQuantitativeApi
)

const pendingItems = computed(() => items.value.filter((item) => item.status === 'submitted'))

onMounted(fetchAll)

function goToDetail(id: string) {
  router.push(`/evaluate-gri-quantitative/${id}`)
}

function decide(id: string, status: 'approved' | 'rejected') {
  update(id, { status, actor: 'You', updatedAt: new Date().toISOString() })
}
</script>
