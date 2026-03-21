<template>
  <div ref="wrapper" class="search-wrapper">
    <div class="search-bar" :class="{ 'is-focused': focused }">
      <!-- Icône gauche -->
      <span class="search-icon">
        <i class="bi bi-search" aria-hidden="true"></i>
      </span>

      <input
        :value="modelValue"
        type="text"
        class="search-input"
        :placeholder="placeholder"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.enter.prevent="emitSearch"
      />

      <!-- Clear button -->
      <button
        v-if="modelValue"
        class="search-clear"
        type="button"
        tabindex="-1"
        @click="clearInput"
        aria-label="Effacer"
      >
        <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
      </button>

      <!-- Bouton rechercher -->
      <button class="search-btn" type="button" @click="emitSearch">
        <i class="bi bi-search" aria-hidden="true"></i>
        <span class="search-btn-label">Rechercher</span>
      </button>
    </div>

    <!-- Suggestions -->
    <Transition name="suggestions">
      <ul v-if="showList" class="suggestions-list">
        <li
          v-for="suggestion in localSuggestions"
          :key="suggestion.id || suggestion.value || suggestion"
          class="suggestion-item"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          <span class="suggestion-icon">
            <i class="bi bi-clock-history" aria-hidden="true"></i>
          </span>
          <div class="suggestion-text">
            <span class="suggestion-label">{{ suggestion.label || suggestion.value || suggestion }}</span>
            <small v-if="suggestion.correction" class="suggestion-correction">
              Voulez-vous dire : {{ suggestion.correction }} ?
            </small>
          </div>
          <i class="bi bi-arrow-up-left suggestion-arrow" aria-hidden="true"></i>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRechercheStore } from "@/stores/recherche";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: {
    type: String,
    default: "Médicament, pharmacie, quartier..."
  }
});

const emit = defineEmits(["update:modelValue", "search", "selectSuggestion"]);
const rechercheStore = useRechercheStore();

let debounceTimer;
const focused = ref(false);
const wrapper = ref(null);

const localSuggestions = computed(() => rechercheStore.suggestions);
const showSuggestions  = ref(false);
const showList = computed(() => showSuggestions.value && localSuggestions.value.length > 0);

const clearInput = () => {
  emit("update:modelValue", "");
  rechercheStore.suggestions = [];
  showSuggestions.value = false;
};

const onInput = (e) => {
  const value = e.target.value;
  emit("update:modelValue", value);
  clearTimeout(debounceTimer);
  if (!value || value.trim().length < 2) {
    rechercheStore.suggestions = [];
    showSuggestions.value = false;
    return;
  }
  showSuggestions.value = true;
  debounceTimer = setTimeout(() => rechercheStore.fetchSuggestions(value), 250);
};

const emitSearch = () => {
  showSuggestions.value = false;
  rechercheStore.suggestions = [];
  emit("search");
};

const selectSuggestion = (suggestion) => {
  const value = suggestion.label || suggestion.value || suggestion;
  emit("update:modelValue", value);
  emit("selectSuggestion", value);
  rechercheStore.suggestions = [];
  showSuggestions.value = false;
};

const onFocus = () => {
  focused.value = true;
  if (localSuggestions.value.length) showSuggestions.value = true;
};

const onBlur = () => {
  focused.value = false;
  setTimeout(() => { showSuggestions.value = false; }, 150);
};

const onDocumentClick = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    showSuggestions.value = false;
  }
};

onMounted(() => document.addEventListener("click", onDocumentClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick));
</script>

<style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 16px;
}

/* ── Barre principale ────────────────────────────────────────────────────────── */
.search-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #dfe7e3;
  border-radius: 14px;
  padding: 4px 4px 4px 14px;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(13,59,46,0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar.is-focused {
  border-color: #0a7c5c;
  box-shadow: 0 0 0 3px rgba(10,124,92,0.12), 0 2px 8px rgba(13,59,46,0.06);
}

.search-icon {
  color: #9aa9a1;
  font-size: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #1b2a24;
  padding: 8px 4px;
  min-width: 0;
}

.search-input::placeholder { color: #9aa9a1; }

.search-clear {
  background: none;
  border: none;
  padding: 6px 8px;
  color: #b0bdb7;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.search-clear:hover { color: #5f726a; }

.search-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #0a7c5c;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 3px 10px rgba(10,124,92,0.25);
}
.search-btn:hover {
  background: #096a4f;
  box-shadow: 0 4px 14px rgba(10,124,92,0.35);
}
.search-btn .bi { font-size: 0.85rem; }

/* ── Suggestions ────────────────────────────────────────────────────────────── */
.suggestions-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: #ffffff;
  border: 1.5px solid #dfe7e3;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(13,59,46,0.12);
  overflow: hidden;
  list-style: none;
  margin: 0; padding: 6px;
  z-index: 30;
  max-height: 260px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.12s;
}
.suggestion-item:hover { background: #f4f8f6; }

.suggestion-icon {
  width: 30px; height: 30px;
  background: #f0f4f2;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #6c9e8a; flex-shrink: 0; font-size: 0.8rem;
}

.suggestion-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.suggestion-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1b2a24;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-correction {
  font-size: 0.75rem;
  color: #7a8f86;
}

.suggestion-arrow {
  color: #b0bdb7; font-size: 0.8rem; flex-shrink: 0;
  transition: color 0.12s;
}
.suggestion-item:hover .suggestion-arrow { color: #0a7c5c; }

/* ── Transition ─────────────────────────────────────────────────────────────── */
.suggestions-enter-active, .suggestions-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.suggestions-enter-from, .suggestions-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Mobile : masquer label du bouton ───────────────────────────────────────── */
@media (max-width: 480px) {
  .search-btn-label { display: none; }
  .search-btn { padding: 9px 12px; }
}
</style>