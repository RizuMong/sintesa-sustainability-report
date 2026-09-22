<template>
    <MpFlex
        direction="column"
        backgroundColor="background.stage"
        minHeight="100vh"
    >
        <MpFlex
            paddingX="24px"
            paddingY="24px"
            backgroundColor="background.surface"
            justifyContent="space-between"
            alignItems="flex-start"
            wrap="wrap"
            gap="4"
        >
            <MpFlex direction="column">
                <MpText size="label-small" color="text.secondary"
                    >Dashboard</MpText
                >
                <MpText as="h1" size="h1">SDG</MpText>
            </MpFlex>

            <MpFlex gap="3" class="dashboard-filters">
                <MpFormControl id="sdg-filter-period">
                    <MpFormLabel>Reporting Period</MpFormLabel>
                    <MpSelect
                        v-model="filterState.state.period"
                        placeholder="All Periods"
                        is-full-width
                    >
                        <option value="">All Periods</option>
                        <option
                            v-for="p in filterState.periods.value"
                            :key="p.id"
                            :value="String(p.year)"
                        >
                            {{ p.year }}
                        </option>
                    </MpSelect>
                </MpFormControl>
                <MpFormControl id="sdg-filter-entity">
                    <MpFormLabel>Entity</MpFormLabel>
                    <MpSelect
                        v-model="filterState.state.entityId"
                        placeholder="All Entities"
                        is-full-width
                    >
                        <option value="">All Entities</option>
                        <option
                            v-for="e in filterState.entities.value"
                            :key="e.id"
                            :value="e.id"
                        >
                            {{ e.name }}
                        </option>
                    </MpSelect>
                </MpFormControl>
            </MpFlex>
        </MpFlex>

        <MpFlex v-if="isLoading" direction="column" padding="24px" gap="2">
            <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
        </MpFlex>

        <MpFlex
            v-else
            direction="column"
            padding="24px"
            gap="6"
            class="sdg-print-area"
        >
            <div :class="css({ display: 'flex', gap: '2' })">
                <SummaryBox
                    variant="blue"
                    label="Holding SDG Roadmap"
                    :amount="kpi.holding_sdg_roadmap"
                />
                <SummaryBox
                    variant="green"
                    label="Strategic Alignment %"
                    :amount="`${kpi.strategic_alignment_rate}%`"
                />
                <SummaryBox
                    variant="orange"
                    label="Execution Rate (Take)"
                    :amount="`${kpi.execution_rate_take}%`"
                />
                <SummaryBox
                    variant="gray"
                    label="Bottom-Up Initiatives"
                    :amount="kpi.bottom_up_initiatives"
                />
            </div>

            <MpFlex direction="column" gap="3">
                <!-- GROU-833: was an MpTable, now a horizontal bar chart. Horizontal, not
                     vertical, because 17 category labels ("SDG 12 — Responsible Consumption and
                     Production") are unreadable on an x-axis; one bar per row gives each label a
                     full line. Rows come from padMatrixToAllSdgs() so all 17 goals are on the axis
                     even when the payload carries only a handful (AC-2). DashboardChartCard also
                     renders the print-ready text mirror, which is what preserves the exact
                     Take Rate numbers the table used to show. -->
                <DashboardChartCard
                    v-if="matrix.length"
                    id="sdg-take-rate-per-sdg"
                    title="Strategic Action Matrix — Take Rate per SDG"
                    caption="Holding-only Take / (Take + Skip) — all 17 goals"
                    kind="bar-horizontal"
                    height="520px"
                    :labels="takeRateData.labels"
                    :datasets="takeRateData.datasets"
                />
                <MpFlex
                    v-else
                    direction="column"
                    alignItems="center"
                    gap="2"
                    paddingY="10"
                >
                    <MpText as="h2" size="h3" weight="semiBold"
                        >Strategic Action Matrix — Take Rate per SDG</MpText
                    >
                    <MpImage
                        src="https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png"
                        alt="empty state illustration"
                        layout="fixed"
                        :width="160"
                        :height="128"
                        object-fit="contain"
                        :is-show-loading="false"
                    />
                    <MpText size="label" color="text.secondary"
                        >No available yet</MpText
                    >
                </MpFlex>
            </MpFlex>

            <MpFlex direction="column" gap="3">
                <!-- DashboardChartCard, not a raw MpChart: the hand-rolled MpChart here rendered
                     every bar crammed into the first category slot while the x-axis labels spread
                     across the full width, because it passed no chart height (MpChart's default
                     collapses the plot area) and none of the legend/stacking props. The GRI page's
                     card wrapper already solves all of that, and carries the print-ready text
                     mirror this page was duplicating by hand. Caught by screenshot review — the
                     canvas HAD painted pixels, so the acceptance check passed it. -->
                <DashboardChartCard
                    id="sdg-aligned-vs-initiated"
                    title="Aligned vs Initiated per SDG"
                    caption="Holding-mandated actions vs bottom-up initiatives"
                    kind="bar"
                    height="320px"
                    :labels="alignedVsInitiatedData.labels"
                    :datasets="alignedVsInitiatedData.datasets"
                />
            </MpFlex>

            <!-- GROU-833: the drill-down used to be driven by clicking a row of the matrix
                 table. A chart bar is not a row and MpChart exposes no per-bar click, so the
                 selector became explicit — same `selectedSdgId`, same detail table below, just a
                 different control driving it. Lists all 17 goals; the ones with no action plan
                 fall through to the existing "No action plan items" message. -->
            <MpFlex direction="column" gap="3">
                <MpFormControl id="sdg-detail-selector">
                    <MpFormLabel>Show detail for</MpFormLabel>
                    <MpSelect v-model="selectedSdgValue">
                        <option value="">Select an SDG</option>
                        <option
                            v-for="row in allSdgRows"
                            :key="row.sdg.id"
                            :value="row.sdg.id"
                        >
                            SDG {{ row.sdg.number }} — {{ row.sdg.name }}
                        </option>
                    </MpSelect>
                </MpFormControl>
            </MpFlex>

            <MpFlex v-if="selectedSdgId" direction="column" gap="3">
                <MpText as="h2" size="h3" weight="semiBold">
                    Detail — SDG {{ selectedMatrixRow?.sdg.number }}
                    {{ selectedMatrixRow?.sdg.name }}
                </MpText>
                <MpTableContainer v-if="selectedDetail.length">
                    <MpTable>
                        <MpTableHead>
                            <MpTableRow>
                                <MpTableCell scope="col">Entity</MpTableCell>
                                <MpTableCell scope="col"
                                    >Key Business Action</MpTableCell
                                >
                                <MpTableCell scope="col"
                                    >Action Indicator</MpTableCell
                                >
                                <MpTableCell scope="col"
                                    >Created By</MpTableCell
                                >
                                <MpTableCell scope="col">Decision</MpTableCell>
                                <MpTableCell scope="col"
                                    >Skip Reason</MpTableCell
                                >
                            </MpTableRow>
                        </MpTableHead>
                        <MpTableBody>
                            <MpTableRow
                                v-for="item in selectedDetail"
                                :key="item.id"
                            >
                                <MpTableCell as="td" scope="row">{{
                                    item.entity.name
                                }}</MpTableCell>
                                <MpTableCell as="td" scope="row">{{
                                    item.key_business_action
                                }}</MpTableCell>
                                <MpTableCell as="td" scope="row">{{
                                    item.action_indicator?.name ?? "-"
                                }}</MpTableCell>
                                <MpTableCell as="td" scope="row">
                                    <MpFlex
                                        direction="column"
                                        gap="1"
                                        alignItems="flex-start"
                                    >
                                        <MpText size="label-small">{{
                                            item.created_by_level
                                        }}</MpText>
                                        <MpBadge
                                            v-if="item.unverified"
                                            for="tableStatus"
                                            type="announcement"
                                            >Unverified / Non-Official
                                            SDG</MpBadge
                                        >
                                    </MpFlex>
                                </MpTableCell>
                                <MpTableCell as="td" scope="row">
                                    <MpBadge
                                        for="tableStatus"
                                        :type="
                                            decisionBadgeType[
                                                item.decision ?? 'none'
                                            ]
                                        "
                                        >{{
                                            item.decision ?? "Pending"
                                        }}</MpBadge
                                    >
                                </MpTableCell>
                                <MpTableCell as="td" scope="row">{{
                                    item.skip_reason ?? "-"
                                }}</MpTableCell>
                            </MpTableRow>
                        </MpTableBody>
                    </MpTable>
                </MpTableContainer>
                <MpText v-else size="label" color="text.secondary"
                    >No action plan items for this SDG yet.</MpText
                >
            </MpFlex>
        </MpFlex>
    </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
    MpFlex,
    MpText,
    MpSelect,
    MpFormControl,
    MpFormLabel,
    MpSkeleton,
    MpImage,
    MpTable,
    MpTableHead,
    MpTableBody,
    MpTableRow,
    MpTableCell,
    MpTableContainer,
    MpBadge,
    css,
} from "@mekari/pixel3";
import SummaryBox from "@/components/SummaryBox.vue";
import DashboardChartCard from "@/components/DashboardChartCard.vue";
import {
    padMatrixToAllSdgs,
    useSdgInsight,
    useStrategicInsightFilterState,
} from "@/services/strategic-insight";

