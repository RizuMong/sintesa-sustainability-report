<template>
    <MpFlex
        direction="column"
        backgroundColor="background.surface"
        minHeight="100vh"
    >
        <MpFlex
            justifyContent="space-between"
            alignItems="center"
            paddingX="24px"
            paddingY="24px"
        >
            <MpFlex direction="row" gap="3">
                <MpButton
                    variant="ghost"
                    left-icon="arrows-left"
                    aria-label="Back"
                    @click="router.back()"
                />
                <MpFlex direction="column" alignItems="flex-start">
                    <MpButton
                        variant="textLink"
                        as="a"
                        href="#/evaluate-gri-quantitative/requestor"
                    >
                        Evaluate GRI Quantitative
                    </MpButton>
                    <MpFlex alignItems="center" gap="3">
                        <MpText as="h1" size="h1">{{
                            detail?.template_id.name ?? "Loading..."
                        }}</MpText>
                        <MpBadge
                            v-if="detail"
                            for="tableStatus"
                            :type="
                                statusBadgeType[detail.flow_status] ??
                                'information'
                            "
                        >
                            {{ detail.flow_status }}
                        </MpBadge>
                    </MpFlex>
                </MpFlex>
            </MpFlex>
            <MpButton
                v-if="detail && !readOnly && detail.flow_status === 'draft'"
                variant="ghost"
                left-icon="delete"
                @click="isConfirmingDelete = true"
            >
                Delete
            </MpButton>
        </MpFlex>

        <MpFlex
            direction="column"
            flex="1"
            gap="6"
            backgroundColor="background.stage"
            borderTopWidth="1px"
            borderLeftWidth="1px"
            borderColor="border.default"
            roundedTopLeft="md"
            padding="24px"
        >
            <MpFlex v-if="isLoading" direction="column" gap="2" flex="1">
                <MpSkeleton
                    v-for="i in 3"
                    :key="i"
                    height="56px"
                    rounded="md"
                />
            </MpFlex>

            <MpFlex v-else-if="detail" gap="6" alignItems="flex-start">
                <MpFlex direction="column" gap="6" flex="2" minWidth="0">
                    <MpFlex
                        v-if="
                            detail.flow_status === 'rejected' && rejectionNote
                        "
                        direction="column"
                        gap="1"
                        padding="16px"
                        backgroundColor="background.surface"
                        borderWidth="1px"
                        borderColor="border.default"
                        rounded="md"
                    >
                        <MpFlex alignItems="center" gap="2">
                            <MpBadge for="tableStatus" type="critical"
                                >rejected</MpBadge
                            >
                            <MpText size="label" weight="semiBold"
                                >Reviewer note</MpText
                            >
                        </MpFlex>
                        <MpText size="label">{{ rejectionNote }}</MpText>
                    </MpFlex>

                    <MpFlex gap="6">
                        <MpFormControl id="detail-entity" is-disabled flex="1">
                            <MpFormLabel>Entity</MpFormLabel>
                            <MpInput
                                :model-value="detail.entity_id.name"
                                is-disabled
                            />
                        </MpFormControl>
                        <MpFormControl id="detail-period" is-disabled flex="1">
                            <MpFormLabel>Period</MpFormLabel>
                            <MpInput
                                :model-value="String(detail.period_id.name)"
                                is-disabled
                            />
                        </MpFormControl>
                        <MpFormControl
                            id="detail-template"
                            is-disabled
                            flex="1"
                        >
                            <MpFormLabel>Template</MpFormLabel>
                            <MpInput
                                :model-value="detail.template_id.name"
                                is-disabled
                            />
                        </MpFormControl>
                    </MpFlex>

                    <!-- items grouped under their category heading -->
                    <MpFlex
                        v-for="group in groups"
                        :key="group.id"
                        direction="column"
                        gap="4"
                    >
                        <MpText size="h2" weight="semiBold">{{
                            group.name
                        }}</MpText>

                        <MpFlex
                            v-for="item in group.items"
                            :key="item.id"
                            direction="column"
                            gap="3"
                        >
                            <MpText size="h3" weight="semiBold">{{
                                itemTitle(item)
                            }}</MpText>

                            <MpTableContainer>
                                <MpTable>
                                    <MpTableHead>
                                        <MpTableRow>
                                            <MpTableCell
                                                v-for="col in item.columns"
                                                :key="col.key"
                                                scope="col"
                                                >{{ col.name }}</MpTableCell
                                            >
                                            <MpTableCell
                                                v-for="metric in item.metrics"
                                                :key="metric.key"
                                                scope="col"
                                            >
                                                {{ metric.name }}
                                            </MpTableCell>
                                        </MpTableRow>
                                    </MpTableHead>
                                    <MpTableBody>
                                        <MpTableRow
                                            v-for="row in item.rows"
                                            :key="row.sequence"
                                        >
                                            <MpTableCell
                                                v-for="col in item.columns"
                                                :key="col.key"
                                                as="td"
                                                scope="row"
                                            >
                                                {{ row.labels[col.key] }}
                                            </MpTableCell>
                                            <MpTableCell
                                                v-for="metric in item.metrics"
                                                :key="metric.key"
                                                as="td"
                                                scope="row"
                                            >
                                                <DynamicFieldInput
                                                    :input_type="
                                                        metric.input_type
                                                    "
                                                    :unit="metric.unit?.name"
                                                    :model-value="
                                                        cells[
                                                            cellId(
                                                                item.id,
                                                                row.sequence,
                                                                metric.key,
                                                            )
                                                        ]
                                                    "
                                                    :disabled="readOnly"
                                                    @update:model-value="
                                                        (
                                                            v:
                                                                | string
                                                                | number
                                                                | boolean
                                                                | null,
                                                        ) =>
                                                            (cells[
                                                                cellId(
                                                                    item.id,
                                                                    row.sequence,
                                                                    metric.key,
                                                                )
                                                            ] = v)
                                                    "
                                                />
                                            </MpTableCell>
                                        </MpTableRow>
                                    </MpTableBody>
                                </MpTable>
                            </MpTableContainer>

                            <MpFormControl
                                v-if="item.evidence_attachment === 'Required'"
                                :id="`evidence-${item.id}`"
                                is-required
                            >
                                <MpFormLabel
                                    >Evidence (pdf, jpg, png, docx, csv — max
                                    4MB)</MpFormLabel
                                >
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.docx,.csv"
                                    :disabled="readOnly"
                                    @change="
                                        (e) => onEvidenceChange(item.id, e)
                                    "
                                />
                                <MpFormErrorMessage
                                    v-if="evidenceErrors[item.id]"
                                    >{{
                                        evidenceErrors[item.id]
                                    }}</MpFormErrorMessage
                                >
                                <MpText
                                    v-else-if="evidenceFiles[item.id]"
                                    size="label-small"
                                    color="text.secondary"
                                >
                                    {{ evidenceFiles[item.id]?.name }}
                                </MpText>
                            </MpFormControl>
                        </MpFlex>
                    </MpFlex>

                    <!-- actions sit below the form, matching the Officeless submission screen -->
                    <MpFlex v-if="!readOnly" gap="3" paddingTop="2">
                        <MpButton
                            :is-disabled="
                                !canSubmitForm || isSaving || isSubmitting
                            "
                            @click="submit"
                            >Submit</MpButton
                        >
                        <MpButton
                            variant="secondary"
                            :is-disabled="isSaving"
                            @click="save"
                            >Update</MpButton
                        >
                    </MpFlex>
                </MpFlex>

                <!-- approval line — moved here from the Review & Approval table's inline expand row;
             read-only fields follow report-plan-realization/DetailPage.vue (MpFormControl + MpText) -->
                <MpFlex direction="column" gap="6" flex="1" minWidth="0">
                    <MpText as="h2" size="h2" weight="semiBold"
                        >Approval line</MpText
                    >

                    <MpText
                        v-if="!approvalLogs.length"
                        size="label"
                        color="text.secondary"
                        >No approval stages yet.</MpText
                    >

                    <MpTimeline v-else>
                        <MpTimelineAccordion
                            v-for="(log, i) in approvalLogs"
                            :key="log.stage_order"
                            :label="`Stage ${log.stage_order} · ${log.approval_type}`"
                            :position="
                                i === approvalLogs.length - 1
                                    ? 'last'
                                    : undefined
                            "
                            is-open
                        >
                            <template #sub-content>
                                <MpFlex
                                    alignItems="center"
                                    gap="2"
                                    paddingBottom="3"
                                >
                                    <MpBadge
                                        for="tableStatus"
                                        :type="
                                            statusBadgeType[log.status] ??
                                            'information'
                                        "
                                    >
                                        {{ log.status }}
                                    </MpBadge>
                                    <MpText
                                        v-if="formatDecidedAt(log)"
                                        size="label-small"
                                        color="text.secondary"
                                    >
                                        {{ formatDecidedAt(log) }}
                                    </MpText>
                                </MpFlex>
                            </template>

                            <MpTimelineItem
                                v-for="a in log.approvers"
                                :key="a.user.id"
                                :status="timelineStatus[a.action] ?? 'next'"
                            >
                                <MpTimelineTitle>
                                    <MpText weight="semiBold">{{
                                        a.action
                                    }}</MpText>
                                </MpTimelineTitle>
                                <MpTimelineCaption
                                    >{{ a.user.name }} ({{
                                        a.position.name
                                    }})</MpTimelineCaption
                                >
                                <MpTimelineContent v-if="a.acted_at">
                                    <MpFlex
                                        direction="column"
                                        gap="1"
                                        paddingBottom="4"
                                    >
                                        <MpText
                                            v-if="a.acted_at"
                                            size="label-small"
                                            color="text.secondary"
                                        >
                                            {{
                                                new Date(
                                                    a.acted_at,
                                                ).toLocaleString("sv-SE")
                                            }}
                                        </MpText>
                                        <MpText v-if="a.notes" size="label"
                                            >"{{ a.notes }}"</MpText
                                        >
                                    </MpFlex>
                                </MpTimelineContent>
                            </MpTimelineItem>
                        </MpTimelineAccordion>
                    </MpTimeline>
                </MpFlex>
            </MpFlex>
        </MpFlex>

        <ConfirmDeleteModal
            :is-open="isConfirmingDelete"
            title="Delete this submission?"
            message="This will permanently remove the draft submission. This action cannot be undone."
            @close="isConfirmingDelete = false"
            @confirm="confirmDelete"
        />
    </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    MpFlex,
    MpText,
    MpButton,
    MpBadge,
    MpInput,
    MpFormControl,
    MpFormLabel,
    MpFormErrorMessage,
    MpSkeleton,
    MpTable,
    MpTableHead,
    MpTableBody,
    MpTableRow,
    MpTableCell,
    MpTableContainer,
    MpTimeline,
    MpTimelineItem,
    MpTimelineTitle,
    MpTimelineCaption,
    MpTimelineContent,
    MpTimelineAccordion,
} from "@mekari/pixel3";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import DynamicFieldInput from "@/components/DynamicFieldInput.vue";
import {
    isAllowedEvidenceFile,
    canSubmit as canSubmitEvidence,
} from "@/lib/dynamic-validation";
import {
    useGetEvaluateGriQuantitativeDetail,
    useUpdateEvaluateGriQuantitative,
    useSubmitEvaluateGriQuantitative,
    useDeleteEvaluateGriQuantitative,
    isReadOnly,
    latestRejectionNote,
    groupItemsByCategory,
    fromSubmissionValues,
    toSubmissionValue,
    cellKey,
} from "@/services/evaluate-gri-quantitative";

