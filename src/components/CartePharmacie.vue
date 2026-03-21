<template>
  <div class="carte-pharma-wrapper">
    <!-- Container principal avec ombre douce -->
    <div ref="mapContainer" class="map-container">
      <div ref="mapboxContainer" class="map-layer"></div>
      
      <!-- Overlay de chargement -->
      <div v-if="styleLoading" class="map-loader">
        <div class="loader-spinner"></div>
        <span>Chargement...</span>
      </div>
    </div>

    <!-- Contrôles regroupés et flottants (Design Glassmorphism) -->
    <div class="floating-controls">
      <!-- Groupe Gauche : Navigation -->
      <div class="control-group">
        <button 
          class="glass-btn" 
          @click="togglePlaceSearch"
          :class="{ active: showPlaceSearch }"
          title="Rechercher un lieu"
        >
          <i class="bi bi-search" aria-hidden="true"></i>
          <span class="btn-label">Rechercher</span>
        </button>
        
        <button 
          class="glass-btn locate-btn" 
          @click="locateUser"
          title="Ma position"
        >
          <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Groupe Droite : Vues -->
      <div class="control-group">
        <div v-if="isMobile" class="view-switch" role="group" aria-label="Changer de vue">
          <button
            class="view-switch-btn"
            :class="{ active: !isSatellite }"
            :disabled="styleLoading"
            @click="setSatelliteMode(false)"
            aria-pressed="!isSatellite"
          >
            Plan
          </button>
          <button
            class="view-switch-btn"
            :class="{ active: isSatellite }"
            :disabled="styleLoading"
            @click="setSatelliteMode(true)"
            aria-pressed="isSatellite"
          >
            Satellite
          </button>
        </div>
        <button 
          v-else
          class="glass-btn satellite-toggle" 
          :class="{ active: isSatellite }"
          :disabled="styleLoading"
          @click="toggleSatellite"
          title="Changer de vue"
        >
          <span class="toggle-icon">
            <i :class="isSatellite ? 'fa-solid fa-map' : 'fa-solid fa-globe'" aria-hidden="true"></i>
          </span>
          <span class="toggle-text">
            <span class="btn-label">{{ isSatellite ? "Vue plan" : "Vue satellite" }}</span>
            <span class="btn-sub">{{ isSatellite ? "Retour plan" : "Passer satellite" }}</span>
          </span>
          <span class="mode-pill">{{ isSatellite ? "PLAN" : "SAT" }}</span>
        </button>
      </div>
    </div>

    <!-- Panneau de recherche (Style carte flottante) -->
    <Transition name="slide-down">
      <div v-if="showPlaceSearch" class="search-panel glass-panel">
        <div class="search-header">
          <h6 class="m-0 fw-bold text-secondary">
            <i class="bi bi-geo-alt me-2"></i>Rechercher un lieu
          </h6>
          <button class="btn-close-custom" @click="showPlaceSearch = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div class="search-body">
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="Adresse, quartier, ville..."
              @input="onSearchInput"
              @keydown.enter.prevent="selectFirstResult"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
          
          <div v-if="searchResults.length" class="results-list">
            <button
              v-for="place in searchResults"
              :key="place.id"
              class="result-item"
              type="button"
              @click="selectPlace(place)"
            >
              <div class="result-icon">
                <i class="bi bi-geo-alt-fill"></i>
              </div>
              <div class="result-content">
                <div class="result-title">{{ place.text }}</div>
                <div class="result-subtitle">{{ place.place_name }}</div>
              </div>
              <i class="bi bi-chevron-right result-arrow"></i>
            </button>
          </div>
          
          <div class="search-footer">
            <small class="text-muted">
              <i class="bi bi-info-circle me-1"></i>
              Pour les médicaments, utilisez la barre principale
            </small>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Carte d'itinéraire (Design compact et animé) -->
    <Transition name="slide-up">
      <div v-if="routeInfo" class="route-card glass-panel">
        <div class="route-header" @click="toggleRouteCard">
          <div class="route-icon">
            <i class="bi bi-sign-turn-right-fill"></i>
          </div>
          <div class="route-info">
            <div class="route-title">Itinéraire</div>
            <div class="route-details">
              <span class="route-distance">{{ routeInfo.distance_km }} km</span>
              <span class="route-separator">•</span>
              <span class="route-duration">{{ routeInfo.duration_min }} min</span>
            </div>
          </div>
          <button class="btn-toggle" type="button">
            <i class="bi" :class="routeCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </button>
        </div>
        
        <Transition name="expand">
          <div v-if="!routeCollapsed" class="route-body">
            <div class="route-provider">
              <i class="bi bi-map me-1"></i>
              {{ routeInfo.provider }}
            </div>
            <div class="route-actions">
              <button class="btn-route-action secondary" @click="clearRoute">
                <i class="bi bi-x-lg me-1"></i> Effacer
              </button>
              <button class="btn-route-action primary">
                <i class="bi bi-box-arrow-up-right me-1"></i> Ouvrir
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Légende flottante (Minimaliste) -->
    <div class="legend-float">
      <div class="legend-item" v-for="item in legendItems" :key="item.label">
        <span class="legend-dot" :style="{ background: item.color }"></span>
        <span class="legend-text">{{ item.label }}</span>
      </div>
    </div>

    <!-- Indicateur de sélection mobile (Bottom Sheet style) -->
    <Transition name="slide-up">
      <div v-if="selectedPharmacy && isMobile" class="mobile-pharma-card">
        <div class="pharma-handle"></div>
        <div class="pharma-content">
          <h5>{{ selectedPharmacy.nom }}</h5>
          <p class="text-muted small mb-2">{{ selectedPharmacy.adresse }}</p>
          <div class="pharma-meta">
            <span class="badge" :class="selectedPharmacy.statut">
              {{ selectedPharmacy.statut === 'disponible' ? 'En stock' : 'Indisponible' }}
            </span>
            <span v-if="selectedPharmacy.prix" class="price-tag">
              {{ selectedPharmacy.prix }} FCFA
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch, computed } from "vue";
import mapboxgl from "mapbox-gl";
import coreApi from "@/api/core";

