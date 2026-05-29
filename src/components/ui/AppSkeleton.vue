<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  circle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: 'md',
  circle: false,
})

const roundedClass = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}[props.rounded]
</script>

<template>
  <span
    :class="['app-skeleton block bg-gray-200 dark:bg-gray-700', circle ? 'rounded-full' : roundedClass]"
    :style="{ width, height: circle ? width : height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-skeleton {
  position: relative;
  overflow: hidden;
}
.app-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.6s infinite;
}
:global(.dark) .app-skeleton::after {
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0) 100%
  );
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>
