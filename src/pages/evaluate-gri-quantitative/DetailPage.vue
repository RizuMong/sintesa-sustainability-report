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
                        v-if="approverNote && !fromApproval && !readOnly"
                        direction="column"
                        gap="1"
                        padding="16px"
                        backgroundColor="background.surface"
                        borderWidth="1px"
                        borderColor="border.default"
                        rounded="md"
                    >
                        <MpFlex alignItems="center" gap="2">
                            <MpBadge
                                for="tableStatus"
                                :type="noteIsRevision ? 'warning' : 'critical'"
                                >{{
                                    noteIsRevision
                                        ? "revision requested"
                                        : "rejected"
                                }}</MpBadge
                            >
                            <MpText size="label" weight="semiBold">{{
                                noteIsRevision
                                    ? "Revision requested"
                                    : "Reviewer note"
                            }}</MpText>
                        </MpFlex>
                        <MpText size="label">{{ approverNote.note }}</MpText>
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
                                                v-if="isSection(row)"
                                                as="td"
                                                :class="sectionRow"
                                                :colspan="
                                                    item.columns.length +
                                                    item.metrics.length
                                                "
                                            >
                                                <MpText weight="semiBold">{{
                                                    row.name
                                                }}</MpText>
                                            </MpTableCell>
                                            <template v-else>
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
                                                        :unit="
                                                            resolveUnit(
                                                                row,
                                                                metric,
                                                                item.unit_mode,
                                                                item.unit,
                                                            )?.name
                                                        "
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
                                            </template>
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

                    <!-- GROU-659 — sent submissions are read-only, so this is the requestor's only
                         action: pull it back out of approval and return it to draft -->
                    <MpFlex
                        v-if="canReviseSubmission"
                        gap="3"
                        paddingTop="2"
                    >
                        <MpButton
                            variant="secondary"
                            :is-disabled="isRevising"
                            :is-loading="isRevising"
                            @click="isConfirmingRevise = true"
                            >Revise Submission</MpButton
                        >
                    </MpFlex>

                    <!-- approver-facing actions — only on rows opened from the Review & Approval queue -->
                    <MpFlex v-if="canAct" gap="3" paddingTop="2">
                        <MpButton
                            :is-disabled="isApproving || isRequestingRevision"
                            :is-loading="isApproving"
                            @click="approve"
                            >Approve</MpButton
                        >
                        <MpButton
                            variant="secondary"
                            :is-disabled="isApproving || isRequestingRevision"
                            @click="openRequestRevision"
                            >Request Revision</MpButton
                        >
                        <MpButton
                            variant="danger"
                            :is-disabled="isApproving || isRequestingRevision"
                            @click="openReject"
                            >Reject</MpButton
                        >
                    </MpFlex>
                </MpFlex>

                <!-- approval line — moved here from the Review & Approval table's inline expand row;
             read-only fields follow report-plan-realization/DetailPage.vue (MpFormControl + MpText) -->
                <MpFlex direction="column" gap="6" flex="1" minWidth="0">
                    <MpText as="h2" size="h2" weight="semiBold"
                        >Approval line</MpText
                    >

                    <MpTimeline>
                        <MpTimelineItem status="submitted">
                            <MpTimelineTitle>
                                <MpText weight="semiBold">
                                    Requested by
                                    {{ requestedBy }}
                                </MpText>
                            </MpTimelineTitle>
                            <MpTimelineCaption>
                                {{
                                    formatStamp(
                                        detail.submitted_at ??
                                            detail.created_at,
                                    )
                                }}
                            </MpTimelineCaption>
                        </MpTimelineItem>

                        <MpTimelineItem
                            v-for="(log, i) in approvalLogs"
                            :key="log.stage_order"
                            :status="timelineStatus[log.status] ?? 'next'"
                            :position="
                                i === approvalLogs.length - 1
                                    ? 'last'
                                    : undefined
                            "
                        >
                            <MpTimelineContent>
                                <MpFlex
                                    direction="column"
                                    borderWidth="1px"
                                    borderColor="border.default"
                                    rounded="md"
                                    overflow="hidden"
                                    marginBottom="4"
                                >
                                    <MpAccordion>
                                        <MpAccordionItem
                                            is-default-open
                                            iconPosition="start"
                                        >
                                            <MpAccordionHeader
                                                :class="
                                                    css({
                                                        backgroundColor:
                                                            'background.surface',
                                                        paddingInline: '2',
                                                        paddingBottom: '2',
                                                    })
                                                "
                                            >
                                                <MpAccordionIcon
                                                    name="chevrons-right"
                                                    width="16"
                                                    height="16"
                                                />

                                                <MpFlex
                                                    direction="column"
                                                    gap="1"
                                                >
                                                    <MpText weight="semiBold">{{
                                                        log.approval_type
                                                    }}</MpText>
                                                    <MpText
                                                        size="label-small"
                                                        color="text.secondary"
                                                        weight="semiBold"
                                                        >{{
                                                            stageRule(log)
                                                        }}</MpText
                                                    >
                                                </MpFlex>
                                            </MpAccordionHeader>
                                            <MpAccordionPanel
                                                :class="
                                                    css({ paddingInline: '2' })
                                                "
                                            >
                                                <MpTimeline>
                                                    <MpTimelineItem
                                                        v-for="a in log.approvers"
                                                        :key="a.user.id"
                                                        :status="
                                                            timelineStatus[
                                                                a.action
                                                            ] ?? 'next'
                                                        "
                                                        :icon="
                                                            isNotRequired(
                                                                log,
                                                                a,
                                                            )
                                                                ? 'time'
                                                                : undefined
                                                        "
                                                        :icon-color="
                                                            isNotRequired(
                                                                log,
                                                                a,
                                                            )
                                                                ? 'icon.subtle'
                                                                : undefined
                                                        "
                                                    >
                                                        <MpTimelineTitle>
                                                            <MpText
                                                                :weight="
                                                                    isNotRequired(
                                                                        log,
                                                                        a,
                                                                    )
                                                                        ? 'regular'
                                                                        : 'semiBold'
                                                                "
                                                                :color="
                                                                    isNotRequired(
                                                                        log,
                                                                        a,
                                                                    )
                                                                        ? 'text.secondary'
                                                                        : 'text.default'
                                                                "
                                                            >
                                                                {{
                                                                    approverLabel(
                                                                        log,
                                                                        a,
                                                                    )
                                                                }}
                                                            </MpText>
                                                        </MpTimelineTitle>
                                                        <MpTimelineCaption>{{
                                                            a.user.name
                                                        }}</MpTimelineCaption>
                                                        <MpTimelineContent
                                                            v-if="
                                                                a.acted_at ||
                                                                a.notes
                                                            "
                                                        >
                                                            <MpFlex
                                                                direction="column"
                                                                gap="1"
                                                                paddingBottom="4"
                                                            >
                                                                <MpText
                                                                    v-if="
                                                                        a.acted_at
                                                                    "
                                                                    size="label-small"
                                                                    color="text.secondary"
                                                                >
                                                                    {{
                                                                        formatStamp(
                                                                            a.acted_at,
                                                                        )
                                                                    }}
                                                                </MpText>
                                                                <MpText
                                                                    v-if="
                                                                        a.notes
                                                                    "
                                                                    size="label"
                                                                    >"{{
                                                                        a.notes
                                                                    }}"</MpText
                                                                >
                                                            </MpFlex>
                                                        </MpTimelineContent>
                                                    </MpTimelineItem>
                                                </MpTimeline>
                                            </MpAccordionPanel>
                                        </MpAccordionItem>
                                    </MpAccordion>
                                </MpFlex>
                            </MpTimelineContent>
                        </MpTimelineItem>
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

        <ConfirmDeleteModal
            :is-open="isConfirmingRevise"
            title="Revise this submission?"
            message="This pulls the submission back out of approval and returns it to draft so you can edit it. Approvers will no longer see it in their queue."
            confirm-label="Revise Submission"
            confirm-variant="primary"
            @close="isConfirmingRevise = false"
            @confirm="confirmRevise"
        />

        <MpModal :is-open="isRejecting" size="md" @close="closeReject">
            <MpModalContent>
                <MpModalHeader>
                    Reject submission
                    <MpModalCloseButton />
                </MpModalHeader>
                <MpModalBody>
                    <MpFormControl id="detail-reject-notes" is-required>
                        <MpFormLabel>Reviewer Notes</MpFormLabel>
                        <MpTextarea
                            v-model="rejectNotes"
                            placeholder="Explain why this is being rejected"
                        />
                    </MpFormControl>
                </MpModalBody>
                <MpModalFooter>
                    <MpButtonGroup>
                        <MpButton variant="ghost" @click="closeReject"
                            >Cancel</MpButton
                        >
                        <MpButton
                            variant="danger"
                            :is-disabled="
                                !canReject(rejectNotes) || isRejectSubmitting
                            "
                            :is-loading="isRejectSubmitting"
                            @click="confirmReject"
                        >
                            Reject
                        </MpButton>
                    </MpButtonGroup>
                </MpModalFooter>
            </MpModalContent>
            <MpModalOverlay />
        </MpModal>

        <MpModal
            :is-open="isRequestingRevisionOpen"
            size="md"
            @close="closeRequestRevision"
        >
            <MpModalContent>
                <MpModalHeader>
                    Request revision
                    <MpModalCloseButton />
                </MpModalHeader>
                <MpModalBody>
                    <MpFormControl id="detail-revision-notes" is-required>
                        <MpFormLabel>Revision Notes</MpFormLabel>
                        <MpTextarea
                            v-model="revisionNotes"
                            placeholder="Explain what needs to be revised"
                        />
                    </MpFormControl>
                </MpModalBody>
                <MpModalFooter>
                    <MpButtonGroup>
                        <MpButton
                            variant="ghost"
                            @click="closeRequestRevision"
                            >Cancel</MpButton
                        >
                        <MpButton
                            variant="primary"
                            :is-disabled="
                                !canReject(revisionNotes) ||
                                isRequestingRevision
                            "
                            :is-loading="isRequestingRevision"
                            @click="confirmRequestRevision"
                        >
                            Request Revision
                        </MpButton>
                    </MpButtonGroup>
                </MpModalFooter>
            </MpModalContent>
            <MpModalOverlay />
        </MpModal>
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
    MpAccordion,
    MpAccordionItem,
    MpAccordionHeader,
    MpAccordionPanel,
    MpModal,
    MpModalContent,
    MpModalHeader,
    MpModalBody,
    MpModalFooter,
    MpModalOverlay,
    MpModalCloseButton,
    MpButtonGroup,
    MpTextarea,
    css,
    MpAccordionIcon,
} from "@mekari/pixel3";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import DynamicFieldInput from "@/components/DynamicFieldInput.vue";
import {
    isAllowedEvidenceFile,
    canSubmit as canSubmitEvidence,
} from "@/lib/dynamic-validation";
import {
    canReject,
    canRevise,
    selectableApprovalIds,
} from "@/lib/review-approval-validation";
import {
    useGetEvaluateGriQuantitativeDetail,
    useUpdateEvaluateGriQuantitative,
    useSubmitEvaluateGriQuantitative,
    useCancelEvaluateGriQuantitative,
    useDeleteEvaluateGriQuantitative,
    useApproveEvaluateGriQuantitative,
    useRejectEvaluateGriQuantitative,
    useRequestRevisionEvaluateGriQuantitative,
    isDetailReadOnly,
    latestApproverNote,
    groupItemsByCategory,
    fromSubmissionValues,
    toSubmissionValue,
    cellKey,
    requesterLabel,
} from "@/services/evaluate-gri-quantitative";
import {
    isSection,
    resolveUnit,
    dataRows,
} from "@/services/master-key-indicator-quantitative";
import { useGetUserProfile } from "@/services/user-profile";
import { logger } from "@/lib/logger";

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
    REQUEST_REVISION: "rejected",
};