const emit = defineEmits(["route-updated"]);

const props = defineProps({
  pharmacies: { type: Array, default: () => [] },
  center:     { type: Array,  default: () => [11.5174, 3.848] },
  zoom:       { type: Number, default: 11 },
  userPosition:      { type: Array,  default: null },
  selectedPharmacy:  { type: Object, default: null },
  routeInfo:         { type: Object, default: null }
});

// ---- Styles ------------------------------------------------------------
const STYLE_PLAN = "mapbox://styles/mapbox/streets-v12";

const buildEsriSatelliteStyle = () => ({
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sprite: "mapbox://sprites/mapbox/streets-v12",
  sources: {
    "esri-imagery": {
      type: "raster",
      tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS"
    },
    "esri-labels": {
      type: "raster",
      tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri"
    }
  },
  layers: [
    { id: "esri-imagery-layer", type: "raster", source: "esri-imagery" },
    { id: "esri-labels-layer",  type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.65 } }
  ]
});

const MAP_MODE_KEY = "pharmamap_map_mode";

const ROUTE_SOURCE_ID        = "route-source";
const ROUTE_LAYER_ID         = "route-layer";
const PHARM_SOURCE_ID        = "pharmacies-source";
const PHARM_LAYER_ID         = "pharmacies-unclustered";
const PHARM_CLUSTER_LAYER_ID = "pharmacies-clusters";
const PHARM_CLUSTER_COUNT_ID = "pharmacies-cluster-count";

const mapboxContainer = ref(null);
const mapContainer    = ref(null);
const isSatellite     = ref(false);
const searchQuery     = ref("");
const searchResults   = ref([]);
const showPlaceSearch = ref(false);
const routeCollapsed  = ref(false);
const styleLoading    = ref(false);
const isMobile        = ref(window.innerWidth < 768);

let map;
let userMarker;
let searchMarker;
let pharmacyHandlersBound = false;
let lastRouteGeometry     = null;

// Légende dynamique
const legendItems = computed(() => [
  { label: "Disponible", color: "#0a7c5c" },
  { label: "Indisponible", color: "#6c757d" },
  { label: "Livraison bientôt", color: "#f59e0b" },
  { label: "Votre position", color: "#1b2a24" }
]);

const toggleRouteCard = () => { routeCollapsed.value = !routeCollapsed.value; };

