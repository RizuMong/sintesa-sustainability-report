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
                    <FilterSelect v-model="filterState.state.period" :options="filterState.periods.value.map((p) => ({ value: String(p.year), label: String(p.year) }))" placeholder="All Periods" />
                </MpFormControl>
                <MpFormControl id="sdg-filter-entity">
                    <MpFormLabel>Entity</MpFormLabel>
                    <FilterSelect v-model="filterState.state.entityId" :options="filterState.entities.value.map((e) => ({ value: e.id, label: e.name }))" placeholder="All Entities" />
                </MpFormControl>
                <MpFormControl id="sdg-filter-impact">
                    <MpFormLabel>Impact</MpFormLabel>
                    <FilterSelect v-model="filterState.state.impact" :options="IMPACT_OPTIONS.map((i) => ({ value: i, label: i }))" placeholder="All Impacts" />
                </MpFormControl>
                <MpButton variant="secondary" left-icon="close" style="align-self: flex-end" :is-disabled="!filterState.hasActiveFilter.value" @click="filterState.reset">Clear filters</MpButton>
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
                        <div :class="legend.swatchClass" />
                        <MpText size="label-small" color="text.secondary">{{
                            legend.label
                        }}</MpText>
                    </MpFlex>
                </MpFlex>
                <MpTableContainer v-if="columns.length">
                    <MpTable>
                        <MpTableHead>
                            <!-- Column grouping header (Holding SDGs / Bottom-Up Initiatives), rule 4:
                                 Entity + Execution % sit outside both groups under one blank
                                 colspan="2" cell. Empty groups are omitted (colspan="0" isn't
                                 valid HTML). Grouping follows Master SDG adoption status. -->
                            <MpTableRow>
                                <MpTableCell colspan="2" />
                                <MpTableCell
                                    v-for="(group, groupIndex) in columnGroups"
                                    :key="group.group"
                                    scope="colgroup"
                                    :colspan="group.span"
                                    :class="[
                                        GROUP_HEADER_CLASS[group.group],
                                        groupIndex > 0 ? GROUP_SEPARATOR_CLASS : '',
                                    ]"
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
                                    :class="groupSeparator(column.sdg_id)"
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
                                    :class="[
                                        CELL_CLASS[cell.status],
                                        groupSeparator(cell.sdg_id),
                                    ]"
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
    MpButton,
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
import FilterSelect from "@/components/FilterSelect.vue";
import SummaryBox from "@/components/SummaryBox.vue";
import DashboardChartCard from "@/components/DashboardChartCard.vue";
import SdgActionPlanDetail from "@/components/SdgActionPlanDetail.vue";
import {
    useSdgInsight,
    useStrategicInsightFilterState,
    IMPACT_OPTIONS,
    isTakenMandate,
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
                label: column.group === "HOLDING" ? "Holding SDGs" : "Bottom-Up Initiatives",
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
    // Holding bar counts taken mandates only (holding_count), so its drill-down must match.
    return detail.value.filter(
        (item) =>
            item.entity_id === sel.entityId &&
            item.plan_origin === sel.planOrigin &&
            (sel.planOrigin !== "HOLDING" || isTakenMandate(item)),
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

// Colours: this page renders in the 2.1 token theme (no nextTheme route meta), where the `yellow`
// scale is undefined and `orange` IS the yellow/amber scale (orange.50 #FBF3DD, orange.400 #E0AB00).
// Every class below is a literal css() call on purpose: @mekari/pixel3-postcss extracts CSS
// statically, so style objects built at runtime (lookups, spreads, helper returns) get a class
// name but no CSS rule.

// Cell colour by action status (INITIATE > TAKE > SKIP precedence, see normalize-sdg.ts), regardless
// of which column group the cell sits in: TAKE -> green, INITIATE -> yellow, SKIP/PENDING/NONE ->
// plain surface with a gray.100 border.
const cellLegend = [
    {
        status: "TAKE",
        label: "Adopted",
        swatchClass: css({ w: "3", h: "3", rounded: "sm", bg: "green.50", borderWidth: "1px", borderColor: "green.400" }),
    },
    {
        status: "INITIATE",
        label: "Initiate",
        swatchClass: css({ w: "3", h: "3", rounded: "sm", bg: "orange.50", borderWidth: "1px", borderColor: "orange.400" }),
    },
    {
        status: "SKIP",
        label: "Skip",
        swatchClass: css({ w: "3", h: "3", rounded: "sm", bg: "background.surface", borderWidth: "1px", borderColor: "gray.100" }),
    },
] as const;

const SKIP_CELL_CLASS = css({ cursor: "pointer", bg: "background.surface", borderWidth: "1px", borderColor: "gray.100" });
const CELL_CLASS: Record<SdgCellStatus, string> = {
    TAKE: css({ cursor: "pointer", bg: "green.50", color: "green.700" }),
    INITIATE: css({ cursor: "pointer", bg: "orange.50", color: "orange.700" }),
    SKIP: SKIP_CELL_CLASS,
    NONE: SKIP_CELL_CLASS,
};

// Column groups: green header for Holding SDGs, yellow for Bottom-Up Initiatives, one separator
// line between the two groups (header rows and body) in the default border colour — gray.100 in
// 2.1, the same colour MpTable uses for its own cell borders (`border.default` is 2.4-only).
const GROUP_HEADER_CLASS = {
    HOLDING: css({ textAlign: "center", fontWeight: "semiBold", bg: "green.50", color: "green.700" }),
    INITIATE: css({ textAlign: "center", fontWeight: "semiBold", bg: "orange.50", color: "orange.700" }),
} as const;
const GROUP_SEPARATOR_CLASS = css({ borderLeftWidth: "2px", borderLeftColor: "gray.100" });

// The first column of a group that follows another group carries the separator. Relies on columns
// being contiguous per group, which normalize-sdg.ts guarantees.
function groupSeparator(sdgId: string): string {
    const cols = columns.value;
    const i = cols.findIndex((c) => c.sdg_id === sdgId);
    return i > 0 && cols[i - 1]!.group !== cols[i]!.group ? GROUP_SEPARATOR_CLASS : "";
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
