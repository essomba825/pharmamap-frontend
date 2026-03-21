<template>
  <div class="ad-banners d-lg-none">
    <div class="ad-track" ref="trackRef">
      <div
        v-for="(banner, index) in banners"
        :key="banner.id"
        class="ad-card"
        :class="{ 'is-active': activeIndex === index }"
      >
        <div class="ad-img-wrapper">
          <div v-if="loadingStates[index]" class="ad-skeleton" aria-hidden="true" />
          <img
            :src="banner.cached || banner.src"
            :alt="banner.alt"
            loading="lazy"
            decoding="async"
            @error="onImgError($event, index)"
            @load="onImgLoad($event, index)"
          />
        </div>
        <div class="ad-caption">
          <span class="ad-badge">{{ banner.category }}</span>
          <span class="ad-label">{{ banner.caption }}</span>
        </div>
      </div>
    </div>
    <div class="ad-dots" aria-hidden="true">
      <span
        v-for="(_, i) in banners"
        :key="i"
        class="ad-dot"
        :class="{ active: activeIndex === i }"
        @click="scrollToIndex(i)"
      />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";

// Images de médicaments réels — Unsplash (libres de droits, CDN stable)
const MEDICINE_IMAGES = [
  {
    id: "paracetamol",
    // Photo réelle : comprimés blancs de paracétamol en gros plan
    src: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80&auto=format&fit=crop",
    alt: "Comprimés de paracétamol",
    caption: "Paracétamol · Douleurs & Fièvre",
    category: "Analgésique"
  },
  {
    id: "capsules",
    // Photo réelle : gélules d'antibiotique rouge et jaune sur fond blanc
    src: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=80&auto=format&fit=crop",
    alt: "Gélules d'antibiotique",
    caption: "Antibiotiques · Infections bactériennes",
    category: "Antibiotique"
  },
  {
    id: "assortiment",
    // Photo réelle : assortiment de comprimés colorés
    src: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80&auto=format&fit=crop",
    alt: "Assortiment de comprimés médicaux",
    caption: "Médicaments disponibles près de vous",
    category: "Pharmacie"
  },
  {
    id: "vitamines",
    // Photo réelle : gélules de vitamines orange transparentes
    src: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80&auto=format&fit=crop",
    alt: "Compléments vitaminés",
    caption: "Vitamines & Compléments alimentaires",
    category: "Vitamines"
  },
  {
    id: "boites",
    // Photo réelle : boîtes de médicaments en pharmacie
    src: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&q=80&auto=format&fit=crop",
    alt: "Rayon de pharmacie avec boîtes",
    caption: "Livraison rapide à domicile",
    category: "Service"
  }
];

const CACHE_NAME = "pharmamap-med-images-v2";

const banners = ref(MEDICINE_IMAGES.map(b => ({ ...b, cached: null })));
const loadingStates = reactive(Object.fromEntries(MEDICINE_IMAGES.map((_, i) => [i, true])));
const activeIndex = ref(0);
const trackRef = ref(null);

// ── Cache offline via Cache API ───────────────────────────────────────────────
const loadFromCache = async () => {
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(banners.value.map(async (banner, i) => {
      try {
        const match = await cache.match(banner.src);
        if (match) {
          const blob = await match.blob();
          banners.value[i] = { ...banner, cached: URL.createObjectURL(blob) };
          loadingStates[i] = false;
        }
      } catch { /* entrée cache invalide, on charge normalement */ }
    }));
  } catch { /* cache indisponible */ }
};

const cacheImage = async (src) => {
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    if (!(await cache.match(src))) {
      const resp = await fetch(src, { mode: "cors" });
      if (resp.ok) await cache.put(src, resp);
    }
  } catch { /* silencieux */ }
};

const onImgLoad = (event, index) => {
  loadingStates[index] = false;
  if (!banners.value[index].cached) cacheImage(banners.value[index].src);
};

const onImgError = (event, index) => {
  loadingStates[index] = false;
  const colors = ["#dff3ed", "#d4eaf7", "#fdf3e3", "#f0e6f6", "#e8f5e9"];
  const icons = ["💊", "💉", "🩺", "🧬", "🏥"];
  const c = colors[index % colors.length];
  const ic = icons[index % icons.length];
  const label = banners.value[index].caption.replace(/</g, "&lt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="${c}"/><text x="200" y="85" text-anchor="middle" font-size="56">${ic}</text><text x="200" y="148" text-anchor="middle" font-size="13" fill="#0a7c5c" font-family="sans-serif" font-weight="600">${label}</text></svg>`;
  event.target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// ── Navigation ────────────────────────────────────────────────────────────────
const scrollToIndex = (i) => {
  const card = trackRef.value?.children[i];
  if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  activeIndex.value = i;
};

let observer;
const setupObserver = () => {
  if (!trackRef.value || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          activeIndex.value = Array.from(trackRef.value?.children || []).indexOf(e.target);
        }
      });
    },
    { root: trackRef.value, threshold: 0.6 }
  );
  Array.from(trackRef.value.children).forEach((c) => observer.observe(c));
};

let autoTimer;
const startAuto = () => {
  autoTimer = setInterval(() => scrollToIndex((activeIndex.value + 1) % banners.value.length), 4000);
};
const stopAuto = () => clearInterval(autoTimer);

onMounted(async () => {
  await loadFromCache();
  setupObserver();
  startAuto();
  trackRef.value?.addEventListener("touchstart", stopAuto, { passive: true });
  trackRef.value?.addEventListener("touchend", startAuto, { passive: true });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  stopAuto();
  banners.value.forEach((b) => {
    if (b.cached?.startsWith("blob:")) URL.revokeObjectURL(b.cached);
  });
});
</script>

<style scoped>
.ad-banners { margin: 12px 0 8px; }

.ad-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 82%;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.ad-track::-webkit-scrollbar { display: none; }

.ad-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  scroll-snap-align: center;
  box-shadow: 0 4px 16px rgba(13, 59, 46, 0.1);
  background: #f0f4f2;
  transition: box-shadow 0.25s ease;
}
.ad-card.is-active { box-shadow: 0 8px 24px rgba(10, 124, 92, 0.18); }

.ad-img-wrapper { position: relative; height: 140px; }

.ad-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.ad-skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, #e8f0ec 25%, #f4f8f6 50%, #e8f0ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.ad-caption {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 10px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: linear-gradient(180deg, transparent 0%, rgba(13, 40, 28, 0.78) 100%);
}
.ad-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #a8e6cf;
}
.ad-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.2;
}

.ad-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}
.ad-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: #c5d9d0;
  cursor: pointer;
  transition: background 0.2s, width 0.2s;
}
.ad-dot.active { background: #0a7c5c; width: 18px; }
</style>