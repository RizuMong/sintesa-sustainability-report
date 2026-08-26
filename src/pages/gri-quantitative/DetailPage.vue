<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/gri-quantitative">GRI Management</MpButton>
          <MpFlex direction="row" alignItems="center" gap="2">
            <MpText as="h1" size="h1">{{ isEdit ? form.template_name || 'Edit' : 'Create' }}</MpText>
            <MpBadge v-if="isEdit" for="tableStatus" :type="form.status === 'Published' ? 'completed' : 'announcement'">
              {{ form.status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit && form.status === 'Draft'" :is-disabled="Boolean(publishError)" @click="publish">
        Publish
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
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" flex="1" maxWidth="720px">
        <MpBanner v-if="isLocked" variant="warning">
          <MpBannerDescription>
            This template is Published and locked for editing. Publish a new version to make changes.
          </MpBannerDescription>
        </MpBanner>

        <MpFormControl id="release-template-name" is-required>
          <MpFormLabel>Template name</MpFormLabel>
          <MpInput v-model="form.template_name" :is-disabled="isLocked" placeholder="e.g. GRI Quantitative FY2026" />
        </MpFormControl>

        <MpFormControl id="release-period" is-required>
          <MpFormLabel>Period</MpFormLabel>
          <MpSelect v-model="form.period_id" placeholder="Select period" is-full-width :is-disabled="isLocked">
            <option value="" disabled>Select period</option>
            <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.year }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="release-category" is-required>
          <MpFormLabel>Category</MpFormLabel>
          <MpSelect v-model="form.category" placeholder="Select category" is-full-width :is-disabled="isLocked || isEdit">
            <option value="" disabled>Select category</option>
            <option value="GRI_QUANT">GRI Quantitative</option>
            <option value="GRI_QUAL">GRI Qualitative</option>
          </MpSelect>
        </MpFormControl>

        <MpDivider />

        <MpFlex direction="column" gap="4">
          <MpText size="h3" weight="semiBold">Disclosures</MpText>

          <MpFlex
            v-for="(disclosure, i) in form.disclosures"
            :key="disclosure.id"
            direction="column"
            gap="3"
            padding="16px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
            backgroundColor="background.surface"
          >
            <MpFlex justifyContent="space-between" alignItems="center">
              <MpText size="label" weight="semiBold">Disclosure {{ i + 1 }}</MpText>
              <MpButton
                v-if="!isLocked"
                variant="ghost"
                size="sm"
                left-icon="delete"
                aria-label="Remove disclosure"
                @click="removeDisclosure(i)"
              />
            </MpFlex>

            <MpFormControl :id="`disclosure-mki-${i}`" is-required>
              <MpFormLabel>{{ form.category === 'GRI_QUAL' ? 'MKI (GRI Qualitative)' : 'MKI (GRI Quantitative)' }}</MpFormLabel>
              <MpSelect
                :model-value="disclosure.mki_id"
                is-full-width
                :is-disabled="isLocked"
                @update:model-value="(v: string) => onPickMki(disclosure, v)"
              >
                <option value="" disabled>Select MKI</option>
                <option v-for="m in mkiOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
              </MpSelect>
            </MpFormControl>

            <MpFormControl :id="`disclosure-gri-code-${i}`" is-required>
              <MpFormLabel>GRI Code</MpFormLabel>
              <MpSelect v-model="disclosure.gri_code" is-full-width :is-disabled="isLocked">
                <option value="" disabled>Select GRI code</option>
                <option v-for="g in griCodes" :key="g.id" :value="g.gri_code">
                  {{ g.gri_code }} — {{ g.disclosure_title }}
                </option>
              </MpSelect>
            </MpFormControl>

            <template v-if="form.category === 'GRI_QUANT'">
              <MpFormControl :id="`disclosure-input-type-${i}`">
                <MpFormLabel>Input Type</MpFormLabel>
                <MpInput :model-value="disclosure.input_type" is-disabled />
              </MpFormControl>
              <MpFormControl :id="`disclosure-unit-${i}`">
                <MpFormLabel>Unit</MpFormLabel>
                <MpInput :model-value="disclosure.unit || '—'" is-disabled />
              </MpFormControl>
              <MpFormControl :id="`disclosure-evidence-${i}`">
                <MpFormLabel>Evidence</MpFormLabel>
                <MpInput :model-value="disclosure.evidence || '—'" is-disabled />
              </MpFormControl>
            </template>

            <template v-else>
              <MpFlex direction="column" gap="3">
                <MpText size="label" weight="semiBold">Questions</MpText>

                <MpFlex
                  v-for="(question, qi) in disclosure.questions"
                  :key="qi"
                  direction="column"
                  gap="3"
                  padding="16px"
                  borderWidth="1px"
                  borderColor="border.default"
                  rounded="md"
                  backgroundColor="background.stage"
                >
                  <MpFlex justifyContent="space-between" alignItems="center">
                    <MpText size="label" weight="semiBold">Question {{ qi + 1 }}</MpText>
                    <MpButton
                      v-if="!isLocked"
                      variant="ghost"
                      size="sm"
                      left-icon="delete"
                      aria-label="Remove question"
                      @click="removeQuestion(disclosure, qi)"
                    />
                  </MpFlex>

                  <MpFormControl :id="`question-title-${i}-${qi}`" is-required>
                    <MpFormLabel>Title</MpFormLabel>
                    <MpTextarea
                      v-model="question.title"
                      :is-disabled="isLocked"
                      placeholder="e.g. Apakah perusahaan memiliki fasilitas ..."
                    />
                  </MpFormControl>

                  <MpFormControl :id="`question-mode-${i}-${qi}`" is-required>
                    <MpFormLabel>Answer Mode</MpFormLabel>
                    <MpSelect v-model="question.answer_mode" is-full-width :is-disabled="isLocked">
                      <option value="Single">Single</option>
                      <option value="Conditional">Conditional (Yes / No)</option>
                      <option value="None">None (toggle only)</option>
                    </MpSelect>
                  </MpFormControl>

                  <MpFormControl v-if="question.answer_mode === 'Single'" :id="`question-followup-${i}-${qi}`">
                    <MpFormLabel>Follow Up</MpFormLabel>
                    <MpTextarea
                      v-model="question.follow_up"
                      :is-disabled="isLocked"
                      placeholder="Instruction/notes for the answer"
                    />
                  </MpFormControl>

                  <template v-else-if="question.answer_mode === 'Conditional'">
                    <MpFormControl :id="`question-followup-yes-${i}-${qi}`">
                      <MpFormLabel>Follow Up — Yes</MpFormLabel>
                      <MpTextarea
                        v-model="question.follow_up_yes"
                        :is-disabled="isLocked"
                        placeholder="Instruction/notes when the answer is Yes"
                      />
                    </MpFormControl>
                    <MpFormControl :id="`question-followup-no-${i}-${qi}`">
                      <MpFormLabel>Follow Up — No</MpFormLabel>
                      <MpTextarea
                        v-model="question.follow_up_no"
                        :is-disabled="isLocked"
                        placeholder="Instruction/notes when the answer is No"
                      />
                    </MpFormControl>
                  </template>
                </MpFlex>

                <MpButton
                  v-if="!isLocked"
                  size="sm"
                  variant="ghost"
                  left-icon="add"
                  is-full-width
                  :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
                  @click="addQuestion(disclosure)"
                >
                  Add Question
                </MpButton>
              </MpFlex>
            </template>
          </MpFlex>

          <MpButton
            v-if="!isLocked"
            size="sm"
            variant="ghost"
            left-icon="add"
            is-full-width
            :is-disabled="!form.category"
            :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
            @click="addDisclosure"
          >
            Add Disclosure
          </MpButton>
        </MpFlex>

        <MpFormErrorMessage v-if="publishError">{{ publishError }}</MpFormErrorMessage>

        <MpFlex>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpSelect,
  MpTextarea,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpBanner,
  MpBannerDescription,
  MpDivider,
  MpSkeleton,
  MpBadge,
  css,
  toast,
} from '@mekari/pixel3'
import {
  useGetGriReleaseDetail,
  useCreateGriRelease,
  useUpdateGriRelease,
  usePublishGriRelease,
  isEditingLocked,
  validateDisclosuresForPublish,
} from '@/services/gri-release'
import { useGetMasterPeriod } from '@/services/master-period'
import { useGetMasterGri } from '@/services/master-gri'
import { useGetMkiGriQualitativeList } from '@/services/mki-gri-qualitative'
import { masterKeyIndicatorQuantitativeApi } from '@/services/master-key-indicator-quantitative.api'
import type { MkiGriQuantitativeDetail, MkiGriQuantitativeSummary } from '@/types'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))

