<template>
  <div class="results-page">
    <NavBar />
    
    <main class="main-content">
      <div class="container-xl">
        <!-- Header -->
        <div class="results-header">
          <div class="header-content">
            <h1 class="page-title">Résultats de recherche</h1>
            <p class="page-subtitle" v-if="query">
              <span class="search-term">"{{ query }}"</span>
              <span class="results-count" v-if="pharmaciesDisponibles.length">
                · {{ pharmaciesDisponibles.length }} pharmacie(s) trouvée(s)
              </span>
            </p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar-container">
          <BarreRecherche
            v-model="query"
            @search="onSearch"
            @selectSuggestion="onSuggestionSelected"
          />
        </div>

        <!-- Banners -->
        <AdBanners class="d-lg-none mb-4" />

        <!-- Alert -->
        <AlerteMessage
          v-if="rechercheStore.error"
          :message="rechercheStore.error"
          type="danger"
          class="mb-4"
        />

        <!-- Route Info -->
        <div v-if="routeInfo" class="route-banner">
          <div class="route-icon">
            <i class="fa-solid fa-route"></i>
          </div>
          <div class="route-details">
            <span class="route-label">Itinéraire vers {{ selectedPharmacie?.nom }}</span>
            <span class="route-stats">
              <i class="fa-solid fa-road"></i> {{ routeInfo.distance_km }} km
              <span class="separator">·</span>
              <i class="fa-solid fa-clock"></i> {{ routeInfo.duration_min }} min
            </span>
          </div>
          <button class="btn-close-route" @click="routeInfo = null">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Content Grid -->
        <div class="results-layout">
          <!-- Liste des pharmacies -->
          <aside class="pharmacies-sidebar">
            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>Pharmacies disponibles</h3>
                <span class="badge-count" v-if="pharmaciesDisponibles.length">
                  {{ pharmaciesDisponibles.length }}
                </span>
              </div>
              
              <div class="pharmacies-list">
                <div
                  v-for="result in pharmaciesDisponibles"
                  :key="`${result.id}-${result.article_id}`"
                  class="pharmacy-item"
                  :class="{ active: selectedPharmacie?.id === result.id }"
                  @click="selectPharmacy(result)"
                >
                  <div class="pharmacy-info">
                    <h4 class="pharmacy-name">{{ result.nom }}</h4>
                    <p class="pharmacy-address">
                      <i class="fa-solid fa-location-dot"></i>
                      {{ result.adresse }}
                    </p>
                    <div class="pharmacy-meta">
                      <span class="price-tag" v-if="result.prix">
                        {{ result.prix }} FCFA
                      </span>
                      <span class="distance-tag" v-if="result.distance_km !== null">
                        <i class="fa-solid fa-person-walking"></i>
                        {{ result.distance_km }} km
                      </span>
                    </div>
                    <div class="product-badge" v-if="result.article_nom">
                      <i class="fa-solid fa-pills"></i>
                      {{ result.article_nom }}
                    </div>
                  </div>
                  
                  <div class="pharmacy-actions">
                    <button 
                      class="btn-action btn-route" 
                      @click.stop="showItineraire(result)"
                      title="Itinéraire"
                    >
                      <i class="fa-solid fa-diamond-turn-right"></i>
                      <span class="btn-label">Itinéraire</span>
                    </button>
                    <button 
                      class="btn-action btn-order" 
                      @click.stop="openCommande(result)"
                      title="Commander"
                    >
                      <i class="fa-solid fa-bag-shopping"></i>
                      <span>Commander</span>
                    </button>
                  </div>
                </div>

                <div v-if="!pharmaciesDisponibles.length" class="empty-state">
                  <div class="empty-icon">
                    <i class="fa-solid fa-store-slash"></i>
                  </div>
                  <h4>Aucun stock disponible</h4>
                  <p>Essayez une autre recherche ou élargissez votre zone</p>
                </div>
              </div>
            </div>
          </aside>

          <!-- Carte -->
          <div class="map-container">
            <CartePharmacie
              :pharmacies="rechercheStore.results"
              :user-position="userPosition"
              :selected-pharmacy="selectedPharmacie"
              :route-info="routeInfo"
              @route-updated="onRouteUpdated"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Authentification -->
    <Transition name="modal">
      <div v-if="showAuthModal" class="modal-overlay" @click.self="showAuthModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <div class="modal-icon auth-icon">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h3>Connexion requise</h3>
            <button class="btn-close-modal" @click="showAuthModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              Pour commander rapidement, connectez-vous ou créez un compte. 
              Votre sélection sera conservée automatiquement.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showAuthModal = false">
              Annuler
            </button>
            <button class="btn btn-primary" @click="goLogin">
              Se connecter
            </button>
            <button class="btn btn-accent" @click="goRegister">
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Commande -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-icon order-icon">
              <i class="fa-solid fa-bag-shopping"></i>
            </div>
            <h3>Commander chez {{ selectedPharmacie?.nom }}</h3>
            <button class="btn-close-modal" @click="showModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <AlerteMessage 
              v-if="modalMessage" 
              :message="modalMessage" 
              :type="modalError ? 'danger' : 'info'" 
              :dismissible="false"
              class="mb-4"
            />

            <div class="order-summary">
              <div class="product-card">
                <div class="product-icon">
                  <i class="fa-solid fa-pills"></i>
                </div>
                <div class="product-details">
                  <span class="product-label">Article</span>
                  <h4>{{ selectedPharmacie?.article_nom }}</h4>
                  <span class="product-price" v-if="selectedPharmacie?.prix">
                    {{ selectedPharmacie.prix }} FCFA / unité
                  </span>
                </div>
              </div>
            </div>

            <form class="order-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    <i class="fa-solid fa-phone"></i>
                    Téléphone <span class="required">*</span>
                  </label>
                  <input 
                    v-model="commande.telephone" 
                    type="tel" 
                    class="form-input" 
                    placeholder="6XX XXX XXX"
                    required 
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <i class="fa-solid fa-envelope"></i>
                    Email <span class="optional">(optionnel)</span>
                  </label>
                  <input 
                    v-model="commande.email" 
                    type="email" 
                    class="form-input" 
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="fa-solid fa-hashtag"></i>
                  Quantité
                </label>
                <div class="quantity-selector">
                  <button type="button" class="qty-btn" @click="commande.quantite > 1 ? commande.quantite-- : null">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input 
                    v-model.number="commande.quantite" 
                    type="number" 
                    min="1" 
                    class="qty-input"
                    readonly
                  />
                  <button type="button" class="qty-btn" @click="commande.quantite++">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              <div class="info-box">
                <i class="fa-solid fa-info-circle"></i>
                <span>La livraison sera bientôt disponible. Retrait en pharmacie uniquement pour le moment.</span>
              </div>

              <div class="total-card">
                <div class="total-row">
                  <span>Total articles</span>
                  <span class="price">{{ estimatedArticleTotal }} FCFA</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total à payer</span>
                  <span class="price">{{ estimatedGrandTotal }} FCFA</span>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showModal = false">
              Fermer
            </button>
            <button 
              class="btn btn-primary btn-large" 
              :disabled="submitting" 
              @click="submitCommande"
            >
              <i class="fa-solid fa-credit-card" v-if="!submitting"></i>
              <i class="fa-solid fa-circle-notch fa-spin" v-else></i>
              <span>{{ submitting ? "Traitement..." : "Procéder au paiement" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import BarreRecherche from "@/components/BarreRecherche.vue";
import CartePharmacie from "@/components/CartePharmacie.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import AdBanners from "@/components/AdBanners.vue";
import { useAuthStore } from "@/stores/auth";
import { useRechercheStore } from "@/stores/recherche";
import coreApi from "@/api/core";

const PENDING_COMMANDE_KEY = "pharmamap_pending_commande";
const YAOUNDE = [11.5174, 3.848];
const CAMEROUN_BOUNDS = { minLat: 1.65, maxLat: 13.08, minLng: 8.4, maxLng: 16.2 };

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const rechercheStore = useRechercheStore();

const query = ref(route.query.q || "");
const showModal = ref(false);
const showAuthModal = ref(false);
const selectedPharmacie = ref(null);
const userPosition = ref(null);
const routeInfo = ref(null);
const submitting = ref(false);
const modalMessage = ref("");
const modalError = ref(false);

const commande = ref({
  quantite: 1,
  mode: "retrait",
  telephone: "",
  email: ""
});

const pharmaciesDisponibles = computed(() =>
  rechercheStore.results.filter((p) => p.statut === "disponible" && p.article_id)
);

const unitPrice = computed(() => Number(selectedPharmacie.value?.prix || 0));
const estimatedArticleTotal = computed(() => Math.max(1, Number(commande.value.quantite) || 1) * unitPrice.value);
const estimatedGrandTotal = computed(() => estimatedArticleTotal.value);

const getSearchParams = () => {
  if (!userPosition.value) return {};
  return { lng: userPosition.value[0], lat: userPosition.value[1] };
};

const onSearch = async () => {
  if (!query.value.trim()) return;
  await rechercheStore.search(query.value, getSearchParams());
  router.replace({ path: "/resultats", query: { q: query.value } });
};

const onSuggestionSelected = async (value) => {
  query.value = value;
  await onSearch();
};

const onRouteUpdated = (payload) => {
  routeInfo.value = payload || null;
};

const selectPharmacy = (pharmacie) => {
  selectedPharmacie.value = pharmacie;
};

const showItineraire = (pharmacie) => {
  selectedPharmacie.value = pharmacie;
};

const openCommandeModal = (pharmacie) => {
  selectedPharmacie.value = pharmacie;
  commande.value = {
    quantite: 1,
    mode: "retrait",
    telephone: authStore.user?.telephone || "",
    email: authStore.user?.email || ""
  };
  modalMessage.value = "";
  modalError.value = false;
  showModal.value = true;
};

const openCommande = (pharmacie) => {
  selectPharmacy(pharmacie);
  showItineraire(pharmacie);

  if (!authStore.isAuthenticated) {
    localStorage.setItem(
      PENDING_COMMANDE_KEY,
      JSON.stringify({ pharmacie_id: pharmacie.id, article_id: pharmacie.article_id })
    );
    showAuthModal.value = true;
    return;
  }
  openCommandeModal(pharmacie);
};

const goLogin = () => {
  showAuthModal.value = false;
  router.push({ path: "/auth/login", query: { next: route.fullPath } });
};

const goRegister = () => {
  showAuthModal.value = false;
  router.push({ path: "/auth/register", query: { next: route.fullPath, express: "1" } });
};

const resumePendingCommande = () => {
  if (!authStore.isAuthenticated) return;
  const raw = localStorage.getItem(PENDING_COMMANDE_KEY);
  if (!raw) return;

  try {
    const pending = JSON.parse(raw);
    const match = pharmaciesDisponibles.value.find(
      (item) => item.id === pending.pharmacie_id && item.article_id === pending.article_id
    );
    if (match) {
      openCommandeModal(match);
      localStorage.removeItem(PENDING_COMMANDE_KEY);
    }
  } catch {
    localStorage.removeItem(PENDING_COMMANDE_KEY);
  }
};

const submitCommande = async () => {
  if (!selectedPharmacie.value) return;
  if (!commande.value.telephone?.trim()) {
    modalError.value = true;
    modalMessage.value = "Numéro de téléphone obligatoire.";
    return;
  }

  submitting.value = true;
  modalError.value = false;
  modalMessage.value = "";

  try {
    await authStore.updateProfile({
      telephone: commande.value.telephone,
      email: commande.value.email || ""
    });

    const payload = {
      pharmacie_id: selectedPharmacie.value.id,
      article_id: selectedPharmacie.value.article_id,
      quantite: commande.value.quantite,
      mode: commande.value.mode
    };

    const { data } = await coreApi.createCommande(payload);
    const commandeId = data.commande?.id;
    if (!commandeId) throw new Error("Commande non créée");

    showModal.value = false;
    router.push({ path: "/client/paiement", query: { commande_id: String(commandeId) } });
  } catch (error) {
    modalError.value = true;
    modalMessage.value = error.response?.data?.erreur || "Impossible de créer la commande.";
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  if (!userPosition.value) userPosition.value = YAOUNDE;
  if (query.value) {
    await rechercheStore.search(query.value, getSearchParams());
  } else {
    await rechercheStore.loadAllPharmacies();
  }
  resumePendingCommande();
});
</script>

<style scoped>
.results-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fafcfb 0%, #f5f9f7 100%);
}

.main-content {
  padding: 32px 0 64px;
}

/* Header */
.results-header {
  margin-bottom: 32px;
}

.header-content {
  text-align: center;
}

.page-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  color: #0d3b2e;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #6b8a7d;
  font-size: 1rem;
  margin: 0;
}