const statusBadgeType: Partial<
    Record<
        SubmissionFlowStatus | ApprovalStatus,
        "announcement" | "information" | "completed" | "critical"
    >
> = {
    draft: "announcement",
    submitted: "information",
    approved: "completed",
    rejected: "critical",
    cancelled: "announcement",
    WAITING_APPROVAL: "information",
    PENDING: "information",
    APPROVE: "completed",
    APPROVED: "completed",
    REJECTED: "critical",
    CANCEL: "announcement",
};

// MpTimelineItem picks its own dot icon/color from `status` (see pixel3-timeline separator)
const timelineStatus: Record<
    ApprovalStatus,
    | "approved"
    | "canceled"
    | "need-approval"
    | "rejected"
    | "created"
    | "submitted"
    | "next"
> = {
    WAITING_APPROVAL: "need-approval",
    PENDING: "need-approval",
    APPROVE: "approved",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCEL: "canceled",
};

function formatDecidedAt(log: ApprovalLog) {
    const acted = log.approvers
        .map((a) => a.acted_at)
        .filter((v): v is number => v != null);
    const value = log.decided_at ?? (acted.length ? Math.max(...acted) : null);
    return value ? new Date(value).toLocaleString("sv-SE") : null;
}

const route = useRoute();
const router = useRouter();
const id = computed(() => route.query.id as string | undefined);