const { data: detail, isLoading } = useGetGriReleaseDetail(id)
const { data: periodsData } = useGetMasterPeriod()
const periods = computed(() => periodsData.value ?? [])
const { data: griCodesData } = useGetMasterGri()
const griCodes = computed(() => griCodesData.value ?? [])

// GRI_QUAL indicators — new-shape module, fetched via composable
const { data: mkiQualData } = useGetMkiGriQualitativeList()

// GRI_QUANT indicators — old shape, still fine to read from per §5 Stream A. No composable exists
// for it yet, so fetch once like src/pages/master-key-indicator-quantitative/ListPage.vue does.
const mkiQuantList = ref<MkiGriQuantitativeSummary[]>([])
masterKeyIndicatorQuantitativeApi.index().then((result) => {
  mkiQuantList.value = (result as { data: MkiGriQuantitativeSummary[] }).data
})

const mkiOptions = computed(() =>
  form.category === 'GRI_QUAL' ? (mkiQualData.value ?? []) : mkiQuantList.value,
)

const form = reactive<{
  template_name: string
  period_id: string
  category: GriDisclosureCategory | ''
  disclosures: GriDisclosure[]
  status: GriTemplateStatus
}>({
  template_name: '',
  period_id: '',
  category: '',
  disclosures: [],
  status: 'Draft',
})

