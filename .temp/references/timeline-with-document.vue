<template>
    <Pixel.div maxWidth="400px">
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
                    <MpTimelineDocument
                        icon="pdf"
                        title="mekari-document-example-file-name-with-long-name.pdf"
                        file-size="0.53Mb"
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
                    <MpTimelineDocument
                        icon="zip"
                        icon-variant="fill"
                        title="mekari-document-example-file-name-with-long-name.pdf"
                        file-size="0.53Mb"
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
                            Download
                        </MpText>
                    </MpTimelineDocument>
                </MpTimelineContent>
            </MpTimelineItem>

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
                    <MpTimelineDocument
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
    </Pixel.div>
</template>

<script setup lang="ts">
import {
    Pixel,
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