const { data: detail, isLoading } = useGetEvaluateGriQuantitativeDetail(id);

const readOnly = computed(
    () => !detail.value || isReadOnly(detail.value.flow_status),
);
const approvalLogs = computed(() =>
    [...(detail.value?.approval_logs ?? [])].sort(
        (a, b) => a.stage_order - b.stage_order,
    ),
);
const rejectionNote = computed(() =>
    detail.value ? latestRejectionNote(detail.value.approval_logs) : null,
);

const items = computed(() => detail.value?.items ?? []);
const groups = computed(() => groupItemsByCategory(items.value));

// the API answers no title of its own on an item — see the ponytail note on EvaluateGriQuantitativeItem
function itemTitle(item: EvaluateGriQuantitativeItem) {
    return (
        item.description ??
        item.name ??
        item.code ??
        item.parent_id?.name ??
        "—"
    );
}

// one editable cell per (item, row, metric); kept flat and outside the query cache so the form
// never mutates fetched data in place
const cells = reactive<Record<string, string | number | boolean | null>>({});

function cellId(itemId: string, rowSequence: number, metricKey: string) {
    return `${itemId}:${cellKey(rowSequence, metricKey)}`;
}

watch(
    items,
    (next) => {
        for (const key of Object.keys(cells)) delete cells[key];
        for (const item of next) {
            const saved = fromSubmissionValues(item.values);
            for (const [key, value] of Object.entries(saved))
                cells[`${item.id}:${key}`] = value;
        }
    },
    { immediate: true },
);

