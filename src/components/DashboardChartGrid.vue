<script setup lang="ts">
import { css } from "@mekari/pixel3";

// Responsive 1→2 column grid for dashboard chart cards.
// Convention: a direct child that should span the full width sets
// `data-span="full"` on itself (or its outer wrapper element), e.g.
//   <DashboardChartCard data-span="full" ... />
// The grid's own CSS targets that attribute so no extra wrapper component
// is required.
const gridClass = css({
    display: "grid",
    gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
    gap: "4",
    "& > [data-span='full']": {
        gridColumn: { base: "auto", md: "1 / -1" },
    },
});
</script>

<template>
    <div :class="gridClass">
        <slot />
    </div>
</template>
