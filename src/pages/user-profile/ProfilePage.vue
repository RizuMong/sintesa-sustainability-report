<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="16px">
      <MpText as="h1" size="h1">My Profile</MpText>
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
      <MpFlex v-if="isLoading" direction="column" gap="2" maxWidth="552px">
        <MpSkeleton v-for="i in 4" :key="i" height="48px" rounded="md" />
      </MpFlex>

      <MpBanner v-else-if="isError" variant="danger">
        <MpBannerDescription>Couldn't load your profile.</MpBannerDescription>
      </MpBanner>

      <MpFlex v-else direction="column" maxWidth="552px">
        <ProfileRow label="Name" :value="profile?.name" />
        <ProfileRow label="Email" :value="profile?.email" />
        <ProfileRow label="Position ID" :value="profile?.position_id" />
        <ProfileRow label="Entity ID" :value="profile?.entity_id" />
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpText, MpSkeleton, MpBanner, MpBannerDescription } from '@mekari/pixel3'
import { useGetUserProfile } from '@/services/user-profile'
import ProfileRow from './ProfileRow.vue'

const { data: profile, isLoading, isError } = useGetUserProfile()
</script>
