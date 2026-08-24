<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpText as="h1" size="h1">Access Management</MpText>
      <MpText size="label" color="text.secondary">
        Map a Position to the App and Page combinations it can access.
      </MpText>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingY="24px" gap="6">
      <MpFlex maxWidth="360px">
        <MpFormControl id="access-management-position">
          <MpFormLabel>Position</MpFormLabel>
          <MpSelect v-model="positionId" placeholder="Select a position" is-full-width>
            <option value="" disabled>Select a position</option>
            <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.name }}</option>
          </MpSelect>
        </MpFormControl>
      </MpFlex>

      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="48px" rounded="md" />
      </MpFlex>

      <template v-else-if="positionId">
        <MpFlex v-for="app in apps" :key="app" direction="column" gap="3">
          <MpText size="h3" weight="semiBold">{{ app }}</MpText>
          <MpTableContainer>
            <MpTable>
              <MpTableHead>
                <MpTableRow>
                  <MpTableCell scope="col">Page</MpTableCell>
                  <MpTableCell scope="col">Granted</MpTableCell>
                </MpTableRow>
              </MpTableHead>
              <MpTableBody>
                <MpTableRow v-for="page in pagesByApp[app]" :key="page.id">
                  <MpTableCell as="td" scope="row">{{ page.label }}</MpTableCell>
                  <MpTableCell as="td" scope="row">
                    <MpCheckbox
                      :id="`grant-${page.id}`"
                      :is-checked="grantedPageIds.has(page.id)"
                      @update:is-checked="(checked: boolean) => toggleGrant(page.id, checked)"
                    />
                  </MpTableCell>
                </MpTableRow>
              </MpTableBody>
            </MpTable>
          </MpTableContainer>
        </MpFlex>

        <MpFlex>
          <MpButton :is-loading="saveMutation.isPending.value" @click="save">Save Changes</MpButton>
        </MpFlex>
      </template>

      <MpFlex v-else direction="column" alignItems="center" gap="4" paddingY="20">
        <MpText size="label" color="text.secondary">Select a Position to configure its App/Page access.</MpText>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  MpFlex,
  MpText,
  MpButton,
  MpCheckbox,
  MpFormControl,
  MpFormLabel,
  MpSelect,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  toast,
} from '@mekari/pixel3'
import { useGetAccessGrants, useSaveAccessGrants, ACCESS_MANAGEMENT_APPS, buildAccessManagementCatalog } from '@/services/access-management'
import { useGetMasterPosition } from '@/services/master-position'

const apps = ACCESS_MANAGEMENT_APPS
const catalog = buildAccessManagementCatalog()
const pagesByApp = Object.fromEntries(apps.map((app) => [app, catalog.filter((p) => p.app === app)])) as Record<
  string,
  AccessManagementPage[]
>

const { data: positions } = useGetMasterPosition()
const { data: grants, isLoading } = useGetAccessGrants()
const saveMutation = useSaveAccessGrants()

const positionId = ref('')
const grantedPageIds = ref<Set<string>>(new Set())

// switching Position reloads the checked state from that Position's persisted grants
watch([positionId, grants], ([id, allGrants]) => {
  if (!id) {
    grantedPageIds.value = new Set()
    return
  }
  grantedPageIds.value = new Set((allGrants ?? []).filter((g) => g.position_id === id).map((g) => g.page))
})

function toggleGrant(pageId: string, checked: boolean) {
  const next = new Set(grantedPageIds.value)
  if (checked) next.add(pageId)
  else next.delete(pageId)
  grantedPageIds.value = next
}

async function save() {
  if (!positionId.value) return
  const pages = catalog.filter((p) => grantedPageIds.value.has(p.id)).map((p) => ({ app: p.app, page: p.id }))
  await saveMutation.mutateAsync({ position_id: positionId.value, pages })
  toast.notify({ id: 'access-management-save', variant: 'success', title: 'Access updated.' })
}
</script>