.search-term {
  color: #0a7c5c;
  font-weight: 600;
}

.results-count {
  color: #9ab5a8;
}

/* Search Bar */
.search-bar-container {
  max-width: 700px;
  margin: 0 auto 32px;
}

/* Route Banner */
.route-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(2, 195, 154, 0.1) 0%, rgba(2, 195, 154, 0.05) 100%);
  border: 1px solid rgba(2, 195, 154, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.route-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(2, 195, 154, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #02c39a;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.route-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-label {
  font-weight: 600;
  color: #0d3b2e;
  font-size: 0.95rem;
}

.route-stats {
  font-size: 0.85rem;
  color: #6b8a7d;
  display: flex;
  align-items: center;
  gap: 12px;
}

.route-stats i {
  color: #02c39a;
  font-size: 0.8rem;
}

.separator {
  color: rgba(107, 138, 125, 0.4);
}

.btn-close-route {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  color: #6b8a7d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close-route:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #8a3030;
}

/* Layout */
.results-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  align-items: start;
}

/* Sidebar */
.sidebar-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(13, 59, 46, 0.06);
  border: 1px solid rgba(223, 231, 227, 0.6);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%);
  border-bottom: 1px solid rgba(223, 231, 227, 0.4);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0d3b2e;
}

.badge-count {
  background: rgba(2, 195, 154, 0.1);
  color: #0a7c5c;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 50px;
}

