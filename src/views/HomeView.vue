<template>
  <!-- Écran de chargement initial -->
  <AppLoader :visible="isInitializing" :duration="3000" />
  
  <div class="home-page" v-show="!isInitializing">
    <NavBar />

    <div class="container-xl py-3">

      <!-- ── En-tête ─────────────────────────────────────────────────────── -->
      <div class="page-header mb-3">
        <div>
          <div class="greeting-pill">
            <span class="greeting-dot" aria-hidden="true"></span>
            {{ greeting }}
          </div>

          <h1 class="page-title">Carte des pharmacies</h1>
          <p class="page-subtitle">
            Recherchez un médicament et visualisez les pharmacies proches.
          </p>
        </div>
      </div>

      <!-- ── Alerte ──────────────────────────────────────────────────────── -->
      <AlerteMessage
        v-if="rechercheStore.error"
        :message="rechercheStore.error"
        type="danger"
      />

      <!-- ── Carrousel ───────────────────────────────────────────────────── -->
      <AdBanners />

      <!-- ── Recherche ───────────────────────────────────────────────────── -->
      <BarreRecherche
        v-model="query"
        class="mb-2"
        @search="onSearch"
        @selectSuggestion="onSuggestionSelected"
      />

      <!-- ── Chips rapides ───────────────────────────────────────────────── -->
      <div class="quick-chips mb-2">
        <button
          v-for="chip in quickSearches"
          :key="chip.term"
          class="chip"
          @click="onQuickSearch(chip.term)"
        >
          <i :class="chip.icon" aria-hidden="true"></i>
          {{ chip.term }}
        </button>
      </div>

      <!-- ── Carte ───────────────────────────────────────────────────────── -->
      <div class="map-panel">
        <div class="map-panel__header">
          <div>
            <div class="map-panel__title">Carte interactive</div>
            <div class="map-panel__subtitle">Vue satellite disponible pour plus de détails</div>
          </div>
          <div class="map-panel__badge">Live</div>
        </div>
        <div class="map-panel__body">
          <CartePharmacie
            :pharmacies="rechercheStore.results"
            :center="mapCenter"
            :user-position="userPosition"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import CartePharmacie from "@/components/CartePharmacie.vue";
import BarreRecherche from "@/components/BarreRecherche.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import AdBanners from "@/components/AdBanners.vue";
import AppLoader from "@/components/AppLoader.vue";
import { useRechercheStore } from "@/stores/recherche";

const router = useRouter();
const rechercheStore = useRechercheStore();

const query        = ref("");
const userPosition = ref(null);
const isInitializing = ref(true);
const INIT_KEY = "pharmamap_init_seen";

const YAOUNDE = [11.5174, 3.848];
const CAMEROUN_BOUNDS = { minLat: 1.65, maxLat: 13.08, minLng: 8.4, maxLng: 16.2 };

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  if (h >= 18 && h < 22) return "Bonsoir";
  return "Bonne nuit";
});

// Font Awesome 6 Free — icônes médicament pour les chips
const quickSearches = [
  { term: "Paracétamol",  icon: "fa-solid fa-pills" },
  { term: "Doliprane",    icon: "fa-solid fa-capsules" },
  { term: "Amoxicilline", icon: "fa-solid fa-syringe" },
  { term: "Ibuprofène",   icon: "fa-solid fa-tablets" },
  { term: "Vitamines",    icon: "fa-solid fa-leaf" },
  { term: "Sérum oral",   icon: "fa-solid fa-droplet" },
];

const mapCenter = computed(() => userPosition.value || YAOUNDE);

const getSearchParams = () =>
  userPosition.value
    ? { lng: userPosition.value[0], lat: userPosition.value[1] }
    : {};

const onSearch = async () => {
  await rechercheStore.search(query.value, getSearchParams());
  router.push({ path: "/resultats", query: { q: query.value } });
};

const onSuggestionSelected = async (value) => {
  query.value = value;
  await onSearch();
};

const onQuickSearch = async (term) => {
  query.value = term;
  await rechercheStore.search(term, getSearchParams());
  router.push({ path: "/resultats", query: { q: term } });
};

const loadGeolocation = () => {
  if (!navigator.geolocation) { userPosition.value = YAOUNDE; return; }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { longitude: lng, latitude: lat } = coords;
      const inCameroon =
        lat >= CAMEROUN_BOUNDS.minLat && lat <= CAMEROUN_BOUNDS.maxLat &&
        lng >= CAMEROUN_BOUNDS.minLng && lng <= CAMEROUN_BOUNDS.maxLng;
      userPosition.value = inCameroon ? [lng, lat] : YAOUNDE;
    },
    () => { userPosition.value = YAOUNDE; },
    { enableHighAccuracy: true, timeout: 5000 }
  );
};

onMounted(async () => {
  await rechercheStore.loadAllPharmacies();
  loadGeolocation();

  const alreadySeen = sessionStorage.getItem(INIT_KEY) === "1";
  if (alreadySeen) {
    isInitializing.value = false;
    return;
  }
  sessionStorage.setItem(INIT_KEY, "1");
  setTimeout(() => {
    isInitializing.value = false;
  }, 3000);
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbf9 0%, #ffffff 55%, #f4f9f6 100%);
}

/* ── Salutation ──────────────────────────────────────────────────────────────── */
.greeting-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(10,124,92,0.08);
  border: 1px solid rgba(10,124,92,0.15);
  border-radius: 999px;
  padding: 4px 12px 4px 9px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #0a6644;
  margin-bottom: 8px;
}

.greeting-dot {
  width: 7px; height: 7px;
  border-radius: 50%; background: #0a7c5c;
  animation: dotPulse 2.4s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}

/* ── Chips ───────────────────────────────────────────────────────────────────── */
.quick-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 7px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.quick-chips::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1.5px solid #dfe7e3;
  border-radius: 999px;
  padding: 6px 14px 6px 10px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #2d4a40;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(13,59,46,0.05);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.chip i {
  font-size: 0.8rem;
  color: #0a7c5c;
  width: 14px;
  text-align: center;
}
.chip:hover {
  border-color: #0a7c5c;
  background: #f0faf5;
  box-shadow: 0 3px 10px rgba(10,124,92,0.12);
  transform: translateY(-1px);
}

/* ── Map panel ─────────────────────────────────────────────────────────────── */
.map-panel {
  margin-top: 10px;
  background: #ffffff;
  border: 1px solid rgba(223,231,227,0.9);
  border-radius: 16px;
  box-shadow: 0 16px 34px rgba(13,59,46,0.08);
  overflow: hidden;
}
.map-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(223,231,227,0.8);
  background: linear-gradient(90deg, rgba(10,124,92,0.06), rgba(255,255,255,0.6));
}
.map-panel__title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1b2a24;
}
.map-panel__subtitle {
  font-size: 0.78rem;
  color: #5f726a;
}
.map-panel__badge {
  background: rgba(10,124,92,0.12);
  color: #0a6644;
  border: 1px solid rgba(10,124,92,0.2);
  font-weight: 700;
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 999px;
}
.map-panel__body {
  padding: 10px;
  height: 950px; 

}

.map-panel :deep(.carte-pharma-wrapper) {
  box-shadow: none;
  border-radius: 14px;
}
</style>
