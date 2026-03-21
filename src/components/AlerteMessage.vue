<template>
  <div v-if="visible" class="alert d-flex justify-content-between align-items-center" :class="variantClass" role="alert">
    <span>{{ message }}</span>
    <button v-if="dismissible" type="button" class="btn-close" @click="$emit('close')" />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  message: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    default: "info"
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  visible: {
    type: Boolean,
    default: true
  }
});

defineEmits(["close"]);

const variantClass = computed(() => `alert-${props.type}`);
</script>
