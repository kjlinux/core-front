<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })

function setLocale(lang: 'fr' | 'en') {
  locale.value = lang
  localStorage.setItem('app_locale', lang)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      type="button"
      :class="[
        'text-sm font-medium px-2 py-1 rounded transition-colors',
        locale === 'fr'
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:text-gray-700',
      ]"
      @click="setLocale('fr')"
    >
      FR
    </button>
    <span class="text-gray-300 text-sm">|</span>
    <button
      type="button"
      :class="[
        'text-sm font-medium px-2 py-1 rounded transition-colors',
        locale === 'en'
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:text-gray-700',
      ]"
      @click="setLocale('en')"
    >
      EN
    </button>
  </div>
</template>
