import { reactive, computed } from 'vue'

type ValidationRule = (value: unknown) => true | string
type FieldRules = Record<string, ValidationRule[]>

export function useFormValidation<T extends Record<string, unknown>>(
  formData: T,
  rules: FieldRules,
) {
  const errors = reactive<Record<string, string>>({})

  function validateField(field: string): boolean {
    const fieldRules = rules[field]
    if (!fieldRules) return true

    const value = formData[field]
    for (const rule of fieldRules) {
      const result = rule(value)
      if (result !== true) {
        errors[field] = result
        return false
      }
    }
    delete errors[field]
    return true
  }

  function validateAll(): boolean {
    let valid = true
    for (const field of Object.keys(rules)) {
      if (!validateField(field)) {
        valid = false
      }
    }
    return valid
  }

  function clearErrors() {
    for (const key of Object.keys(errors)) {
      delete errors[key]
    }
  }

  function clearField(field: string) {
    delete errors[field]
  }

  const isValid = computed(() => Object.keys(errors).length === 0)
  const hasErrors = computed(() => Object.keys(errors).length > 0)

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearField,
    isValid,
    hasErrors,
  }
}
