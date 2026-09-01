<template>
    <div>
        <MpTimeline>
            <MpTimelineItem status="approved">
                <MpTimelineTitle>
                    <MpText weight="semiBold">
                        Need Approval
                        <MpText
                            as="span"
                            :color="isNextTheme ? 'text.secondary' : 'gray.400'"
                            weight="regular"
                        >
                            by
                        </MpText>
                        Jessie
                    </MpText>
                </MpTimelineTitle>
                <MpTimelineCaption> 02 Apr 2022, 21:12 PM </MpTimelineCaption>
                <MpTimelineContent>
                    <MpText>
                        Complete all components, specs and space. so it is ready
                        to review to all designers and move to pixel docs 2.0.
                    </MpText>
                </MpTimelineContent>
            </MpTimelineItem>

            <MpTimelineItem>
                <MpTimelineTitle>
                    <MpText weight="semiBold">
                        Approved
                        <MpText
                            as="span"
                            :color="isNextTheme ? 'text.secondary' : 'gray.400'"
                            weight="regular"
                        >
                            by
                        </MpText>
                        Approved
                    </MpText>
                </MpTimelineTitle>
                <MpTimelineCaption> 02 Apr 2022, 21:12 PM </MpTimelineCaption>
                <MpTimelineContent>
                    <MpText>
                        Complete all components, specs and space. so it is ready
                        to review to all designers and move to pixel docs 2.0.
                    </MpText>
                </MpTimelineContent>
            </MpTimelineItem>
        </MpTimeline>
    </div>
</template>

<script setup lang="ts">
import {
    MpText,
    MpTimeline,
    MpTimelineCaption,
    MpTimelineContent,
    MpTimelineItem,
    MpTimelineTitle,
} from "@mekari/pixel3";
import { usePixelTheme } from "@mekari/pixel3-utils";

const { isNextTheme } = usePixelTheme();
</script>
