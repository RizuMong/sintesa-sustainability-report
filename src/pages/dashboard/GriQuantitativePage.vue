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

        <MpFlex v-if="isLoading" direction="column" padding="24px" gap="2">
            <MpSkeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
        </MpFlex>

        <MpFlex v-else direction="column" padding="24px" gap="6">
            <!-- FSD 2.7 AC-76 — the 8 thematic tabs. Driven by the response rather than
                 hardcoded, so the tab list, its order, and each tab's GRI code caption all
                 come from the backend. MpTabs/MpTabList/MpTab props verified in
                 docs/pixel3-tabs-notes.md; the overflow-x wrapper is required (§3), MpTabList
                 ships no built-in scroll behaviour. -->
            <template v-if="categories.length">
                <!-- `is-manual` is required, not optional: without it MpTabs' useTabs()
                     ignores modelValue entirely and tracks its own internal ref, so the
                     clamp below could move activeIndex while the underline stayed on a
                     stale (possibly out-of-range) tab. With it, selectedTab is a computed
                     over modelValue and this component is the single source of truth. -->
                <MpTabs v-model="activeIndex" is-manual variant-color="blue">
                    <div :class="tabScrollClass">
                        <MpTabList>
                            <MpTab
                                v-for="category in categories"
                                :key="category.category_id.id"
                                :id="category.category_id.id"
                            >
                                {{ category.category_id.name }}
                            </MpTab>
                        </MpTabList>
                    </div>
                </MpTabs>

                <MpText size="label" color="text.secondary"
                    >Menampilkan:
                    {{ filterState.activeFilterLabel.value }}</MpText
                >

                <template v-if="activeCategory">
                    <MpFlex direction="column" gap="1">
                        <MpText
                            size="label-small"
                            weight="semiBold"
                            color="text.secondary"
                        >
                            GRI {{ activeCategory.gri_codes.join(" · ") }}
                        </MpText>
                        <MpText
                            v-if="activeCaption"
                            size="label-small"
                            color="text.secondary"
                        >
                            {{ activeCaption }}
                        </MpText>
                    </MpFlex>

                    <div
                        :class="
                            css({ display: 'flex', gap: '2', flexWrap: 'wrap' })
                        "
                    >
                        <!-- No `caption`: formatSummary() already appends the unit to the
                             amount ("372 Metric Ton"), so passing unit.name here too printed
                             it twice AND pushed the card past SummaryBox's fixed 89px height,
                             clipping it. Caught by screenshot review. -->
                        <SummaryBox
                            v-for="(kpi, i) in activeCategory.summary"
                            :key="kpi.key"
                            :variant="metricVariants[i % metricVariants.length]"
                            :label="kpi.name"
                            :amount="formatSummary(kpi)"
                        />
                    </div>

                    <!-- Chart cards come straight from chartCardsFor() — no chart data is
                         re-derived here (chart-spec.ts and DashboardChartCard own that). -->
                    <DashboardChartGrid>
                        <DashboardChartCard
                            v-for="chart in activeCharts"
                            :key="chart.id"
                            :id="chart.id"
                            :title="chart.title"
                            :caption="chart.caption"
                            :kind="chart.kind"
                            :labels="chart.labels"
                            :datasets="chart.datasets"
                            :data-span="
                                chart.width === 'full' ? 'full' : undefined
                            "
                        />
                    </DashboardChartGrid>
                </template>
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
import { computed, ref, watch } from "vue";
import {
    MpFlex,
    MpText,
    MpSelect,
    MpFormControl,
    MpFormLabel,
    MpSkeleton,
    MpImage,
    css,
} from "@mekari/pixel3";
import { MpTabs, MpTabList, MpTab } from "@mekari/pixel3";
import SummaryBox from "@/components/SummaryBox.vue";
import DashboardChartGrid from "@/components/DashboardChartGrid.vue";
import DashboardChartCard from "@/components/DashboardChartCard.vue";
import {
    categoryCaption,
    chartCardsFor,
    nextTabIndex,
    orderedCategories,
    useGriQuantitativeInsight,
    useStrategicInsightFilterState,
} from "@/services/strategic-insight";

const metricVariants = ["blue", "green", "orange", "gray"] as const;

const tabScrollClass = css({ overflowX: "auto" });

const filterState = useStrategicInsightFilterState();
const { data, isLoading } = useGriQuantitativeInsight(filterState.params);

const categories = computed(() => orderedCategories(data.value ?? []));

const activeIndex = ref(0);

// A filter change can shrink or reorder the category list. Resolving the new index is
// nextTabIndex()'s job (tested in tab-index.check.ts) — it follows the selected category by
// id so a reorder or a shrink keeps the user on the tab they were reading, instead of
// silently swapping in a different category that happens to sit at the same slot.
watch(categories, (list) => {
    const previous = activeCategoryId.value;
    activeIndex.value = nextTabIndex(
        list.map((c) => c.category_id.id),
        previous,
        activeIndex.value,
    );
});

const activeCategory = computed(() => categories.value[activeIndex.value]);

// Tracked separately from the index because the watcher above needs the id from BEFORE the
// list changed, and activeCategory is already recomputed against the new list by then.
const activeCategoryId = ref<string | null>(null);
watch(
    activeCategory,
    (category) => {
        activeCategoryId.value = category?.category_id.id ?? null;
    },
    { immediate: true },
);

const activeCaption = computed(() =>
    activeCategory.value ? categoryCaption(activeCategory.value) : "",
);

const activeCharts = computed(() =>
    activeCategory.value ? chartCardsFor(activeCategory.value) : [],
);

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
</script>