const getStatusColor = (statut) => {
  if (statut === "disponible")   return "#0a7c5c";
  if (statut === "indisponible") return "#6c757d";
  if (statut === "bientot" || statut === "livraison") return "#f59e0b";
  return "#0a7c5c";
};

const createUserMarkerEl = () => {
  const el = document.createElement("div");
  el.className = "user-marker-enhanced";
  el.innerHTML = `
    <div class="user-marker-core"></div>
    <div class="user-marker-pulse"></div>
    <div class="user-marker-pulse-delayed"></div>
  `;
  return el;
};

const getCoordsFromPharmacy = (ph) => {
  if (!ph) return null;
  const lng = Number(ph.longitude ?? ph.lng ?? ph.lon ?? ph.long ?? ph.longitude_deg);
  const lat = Number(ph.latitude  ?? ph.lat ?? ph.latitude_deg);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return [lng, lat];
};

const buildPharmacyGeoJson = () => ({
  type: "FeatureCollection",
  features: props.pharmacies.map((ph) => {
    const coords = getCoordsFromPharmacy(ph);
    if (!coords) return null;
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: coords },
      properties: {
        id: ph.id,
        nom: ph.nom || "Pharmacie",
        adresse: ph.adresse || "",
        prix: ph.prix || "",
        distance_km: ph.distance_km ?? "",
        statut: ph.statut === "livraison" ? "bientot" : (ph.statut || "info")
      }
    };
  }).filter(Boolean)
});

const PIN_DEFS = [
  { key: "disponible",   color: "#0a7c5c" },
  { key: "indisponible", color: "#6c757d" },
  { key: "bientot",      color: "#f59e0b" },
  { key: "default",      color: "#0a7c5c" }
];

const buildPinSvg = (color) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M24 2c-7.18 0-13 5.82-13 13 0 9.76 13 27 13 27s13-17.24 13-27c0-7.18-5.82-13-13-13z" fill="${color}" filter="url(#shadow)"/>
    <circle cx="24" cy="15" r="6" fill="#ffffff"/>
    <path d="M22.5 11.5h3v7h-3z" fill="${color}"/>
    <path d="M20 14h7v3h-7z" fill="${color}"/>
  </svg>`;

const loadPinImages = () =>
  Promise.all(PIN_DEFS.map(({ key, color }) =>
    new Promise((resolve) => {
      const id = `pharma-pin-${key}`;
      if (map.hasImage(id)) { resolve(); return; }
      const img = new Image(48, 48);
      img.onload = () => { map.addImage(id, img, { pixelRatio: 2 }); resolve(); };
      img.onerror = resolve;
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildPinSvg(color))}`;
    })
  ));

