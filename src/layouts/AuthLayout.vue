<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
    <div class="w-full max-w-md px-4">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-white">CORE TANGA GROUP</h1>
        <p class="mt-2 text-primary-200">Plateforme de gestion centralisee</p>
      </div>
      <div class="rounded-xl bg-white p-8 shadow-2xl">
        <slot />
      </div>
    </div>
  </div>
</template>
