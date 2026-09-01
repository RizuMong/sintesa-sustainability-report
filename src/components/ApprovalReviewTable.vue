<template>
    <MpFlex direction="column" gap="3">
        <MpFlex
            v-if="selected.size"
            justifyContent="space-between"
            alignItems="center"
        >
            <MpText size="label" color="text.secondary">
                {{ selected.size }} selected
            </MpText>
            <MpButtonGroup>
                <MpButton
                    :is-disabled="isBulkApproving"
                    :is-loading="isBulkApproving"
                    @click="bulkApprove"
                >
                    Bulk Approve
                </MpButton>
                <MpButton
                    variant="danger"
                    :is-disabled="isBulkApproving"
                    @click="openBulkReject"
                >
                    Bulk Reject
                </MpButton>
            </MpButtonGroup>
        </MpFlex>

        <MpFlex v-if="isLoading" direction="column" gap="2">
            <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
        </MpFlex>

        <template v-else-if="items.length">
            <MpTableContainer>
                <MpTable>
                    <MpTableHead>
                        <MpTableRow>
                            <MpTableCell scope="col">
                                <MpCheckbox
                                    id="select-all"
                                    :is-checked="allSelectableSelected"
                                    :is-disabled="!selectableIds.length"
                                    @update:is-checked="toggleSelectAll"
                                />
                            </MpTableCell>
                            <MpTableCell
                                v-for="col in columns"
                                :key="col.key"
                                scope="col"
                                >{{ col.label }}</MpTableCell
                            >
                        </MpTableRow>
                    </MpTableHead>
                    <MpTableBody>
                        <template v-for="row in items" :key="row.id">
                            <MpTableRow
                                :class="css({ cursor: 'pointer' })"
                                @click="emit('rowClick', row)"
                            >
                                <MpTableCell as="td" scope="row" @click.stop>
                                    <MpCheckbox
                                        :id="`select-${row.id}`"
                                        :is-checked="selected.has(row.id)"
                                        :is-disabled="!isActionable(row)"
                                        @update:is-checked="
                                            (checked: boolean) =>
                                                toggleRow(row.id, checked)
                                        "
                                    />
                                </MpTableCell>
                                <MpTableCell
                                    v-for="col in columns"
                                    :key="col.key"
                                    as="td"
                                    scope="row"
                                >
                                    {{ col.value(row) }}
                                </MpTableCell>
                            </MpTableRow>
                        </template>
                    </MpTableBody>
                </MpTable>
            </MpTableContainer>
        </template>

        <MpFlex
            v-else
            direction="column"
            alignItems="center"
            gap="4"
            paddingY="20"
        >
            <MpImage
                src="https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png"
                alt="empty state illustration"
                layout="fixed"
                :width="200"
                :height="160"
                object-fit="contain"
                :is-show-loading="false"
            />
            <MpText size="h3" weight="semiBold">{{ emptyTitle }}</MpText>
        </MpFlex>

        <MpModal
            :is-open="rejectTargetIds.length > 0"
            size="md"
            @close="closeReject"
        >
            <MpModalContent>
                <MpModalHeader>
                    Reject submission
                    <MpModalCloseButton />
                </MpModalHeader>
                <MpModalBody>
                    <MpFormControl id="reject-notes" is-required>
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
                                !canReject(rejectNotes) || isBulkRejecting
                            "
                            :is-loading="isBulkRejecting"
                            @click="confirmReject"
                        >
                            Reject
                        </MpButton>
                    </MpButtonGroup>
                </MpModalFooter>
            </MpModalContent>
            <MpModalOverlay />
        </MpModal>
    </MpFlex>
</template>

<script
    setup
    lang="ts"
    generic="
        TRow extends {
            id: string;
            flow_status: string;
            current_stage_order?: number;
            approval_logs?: ApprovalLog[];
        }
    "
