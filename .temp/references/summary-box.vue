<script setup lang="ts">
import { sva } from "@mekari/pixel3-styled-system/css";
import { MpText, MpTooltip, MpSpinner, MpIcon } from "@mekari/pixel3";
import { useSlots } from "vue";

const props = defineProps({
    as: { type: String, default: "div" },
    id: [String, Number],
    isLoading: Boolean,
    variant: [String, Number],
    label: { type: [String], default: "Label" },
    labelSrc: String,
    badge: [String, Number],
    caption: { type: [String, Number], default: "Total" },
    amount: { type: [String, Number], default: 0 },
    isFilter: Boolean,
    isActive: Boolean,
    isHoverable: Boolean,
});

const slots = useSlots();
const hasSlot = (name: string) => {
    return !!slots[name];
};

const summaryBoxStyle = sva({
    slots: [
        "root",
        "topContent",
        "badge",
        "bottomContent",
        "bottomContentWrapper",
        "loadingWrapper",
        "filterWrapper",
        "filterIcon",
    ],
    base: {
        root: {
            display: "flex",
            flexDirection: "column",
            borderWidth: "1px",
            transition: "all 0.1s ease, box-shadow 0.5s ease",
            rounded: "md",
        },
        topContent: {
            display: "flex",
            position: "relative",
            px: 3,
            py: 2,
            justifyContent: "space-between",
            alignItems: "center",
            roundedTop: "md",
        },
        badge: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "1.5",
            py: "0.5",
            rounded: "16",
            color: "text.inverse.static",
            fontFamily: "body",
            fontWeight: "regular",
            letterSpacing: "normal",
            height: "5",
        },
        bottomContent: {
            position: "relative",
            bg: "background.neutral",
            roundedBottom: "md",
            width: "full",
        },
        bottomContentWrapper: {
            flexDirection: "column",
            px: 3,
            py: 2,
        },
        loadingWrapper: {
            position: "absolute",
            top: "0",
            width: "full",
            height: "full",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
        },
        filterWrapper: {
            position: "absolute",
            top: "5",
            right: "3",
        },
        filterIcon: {
            transition: "all 0.2s ease",
            opacity: "0",
            transform: "scale(.5)",
            _active: {
                opacity: "100",
                transform: "scale(1)",
            },
            _groupHover: {
                opacity: "100",
                transform: "scale(1)",
            },
        },
    },
    variants: {
        color: {
            orange: {
                root: {
                    "&[data-hoverabale=true]": {
                        _hover: {
                            borderColor: "border.warning",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "border.warning",
                    },
                    "&[data-active=false]": {
                        borderColor: "border.warning",
                    },
                },
                topContent: {
                    bg: "background.warning",
                },
                badge: {
                    bg: "background.warning.bold",
                },
            },
            green: {
                root: {
                    "&[data-hoverabale=true]": {
                        _hover: {
                            borderColor: "green.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "green.700",
                    },
                    "&[data-active=false]": {
                        borderColor: "orange.400",
                    },
                },
                topContent: {
                    bg: "background.success",
                },
                badge: {
                    bg: "background.success.bold",
                },
            },
            red: {
                root: {
                    "&[data-hoverabale=true]": {
                        _hover: {
                            borderColor: "red.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "red.700",
                    },
                    "&[data-active=false]": {
                        borderColor: "red.400",
                    },
                },
                topContent: {
                    bg: "background.danger",
                },
                badge: {
                    bg: "background.danger.bold",
                },
            },
            blue: {
                root: {
                    "&[data-hoverabale=true]": {
                        _hover: {
                            borderColor: "blue.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "blue.700",
                    },
                    "&[data-active=false]": {
                        borderColor: "blue.400",
                    },
                },
                topContent: {
                    bg: "background.brand",
                },
                badge: {
                    bg: "background.brand.bold",
                },
            },
            gray: {
                root: {
                    "&[data-hoverabale=true]": {
                        _hover: {
                            borderColor: "gray.400",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "gray.400",
                    },
                    "&[data-active=false]": {
                        borderColor: "gray.100",
                    },
                },
                topContent: {
                    bg: "background.neutral.subtle",
                },
                badge: {
                    bg: "background.neutral.bold",
                },
            },
        },
    },
});

const {
    root,
    topContent,
    bottomContent,
    bottomContentWrapper,
    badge: badgeStyle,
    loadingWrapper,
    filterWrapper,
    filterIcon,
} = summaryBoxStyle({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    color: props.variant as any,
});
</script>

<template>
    <component
        :is="props.as"
        data-slot="root"
        data-active="true"
        :class="['group', root]"
        :style="{
            cursor: props.isHoverable || props.isFilter ? 'pointer' : '',
        }"
        v-bind="$attrs"
    >
        <!-- Top Content -->
        <div data-slot="top-content" :class="topContent">
            <div w="calc(100% - 32px)">
                <img
                    v-if="props.labelSrc"
                    :style="{ height: '20px', width: 'auto' }"
                    :src="labelSrc"
                    alt=""
                />

                <div v-else>
                    <MpTooltip :label="label">
                        <MpText weight="semiBold" isTruncated>
                            {{ label }}
                        </MpText>
                    </MpTooltip>
                </div>
            </div>

            <div
                v-if="badge && !props.isLoading"
                data-slot="badge"
                :class="badgeStyle"
            >
                {{ isLoading ? "" : badge }}
            </div>

            <mp-box v-if="hasSlot('top-right-content')">
                <slot name="top-right-content" />
            </mp-box>
        </div>

        <!-- Bottom Content -->
        <div data-slot="bottom-content" :class="bottomContent">
            <div
                :class="bottomContentWrapper"
                :style="{
                    visibility: props.isLoading ? 'hidden' : 'visible',
                }"
            >
                <MpText color="gray.600" size="label-small">
                    {{ caption }}
                </MpText>
                <MpText as="h2" size="h2">
                    {{ amount }}
                </MpText>

                <div
                    v-if="props.isFilter || hasSlot('bottom-right-content')"
                    :class="filterWrapper"
                >
                    <div v-if="props.isFilter">
                        <MpTooltip label="Filter" placement="bottom">
                            <MpIcon
                                :data-active="props.isActive || undefined"
                                name="filter"
                                :variant="
                                    props.isActive ? 'duotone' : 'outline'
                                "
                                :class="filterIcon"
                            />
                        </MpTooltip>
                    </div>

                    <slot v-else name="bottom-right-content" />
                </div>
            </div>

            <div
                v-if="isLoading"
                data-slot="loading-wrapper"
                :class="loadingWrapper"
            >
                <MpSpinner size="md" />
            </div>
        </div>
    </component>
</template>