const filterState = useStrategicInsightFilterState();
const { data, isLoading } = useSdgInsight(filterState.params);

const kpi = computed<StrategicInsightSdgKpi>(
    () =>
        data.value?.kpi ?? {
            holding_sdg_roadmap: 0,
            strategic_alignment_rate: 0,
            execution_rate_take: 0,
            bottom_up_initiatives: 0,
        },
);
const matrix = computed(() => data.value?.matrix ?? []);
const detail = computed(() => data.value?.detail ?? []);

// All 17 goals, zero-filled — what the take-rate chart plots and what the detail selector lists.
const allSdgRows = computed(() => padMatrixToAllSdgs(matrix.value));

// MpSelect binds a string; selectedSdgId keeps the null-or-id shape the detail section already
// expects, so nothing downstream of it changed.
const selectedSdgValue = ref("");
const selectedSdgId = computed(() => selectedSdgValue.value || null);
const selectedMatrixRow = computed(() =>
    allSdgRows.value.find((row) => row.sdg.id === selectedSdgId.value),
);
const selectedDetail = computed(() =>
    detail.value.filter((item) => item.sdg_id === selectedSdgId.value),
);

const takeRateData = computed(() => ({
    labels: allSdgRows.value.map((row) => `SDG ${row.sdg.number} — ${row.sdg.name}`),
    datasets: [
        {
            label: "Take Rate (%)",
            data: allSdgRows.value.map((row) => row.take_rate),
        },
    ],
}));

const alignedVsInitiatedData = computed(() => ({
    labels: matrix.value.map((row) => `SDG ${row.sdg.number}`),
    datasets: [
        {
            label: "Aligned",
            data: matrix.value.map((row) => row.aligned_count),
        },
        {
            label: "Initiated",
            data: matrix.value.map((row) => row.initiated_count),
        },
    ],
}));

// none === decision null (Pending Response) — kept out of the global TakeSkipDecision union
const decisionBadgeType: Record<
    "Take" | "Skip" | "none",
    "completed" | "announcement" | "information"
> = {
    Take: "completed",
    Skip: "announcement",
    none: "information",
};
</script>

<style scoped>
@media print {
    .dashboard-filters {
        display: none;
    }
    .sdg-print-area {
        padding: 12px;
    }
    @page {
        size: A4;
        margin: 12mm;
    }
}
</style>