>
import { computed, ref } from "vue";
import {
    MpFlex,
    MpText,
    MpButton,
    MpButtonGroup,
    MpImage,
    MpSkeleton,
    MpCheckbox,
    MpTable,
    MpTableHead,
    MpTableBody,
    MpTableRow,
    MpTableCell,
    MpTableContainer,
    MpModal,
    MpModalContent,
    MpModalHeader,
    MpModalBody,
    MpModalFooter,
    MpModalOverlay,
    MpModalCloseButton,
    MpFormControl,
    MpFormLabel,
    MpTextarea,
    css,
    toast,
} from "@mekari/pixel3";
import {
    canReject,
    selectableApprovalIds,
} from "@/lib/review-approval-validation";

// shared table for the 3 Review & Approval tabs (FSD 2.4, AC-55...AC-62) — the only thing that
// differs per tab is which columns to show and which module's mutations back approve/reject.
interface ApprovableRow {
    id: string;
    flow_status: string;
    current_stage_order?: number;
    approval_logs?: ApprovalLog[];
}

const props = defineProps<{
    items: TRow[];
    isLoading: boolean;
    columns: {
        key: string;
        label: string;
        value: (row: TRow) => string | number;
    }[];
    approveMutation: {
        mutateAsync: (payload: {
            id: string;
            remarks?: string;
            silentToast?: boolean;
        }) => Promise<unknown>;
        isPending: { value: boolean };
    };
    rejectMutation: {
        mutateAsync: (payload: {
            id: string;
            remarks: string;
            silentToast?: boolean;
        }) => Promise<unknown>;
        isPending: { value: boolean };
    };
    emptyTitle?: string;
}>();

const emit = defineEmits<{ rowClick: [row: TRow] }>();

const emptyTitle = props.emptyTitle ?? "No submissions waiting for approval";

const selected = ref<Set<string>>(new Set());
const rejectTargetIds = ref<string[]>([]);
const rejectNotes = ref("");
const isBulkApproving = ref(false);
const isBulkRejecting = ref(false);

const selectableIds = computed(() => selectableApprovalIds(props.items));
const allSelectableSelected = computed(
    () =>
        selectableIds.value.length > 0 &&
        selectableIds.value.every((id) => selected.value.has(id)),
);

function isActionable(row: ApprovableRow) {
    return selectableIds.value.includes(row.id);
}

function toggleRow(id: string, checked: boolean) {
    const next = new Set(selected.value);
    if (checked) next.add(id);
    else next.delete(id);
    selected.value = next;
}

function toggleSelectAll(checked: boolean) {
    selected.value = checked ? new Set(selectableIds.value) : new Set();
}

// AC-62 — bulk approve/reject are one mutation call per selected row; each mutation's own onSuccess
// already invalidates the list query on settle (see the module's composables.ts).
async function bulkApprove() {
    const ids = Array.from(selected.value);
    if (!ids.length) return;
    isBulkApproving.value = true;
    try {
        for (const id of ids) {
            await props.approveMutation.mutateAsync({ id, silentToast: true });
        }
        toast.notify({
            id: "bulk-approve",
            variant: "success",
            title: `Approved ${ids.length} submission(s).`,
        });
        selected.value = new Set();
    } finally {
        isBulkApproving.value = false;
    }
}

function openBulkReject() {
    rejectTargetIds.value = Array.from(selected.value);
    rejectNotes.value = "";
}

function closeReject() {
    rejectTargetIds.value = [];
    rejectNotes.value = "";
}

async function confirmReject() {
    const ids = rejectTargetIds.value;
    if (!ids.length || !canReject(rejectNotes.value)) return;
    isBulkRejecting.value = true;
    try {
        const remarks = rejectNotes.value.trim();
        for (const id of ids) {
            await props.rejectMutation.mutateAsync({
                id,
                remarks,
                silentToast: true,
            });
        }
        toast.notify({
            id: "bulk-reject",
            variant: "success",
            title: `Rejected ${ids.length} submission(s).`,
        });
        selected.value = new Set();
        closeReject();
    } finally {
        isBulkRejecting.value = false;
    }
}
</script>
