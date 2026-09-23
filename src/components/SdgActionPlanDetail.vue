<script setup lang="ts">
import {
    MpText,
    MpTable,
    MpTableHead,
    MpTableBody,
    MpTableRow,
    MpTableCell,
    MpTableContainer,
    MpBadge,
} from "@mekari/pixel3";

defineProps<{
    items: StrategicInsightSdgDetailItem[];
    heading: string;
}>();

// 'HOLDING' -> information, 'INITIATE' -> announcement; mirrors the Take/Skip badge mapping
// below, just for the origin axis instead of the decision axis.
const originBadgeType: Record<string, "information" | "announcement"> = {
    HOLDING: "information",
    INITIATE: "announcement",
};

const adoptionBadgeType: Record<string, "completed" | "announcement" | "information"> = {
    TAKE: "completed",
    SKIP: "announcement",
};
</script>

<template>
    <MpText as="h2" size="h3" weight="semiBold">{{ heading }}</MpText>
    <MpTableContainer v-if="items.length">
        <MpTable>
            <MpTableHead>
                <MpTableRow>
                    <MpTableCell scope="col">SDG</MpTableCell>
                    <MpTableCell scope="col">Action Plan Initiative</MpTableCell>
                    <MpTableCell scope="col">Origin</MpTableCell>
                    <MpTableCell scope="col">Adoption Status</MpTableCell>
                </MpTableRow>
            </MpTableHead>
            <MpTableBody>
                <MpTableRow v-for="item in items" :key="item.id">
                    <MpTableCell as="td" scope="row">{{ item.sdg_name }}</MpTableCell>
                    <MpTableCell as="td" scope="row">{{
                        item.key_business_action
                    }}</MpTableCell>
                    <MpTableCell as="td" scope="row">
                        <MpBadge
                            for="tableStatus"
                            :type="originBadgeType[item.plan_origin] ?? 'information'"
                            >{{ item.plan_origin }}</MpBadge
                        >
                    </MpTableCell>
                    <MpTableCell as="td" scope="row">
                        <MpBadge
                            for="tableStatus"
                            :type="adoptionBadgeType[item.adoption_status] ?? 'information'"
                            >{{ item.adoption_status }}</MpBadge
                        >
                    </MpTableCell>
                </MpTableRow>
            </MpTableBody>
        </MpTable>
    </MpTableContainer>
    <MpText v-else size="label" color="text.secondary"
        >No action plan items for this SDG yet.</MpText
    >
</template>
