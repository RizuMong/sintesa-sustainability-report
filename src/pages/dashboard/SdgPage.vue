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
                <MpFormControl id="sdg-filter-impact">
                    <MpFormLabel>Impact</MpFormLabel>
                    <MpSelect
                        v-model="filterState.state.impact"
                        placeholder="All Impacts"
                        is-full-width
                    >
                        <option value="">All Impacts</option>
                        <option
                            v-for="impact in IMPACT_OPTIONS"
                            :key="impact"
                            :value="impact"
                        >
                            {{ impact }}
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
                    v-for="block in summary"
                    :key="block.key"
                    is-full-width
                    :class="css({ flex: '1', minWidth: '0' })"
                    :label="block.name"
                    :description="block.description"
                    :amount="formatSummaryAmount(block)"
                />
            </div>

            <!-- Strategic Action Matrix: an MpTable, not a chart (decision 3 in
                 plans/sdg-dashboard-adjustments/plan.md) — a per-cell click is free, long SDG
                 labels stay readable as column headers, and the acceptance check can assert on
                 real DOM instead of canvas pixels. -->
            <MpFlex direction="column" gap="3">
                <MpText as="h2" size="h3" weight="semiBold"
                    >Strategic Action Matrix</MpText
                >
                <MpFlex v-if="columns.length" gap="4" alignItems="center">
                    <MpFlex
                        v-for="legend in cellLegend"
                        :key="legend.status"
                        gap="1"
                        alignItems="center"
                    >
                        <div :class="css(legend.swatchStyle)" />
                        <MpText size="label-small" color="text.secondary">{{
                            legend.label
                        }}</MpText>
                    </MpFlex>
                </MpFlex>
                <MpTableContainer v-if="columns.length">
                    <MpTable>
                        <MpTableHead>
                            <!-- Column grouping header (Holding SDGs / Initiative SDGs), rule 4:
                                 Entity + Execution % sit outside both groups under one blank
                                 colspan="2" cell. Empty groups are omitted (colspan="0" isn't
                                 valid HTML) — against the current contract only Holding SDGs
                                 renders, spanning all 5 SDG columns. -->
                            <MpTableRow>
                                <MpTableCell colspan="2" />
                                <MpTableCell
                                    v-for="group in columnGroups"
                                    :key="group.group"
                                    scope="colgroup"
                                    :colspan="group.span"
                                    :class="css({
                                        textAlign: 'center',
                                        backgroundColor: 'background.neutral.subtle',
                                        color: 'text.secondary',
                                        fontWeight: 'semiBold',
                                    })"
                                >
                                    {{ group.label }}
                                </MpTableCell>
                            </MpTableRow>
                            <MpTableRow>
                                <MpTableCell scope="col">Entity</MpTableCell>
                                <MpTableCell scope="col"
                                    >Execution %</MpTableCell
                                >
                                <MpTableCell
                                    v-for="column in columns"
                                    :key="column.sdg_id"
                                    scope="col"
                                >
                                    {{ column.name }}
                                </MpTableCell>
                            </MpTableRow>
                        </MpTableHead>
                        <MpTableBody>
                            <MpTableRow
                                v-for="row in matrix"
                                :key="row.entity.id"
                            >
                                <MpTableCell as="td" scope="row">{{
                                    row.entity.name
                                }}</MpTableCell>
                                <MpTableCell as="td" scope="row"
                                    >{{ row.execution_percentage }}%</MpTableCell
                                >
                                <MpTableCell
                                    v-for="cell in row.cells"
                                    :key="cell.sdg_id"
                                    as="td"
                                    scope="row"
                                    :class="css(cellStyle(cell.status))"
                                    @click="
                                        selection = {
                                            kind: 'cell',
                                            entityId: row.entity.id,
                                            sdgId: cell.sdg_id,
                                        }
                                    "
                                >
                                    {{ cell.take_percentage }}%
                                </MpTableCell>
                            </MpTableRow>
                        </MpTableBody>
                    </MpTable>
                </MpTableContainer>
                <MpFlex
                    v-else
                    direction="column"
                    alignItems="center"
                    gap="2"
                    paddingY="10"
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
                <DashboardChartCard
                    v-if="matrix.length"
                    id="sdg-alignment-gap"
                    title="Strategic Alignment Gap"
                    caption="Holding-mandated actions vs bottom-up initiatives, per entity"
                    kind="bar-stacked-horizontal"
                    height="320px"
                    :labels="alignmentGapData.labels"
                    :datasets="alignmentGapData.datasets"
                    :on-segment-click="onAlignmentGapClick"
                />
            </MpFlex>

            <MpFlex v-if="selection" direction="column" gap="3">
                <SdgActionPlanDetail
                    :items="selectedDetail"
                    :heading="selectedDetailHeading"
                />
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
    css,
} from "@mekari/pixel3";
import SummaryBox from "@/components/SummaryBox.vue";
import DashboardChartCard from "@/components/DashboardChartCard.vue";
import SdgActionPlanDetail from "@/components/SdgActionPlanDetail.vue";
import {
    useSdgInsight,
    useStrategicInsightFilterState,
    IMPACT_OPTIONS,
} from "@/services/strategic-insight";

