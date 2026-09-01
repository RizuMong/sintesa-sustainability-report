<template>
    <MpFlex
        direction="column"
        backgroundColor="background.stage"
        minHeight="100vh"
    >
        <MpFlex
            justifyContent="end"
            alignItems="center"
            paddingX="24px"
            paddingTop="24px"
            paddingBottom="8px"
            backgroundColor="background.surface"
        >
            <MpButton left-icon="add" @click="openCreate = true"
                >Create Data</MpButton
            >
        </MpFlex>

        <MpFlex
            direction="column"
            paddingX="24px"
            paddingTop="8px"
            paddingBottom="24px"
            gap="4"
        >
            <div :class="css({ display: 'flex', gap: '2' })">
                <SummaryBox
                    v-for="box in summaryBoxes"
                    :key="box.status"
                    :variant="box.variant"
                    :label="box.label"
                    :amount="box.amount"
                    :is-loading="isLoading"
                    :is-active="isStatusActive(box.status)"
                    is-hoverable
                    @click="toggleStatusFilter(box.status)"
                />
            </div>

            <MpFlex justifyContent="flex-start">
                <TableFilter
                    :columns="filterColumns"
                    @apply="applyFilter"
                    @reset="resetFilter"
                />
            </MpFlex>

            <MpFlex v-if="isLoading" direction="column" gap="2">
                <MpSkeleton
                    v-for="i in 4"
                    :key="i"
                    height="56px"
                    rounded="md"
                />
            </MpFlex>

            <template v-else>
                <MpTableContainer>
                    <MpTable>
                        <MpTableHead>
                            <MpTableRow>
                                <MpTableCell scope="col">Entity</MpTableCell>
                                <MpTableCell scope="col">Period</MpTableCell>
                                <MpTableCell scope="col">Template</MpTableCell>
                            </MpTableRow>
                        </MpTableHead>
                        <MpTableBody>
                            <MpTableRow
                                v-for="row in filteredItems"
                                :key="row.id"
                                @click="goToDetail(row)"
                                :class="css({ cursor: 'pointer' })"
                            >
                                <MpTableCell as="td" scope="row">
                                    {{ row.entity_id.name }}
                                </MpTableCell>
                                <MpTableCell as="td" scope="row">
                                    {{ row.period_id.name }}
                                </MpTableCell>
                                <MpTableCell as="td" scope="row">
                                    {{ row.template_id.name }}
                                </MpTableCell>
                            </MpTableRow>
                            <MpTableRow v-if="!filteredItems.length">
                                <MpTableCell
                                    as="td"
                                    scope="row"
                                    :colspan="3"
                                    :class="css({ textAlign: 'center' })"
                                >
                                    <MpText color="text.secondary"
                                        >No data</MpText
                                    >
                                </MpTableCell>
                            </MpTableRow>
                        </MpTableBody>
                    </MpTable>
                </MpTableContainer>
            </template>
        </MpFlex>

        <MpModal :is-open="openCreate" size="md" @close="openCreate = false">
            <MpModalContent>
                <MpModalHeader>
                    Create Data
                    <MpModalCloseButton />
                </MpModalHeader>
                <MpModalBody>
                    <MpFlex direction="column" gap="4">
                        <MpFormControl id="new-entity" is-required>
                            <MpFormLabel>Entity</MpFormLabel>
                            <MpSelect
                                v-model="form.entityId"
                                placeholder="Select entity"
                                is-full-width
                            >
                                <option value="" disabled>Select entity</option>
                                <option
                                    v-for="e in entities"
                                    :key="e.id"
                                    :value="e.id"
                                >
                                    {{ e.name }}
                                </option>
                            </MpSelect>
                        </MpFormControl>
                        <MpFormControl id="new-period" is-required>
                            <MpFormLabel>Period</MpFormLabel>
                            <MpSelect
                                v-model="form.periodId"
                                placeholder="Select period"
                                is-full-width
                            >
                                <option value="" disabled>Select period</option>
                                <option
                                    v-for="p in periods"
                                    :key="p.id"
                                    :value="p.id"
                                >
                                    {{ p.year }}
                                </option>
                            </MpSelect>
                        </MpFormControl>
                        <MpFormControl id="new-template" is-required>
                            <MpFormLabel>Template</MpFormLabel>
                            <MpSelect
                                v-model="form.templateId"
                                placeholder="Select template"
                                is-full-width
                            >
                                <option value="" disabled>
                                    Select template
                                </option>
                                <option
                                    v-for="t in publishedTemplates"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.template_name }}
                                </option>
                            </MpSelect>
                        </MpFormControl>
                        <MpFormErrorMessage v-if="isDuplicate">
                            A submission for this entity, period and template
                            already exists.
                        </MpFormErrorMessage>
                    </MpFlex>
                </MpModalBody>
                <MpModalFooter>
                    <MpButtonGroup>
                        <MpButton variant="ghost" @click="openCreate = false"
                            >Cancel</MpButton
                        >
                        <MpButton
                            :is-disabled="!canCreate || isCreating"
                            @click="createSubmission"
                            >Create</MpButton
                        >
                    </MpButtonGroup>
                </MpModalFooter>
            </MpModalContent>
            <MpModalOverlay />
        </MpModal>
    </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
    MpFlex,
    MpText,
    MpButton,
    MpButtonGroup,
    MpSkeleton,
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
    MpFormErrorMessage,
    MpSelect,
    css,
} from "@mekari/pixel3";
import { useTableFilter } from "@/composables/useTableFilter";
import TableFilter from "@/components/TableFilter.vue";
import SummaryBox from "@/components/SummaryBox.vue";
import { useGetMasterEntity } from "@/services/master-entity";
import { useGetMasterPeriod } from "@/services/master-period";
import {
    useGetRequestorList,
    useCreateEvaluateGriQuantitative,
    useGetMasterTemplateQuantitativeOptions,
    hasDuplicateSubmission,
    requestorSummary,
} from "@/services/evaluate-gri-quantitative";

