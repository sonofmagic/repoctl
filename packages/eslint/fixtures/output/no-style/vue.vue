<script setup>
// Define reactive data and props
import { ref  } from 'vue';

const greeting = ref(`Hello, Vue 3!${  1}`);
const counter = ref(0)
const doubled = computed(() => counter.value * 2);

// Define a function
const incrementCounter = () => {
  counter.value++;
};

const _zero = doubled.value + counter.value
</script>

<script>
export default {
  name: 'Counter',
  props: {
    msg: String,
  },
  data(){
    return {
      aaa
    }
  }
};
</script>

<template>
  <div>
    <h1>
      {{ greeting }}
    </h1>
    <button @click="incrementCounter">
      Click me!
    </button>
    <p>Counter: {{ counter }}</p>
  </div>
</template>