// Section marker rows get a distinct tint so they read as structural, not another data row.
const sectionRow = css({
    backgroundColor: "background.stage",
});

const stampFormat = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

function formatStamp(value?: number | null) {
    return value ? stampFormat.format(new Date(value)) : "";
}

const PENDING_ACTIONS: ApprovalAction[] = ["WAITING_APPROVAL", "PENDING"];

// a stage that already reached its decision leaves the remaining approvers as "not required"
function isNotRequired(log: ApprovalLog, a: ApprovalApprover) {
    return (
        PENDING_ACTIONS.includes(a.action) &&
        !PENDING_ACTIONS.includes(log.status)
    );
}

const actionVerb: Record<ApprovalAction, string> = {
    WAITING_APPROVAL: "Waiting approval from",
    PENDING: "Waiting approval from",
    APPROVE: "Approved by",
    APPROVED: "Approved by",
    REJECTED: "Rejected by",
    CANCEL: "Canceled by",
    REQUEST_REVISION: "Revision requested by",
};

function approverLabel(log: ApprovalLog, a: ApprovalApprover) {
    const verb = isNotRequired(log, a)
        ? "Not required approval from"
        : actionVerb[a.action];
    return `${verb} ${a.position.name} | ${a.user.email}`;
}

// ponytail: the API sends no wording for the stage rule, only minimum_action — "anyone" vs "all"
// is derived from it. Swap for a backend-provided label if one shows up.
function stageRule(log: ApprovalLog) {
    const total = log.approvers.length;
    const min = log.minimum_action || 1;
    return `${min >= total ? "ALL MUST APPROVE" : "ANYONE CAN APPROVE"}, ${min} OF ${total} REQUIRED`;
}