const addPharmacyLayers = () => {
  if (!map || map.getSource(PHARM_SOURCE_ID)) return;

  map.addSource(PHARM_SOURCE_ID, {
    type: "geojson",
    data: buildPharmacyGeoJson(),
    cluster: true, clusterRadius: 50, clusterMaxZoom: 14
  });

  map.addLayer({
    id: PHARM_CLUSTER_LAYER_ID, type: "circle",
    source: PHARM_SOURCE_ID, filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#bcded3", 20, "#6fc5b0", 50, "#0a7c5c"],
      "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 50, 22],
      "circle-stroke-color": "#ffffff", "circle-stroke-width": 2
    }
  });

  map.addLayer({
    id: PHARM_CLUSTER_COUNT_ID, type: "symbol",
    source: PHARM_SOURCE_ID, filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
    paint: { "text-color": "#0d3b2e" }
  });

  map.addLayer({
    id: PHARM_LAYER_ID, type: "symbol",
    source: PHARM_SOURCE_ID, filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["match", ["get", "statut"],
        "disponible",   "pharma-pin-disponible",
        "indisponible", "pharma-pin-indisponible",
        "bientot",      "pharma-pin-bientot",
        "pharma-pin-default"],
      "icon-size": 0.75, "icon-allow-overlap": true,
      "text-field": ["get", "nom"], "text-size": 11,
      "text-offset": [0, 1.2], "text-optional": true
    },
    paint: {
      "text-color":       isSatellite.value ? "#ffffff" : "#1b2a24",
      "text-halo-color":  isSatellite.value ? "rgba(0,0,0,0.65)" : "#ffffff",
      "text-halo-width": 1
    }
  });

  if (!pharmacyHandlersBound) {
    map.on("click", PHARM_CLUSTER_LAYER_ID, (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: [PHARM_CLUSTER_LAYER_ID] });
      if (!f.length) return;
      map.getSource(PHARM_SOURCE_ID).getClusterExpansionZoom(
        f[0].properties.cluster_id,
        (err, zoom) => { if (!err) map.easeTo({ center: f[0].geometry.coordinates, zoom }); }
      );
    });

    map.on("click", PHARM_LAYER_ID, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const coords = feature.geometry.coordinates.slice();
      const p = feature.properties || {};
      const details = [];
      if (p.prix) details.push(`Prix : ${p.prix} FCFA`);
      if (p.distance_km) details.push(`Distance : ${p.distance_km} km`);
      const statusHtml = {
        disponible:   '<span style="color:#0a7c5c;font-weight:700">✓ En stock</span>',
        indisponible: '<span style="color:#6c757d">✕ Indisponible</span>',
        bientot:      '<span style="color:#f59e0b">Livraison bientôt disponible</span>'
      }[p.statut] || "";

      new mapboxgl.Popup({ 
        offset: 12, 
        closeButton: false,
        className: 'custom-popup'
      })
        .setLngLat(coords)
        .setHTML(`
          <div class="popup-header">
            <strong>${p.nom || "Pharmacie"}</strong>
          </div>
          <div class="popup-status">${statusHtml}</div>
          <div class="popup-address">${p.adresse || ""}</div>
          ${details.length ? `<div class="popup-details">${details.join(" • ")}</div>` : ""}
        `)
        .addTo(map);

      map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 15), speed: 0.9 });
    });

    map.on("mouseenter", PHARM_LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", PHARM_LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
    pharmacyHandlersBound = true;
  }
};

const reloadLayersAfterStyle = async () => {
  pharmacyHandlersBound = false;
  await loadPinImages();
  ensureRouteLayer();
  addPharmacyLayers();
  updateUserMarker();
  if (lastRouteGeometry) {
    map.getSource(ROUTE_SOURCE_ID)?.setData({
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: lastRouteGeometry }]
    });
  }
  if (map.getLayer(PHARM_LAYER_ID)) {
    map.setPaintProperty(PHARM_LAYER_ID, "text-color",      isSatellite.value ? "#ffffff"         : "#1b2a24");
    map.setPaintProperty(PHARM_LAYER_ID, "text-halo-color", isSatellite.value ? "rgba(0,0,0,0.65)" : "#ffffff");
  }
};

const ensurePharmacyLayers = async () => {
  if (!map) return;
  await loadPinImages();
  addPharmacyLayers();
};

const updatePharmacySource = () => {
  const source = map?.getSource(PHARM_SOURCE_ID);
  if (!source) { ensurePharmacyLayers(); return; }
  source.setData(buildPharmacyGeoJson());
};

const ensureRouteLayer = () => {
  if (!map || map.getSource(ROUTE_SOURCE_ID)) return;
  map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: ROUTE_LAYER_ID, type: "line", source: ROUTE_SOURCE_ID,
    paint: { "line-color": "#0d6efd", "line-width": 4, "line-opacity": 0.9 }
  });
};

const clearRoute = () => {
  map?.getSource(ROUTE_SOURCE_ID)?.setData({ type: "FeatureCollection", features: [] });
  lastRouteGeometry = null;
  emit("route-updated", null);
};

const setRouteGeometry = (geometry, info) => {
  if (!geometry) return;
  lastRouteGeometry = geometry;
  map?.getSource(ROUTE_SOURCE_ID)?.setData({
    type: "FeatureCollection", features: [{ type: "Feature", geometry }]
  });
  emit("route-updated", info);
};

