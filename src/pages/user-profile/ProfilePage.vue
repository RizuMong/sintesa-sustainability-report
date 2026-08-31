<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex direction="column" flex="1" backgroundColor="background.stage" padding="24px">
      <MpFlex v-if="isLoading" direction="column" gap="6" width="100%">
        <MpSkeleton width="72px" height="72px" rounded="full" />
        <MpFlex direction="column" gap="4">
          <MpSkeleton v-for="i in 4" :key="i" height="60px" rounded="md" />
        </MpFlex>
      </MpFlex>

      <MpBanner v-else-if="isError" variant="danger">
        <MpBannerDescription>Couldn't load your profile.</MpBannerDescription>
      </MpBanner>

      <MpFlex v-else direction="column" gap="6" width="100%">
        <MpFlex direction="column" gap="4">
          <MpFormControl id="profile-name">
            <MpFormLabel>Name</MpFormLabel>
            <MpInput :model-value="profile?.name ?? '—'" is-disabled />
          </MpFormControl>

          <MpFormControl id="profile-email">
            <MpFormLabel>Email</MpFormLabel>
            <MpInput :model-value="profile?.email ?? '—'" is-disabled />
          </MpFormControl>

          <MpFormControl id="profile-position">
            <MpFormLabel>Position</MpFormLabel>
            <MpInput :model-value="profile?.position_id?.name ?? '—'" is-disabled />
          </MpFormControl>

          <MpFormControl id="profile-entity">
            <MpFormLabel>Entity</MpFormLabel>
            <MpInput :model-value="profile?.entity_id?.name ?? '—'" is-disabled />
          </MpFormControl>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpSkeleton, MpBanner, MpBannerDescription, MpFormControl, MpFormLabel, MpInput } from '@mekari/pixel3'
import { useGetUserProfile } from '@/services/user-profile'

const { data: profile, isLoading, isError } = useGetUserProfile()
</script>