watch(
  detail,
  (value) => {
    if (!value) return
    form.template_name = value.template_name
    form.period_id = value.period_id.id
    form.category = value.category
    form.disclosures = value.disclosures.map((d) => ({ ...d, questions: d.questions.map((q) => ({ ...q })) }))
    form.status = value.status
  },
  { immediate: true },
)

const isLocked = computed(() => isEditingLocked(form.status))
const canSave = computed(() => Boolean(form.template_name && form.period_id && form.category) && !isLocked.value)
const publishError = computed(() =>
  form.category ? validateDisclosuresForPublish(form.category, form.disclosures) : 'Select a category first.',
)

function newDisclosure(): GriDisclosure {
  return { id: crypto.randomUUID(), mki_id: '', mki_name: '', gri_code: '', input_type: '', unit: '', evidence: '', questions: [] }
}

function addDisclosure() {
  form.disclosures.push(newDisclosure())
}

function removeDisclosure(i: number) {
  form.disclosures.splice(i, 1)
}

function newQuestion(): GriQualQuestion {
  return { title: '', answer_mode: 'Single', follow_up: '', follow_up_yes: '', follow_up_no: '' }
}

function addQuestion(disclosure: GriDisclosure) {
  disclosure.questions.push(newQuestion())
}

function removeQuestion(disclosure: GriDisclosure, qi: number) {
  disclosure.questions.splice(qi, 1)
}

// AC-39: GRI_QUANT — input_type/unit/evidence auto-fill read-only from the picked MKI record.
// AC-40/41: GRI_QUAL — no input_type/unit/evidence; seed the question builder from the picked
// MKI GRI-Qualitative's own questions as a starting point (still fully editable here).
async function onPickMki(disclosure: GriDisclosure, mkiId: string) {
  disclosure.mki_id = mkiId
  if (form.category === 'GRI_QUAL') {
    const mki = (mkiQualData.value ?? []).find((m) => m.id === mkiId)
    disclosure.mki_name = mki?.name ?? ''
    disclosure.input_type = ''
    disclosure.unit = ''
    disclosure.evidence = ''
    if (mki && disclosure.questions.length === 0) {
      disclosure.questions = mki.questions.map((q) => ({ ...q }))
    }
    return
  }

  const summary = mkiQuantList.value.find((m) => m.id === mkiId)
  disclosure.mki_name = summary?.name ?? ''
  const detailRecord = (await masterKeyIndicatorQuantitativeApi.index({ id: mkiId })) as
    | MkiGriQuantitativeDetail
    | undefined
  const metric = detailRecord?.metrics[0]
  disclosure.input_type = metric?.input_type ?? ''
  disclosure.unit = metric?.unit?.name ?? ''
  // ponytail: master-key-indicator-quantitative has no evidence_attachment field yet (only
  // mki-sdg/mki-gri-qualitative model that) — default to Optional until it grows one.
  disclosure.evidence = 'Optional'
}

const createMutation = useCreateGriRelease()
const updateMutation = useUpdateGriRelease()
const publishMutation = usePublishGriRelease()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value || !form.category) return
  const payload = {
    template_name: form.template_name,
    period_id: { id: form.period_id },
    category: form.category,
    disclosures: form.disclosures.map((d) => ({ ...d, questions: d.questions.map((q) => ({ ...q })) })),
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'gri-release-update', variant: 'success', title: 'Template updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'gri-release-create', variant: 'success', title: 'Template created.' })
  }
  router.push('/gri-quantitative')
}

async function publish() {
  if (!id || publishError.value) return
  await publishMutation.mutateAsync({ id })
  // auto-distribution + notification are backend-side — see ponytail note in composables.ts
  toast.notify({ id: 'gri-release-publish', variant: 'success', title: 'Template published.' })
}
</script>