const updateRoute = async () => {
  if (!props.selectedPharmacy || !props.userPosition) { clearRoute(); return; }
  const dest = getCoordsFromPharmacy(props.selectedPharmacy);
  if (!dest) { clearRoute(); return; }
  try {
    const { data } = await coreApi.getItineraire({
      start_lng: props.userPosition[0], start_lat: props.userPosition[1],
      end_lng: dest[0], end_lat: dest[1]
    });
    setRouteGeometry(data.geometry, { distance_km: data.distance_km, duration_min: data.duration_min, provider: data.provider });
    const bounds = new mapboxgl.LngLatBounds(props.userPosition, props.userPosition);
    bounds.extend(dest);
    map?.fitBounds(bounds, { padding: 80, duration: 900 });
  } catch { clearRoute(); }
};

const updateUserMarker = () => {
  if (!map || !props.userPosition) return;
  if (userMarker) userMarker.remove();
  userMarker = new mapboxgl.Marker({ element: createUserMarkerEl() })
    .setLngLat(props.userPosition)
    .setPopup(new mapboxgl.Popup({ offset: 8 }).setText("Votre position"))
    .addTo(map);
};

const initMapbox = () => {
  const savedMode = localStorage.getItem(MAP_MODE_KEY);
  isSatellite.value = savedMode === "satellite";

  map = new mapboxgl.Map({
    container: mapboxContainer.value,
    style: isSatellite.value ? buildEsriSatelliteStyle() : STYLE_PLAN,
    center: props.userPosition || props.center,
    zoom: props.zoom,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  map.on("load", async () => {
    ensureRouteLayer();
    await ensurePharmacyLayers();
    updateUserMarker();
    updateRoute();
  });
};

const toggleSatellite = () => {
  if (styleLoading.value || !map) return;
  styleLoading.value = true;
  isSatellite.value = !isSatellite.value;
  localStorage.setItem(MAP_MODE_KEY, isSatellite.value ? "satellite" : "plan");
  map.setStyle(isSatellite.value ? buildEsriSatelliteStyle() : STYLE_PLAN, { diff: false });
  map.once("style.load", async () => {
    await reloadLayersAfterStyle();
    styleLoading.value = false;
  });
};

const setSatelliteMode = (next) => {
  if (styleLoading.value || !map) return;
  if (next === isSatellite.value) return;
  toggleSatellite();
};

const locateUser = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const coords = [pos.coords.longitude, pos.coords.latitude];
    map?.flyTo({ center: coords, zoom: 15, duration: 1000 });
    // Le marqueur se mettra à jour via le watcher de props.userPosition
  });
};

// ---- Lifecycle --------------------------------------------------------
onMounted(() => { 
  initMapbox();
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768;
  });
});

watch(() => props.pharmacies, () => updatePharmacySource(), { deep: true });
watch(() => props.userPosition, (pos) => {
  updateUserMarker(); updateRoute();
  if (pos && map) map.easeTo({ center: pos, duration: 700 });
}, { deep: true });
watch(() => props.selectedPharmacy, () => updateRoute(), { deep: true });
watch(() => props.routeInfo, (info) => { if (!info) routeCollapsed.value = false; });

onBeforeUnmount(() => {
  if (userMarker)   userMarker.remove();
  if (searchMarker) searchMarker.remove();
  if (map)          map.remove();
});

// ---- Recherche de lieu -----------------------------------------------
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
let searchTimer;

