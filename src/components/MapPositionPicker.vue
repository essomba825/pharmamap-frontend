<template>
  <div class="position-picker">
    <div class="picker-header">
      <div class="picker-info">
        <div class="picker-icon">
          <i class="fa-solid fa-location-dot"></i>
        </div>
        <div class="picker-text">
          <h4>Positionnez votre pharmacie</h4>
          <p>Cliquez sur la carte ou utilisez votre localisation</p>
        </div>
      </div>
      <div class="picker-actions">
        <button type="button" class="btn-map" @click="toggleSatellite">
          <i :class="isSatellite ? 'fa-solid fa-map' : 'fa-solid fa-satellite'"></i>
          <span>{{ isSatellite ? "Plan" : "Satellite" }}</span>
        </button>
        <button type="button" class="btn-map btn-map-primary" @click="useCurrentPosition">
          <i class="fa-solid fa-crosshairs"></i>
          <span>Ma position</span>
        </button>
      </div>
    </div>
    <div ref="containerRef" class="picker-map"></div>
    <div v-if="props.latitude && props.longitude" class="coordinates-badge">
      <i class="fa-solid fa-check-circle"></i>
      <span>{{ props.latitude.toFixed(6) }}, {{ props.longitude.toFixed(6) }}</span>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import mapboxgl from "mapbox-gl";

const props = defineProps({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null }
});

const emit = defineEmits(["update:latitude", "update:longitude"]);

const containerRef = ref(null);
const isSatellite = ref(false);
let map;
let marker;

const MAPBOX_STREET_STYLE = "mapbox://styles/mapbox/streets-v12";
const getEsriSatStyle = () => ({
  version: 8,
  sprite: "mapbox://sprites/mapbox/streets-v12",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {
    "arcgis-satellite": {
      type: "raster",
      tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri"
    },
    "arcgis-transport": {
      type: "raster",
      tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri"
    },
    "arcgis-labels": {
      type: "raster",
      tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri"
    }
  },
  layers: [
    { id: "arcgis-satellite", type: "raster", source: "arcgis-satellite" },
    { id: "arcgis-transport", type: "raster", source: "arcgis-transport" },
    { id: "arcgis-labels", type: "raster", source: "arcgis-labels" }
  ]
});

const getInitialCenter = () => {
  if (props.longitude && props.latitude) {
    return [props.longitude, props.latitude];
  }
  return [9.7043, 4.0511];
};

const setMarker = (lng, lat, pan = false) => {
  if (!map) return;
  if (!marker) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
    
    marker = new mapboxgl.Marker({ 
      element: el,
      draggable: true 
    })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lng: newLng, lat: newLat } = marker.getLngLat();
      emit("update:longitude", Number(newLng.toFixed(6)));
      emit("update:latitude", Number(newLat.toFixed(6)));
    });
  } else {
    marker.setLngLat([lng, lat]);
  }

  if (pan) {
    map.easeTo({ center: [lng, lat], duration: 800, easing: t => t * (2 - t) });
  }
};

const useCurrentPosition = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lng = Number(position.coords.longitude.toFixed(6));
      const lat = Number(position.coords.latitude.toFixed(6));
      emit("update:longitude", lng);
      emit("update:latitude", lat);
      setMarker(lng, lat, true);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 8000 }
  );
};

onMounted(() => {
  map = new mapboxgl.Map({
    container: containerRef.value,
    style: MAPBOX_STREET_STYLE,
    center: getInitialCenter(),
    zoom: 13,
    attributionControl: false
  });

  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

  map.on("load", () => {
    if (props.longitude && props.latitude) {
      setMarker(props.longitude, props.latitude);
    }
  });

  map.on("click", (event) => {
    const lng = Number(event.lngLat.lng.toFixed(6));
    const lat = Number(event.lngLat.lat.toFixed(6));
    emit("update:longitude", lng);
    emit("update:latitude", lat);
    setMarker(lng, lat);
  });
});

watch(
  () => [props.longitude, props.latitude],
  ([lng, lat]) => {
    if (!map || lng === null || lat === null || Number.isNaN(lng) || Number.isNaN(lat)) return;
    setMarker(lng, lat);
  }
);

onBeforeUnmount(() => {
  if (map) map.remove();
});

const applyStyle = (style) => {
  if (!map) return;
  map.setStyle(style, { diff: false });
  map.once("style.load", () => {
    if (props.longitude && props.latitude) {
      setMarker(props.longitude, props.latitude);
    }
  });
};

const toggleSatellite = () => {
  isSatellite.value = !isSatellite.value;
  applyStyle(isSatellite.value ? getEsriSatStyle() : MAPBOX_STREET_STYLE);
};
</script>

<style scoped>
.position-picker {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(13, 59, 46, 0.06);
  border: 1px solid rgba(223, 231, 227, 0.6);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%);
  border-bottom: 1px solid rgba(223, 231, 227, 0.4);
  gap: 16px;
  flex-wrap: wrap;
}

.picker-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.picker-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(2, 195, 154, 0.1) 0%, rgba(2, 195, 154, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #02c39a;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.picker-text h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0d3b2e;
}

.picker-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b8a7d;
}

.picker-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-map {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(223, 231, 227, 0.8);
  background: white;
  color: #4a6358;
}

.btn-map:hover {
  border-color: rgba(2, 195, 154, 0.4);
  background: rgba(2, 195, 154, 0.03);
  transform: translateY(-1px);
}

.btn-map i {
  font-size: 0.9rem;
  color: #02c39a;
}

.btn-map-primary {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  border-color: transparent;
}

.btn-map-primary i {
  color: rgba(255, 255, 255, 0.9);
}

.btn-map-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 59, 46, 0.25);
}

.picker-map {
  width: 100%;
  height: 380px;
  position: relative;
}

.coordinates-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 16px 24px;
  padding: 10px 16px;
  background: rgba(2, 195, 154, 0.08);
  border: 1px solid rgba(2, 195, 154, 0.2);
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0a7c5c;
}

.coordinates-badge i {
  color: #02c39a;
}

/* Custom Marker Styles */
:deep(.custom-marker) {
  position: relative;
  width: 40px;
  height: 40px;
}

:deep(.marker-pin) {
  width: 24px;
  height: 24px;
  border-radius: 50% 50% 50% 0;
  background: linear-gradient(135deg, #02c39a 0%, #00a8e8 100%);
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
  box-shadow: 0 4px 12px rgba(2, 195, 154, 0.4);
  border: 3px solid white;
}

:deep(.marker-pulse) {
  background: rgba(2, 195, 154, 0.3);
  border-radius: 50%;
  height: 14px;
  width: 14px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin: 7px 0px 0px -7px;
  transform: rotateX(55deg);
  z-index: -1;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@media (max-width: 768px) {
  .picker-header {
    padding: 16px 20px;
  }
  
  .picker-info {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .picker-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .btn-map {
    flex: 1;
    justify-content: center;
  }
  
  .picker-map {
    height: 300px;
  }
}
</style>