<script setup lang="ts">
import { computed } from "vue";
import { MpFlex, MpText, MpChart } from "@mekari/pixel3";

type ChartKind =
    "bar" | "bar-stacked" | "bar-horizontal" | "line" | "doughnut" | "pie";

interface ChartDataset {
    label: string;
    data: number[];
}

const props = withDefaults(
    defineProps<{
        id: string;
        title: string;
        caption?: string;
        kind: ChartKind;
        labels: string[];
        datasets: ChartDataset[];
        height?: string;
    }>(),
    {
        caption: "",
        height: "220px",
    },
);

// Maps the presentational `kind` prop onto MpChart's verified `type` + boolean
// flags (see docs/dashboard-gri-quantitative-mockup-spec.md section 3 for the
// prop list this was checked against).
const chartType = computed(() => {
    switch (props.kind) {
        case "bar-stacked":
        case "bar-horizontal":
            return "bar";
        case "doughnut":
            return "doughnut";
        case "pie":
            return "pie";
        case "line":
            return "line";
        default:
            return "bar";
    }
});

const isStacked = computed(() => props.kind === "bar-stacked");
const isHorizontal = computed(() => props.kind === "bar-horizontal");
const isArea = computed(
    () => props.kind === "line" && props.datasets.length === 1,
);

const isCategorical = computed(() => {
    if (
        props.kind === "pie" ||
        props.kind === "doughnut" ||
        props.kind === "bar-horizontal"
    ) {
        return true;
    }
    return props.kind === "bar" && props.datasets.length === 1;
});

const isShowLegend = computed(
    () =>
        props.kind === "pie" ||
        props.kind === "doughnut" ||
        props.datasets.length > 1,
);

const chartData = computed(() => ({
    labels: props.labels,
    datasets: props.datasets,
}));

// Print-ready / zero-hover text mirror (matches the pattern already used in
// GriQuantitativePage.vue / SdgPage.vue): every value the chart plots is
// repeated here as plain text, so the numbers are readable with no mouse and
// on a printed page.
const seriesLines = computed(() => {
    if (isCategorical.value) {
        const series = props.datasets[0];
        if (!series) return [];
        const pairs = props.labels
            .map((label, i) => {
                const value = series.data[i];
                if (value === undefined) return null;
                return `${label}: ${value.toLocaleString("en-US")}`;
            })
            .filter((v): v is string => v !== null);
        return [pairs.join(" · ")];
    }

    return props.datasets.map((series) => {
        const pairs = props.labels
            .map((label, i) => {
                const value = series.data[i];
                if (value === undefined) return null;
                return `${label}: ${value.toLocaleString("en-US")}`;
            })
            .filter((v): v is string => v !== null);
        return `${series.label}: ${pairs.join(" · ")}`;
    });
});
</script>

<template>
    <MpFlex
        data-card="chart"
        direction="column"
        gap="3"
        height="100%"
        backgroundColor="background.surface"
        borderWidth="1px"
        borderColor="gray.100"
        rounded="md"
        padding="20px"
    >
        <MpFlex
            direction="column"
            gap="1"
            backgroundColor="gray.25"
            rounded="sm"
            padding="12px"
        >
            <MpText as="h2" size="h3" weight="semiBold">{{
                props.title
            }}</MpText>
            <MpText
                v-if="props.caption"
                size="label-small"
                color="text.secondary"
            >
                {{ props.caption }}
            </MpText>
        </MpFlex>

        <!-- MpChart's own `title` is deliberately blank: the card header above already
             renders the title in the app's type scale, and passing it here too printed
             every chart title twice. Caught by screenshot review, not by any structural
             check — the DOM was "correct", it just read wrong. -->
        <MpChart
            :id="props.id"
            title=""
            :type="chartType"
            :data="chartData"
            width-container="100%"
            width-chart="100%"
            :height-chart="props.height"
            :height-container="props.height"
            :is-stacked="isStacked"
            :is-horizontal="isHorizontal"
            :is-area="isArea"
            :is-show-legend="isShowLegend"
        />

        <MpFlex direction="column" gap="1">
            <MpText
                v-for="(line, i) in seriesLines"
                :key="i"
                size="label-small"
                color="text.secondary"
            >
                {{ line }}
            </MpText>
        </MpFlex>
    </MpFlex>
</template>