const statusBadgeType: Record<
    SubmissionFlowStatus,
    "announcement" | "information" | "completed" | "critical"
> = {
    draft: "announcement",
    submitted: "information",
    approved: "completed",
    rejected: "critical",
    cancelled: "announcement",
};

const router = useRouter();

const { data, isLoading } = useGetRequestorList();
const items = computed(() => data.value ?? []);

const summary = computed(() => requestorSummary(items.value));

const { data: entityData } = useGetMasterEntity();
const entities = computed(() =>
    (entityData.value ?? []).filter((e) => e.status === "Active"),
);

const { data: periodData } = useGetMasterPeriod();
const periods = computed(() =>
    (periodData.value ?? []).filter((p) => p.status === "Active"),
);

const { data: templateData } = useGetMasterTemplateQuantitativeOptions();
const publishedTemplates = computed(() =>
    (templateData.value ?? []).filter((t) => t.status === "Published"),
);

const filterColumns = computed(() => [
    { value: "entity_id.name", label: "Entity" },
    { value: "period_id.name", label: "Period" },
    { value: "template_id.name", label: "Template" },
    {
        value: "flow_status",
        label: "Status",
        options: (Object.keys(statusBadgeType) as SubmissionFlowStatus[]).map(
            (value) => ({ value, label: value }),
        ),
    },
]);
const { filteredItems, activeFilter, applyFilter, resetFilter } =
    useTableFilter(items);

// Clicking a summary block filters the table by flow_status; clicking the active one clears it.
// ponytail: reuses TableFilter's substring filter, so the popover's own controls stay out of sync
// with a box click — swap both onto one shared filter state if that ever confuses anyone.
const summaryBoxes = computed(() => [
    { status: "draft", variant: "gray", label: "Draft", amount: summary.value.draft },
    {
        status: "sent",
        variant: "orange",
        label: "Awaiting Approval",
        amount: summary.value.awaitingApproval,
    },
    { status: "approved", variant: "green", label: "Approved", amount: summary.value.approved },
    { status: "rejected", variant: "red", label: "Rejected", amount: summary.value.rejected },
]);

function isStatusActive(status: string) {
    return (
        activeFilter.value?.column === "flow_status" &&
        activeFilter.value.value === status
    );
}

function toggleStatusFilter(status: string) {
    if (isStatusActive(status)) resetFilter();
    else applyFilter({ column: "flow_status", value: status });
}

const openCreate = ref(false);
const form = reactive({ entityId: "", periodId: "", templateId: "" });

// AC-86 — block a duplicate submission for the same entity+period+template while one is in flight
const isDuplicate = computed(() => {
    if (!form.entityId || !form.periodId || !form.templateId) return false;
    return hasDuplicateSubmission(
        items.value,
        form.entityId,
        form.periodId,
        form.templateId,
    );
});
const canCreate = computed(
    () =>
        Boolean(form.entityId && form.periodId && form.templateId) &&
        !isDuplicate.value,
);

const createMutation = useCreateEvaluateGriQuantitative();
const isCreating = computed(() => createMutation.isPending.value);

function goToDetail(row: EvaluateGriQuantitativeSummary) {
    router.push({
        path: "/evaluate-gri-quantitative/detail",
        query: { id: row.id },
    });
}

async function createSubmission() {
    if (!canCreate.value) return;
    const entity = entities.value.find((e) => e.id === form.entityId);
    const period = periods.value.find((p) => p.id === form.periodId);
    const template = publishedTemplates.value.find(
        (t) => t.id === form.templateId,
    );
    if (!entity || !period || !template) return;

    const created = await createMutation.mutateAsync({
        entity_id: { id: entity.id, name: entity.name },
        period_id: { id: period.id, name: String(period.year) },
        template_id: { id: template.id, name: template.template_name },
    });
    form.entityId = "";
    form.periodId = "";
    form.templateId = "";
    openCreate.value = false;
    router.push({
        path: "/evaluate-gri-quantitative/detail",
        query: { id: created.id },
    });
}
</script>