// evidence_attachment === 'Required' — file uploader per item, Submit disabled until attached (§4)
// ponytail: no confirmed evidence-upload endpoint in api/Evaluate GRI - Quantitative/*.yml (create/
// update only take template_id/period_id/entity_id/items, no file field) — the file is validated and
// gates Submit client-side but isn't sent anywhere yet. Wire it once an upload endpoint exists.
const evidenceFiles = reactive<Record<string, File | undefined>>({});
const evidenceErrors = reactive<Record<string, string | undefined>>({});

function onEvidenceChange(itemId: string, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!isAllowedEvidenceFile(file.name, file.size)) {
        evidenceErrors[itemId] =
            "File must be pdf, jpg, png, docx or csv, max 4MB.";
        evidenceFiles[itemId] = undefined;
        return;
    }
    evidenceErrors[itemId] = undefined;
    evidenceFiles[itemId] = file;
}

const canSubmitForm = computed(() =>
    items.value.every((item) =>
        canSubmitEvidence(
            item.evidence_attachment ?? "Optional",
            Boolean(evidenceFiles[item.id]),
        ),
    ),
);

const updateMutation = useUpdateEvaluateGriQuantitative();
const submitMutation = useSubmitEvaluateGriQuantitative();
const deleteMutation = useDeleteEvaluateGriQuantitative();
const isSaving = computed(() => updateMutation.isPending.value);
const isSubmitting = computed(() => submitMutation.isPending.value);
const isConfirmingDelete = ref(false);

async function save() {
    if (!detail.value) return;
    await updateMutation.mutateAsync({
        id: detail.value.id,
        template_id: detail.value.template_id,
        period_id: detail.value.period_id,
        entity_id: detail.value.entity_id,
        items: items.value.map((item) => ({
            item_id: item.id,
            values: item.rows.flatMap((row) =>
                item.metrics.map((metric) =>
                    toSubmissionValue(
                        metric,
                        row.sequence,
                        cells[cellId(item.id, row.sequence, metric.key)],
                    ),
                ),
            ),
        })),
    });
}

async function submit() {
    if (!detail.value || !canSubmitForm.value) return;
    await save();
    await submitMutation.mutateAsync(detail.value.id);
}

async function confirmDelete() {
    if (!detail.value) return;
    await deleteMutation.mutateAsync(detail.value.id);
    isConfirmingDelete.value = false;
    router.push(
        route.query.from === "approval"
            ? "/evaluate-gri-quantitative/approval"
            : "/evaluate-gri-quantitative/requestor",
    );
}
</script>
