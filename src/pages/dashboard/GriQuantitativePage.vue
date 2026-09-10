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
                <MpText as="h1" size="h1">GRI — Quantitative</MpText>
            </MpFlex>

            <MpFlex gap="3">
                <MpFormControl id="gri-quant-filter-period">
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
                <MpFormControl id="gri-quant-filter-entity">
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

        <MpFlex direction="column" paddingX="24px" paddingTop="16px">
            <!-- MpTabs' props aren't verified here (no pixel-hub MCP in this environment) — a manual
           MpButtonGroup toggle reuses components already proven elsewhere in this codebase
           (e.g. src/pages/evaluate-gri-quantitative/RequestorPage.vue) instead of guessing them.
           Tabs come from the payload's categories, ordered by `sequence`, rather than a
           hardcoded list — the previous version keyed tabs on a `gri_code` prefix ('2-7')
           which never matched the leaf codes the API actually sends ('2-7a'). -->
            <MpButtonGroup>
                <MpButton
                    v-for="tab in categories"
                    :key="tab.category_id.id"
                    :variant="
                        activeCategoryId === tab.category_id.id
                            ? 'primary'
                            : 'secondary'
                    "
                    size="sm"
                    @click="activeCategoryId = tab.category_id.id"
                >
                    {{ tab.category_id.name }}
                </MpButton>
            </MpButtonGroup>
        </MpFlex>

        <MpFlex v-if="isLoading" direction="column" padding="24px" gap="2">
            <MpSkeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
        </MpFlex>

        <MpFlex v-else direction="column" padding="24px" gap="6">
            <MpText size="label" color="text.secondary"
                >Menampilkan: {{ filterState.activeFilterLabel.value }}</MpText
            >

            <template v-if="activeCategory">
                <MpText size="label-small" color="text.secondary">
                    GRI {{ activeCategory.gri_codes.join(" · ") }}
                </MpText>

                <div
                    :class="
                        css({ display: 'flex', gap: '2', flexWrap: 'wrap' })
                    "
                >
                    <SummaryBox
                        v-for="(kpi, i) in activeCategory.summary"
                        :key="kpi.key"
                        :variant="metricVariants[i % metricVariants.length]"
                        :label="kpi.name"
                        :caption="kpi.unit?.name ?? ''"
                        :amount="formatSummary(kpi)"
                    />
                </div>

                <!-- One grouped bar chart per declared dimension. Series come from
                     items[].labels, so a dimension added backend-side shows up here with
                     no FE change. -->
                <MpFlex
                    v-for="chart in dimensionCharts"
                    :key="chart.id"
                    direction="column"
                    gap="3"
                >
                    <MpText as="h2" size="h3" weight="semiBold">{{
                        chart.title
                    }}</MpText>
                    <MpChart
                        :id="chart.id"
                        :title="chart.title"
                        type="bar"
                        width-container="660px"
                        width-chart="660px"
                        :data="chart.data"
                    />
                    <!-- print-ready / zero-hover, matching SdgPage: every plotted value is
                         repeated as text so the numbers read with no mouse and on paper. -->
                    <MpFlex direction="column" gap="1">
                        <MpText
                            v-for="series in chart.data.datasets"
                            :key="series.label"
                            size="label-small"
                            color="text.secondary"
                        >
                            {{ series.label }}:
                            {{ describeSeries(chart.periods, series.data) }}
                        </MpText>
                    </MpFlex>
                </MpFlex>

                <!-- AC-77 — PT comparison. Uses every entity present in items[], which the
                     contract documents as unfiltered, so it survives an active entity filter. -->
                <MpFlex
                    v-if="ptComparison.length > 1"
                    direction="column"
                    gap="3"
                >
                    <MpText as="h2" size="h3" weight="semiBold"
                        >Perbandingan antar PT</MpText
                    >
                    <MpChart
                        id="gri-quant-pt-comparison"
                        title="Perbandingan antar PT"
                        type="bar"
                        width-container="660px"
                        width-chart="660px"
                        :data="ptComparisonData"
                    />
                </MpFlex>
            </template>

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
    </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
    MpFlex,
    MpText,
    MpChart,
    MpSelect,
    MpFormControl,
    MpFormLabel,
    MpSkeleton,
    MpImage,
    MpButton,
    MpButtonGroup,
    css,
} from "@mekari/pixel3";
import SummaryBox from "@/components/SummaryBox.vue";
import {
    orderedCategories,
    periodsOf,
    seriesByDimension,
    totalsByEntity,
    useGriQuantitativeInsight,
    useStrategicInsightFilterState,
} from "@/services/strategic-insight";

const metricVariants = ["blue", "green", "orange", "gray"] as const;

const filterState = useStrategicInsightFilterState();
const { data, isLoading } = useGriQuantitativeInsight(filterState.params);

// FSD 2.7 AC-76 — the 8 thematic tabs. Driven by the response rather than hardcoded, so the
// tab list, its order, and each tab's GRI code caption all come from the backend.
const categories = computed(() => orderedCategories(data.value ?? []));

const activeCategoryId = ref<string | null>(null);
const activeCategory = computed(() => {
    const list = categories.value;
    if (list.length === 0) return undefined;
    return (
        list.find((c) => c.category_id.id === activeCategoryId.value) ?? list[0]
    );
});

function formatSummary(kpi: StrategicInsightGriSummary): string {
    // Ratios (salary F/M) need 2dp; everything else reads better as a grouped integer.
    const isRatio = kpi.aggregation === "AVERAGE" && Math.abs(kpi.value) < 10;
    const value = isRatio
        ? kpi.value.toFixed(2)
        : (Math.round(kpi.value * 10) / 10).toLocaleString("id-ID");
    const suffix = kpi.unit?.name ? ` ${kpi.unit.name}` : "";
    const denominator = kpi.total === undefined ? "" : ` / ${kpi.total}`;
    return `${value}${denominator}${suffix}`;
}

// One chart per dimension the active category declares.
const dimensionCharts = computed(() => {
    const category = activeCategory.value;
    if (!category) return [];
    const periods = periodsOf(category.items);
    return category.dimensions
        .map((dimension) => ({
            id: `gri-quant-${category.category_id.id}-${dimension.key}`,
            title: dimension.name,
            periods,
            data: {
                labels: periods.map(String),
                datasets: seriesByDimension(category, dimension.key).map(
                    (series) => ({ label: series.name, data: series.data }),
                ),
            },
        }))
        // a dimension whose members carry no data anywhere would plot a chart of zeros
        .filter((chart) =>
            chart.data.datasets.some((d) => d.data.some((v) => v !== 0)),
        );
});

const ptComparison = computed(() =>
    totalsByEntity(activeCategory.value?.items ?? []),
);

const ptComparisonData = computed(() => ({
    labels: ptComparison.value.map((e) => e.code),
    datasets: [
        {
            label: activeCategory.value?.category_id.name ?? "",
            data: ptComparison.value.map((e) => e.value),
        },
    ],
}));

// "2024: 350 · 2025: 330" — the text mirror of one chart series.
function describeSeries(periods: number[], values: number[]): string {
    return periods
        .map(
            (period, i) =>
                `${period}: ${(values[i] ?? 0).toLocaleString("id-ID")}`,
        )
        .join(" · ");
}
</script>
