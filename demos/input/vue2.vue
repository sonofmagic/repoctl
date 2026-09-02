<script setup>
import { computed, ref } from 'vue'

const inputValue = ref('')
const todoItems = ref([])

function handleClick() {
  todoItems.value.push({
    id: Math.random().toString(36).slice(-8),
    done: false,
    text: inputValue.value,
  })
  inputValue.value = ''
}

const buttonColor = computed(() => (inputValue.value ? 'black' : 'white'))
const buttonPointerEvents = computed(() =>
  inputValue.value ? 'initial' : 'none',
)

aaa
</script>

<template>
  <input v-model="inputValue">
  <button class="add-button" @click="handleClick">
    Add ToDo
  </button>
  <ul class="todo-list">
    <li
      v-for="(todo, index) in todoItems"
      :key="todo.id"
      class="todo-item"
      :class="{ 'todo-item--done': todo.done }"
      @click="todo.done = !todo.done"
    >
      <span v-if="todo.done">✓</span> {{ todo.text }}
    </li>
  </ul>
</template>

<style>
.add-button {
  color: v-bind(buttoncolor);
  pointer-events: v-bind("inputValue ? 'initial' : 'none'");
}

.todo-list {
  list-style: none;
}

.todo-item {
  background-color: #eef;
}

.todo-item--done {
  color: #fff;
  background-color: #3fb983;
}
</style>