const searchPlaces = async () => {
  if (!MAPBOX_TOKEN || !searchQuery.value.trim()) { searchResults.value = []; return; }
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery.value)}.json?limit=5&language=fr&access_token=${MAPBOX_TOKEN}`;
    const data = await (await fetch(url)).json();
    searchResults.value = data.features || [];
  } catch { searchResults.value = []; }
};

const onSearchInput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(searchPlaces, 300); };

const selectPlace = (place) => {
  if (!place?.center) return;
  searchResults.value = [];
  showPlaceSearch.value = false;
  map?.flyTo({ center: place.center, zoom: 15, speed: 0.9 });
  if (!searchMarker) {
    searchMarker = new mapboxgl.Marker({ color: "#0a7c5c" }).setLngLat(place.center).addTo(map);
  } else {
    searchMarker.setLngLat(place.center);
  }
};

const selectFirstResult = () => {
  if (searchResults.value.length) selectPlace(searchResults.value[0]); else searchPlaces();
};
</script>

<style scoped>
.carte-pharma-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(13, 59, 46, 0.1);
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: #f0f4f2;
  border-radius: 18px;
  border: 1px solid rgba(13, 59, 46, 0.08);
  box-shadow: 0 14px 32px rgba(13, 59, 46, 0.12);
  overflow: hidden;
}

.map-layer { 
  position: absolute; 
  inset: 0; 
  border-radius: 18px;
}

.map-loader {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  gap: 12px;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(2, 195, 154, 0.2);
  border-top-color: #02c39a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Contrôles flottants Glassmorphism */
.floating-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
  pointer-events: none;
}

.control-group {
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.glass-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(13, 59, 46, 0.1);
  color: #0d3b2e;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(13, 59, 46, 0.15);
  background: white;
}

.glass-btn.active {
  background: linear-gradient(135deg, #0a7c5c 0%, #0d3b2e 100%);
  color: white;
  border-color: rgba(10, 124, 92, 0.6);
  box-shadow: 0 8px 22px rgba(10, 124, 92, 0.25);
}

.satellite-toggle {
  border-color: rgba(10, 124, 92, 0.35);
  background: linear-gradient(135deg, rgba(10,124,92,0.08), rgba(255,255,255,0.98));
  min-width: 190px;
}

.satellite-toggle .toggle-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(10,124,92,0.12);
  color: #0a7c5c;
  font-size: 1rem;
}

.satellite-toggle.active .toggle-icon {
  background: rgba(255,255,255,0.18);
  color: #ffffff;
}

.satellite-toggle .toggle-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.satellite-toggle .btn-sub {
  font-size: 0.72rem;
  color: #5f726a;
}

.satellite-toggle.active .btn-sub {
  color: rgba(255,255,255,0.8);
}

.satellite-toggle .mode-pill {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(10,124,92,0.25);
  background: rgba(10,124,92,0.08);
  color: #0a7c5c;
}

.satellite-toggle.active .mode-pill {
  border-color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.18);
  color: #ffffff;
}

/* Mobile view switch */
.view-switch {
  width: min(100%, 240px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(10,124,92,0.2);
  padding: 3px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(13, 59, 46, 0.12);
}

.view-switch-btn {
  border: none;
  border-radius: 7px;
  padding: 6px 5px;
  font-weight: 700;
  font-size: 0.72rem;
  color: #0d3b2e;
  background: #ffffff;
  transition: all 0.2s ease;
}

.view-switch-btn.active {
  background: linear-gradient(135deg, #0a7c5c 0%, #0d3b2e 100%);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(10, 124, 92, 0.2);
}

.view-switch-btn:disabled {
  opacity: 0.6;
}

.glass-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-label {
  display: inline;
}

.locate-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
  color: #02c39a;
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .floating-controls {
    top: 12px;
    left: 12px;
    right: 12px;
    flex-direction: column;
    gap: 10px;
  }

  .control-group {
    width: 100%;
  }

  .control-group:first-child {
    justify-content: space-between;
  }

  .control-group:last-child {
    justify-content: flex-end;
  }
}

/* Panneau de recherche */
.search-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 360px;
  max-width: calc(100% - 40px);
  z-index: 20;
  border-radius: 16px;
  overflow: hidden;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 20px 50px rgba(13, 59, 46, 0.15);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(223, 231, 227, 0.5);
}

.btn-close-custom {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(223, 231, 227, 0.4);
  color: #6b8a7d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-custom:hover {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.search-body {
  padding: 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #9ab5a8;
  font-size: 1.1rem;
}

.search-input {
  width: 100%;
  padding: 14px 40px 14px 48px;
  border: 2px solid rgba(223, 231, 227, 0.6);
  border-radius: 12px;
  font-size: 1rem;
  color: #0d3b2e;
  background: white;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: rgba(2, 195, 154, 0.4);
  box-shadow: 0 0 0 4px rgba(2, 195, 154, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ab5a8;
  cursor: pointer;
  padding: 8px;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #dc3545;
}

.results-list {
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(248, 250, 249, 0.8);
}

.result-item {
  width: 100%;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  border-bottom: 1px solid rgba(223, 231, 227, 0.4);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: rgba(2, 195, 154, 0.05);
}

.result-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(2, 195, 154, 0.1);
  color: #02c39a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 600;
  color: #0d3b2e;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-subtitle {
  font-size: 0.85rem;
  color: #9ab5a8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-arrow {
  color: #9ab5a8;
  font-size: 0.9rem;
}

.search-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(223, 231, 227, 0.4);
}

/* Carte d'itinéraire */
.route-card {
  position: absolute;
  right: 20px;
  top: 80px;
  width: 300px;
  max-width: calc(100% - 40px);
  z-index: 15;
  border-radius: 16px;
  overflow: hidden;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.6);
  transition: background 0.2s;
}

.route-header:hover {
  background: rgba(255, 255, 255, 0.9);
}

.route-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.route-info {
  flex: 1;
}

.route-title {
  font-size: 0.85rem;
  color: #6b8a7d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.route-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.route-distance {
  font-weight: 700;
  color: #0d3b2e;
  font-size: 1.1rem;
}

.route-separator {
  color: #9ab5a8;
}

.route-duration {
  font-weight: 600;
  color: #02c39a;
  font-size: 1.1rem;
}

.btn-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(223, 231, 227, 0.4);
  color: #6b8a7d;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background: rgba(2, 195, 154, 0.1);
  color: #0a7c5c;
}

.route-body {
  padding: 0 20px 20px;
  background: rgba(255, 255, 255, 0.6);
}

.route-provider {
  font-size: 0.85rem;
  color: #6b8a7d;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.route-actions {
  display: flex;
  gap: 10px;
}

.btn-route-action {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-route-action.secondary {
  background: rgba(223, 231, 227, 0.6);
  color: #4a6358;
}

.btn-route-action.secondary:hover {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.btn-route-action.primary {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 59, 46, 0.2);
}

.btn-route-action.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(13, 59, 46, 0.3);
}

/* Légende flottante */
.legend-float {
  position: absolute;
  left: 20px;
  bottom: 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(13, 59, 46, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #4a6358;
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

/* Mobile Card */
.mobile-pharma-card {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 -10px 40px rgba(13, 59, 46, 0.2);
  z-index: 30;
}

.pharma-handle {
  width: 40px;
  height: 4px;
  background: rgba(13, 59, 46, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.pharma-content h5 {
  color: #0d3b2e;
  font-weight: 700;
  margin-bottom: 8px;
}

.pharma-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge {
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.disponible {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.badge.indisponible {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.price-tag {
  font-weight: 700;
  color: #0a7c5c;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Markers améliorés */
:global(.user-marker-enhanced) {
  position: relative;
  width: 24px;
  height: 24px;
}

:global(.user-marker-core) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #0066ff;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.4);
  z-index: 3;
}

:global(.user-marker-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0, 102, 255, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
  z-index: 2;
}

:global(.user-marker-pulse-delayed) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0, 102, 255, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s infinite 0.5s;
  z-index: 1;
}

@keyframes :global(pulse-ring) {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

:global(.custom-popup .mapboxgl-popup-content) {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 10px 40px rgba(13, 59, 46, 0.2);
  border: none;
  min-width: 200px;
}

:global(.custom-popup .mapboxgl-popup-tip) {
  border-top-color: white;
  border-width: 8px;
}

:global(.popup-header) {
  margin-bottom: 8px;
}

:global(.popup-header strong) {
  color: #0d3b2e;
  font-size: 1.1rem;
  font-weight: 700;
}

:global(.popup-status) {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

:global(.popup-address) {
  color: #6b8a7d;
  font-size: 0.9rem;
  margin-bottom: 8px;
  line-height: 1.4;
}

:global(.popup-details) {
  color: #0a7c5c;
  font-weight: 600;
  font-size: 0.9rem;
  padding-top: 8px;
  border-top: 1px solid rgba(223, 231, 227, 0.6);
}

/* Responsive */
@media (max-width: 768px) {
  .carte-pharma-wrapper {
    border-radius: 0;
    height: 100vh;
  }
  
  .glass-btn .btn-label {
    display: none;
  }
  
  .glass-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    justify-content: center;
  }
  
  .search-panel {
    left: 10px;
    right: 10px;
    width: auto;
    top: 70px;
  }
  
  .route-card {
    left: 10px;
    right: 10px;
    width: auto;
    top: auto;
    bottom: 20px;
  }
  
  .legend-float {
    display: none;
  }
  
  .floating-controls {
    left: 10px;
    right: 10px;
    top: 10px;
  }
}
</style>