.pharmacies-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 12px;
}

.pharmacy-item {
  background: white;
  border: 1.5px solid rgba(223, 231, 227, 0.6);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pharmacy-item:hover {
  border-color: rgba(2, 195, 154, 0.3);
  box-shadow: 0 8px 24px rgba(13, 59, 46, 0.08);
  transform: translateY(-2px);
}

.pharmacy-item.active {
  border-color: rgba(2, 195, 154, 0.5);
  background: rgba(2, 195, 154, 0.02);
  box-shadow: 0 4px 16px rgba(2, 195, 154, 0.1);
}

.pharmacy-name {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0d3b2e;
}

.pharmacy-address {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
  color: #6b8a7d;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pharmacy-address i {
  font-size: 0.75rem;
  color: #02c39a;
}

.pharmacy-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.price-tag, .distance-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 50px;
}

.price-tag {
  background: rgba(2, 195, 154, 0.1);
  color: #0a7c5c;
}

.distance-tag {
  background: rgba(13, 59, 46, 0.06);
  color: #4a6358;
}

.distance-tag i {
  font-size: 0.75rem;
}

.product-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6b8a7d;
  background: rgba(223, 231, 227, 0.4);
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.product-badge i {
  color: #02c39a;
}

.pharmacy-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-route {
  min-width: 40px;
  height: 40px;
  background: rgba(223, 231, 227, 0.5);
  color: #4a6358;
  padding: 10px;
}

