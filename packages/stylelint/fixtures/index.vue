
<template>
  <div>

  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
/* stylelint-disable order/properties-order */
div {
  background-color: slategray;
  box-sizing: border-box;
  flex: 1 1 auto;
  font-size: 1.5rem;
  grid-gap: 16px;
  order: 1;
  pointer-events: all;
  position: relative;
  transition: opacity 300ms ease;
  width: 320px;
}

@tailwind base;
@tailwind components;
@tailwind utilities;
@config "./tailwind.site.config.js";

@layer base {
  h1 {
    @apply text-2xl;
  }

  h2 {
    @apply text-xl;
  }
}

@layer components {
  .btn-blue {
    @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
}

@layer utilities {
  .filter-none {
    filter: none;
  }

  .filter-grayscale {
    filter: grayscale(100%);
  }
}

.btnBlue {
  @apply btn-blue;
}

</style>

<style lang="scss" scoped>
div {
  background-color: slategray;
  box-sizing: border-box;
  flex: 1 1 auto;
  font-size: 1.5rem;
  grid-gap: 16px;
  order: 1;
  pointer-events: all;
  position: relative;
  transition: opacity 300ms ease;
  width: 320px;
}
</style>