const route = useRoute();
const router = useRouter();
const id = computed(() => route.query.id as string | undefined);

const { data: detail, isLoading } = useGetEvaluateGriQuantitativeDetail(id);

const fromApproval = computed(() => route.query.from === "approval");
const readOnly = computed(
    () =>
        !detail.value ||
        isDetailReadOnly(detail.value.flow_status, fromApproval.value),
);
const { data: profile } = useGetUserProfile();
const requestedBy = computed(() =>
    detail.value
        ? requesterLabel(
              detail.value,
              profile.value?.email,
              !fromApproval.value,
          )
        : "",
);
const approvalLogs = computed(() =>
    [...(detail.value?.approval_logs ?? [])].sort(
        (a, b) => a.stage_order - b.stage_order,
    ),
);
// GROU-657 — the banner is driven by whether a note exists, not by flow_status, because a
// revision request returns the submission to 'draft' (not 'rejected'), and would otherwise never
// show. Labelled by the approver's action so a genuine rejection still reads "rejected".
const approverNote = computed(() =>
    detail.value ? latestApproverNote(detail.value.approval_logs) : null,
);
const noteIsRevision = computed(
    () => approverNote.value?.action === "REQUEST_REVISION",
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

// GROU-659 — the requestor pulls a sent submission back to draft to revise it
const cancelMutation = useCancelEvaluateGriQuantitative();
const isRevising = computed(() => cancelMutation.isPending.value);
const isConfirmingRevise = ref(false);
const canReviseSubmission = computed(
    () =>
        Boolean(detail.value) &&
        canRevise(detail.value!.flow_status, fromApproval.value),
);

async function save() {
    if (!detail.value) return false;
    try {
        await updateMutation.mutateAsync({
            id: detail.value.id,
            template_id: detail.value.template_id,
            period_id: detail.value.period_id,
            entity_id: detail.value.entity_id,
            items: items.value.map((item) => ({
                item_id: item.id,
                values: dataRows(item.rows).flatMap((row) =>
                    item.metrics.map((metric) =>
                        toSubmissionValue(
                            metric,
                            row.sequence,
                            cells[cellId(item.id, row.sequence, metric.key)],
                            resolveUnit(row, metric, item.unit_mode, item.unit),
                        ),
                    ),
                ),
            })),
        });
        return true;
    } catch (error) {
        logger.error("Cannot save", error);
        return false;
    }
}

async function submit() {
    if (!detail.value || !canSubmitForm.value) {
        logger.warn("Cannot submit", {
            detail: detail.value,
            canSubmitForm: canSubmitForm.value,
        });
        return;
    }
    if (!(await save())) {
        logger.warn("Cannot submit due to saving failure");
        return;
    }
    try {
        await submitMutation.mutateAsync(detail.value.id);
    } catch {
        return;
    }
    router.push("/evaluate-gri-quantitative/requestor");
}

async function confirmDelete() {
    if (!detail.value) return;
    try {
        await deleteMutation.mutateAsync(detail.value.id);
    } catch {
        return;
    }
    isConfirmingDelete.value = false;
    router.push(
        fromApproval.value
            ? "/evaluate-gri-quantitative/approval"
            : "/evaluate-gri-quantitative/requestor",
    );
}

async function confirmRevise() {
    if (!detail.value) return;
    try {
        await cancelMutation.mutateAsync(detail.value.id);
    } catch {
        // http.ts already toasted the envelope error — leave the modal open so the user can retry
        return;
    }
    isConfirmingRevise.value = false;
    router.push("/evaluate-gri-quantitative/requestor");
}

// approver actions — only reachable from the Review & Approval queue, same actionable-status rule
// as the queue's bulk actions (ApprovalReviewTable.vue / selectableApprovalIds)
const canAct = computed(
    () =>
        fromApproval.value &&
        Boolean(detail.value) &&
        selectableApprovalIds([detail.value!]).length > 0,
);

const approveMutation = useApproveEvaluateGriQuantitative();
const rejectMutation = useRejectEvaluateGriQuantitative();
const isApproving = computed(() => approveMutation.isPending.value);
const isRejectSubmitting = computed(() => rejectMutation.isPending.value);
const isRejecting = ref(false);
const rejectNotes = ref("");

// GROU-657 — third approver decision; same availability as approve/reject (canAct)
const requestRevisionMutation = useRequestRevisionEvaluateGriQuantitative();
const isRequestingRevision = computed(
    () => requestRevisionMutation.isPending.value,
);
const isRequestingRevisionOpen = ref(false);
const revisionNotes = ref("");

async function approve() {
    if (!detail.value) return;
    try {
        await approveMutation.mutateAsync({ id: detail.value.id });
        router.push("/evaluate-gri-quantitative/approval");
    } catch {
        return;
    }
}

function openReject() {
    rejectNotes.value = "";
    isRejecting.value = true;
}

function closeReject() {
    isRejecting.value = false;
    rejectNotes.value = "";
}

async function confirmReject() {
    if (!detail.value || !canReject(rejectNotes.value)) return;
    try {
        await rejectMutation.mutateAsync({
            id: detail.value.id,
            remarks: rejectNotes.value.trim(),
        });
    } catch {
        return;
    }
    closeReject();
    router.push("/evaluate-gri-quantitative/approval");
}

function openRequestRevision() {
    revisionNotes.value = "";
    isRequestingRevisionOpen.value = true;
}

function closeRequestRevision() {
    isRequestingRevisionOpen.value = false;
    revisionNotes.value = "";
}

async function confirmRequestRevision() {
    if (!detail.value || !canReject(revisionNotes.value)) return;
    try {
        await requestRevisionMutation.mutateAsync({
            id: detail.value.id,
            remarks: revisionNotes.value.trim(),
        });
    } catch {
        // http.ts already toasted the envelope error — keep the modal open for a retry
        return;
    }
    closeRequestRevision();
    router.push("/evaluate-gri-quantitative/approval");
}
</script>
