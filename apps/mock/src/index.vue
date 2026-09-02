<script setup lang="ts">
import { ref } from 'vue'

const xx = ref()
const yy = ref()
</script>

<template>
  <div>
    <div ref="xxx" :label="'Curt. Exclusive\nPrice'" />
    <div label="Curt. Exclusive\nPrice" />
    <div :foo="'bar' /* comment */" />
  </div>
</template>

<style lang="scss" scoped>
a {
  grid-template-areas:
    'a a'
    'b b b';
  colr: hsl(20deg 10% 30% / 5%);
}

a {
  --Foo: 1rem;
}
</style>
