<template>
    <MpFlex
        direction="column"
        backgroundColor="background.stage"
        minHeight="100vh"
    >
        <MpFlex direction="column" padding="24px" gap="4">
            <div
                :class="
                    css({ display: 'flex', flexDirection: 'row', gap: '2' })
                "
            >
                <SummaryBox
                    variant="orange"
                    label="Awaiting Approval"
                    :amount="summary.awaitingApproval"
                    :is-loading="isLoading"
                    :is-active="isStatusActive('sent')"
                    is-hoverable
                    @click="selectStatusFilter('sent')"
                />
                <SummaryBox
                    variant="blue"
                    label="Approved by Me"
                    :amount="summary.approvedByMe"
                    :is-loading="isLoading"
                />
                <SummaryBox
                    variant="green"
                    label="Approved"
                    :amount="summary.approved"
                    :is-loading="isLoading"
                    :is-active="isStatusActive('approved')"
                    is-hoverable
                    @click="selectStatusFilter('approved')"
                />
                <SummaryBox
                    variant="red"
                    label="Rejected"
                    :amount="summary.rejected"
                    :is-loading="isLoading"
                    :is-active="isStatusActive('rejected')"
                    is-hoverable
                    @click="selectStatusFilter('rejected')"
                />
            </div>

            <MpFlex justifyContent="flex-start">
                <TableFilter
                    :columns="filterColumns"
                    @apply="applyFilter"
                    @reset="resetFilter"
                />
            </MpFlex>

            <!--
        ponytail: entity scoping + stage gating enforced server-side (AC-59); the UI only reflects
        approval_logs / current_stage_order returned by the list endpoint, it never filters rows
        client-side as a security control. The TableFilter above is a separate, non-security,
        client-side substring filter over the already-fetched list — useGetApprovalList(filters)
        already accepts server-side entity_id/period/template_id params (mirrors RequestorPage.vue);
        move filtering there if the approval queue grows large enough for client-side to lag.
      -->
            <ApprovalReviewTable
                :items="filteredItems"
                :is-loading="isLoading"
                :columns="columns"
                :approve-mutation="approveMutation"
                :reject-mutation="rejectMutation"
                @row-click="onRowClick"
            />
        </MpFlex>
    </MpFlex>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { MpFlex, css } from "@mekari/pixel3";
import ApprovalReviewTable from "@/components/ApprovalReviewTable.vue";
import SummaryBox from "@/components/SummaryBox.vue";
import TableFilter from "@/components/TableFilter.vue";
import { useTableFilter } from "@/composables/useTableFilter";
import { useCurrentUserEmail } from "@/composables/useCurrentUser";
import {
    useGetApprovalList,
    useApproveEvaluateGriQuantitative,
    useRejectEvaluateGriQuantitative,
    approvalSummary,
} from "@/services/evaluate-gri-quantitative";

// Scoped to GRI Quantitative only — the Qualitative and Action Plan Realization queues have their
// own portals; this one mirrors the Officeless GRI Quantitative approval screen.
const router = useRouter();

const { data, isLoading } = useGetApprovalList();
const items = computed(() => data.value ?? []);

const filterColumns = computed(() => [
    { value: "entity_id.name", label: "Entity" },
    { value: "period_id.name", label: "Period" },
    { value: "template_id.name", label: "Template" },
]);
// The queue is always scoped to one flow_status: it opens on Awaiting Approval and a box click
// switches status, there is no unfiltered "all" state (the popover's Reset returns here too).
// "Approved by Me" has no flow_status of its own, so it stays a plain counter.
const DEFAULT_STATUS_FILTER = { column: "flow_status", value: "sent" };
const { filteredItems, activeFilter, applyFilter, resetFilter } =
    useTableFilter(items, DEFAULT_STATUS_FILTER);

function isStatusActive(status: string) {
    return (
        activeFilter.value?.column === "flow_status" &&
        activeFilter.value.value === status
    );
}

function selectStatusFilter(status: string) {
    applyFilter({ column: "flow_status", value: status });
}

function onRowClick(row: EvaluateGriQuantitativeSummary) {
    router.push({
        path: "/evaluate-gri-quantitative/detail",
        query: { id: row.id, from: "approval" },
    });
}

const { data: myEmail } = useCurrentUserEmail();
const summary = computed(() => approvalSummary(items.value, myEmail.value));

const approveMutation = useApproveEvaluateGriQuantitative();
const rejectMutation = useRejectEvaluateGriQuantitative();

const columns = [
    {
        key: "entity",
        label: "Entity",
        value: (row: EvaluateGriQuantitativeSummary) => row.entity_id.name,
    },
    {
        key: "period",
        label: "Period",
        value: (row: EvaluateGriQuantitativeSummary) => row.period_id.name,
    },
    {
        key: "template",
        label: "Template",
        value: (row: EvaluateGriQuantitativeSummary) => row.template_id.name,
    },
];
</script>
