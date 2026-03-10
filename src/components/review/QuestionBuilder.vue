<template>
  <div class="space-y-3">
    <div
      v-for="(question, index) in questions"
      :key="index"
      class="flex items-center gap-3"
    >
      <span class="text-sm text-gray-400 w-5 text-right shrink-0">{{ index + 1 }}.</span>
      <input
        v-model="question.text"
        type="text"
        placeholder="Ex: Comment évaluez-vous notre service ?"
        class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="emit('update:modelValue', questions)"
      />
      <button
        type="button"
        class="shrink-0 text-red-400 hover:text-red-600 transition-colors"
        @click="removeQuestion(index)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <button
      v-if="questions.length < 10"
      type="button"
      class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      @click="addQuestion"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter une question
    </button>

    <p v-if="questions.length === 0" class="text-sm text-gray-400 italic">
      Aucune question configurée. Ajoutez-en une pour commencer.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Question {
  text: string
  orderIndex: number
}

const props = defineProps<{
  modelValue: Question[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Question[]]
}>()

const questions = ref<Question[]>(props.modelValue.map((q) => ({ ...q })))

watch(
  () => props.modelValue,
  (val) => {
    questions.value = val.map((q) => ({ ...q }))
  },
  { deep: true }
)

function addQuestion() {
  questions.value.push({ text: '', orderIndex: questions.value.length })
  emit('update:modelValue', questions.value)
}

function removeQuestion(index: number) {
  questions.value.splice(index, 1)
  questions.value.forEach((q, i) => (q.orderIndex = i))
  emit('update:modelValue', questions.value)
}
</script>
