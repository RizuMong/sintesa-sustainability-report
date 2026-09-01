<template>
    <div>
        <MpTimeline>
            <MpTimelineItem status="canceled">
                <MpTimelineTitle>
                    <MpText weight="semiBold">
                        Canceled
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
                    <MpText color="text.default">
                        This contains of a short description if any.
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
                        Olivia Rodriguez
                    </MpText>
                </MpTimelineTitle>
                <MpTimelineCaption> 02 Apr 2022, 21:12 PM </MpTimelineCaption>
                <MpTimelineContent>
                    <MpText>
                        This contains of a short description if any.
                    </MpText>

                    <MpButton
                        :class="css({ marginTop: 2 })"
                        variant="secondary"
                    >
                        Sign
                    </MpButton>
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
                        Olivia Rodriguez
                    </MpText>
                </MpTimelineTitle>
                <MpTimelineCaption> 02 Apr 2022, 21:12 PM </MpTimelineCaption>
                <MpTimelineContent>
                    <MpText>
                        This contains of a short description if any.
                    </MpText>

                    <MpTimelineDocument
                        :class="css({ marginTop: 2 })"
                        icon="excel-document"
                        title="jurnal-financial-report.xlsx"
                        file-size="362Kb"
                    >
                        <MpText
                            as="a"
                            href="https://www.jurnal.id/id/"
                            target="_blank"
                            size="body-small"
                            :color="isNextTheme ? 'text.link' : 'blue.400'"
                            is-text-link
                            :class="css({ ml: 1 })"
                        >
                            View
                        </MpText>
                    </MpTimelineDocument>
                </MpTimelineContent>
            </MpTimelineItem>
        </MpTimeline>
    </div>
</template>

<script setup lang="ts">
import {
    MpButton,
    MpText,
    MpTimeline,
    MpTimelineCaption,
    MpTimelineContent,
    MpTimelineDocument,
    MpTimelineItem,
    MpTimelineTitle,
    css,
} from "@mekari/pixel3";
import { usePixelTheme } from "@mekari/pixel3-utils";

const { isNextTheme } = usePixelTheme();
</script>
