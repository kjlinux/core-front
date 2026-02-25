<script setup lang="ts">
</script>

<template>
  <div class="h-screen w-full flex overflow-hidden">
    <!-- Left Panel - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden flex-col justify-between p-12">
      <!-- Decorative shapes -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-sidebar-hover rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 bg-sidebar-active rounded-full translate-y-1/3 -translate-x-1/3 opacity-60"></div>
      <div class="absolute top-1/2 left-1/4 w-48 h-48 border border-primary-400/20 rounded-full"></div>

      <!-- Logo -->
      <div class="relative z-10">
        <h1 class="text-4xl font-bold text-white tracking-tight">CORE TANGA</h1>
        <h2 class="text-lg font-medium text-primary-400 mt-1">GROUP</h2>
      </div>

      <!-- Center content -->
      <div class="relative z-10 space-y-6">
        <p class="text-2xl font-light text-primary-200 leading-relaxed max-w-md">
          Plateforme de gestion intelligente pour votre entreprise
        </p>
        <div class="flex gap-3">
          <div class="w-12 h-1 bg-primary-400 rounded-full"></div>
          <div class="w-8 h-1 bg-primary-500 rounded-full"></div>
          <div class="w-4 h-1 bg-primary-600 rounded-full"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10">
        <p class="text-sm text-primary-500">&copy; 2026 Core Tanga Group. Tous droits reserves.</p>
      </div>
    </div>

    <!-- Right Panel - Content -->
    <div class="w-full lg:w-1/2 flex items-center justify-center bg-primary-50 p-8 sm:p-12 lg:p-16 overflow-y-auto">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <h1 class="text-2xl font-bold text-primary-800">CORE TANGA GROUP</h1>
          <p class="mt-1 text-sm text-primary-500">Plateforme de gestion centralisee</p>
        </div>

        <slot />
      </div>
    </div>
  </div>
</template>
