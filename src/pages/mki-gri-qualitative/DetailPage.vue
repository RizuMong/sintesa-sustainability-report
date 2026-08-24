<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/mki-gri-qualitative">GRI — Qualitative</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.name || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit && !form.locked" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">
        Delete
      </MpButton>
    </MpFlex>

    <MpFlex
      direction="row"
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
        <MpBanner v-if="form.locked" variant="warning">
          <MpBannerDescription>This indicator is used in a Published template and can't be deleted.</MpBannerDescription>
        </MpBanner>

        <MpFormControl id="mki-gri-qual-code" is-required :is-invalid="Boolean(codeError)">
          <MpFormLabel>Variable Code</MpFormLabel>
          <MpInput
            v-model="form.code"
            placeholder="e.g. GRI_306_WASTE"
            @update:model-value="(v: string) => (form.code = v.toUpperCase())"
          />
          <MpFormErrorMessage v-if="codeError">{{ codeError }}</MpFormErrorMessage>
        </MpFormControl>

        <MpFormControl id="mki-gri-qual-name" is-required>
          <MpFormLabel>Name</MpFormLabel>
          <MpInput v-model="form.name" placeholder="e.g. Pengelolaan Air Limbah" />
        </MpFormControl>

        <MpDivider />

        <MpFlex direction="column" gap="4">
          <MpText size="h3" weight="semiBold">Questions</MpText>

          <MpFlex
            v-for="(question, i) in form.questions"
            :key="i"
            direction="column"
            gap="3"
            padding="16px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
            backgroundColor="background.surface"
          >
            <MpFlex justifyContent="space-between" alignItems="center">
              <MpText size="label" weight="semiBold">Question {{ i + 1 }}</MpText>
              <MpButton
                variant="ghost"
                size="sm"
                left-icon="delete"
                aria-label="Remove question"
                @click="removeQuestion(i)"
              />
            </MpFlex>

            <MpFormControl :id="`question-title-${i}`" is-required>
              <MpFormLabel>Title</MpFormLabel>
              <MpTextarea v-model="question.title" placeholder="e.g. Apakah perusahaan memiliki fasilitas ..." />
            </MpFormControl>

            <MpFormControl :id="`question-mode-${i}`" is-required>
              <MpFormLabel>Answer Mode</MpFormLabel>
              <MpSelect v-model="question.answer_mode" is-full-width>
                <option value="Single">Single</option>
                <option value="Conditional">Conditional (Yes / No)</option>
              </MpSelect>
            </MpFormControl>

            <MpFormControl v-if="question.answer_mode === 'Single'" :id="`question-followup-${i}`">
              <MpFormLabel>Follow Up</MpFormLabel>
              <MpTextarea v-model="question.follow_up" placeholder="Instruction/notes for the answer" />
            </MpFormControl>

            <template v-else>
              <MpFormControl :id="`question-followup-yes-${i}`">
                <MpFormLabel>Follow Up — Yes</MpFormLabel>
                <MpTextarea v-model="question.follow_up_yes" placeholder="Instruction/notes when the answer is Yes" />
              </MpFormControl>
              <MpFormControl :id="`question-followup-no-${i}`">
                <MpFormLabel>Follow Up — No</MpFormLabel>
                <MpTextarea v-model="question.follow_up_no" placeholder="Instruction/notes when the answer is No" />
              </MpFormControl>
            </template>
          </MpFlex>

          <MpButton
            size="sm"
            variant="ghost"
            left-icon="add"
            is-full-width
            :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
            @click="addQuestion"
          >
            Add Question
          </MpButton>
        </MpFlex>

        <MpDivider />

        <MpFlex>
          <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Delete this?"
      message="This will set the status to Inactive. It can still be viewed and re-activated."
      @close="isConfirmingDelete = false"
      @confirm="confirmDelete"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpTextarea,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpBanner,
  MpBannerDescription,
  MpDivider,
  MpSkeleton,
  css,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useCreateMkiGriQualitative,
  useGetMkiGriQualitativeList,
  useRemoveMkiGriQualitative,
  useUpdateMkiGriQualitative,
} from '@/services/mki-gri-qualitative'
import { isSnakeCaseCode } from '@/services/mki-gri-qualitative/rules'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data: list, isPending: isLoading } = useGetMkiGriQualitativeList()
const createMutation = useCreateMkiGriQualitative()
const updateMutation = useUpdateMkiGriQualitative()
const removeMutation = useRemoveMkiGriQualitative()

const form = reactive({
  code: '',
  name: '',
  questions: [] as MkiGriQualQuestion[],
  locked: false,
})

const codeError = computed(() => {
  const code = form.code.trim()
  if (!code) return null
  if (!isSnakeCaseCode(code)) return 'Must be UPPER_SNAKE_CASE, e.g. GRI_306_WASTE.'
  const duplicate = (list.value ?? []).some((item) => item.code === code && item.id !== id)
  if (duplicate) return 'This Variable Code is already used by another indicator.'
  return null
})

const canSave = computed(
  () => Boolean(form.code && form.name && form.questions.length && !codeError.value) &&
    form.questions.every((q) => q.title),
)

function newQuestion(): MkiGriQualQuestion {
  return { title: '', answer_mode: 'Single', follow_up: '', follow_up_yes: '', follow_up_no: '' }
}

function addQuestion() {
  form.questions.push(newQuestion())
}

function removeQuestion(i: number) {
  form.questions.splice(i, 1)
}

function populateForm(item: MkiGriQualitative) {
  form.code = item.code
  form.name = item.name
  form.questions = item.questions.map((q) => ({ ...q }))
  form.locked = item.locked
}

onMounted(() => {
  if (id) {
    const found = (list.value ?? []).find((item) => item.id === id)
    if (found) populateForm(found)
  }
})

async function save() {
  if (!canSave.value) return
  const payload = { code: form.code, name: form.name, questions: form.questions.map((q) => ({ ...q })) }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'mki-gri-qual-update', variant: 'success', title: 'Indicator updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'mki-gri-qual-create', variant: 'success', title: 'Indicator created.' })
  }
  router.push('/mki-gri-qualitative')
}

async function confirmDelete() {
  if (!id) return
  await removeMutation.mutateAsync({ id })
  isConfirmingDelete.value = false
  router.push('/mki-gri-qualitative')
}
</script>
