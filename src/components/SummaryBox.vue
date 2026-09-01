<script setup lang="ts">
import { sva } from "@mekari/pixel3-styled-system/css";
import { MpText, MpTooltip, MpSpinner, MpIcon } from "@mekari/pixel3";
import { useSlots } from "vue";

const props = defineProps({
    as: { type: String, default: "div" },
    id: [String, Number],
    isLoading: Boolean,
    variant: { type: [String, Number], default: "gray" },
    label: { type: [String], default: "Label" },
    labelSrc: String,
    badge: [String, Number],
    caption: { type: [String, Number], default: "" },
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
            width: "full",
            minWidth: "0",
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
            color: "white",
            fontFamily: "body",
            fontWeight: "regular",
            letterSpacing: "normal",
            height: "5",
        },
        bottomContent: {
            position: "relative",
            bg: "white",
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
                    borderColor: "orange.400",
                    "&[data-hoverable=true]": {
                        _hover: {
                            borderColor: "orange.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "orange.700",
                    },
                },
                topContent: {
                    bg: "orange.50",
                    color: "orange.700",
                    // borderBottomWidth: "1px",
                    borderBottomColor: "orange.400",
                },
                badge: {
                    bg: "orange.500",
                },
            },
            green: {
                root: {
                    borderColor: "green.400",
                    "&[data-hoverable=true]": {
                        _hover: {
                            borderColor: "green.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "green.700",
                    },
                },
                topContent: {
                    bg: "green.50",
                    color: "green.700",
                    // borderBottomWidth: "1px",
                    borderBottomColor: "green.400",
                },
                badge: {
                    bg: "green.500",
                },
            },
            red: {
                root: {
                    borderColor: "red.400",
                    "&[data-hoverable=true]": {
                        _hover: {
                            borderColor: "red.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "red.700",
                    },
                },
                topContent: {
                    bg: "red.50",
                    color: "red.700",
                    // borderBottomWidth: "1px",
                    borderBottomColor: "red.400",
                },
                badge: {
                    bg: "red.500",
                },
            },
            blue: {
                root: {
                    borderColor: "blue.400",
                    "&[data-hoverable=true]": {
                        _hover: {
                            borderColor: "blue.700",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "blue.700",
                    },
                },
                topContent: {
                    bg: "blue.50",
                    color: "blue.700",
                    // borderBottomWidth: "1px",
                    borderBottomColor: "blue.400",
                },
                badge: {
                    bg: "blue.500",
                },
            },
            gray: {
                root: {
                    borderColor: "gray.100",
                    "&[data-hoverable=true]": {
                        _hover: {
                            borderColor: "gray.400",
                            boxShadow: "lg",
                        },
                    },
                    "&[data-active=true]": {
                        borderColor: "gray.400",
                    },
                },
                topContent: {
                    bg: "gray.50",
                    color: "gray.600",
                    // borderBottomWidth: "1px",
                    borderBottomColor: "gray.100",
                },
                badge: {
                    bg: "gray.600",
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

// MpText sets its own color class, so the label can't inherit the tinted
// header's color — hand it the matching token explicitly.
const labelColor =
    {
        orange: "orange.700",
        green: "green.700",
        red: "red.700",
        blue: "blue.700",
        gray: "gray.600",
    }[String(props.variant)] ?? "gray.600";
</script>

<template>
    <component
        :is="props.as"
        data-slot="root"
        :data-active="props.isActive"
        :data-hoverable="props.isHoverable || undefined"
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
                        <MpText
                            weight="semiBold"
                            :color="labelColor"
                            isTruncated
                        >
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
                <MpText v-if="caption" color="gray.600" size="label-small">
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