const filterState = useStrategicInsightFilterState();
const { data, isLoading } = useSdgInsight(filterState.params);

const summary = computed(() => data.value?.summary ?? []);
const columns = computed(() => data.value?.columns ?? []);
const matrix = computed(() => data.value?.matrix ?? []);
const detail = computed(() => data.value?.detail ?? []);

// Run-length-encode columns (already sorted group-then-number, see normalize-sdg.ts) into
// contiguous group spans for the grouping header row. A group with no columns never appears, so
// the template never has to emit a colspan="0" cell.
const columnGroups = computed(() => {
    const groups: { group: "HOLDING" | "INITIATE"; label: string; span: number }[] = [];
    for (const column of columns.value) {
        const last = groups[groups.length - 1];
        if (last && last.group === column.group) {
            last.span += 1;
        } else {
            groups.push({
                group: column.group,
                label: column.group === "HOLDING" ? "Holding SDGs" : "Initiative SDGs",
                span: 1,
            });
        }
    }
    return groups;
});

// total present -> "value / total"; else percent-formatted keys -> "value%"; else the bare value.
const PERCENT_KEYS = new Set(["execution_rate", "strategic_alignment"]);
function formatSummaryAmount(block: StrategicInsightSdgSummary): string {
    if (block.total !== undefined) return `${block.value} / ${block.total}`;
    if (PERCENT_KEYS.has(block.key)) return `${block.value}%`;
    return String(block.value);
}

type SdgDetailSelection =
    | { kind: "cell"; entityId: string; sdgId: string }
    | { kind: "origin"; entityId: string; planOrigin: "HOLDING" | "INITIATE" }
    | null;

const selection = ref<SdgDetailSelection>(null);

const selectedDetail = computed(() => {
    const sel = selection.value;
    if (!sel) return [];
    if (sel.kind === "cell") {
        return detail.value.filter(
            (item) => item.entity_id === sel.entityId && item.sdg_id === sel.sdgId,
        );
    }
    return detail.value.filter(
        (item) =>
            item.entity_id === sel.entityId && item.plan_origin === sel.planOrigin,
    );
});

const selectedDetailHeading = computed(() => {
    const sel = selection.value;
    if (!sel) return "Action Plan Details";
    const entityName =
        matrix.value.find((row) => row.entity.id === sel.entityId)?.entity.name ??
        sel.entityId;
    if (sel.kind === "cell") {
        const sdgName =
            columns.value.find((c) => c.sdg_id === sel.sdgId)?.name ?? sel.sdgId;
        return `Detail — ${entityName} · ${sdgName}`;
    }
    return `Detail — ${entityName} · ${sel.planOrigin === "HOLDING" ? "Holding" : "Initiate"}`;
});

// Cell colour map (decision 1 in plan.md): TAKE -> green, INITIATE -> orange (Pixel 3 has no
// yellow scale), SKIP/NONE -> plain surface with a gray.100 border.
const cellLegend = [
    {
        status: "TAKE",
        label: "Take",
        swatchStyle: { w: "3", h: "3", rounded: "sm", bg: "green.100", borderWidth: "1px", borderColor: "green.400" },
    },
    {
        status: "INITIATE",
        label: "Initiate",
        swatchStyle: { w: "3", h: "3", rounded: "sm", bg: "orange.100", borderWidth: "1px", borderColor: "orange.400" },
    },
    {
        status: "SKIP",
        label: "Skip / None",
        swatchStyle: { w: "3", h: "3", rounded: "sm", bg: "background.surface", borderWidth: "1px", borderColor: "gray.100" },
    },
] as const;

function cellStyle(status: SdgCellStatus) {
    const base = { cursor: "pointer" as const };
    switch (status) {
        case "TAKE":
            return { ...base, bg: "green.50", color: "green.700" };
        case "INITIATE":
            return { ...base, bg: "orange.50", color: "orange.700" };
        default:
            return { ...base, bg: "background.surface", borderWidth: "1px", borderColor: "gray.100" };
    }
}

const alignmentGapData = computed(() => ({
    labels: matrix.value.map((row) => row.entity.name),
    datasets: [
        { label: "Holding", data: matrix.value.map((row) => row.holding_count) },
        { label: "Initiate", data: matrix.value.map((row) => row.initiate_count) },
    ],
}));

function onAlignmentGapClick(datasetIndex: number, index: number) {
    const row = matrix.value[index];
    if (!row) return;
    const planOrigin: "HOLDING" | "INITIATE" = datasetIndex === 0 ? "HOLDING" : "INITIATE";
    selection.value = { kind: "origin", entityId: row.entity.id, planOrigin };
}
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
