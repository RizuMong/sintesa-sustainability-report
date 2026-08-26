<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpText as="h1" size="h1">SDG Adoption</MpText>
      <MpText size="label" color="text.secondary">
        Toggle which of the 17 UN Sustainable Development Goals this organization adopts.
      </MpText>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingY="24px" gap="4">
      <MpFlex v-if="isLoading" wrap="wrap" gap="4">
        <MpSkeleton v-for="i in 17" :key="i" width="220px" height="160px" rounded="md" />
      </MpFlex>

      <template v-else-if="goals.length">
        <MpFlex wrap="wrap" gap="4">
          <MpFlex
            v-for="goal in goals"
            :key="goal.id"
            direction="column"
            gap="2"
            padding="4"
            width="220px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
            backgroundColor="background.surface"
          >
            <MpFlex justifyContent="space-between" alignItems="flex-start">
              <MpImage :src="goal.icon_url" :alt="goal.name" layout="fixed" :width="48" :height="48" object-fit="contain" />
              <MpToggle
                :is-checked="goal.adopted"
                :is-disabled="goal.adopted && !canDeactivateSdgGoal(goal) || isSaving(goal.id)"
                @update:is-checked="(checked: boolean) => onToggle(goal, checked)"
              />
            </MpFlex>
            <MpText size="label-small" color="text.secondary">Goal {{ goal.number }}</MpText>
            <MpText size="label" weight="semiBold">{{ goal.name }}</MpText>
            <MpText v-if="goal.adopted && !canDeactivateSdgGoal(goal)" size="label-small" color="text.secondary">
              Locked — has active Action Plan Matrix rows
            </MpText>
            <MpText size="label-small" color="text.secondary">
              Updated {{ goal.updated_at }} by {{ goal.updated_by }}
            </MpText>
          </MpFlex>
        </MpFlex>
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
        <MpText size="h3" weight="semiBold">No available yet</MpText>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MpFlex, MpText, MpImage, MpSkeleton, MpToggle, toast } from '@mekari/pixel3'
import { useGetSdgAdoption, useUpdateSdgAdoption, canDeactivateSdgGoal } from '@/services/sdg-adoption'

const { data, isLoading } = useGetSdgAdoption()
const goals = computed(() => data.value ?? [])

const updateMutation = useUpdateSdgAdoption()
const savingIds = ref<Set<string>>(new Set())
function isSaving(id: string) {
  return savingIds.value.has(id)
}

async function onToggle(goal: SdgGoal, checked: boolean) {
  // AC-45: block Adopted -> Not Adopted client-side when this goal has active Action Plan rows;
  // the server remains the source of truth and its rejection is surfaced via the catch below.
  if (!checked && !canDeactivateSdgGoal(goal)) return

  savingIds.value = new Set(savingIds.value).add(goal.id)
  try {
    await updateMutation.mutateAsync({ id: goal.id, adopted: checked })
    toast.notify({ id: `sdg-adoption-${goal.id}`, variant: 'success', title: `${goal.name} ${checked ? 'adopted' : 'un-adopted'}.` })
  } catch (error) {
    toast.notify({
      id: `sdg-adoption-error-${goal.id}`,
      variant: 'error',
      title: error instanceof Error ? error.message : 'Could not update SDG adoption.',
    })
  } finally {
    const next = new Set(savingIds.value)
    next.delete(goal.id)
    savingIds.value = next
  }
}
</script>