.btn-route:hover {
  background: rgba(2, 195, 154, 0.1);
  color: #0a7c5c;
}

.btn-route .btn-label {
  display: none;
  font-size: 0.78rem;
}

.btn-order {
  flex: 1;
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 59, 46, 0.2);
}

.btn-order:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(13, 59, 46, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(223, 231, 227, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #9ab5a8;
  font-size: 2rem;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: #0d3b2e;
  font-size: 1.1rem;
}

.empty-state p {
  margin: 0;
  color: #6b8a7d;
  font-size: 0.9rem;
}

/* Map Container */
.map-container {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(13, 59, 46, 0.06);
  border: 1px solid rgba(223, 231, 227, 0.6);
  height: calc(100vh - 200px);
  min-height: 500px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 59, 46, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(13, 59, 46, 0.25);
  animation: modal-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-sm {
  max-width: 420px;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 0;
  position: relative;
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.auth-icon {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.order-icon {
  background: rgba(2, 195, 154, 0.1);
  color: #02c39a;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0d3b2e;
  flex: 1;
}

.btn-close-modal {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(223, 231, 227, 0.4);
  color: #6b8a7d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  background: rgba(223, 231, 227, 0.8);
  color: #0d3b2e;
}

.modal-body {
  padding: 24px;
}

.modal-text {
  color: #6b8a7d;
  line-height: 1.6;
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  flex: 1;
}

.btn-secondary {
  background: rgba(223, 231, 227, 0.5);
  color: #4a6358;
}

.btn-secondary:hover {
  background: rgba(223, 231, 227, 0.8);
}

.btn-primary {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 59, 46, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(13, 59, 46, 0.3);
}

.btn-accent {
  background: linear-gradient(135deg, #02c39a 0%, #00a8e8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(2, 195, 154, 0.3);
}

.btn-accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(2, 195, 154, 0.4);
}

.btn-large {
  padding: 14px 28px;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

/* Order Form */
.order-summary {
  margin-bottom: 24px;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(2, 195, 154, 0.05);
  border: 1.5px solid rgba(2, 195, 154, 0.15);
  border-radius: 16px;
  padding: 16px;
}

.product-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(2, 195, 154, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #02c39a;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ab5a8;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
}

.product-details h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #0d3b2e;
  font-weight: 700;
}

.product-price {
  font-size: 0.9rem;
  color: #0a7c5c;
  font-weight: 600;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0d3b2e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-label i {
  color: #02c39a;
  font-size: 0.8rem;
}

.required {
  color: #dc3545;
}

.optional {
  color: #9ab5a8;
  font-weight: 500;
}

.form-input {
  padding: 12px 16px;
  border: 1.5px solid rgba(223, 231, 227, 0.8);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #0d3b2e;
  background: white;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: rgba(2, 195, 154, 0.4);
  box-shadow: 0 0 0 4px rgba(2, 195, 154, 0.08);
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid rgba(223, 231, 227, 0.8);
  background: white;
  color: #4a6358;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.qty-btn:hover {
  border-color: rgba(2, 195, 154, 0.4);
  color: #0a7c5c;
  background: rgba(2, 195, 154, 0.03);
}

.qty-input {
  width: 80px;
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  border: 1.5px solid rgba(223, 231, 227, 0.8);
  border-radius: 12px;
  padding: 10px;
  color: #0d3b2e;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(13, 59, 46, 0.04);
  border-radius: 12px;
  font-size: 0.85rem;
  color: #6b8a7d;
  line-height: 1.5;
}

.info-box i {
  color: #02c39a;
  font-size: 1rem;
  margin-top: 2px;
}

.total-card {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.total-row.grand-total {
  margin-bottom: 0;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1.1rem;
  font-weight: 700;
  opacity: 1;
}

.total-row .price {
  font-weight: 700;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 991px) {
  .results-layout {
    grid-template-columns: 1fr;
  }
  
  .pharmacies-sidebar {
    order: 2;
  }
  
  .map-container {
    order: 1;
    height: 400px;
    min-height: auto;
  }
  
  .pharmacies-list {
    max-height: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }

  .btn-route {
    width: auto;
    padding: 10px 12px;
  }

  .btn-route .btn-label {
    display: inline;
  }
  
  .pharmacy-item {
    margin-bottom: 0;
  }
  
  .modal-container {
    max-height: 95vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 20px 0;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
