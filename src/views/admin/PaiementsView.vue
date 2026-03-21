<template>
  <div class="paiements-app">
    <NavBar />
    
    <div class="container py-4">
      <!-- Header amélioré -->
      <div class="page-header mb-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h1 class="page-title">
              <i class="bi bi-credit-card-2-front me-2 text-primary"></i>
              Suivi des paiements
            </h1>
            <p class="text-muted mb-0 mt-1">
              Gérez et suivez les transactions en temps réel
            </p>
          </div>
          <div class="stats-cards d-flex gap-2" v-if="!loading && paiements.length">
            <div class="stat-badge bg-light border rounded-pill px-3 py-2">
              <small class="text-muted d-block">Total</small>
              <strong class="text-primary">{{ paiements.length }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Toast positionnées -->
      <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1050">
        <transition name="toast">
          <div v-if="errorMessage" class="toast show align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
              <div class="toast-body">
                <i class="bi bi-exclamation-circle me-2"></i>{{ errorMessage }}
              </div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="errorMessage = ''"></button>
            </div>
          </div>
        </transition>
        <transition name="toast">
          <div v-if="successMessage" class="toast show align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
              <div class="toast-body">
                <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
              </div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="successMessage = ''"></button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Barre de filtres améliorée -->
      <div class="filters-card card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-4 col-lg-3">
              <label class="form-label text-muted small fw-bold mb-1">
                <i class="bi bi-funnel me-1"></i>Statut
              </label>
              <select v-model="filtreStatut" class="form-select" @change="loadPaiements">
                <option value="">Tous les statuts</option>
                <option value="soumis">🟡 Soumis</option>
                <option value="confirme">🟢 Confirmé</option>
                <option value="rejete">🔴 Rejeté</option>
                <option value="pending">⏳ Pending</option>
              </select>
            </div>
            <div class="col-md-6 col-lg-7">
              <label class="form-label text-muted small fw-bold mb-1">
                <i class="bi bi-search me-1"></i>Recherche
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Rechercher par client, pharmacie, ID commande..."
                >
                <button 
                  v-if="searchQuery" 
                  class="btn btn-outline-secondary border-start-0" 
                  type="button"
                  @click="searchQuery = ''"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <div class="col-md-2 col-lg-2">
              <button 
                class="btn btn-outline-primary w-100" 
                @click="loadPaiements" 
                :disabled="loading"
              >
                <i class="bi" :class="loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'"></i>
                <span class="d-none d-sm-inline ms-1">{{ loading ? "..." : "Actualiser" }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- État de chargement skeleton -->
      <div v-if="loading && !paiements.length" class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th v-for="n in 10" :key="n" class="skeleton-header" style="height: 48px;">
                    <div class="skeleton-line"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in 5" :key="n">
                  <td v-for="m in 10" :key="m">
                    <div class="skeleton-line" :style="{ width: Math.random() * 60 + 40 + '%' }"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tableau amélioré -->
      <div v-else-if="filteredPaiements.length" class="card border-0 shadow-sm overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light border-bottom">
              <tr>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">ID</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Commande</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Client</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Pharmacie</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Article</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Expéditeur</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider text-end">Montant</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Statut</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider">Date</th>
                <th class="fw-semibold text-muted small text-uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <transition-group name="list">
                <tr v-for="p in filteredPaiements" :key="p.id" class="position-relative">
                  <td class="font-monospace text-muted small">#{{ p.id }}</td>
                  <td>
                    <span v-if="p.commande_id" class="badge bg-light text-dark border">
                      #{{ p.commande_id }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-circle bg-primary text-white me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 50%; font-size: 12px;">
                        {{ getInitials(p.client) }}
                      </div>
                      <span class="fw-medium">{{ p.client || "N/A" }}</span>
                    </div>
                  </td>
                  <td>{{ p.pharmacie || "-" }}</td>
                  <td>
                    <span class="text-truncate d-inline-block" style="max-width: 150px;" :title="p.article">
                      {{ p.article || "-" }}
                    </span>
                  </td>
                  <td>
                    <a v-if="p.numero_expediteur" :href="'tel:' + p.numero_expediteur" class="text-decoration-none">
                      <i class="bi bi-telephone me-1 small text-success"></i>
                      {{ p.numero_expediteur }}
                    </a>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="text-end fw-bold text-dark">
                    {{ formatMontant(p.montant) }}
                  </td>
                  <td>
                    <StatutBadge :status="p.statut || 'inconnu'" />
                  </td>
                  <td>
                    <small class="text-muted">
                      <i class="bi bi-clock me-1"></i>
                      {{ formatDate(p.created_at) }}
                    </small>
                  </td>
                  <td>
                    <div class="d-flex gap-2 justify-content-center">
                      <button
                        class="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                        :disabled="actionLoadingId === p.id || p.statut !== 'soumis'"
                        @click="confirmer(p)"
                        title="Confirmer le paiement"
                      >
                        <span v-if="actionLoadingId === p.id" class="spinner-border spinner-border-sm" style="width: 0.8rem; height: 0.8rem;"></span>
                        <i v-else class="bi bi-check-lg"></i>
                        <span class="d-none d-md-inline">Confirmer</span>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        :disabled="actionLoadingId === p.id || p.statut !== 'soumis'"
                        @click="ouvrirModalRejet(p)"
                        title="Rejeter le paiement"
                      >
                        <i class="bi bi-x-lg"></i>
                        <span class="d-none d-md-inline">Rejeter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </transition-group>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination info -->
        <div class="card-footer bg-light border-top d-flex justify-content-between align-items-center py-2">
          <small class="text-muted">
            Affichage de <strong>{{ filteredPaiements.length }}</strong> paiement(s)
          </small>
          <small v-if="filtreStatut || searchQuery" class="text-muted">
            <button class="btn btn-link btn-sm p-0 text-decoration-none" @click="resetFilters">
              Réinitialiser les filtres
            </button>
          </small>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="card border-0 shadow-sm">
        <div class="card-body text-center py-5">
          <div class="mb-3">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          </div>
          <h5 class="text-muted mb-2">Aucun paiement trouvé</h5>
          <p class="text-muted mb-3">
            {{ searchQuery || filtreStatut ? "Essayez de modifier vos critères de recherche" : "Les paiements apparaîtront ici" }}
          </p>
          <button v-if="searchQuery || filtreStatut" class="btn btn-outline-primary" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de rejet amélioré -->
    <div class="modal fade" :class="{ show: showRejectModal }" :style="{ display: showRejectModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom-0">
            <h5 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Rejeter le paiement
            </h5>
            <button type="button" class="btn-close" @click="fermerModalRejet"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">
              Vous êtes sur le point de rejeter le paiement <strong>#{{ paiementToReject?.id }}</strong> 
              de <strong>{{ formatMontant(paiementToReject?.montant) }}</strong>.
            </p>
            <div class="mb-3">
              <label class="form-label fw-bold">Motif du rejet <span class="text-danger">*</span></label>
              <textarea 
                v-model="rejectNote" 
                class="form-control" 
                rows="3" 
                placeholder="Ex: Verification non conforme, preuve invalide..."
                :class="{ 'is-invalid': rejectError }"
              ></textarea>
              <div class="invalid-feedback">{{ rejectError }}</div>
              <div class="form-text">Ce motif sera conservé dans l'historique.</div>
            </div>
          </div>
          <div class="modal-footer border-top-0">
            <button type="button" class="btn btn-outline-secondary" @click="fermerModalRejet">Annuler</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmerRejet"
              :disabled="!rejectNote.trim() || actionLoadingId"
            >
              <span v-if="actionLoadingId" class="spinner-border spinner-border-sm me-1"></span>
              Confirmer le rejet
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" v-if="showRejectModal"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import StatutBadge from "@/components/StatutBadge.vue";
import coreApi from "@/api/core";

const paiements = ref([]);
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);
const actionLoadingId = ref(null);
const filtreStatut = ref("");
const searchQuery = ref("");

// Modal rejet
const showRejectModal = ref(false);
const paiementToReject = ref(null);
const rejectNote = ref("");
const rejectError = ref("");

// Filtres combinés
const filteredPaiements = computed(() => {
  let result = paiements.value;
  
  if (filtreStatut.value) {
    result = result.filter(p => p.statut === filtreStatut.value);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      (p.client?.toLowerCase().includes(query)) ||
      (p.pharmacie?.toLowerCase().includes(query)) ||
      (p.commande_id?.toString().includes(query)) ||
      (p.numero_expediteur?.includes(query))
    );
  }
  
  return result;
});

const loadPaiements = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const params = filtreStatut.value ? { statut: filtreStatut.value } : {};
    const { data } = await coreApi.getAdminPaiements(params);
    paiements.value = data.paiements || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de charger les paiements.";
    setTimeout(() => errorMessage.value = "", 5000);
  } finally {
    loading.value = false;
  }
};

const confirmer = async (paiement) => {
  actionLoadingId.value = paiement.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await coreApi.confirmPaiement(paiement.id, { note: "Confirmé par admin" });
    successMessage.value = `Paiement #${paiement.id} confirmé avec succès.`;
    await loadPaiements();
    setTimeout(() => successMessage.value = "", 3000);
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de confirmer ce paiement.";
    setTimeout(() => errorMessage.value = "", 5000);
  } finally {
    actionLoadingId.value = null;
  }
};

const ouvrirModalRejet = (paiement) => {
  paiementToReject.value = paiement;
  rejectNote.value = "Vérification non conforme";
  rejectError.value = "";
  showRejectModal.value = true;
};

const fermerModalRejet = () => {
  showRejectModal.value = false;
  paiementToReject.value = null;
  rejectNote.value = "";
  rejectError.value = "";
};

const confirmerRejet = async () => {
  if (!rejectNote.value.trim()) {
    rejectError.value = "Veuillez indiquer un motif de rejet";
    return;
  }
  
  actionLoadingId.value = paiementToReject.value.id;
  errorMessage.value = "";
  successMessage.value = "";
  
  try {
    await coreApi.rejectPaiement(paiementToReject.value.id, { note: rejectNote.value });
    successMessage.value = `Paiement #${paiementToReject.value.id} rejeté.`;
    fermerModalRejet();
    await loadPaiements();
    setTimeout(() => successMessage.value = "", 3000);
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de rejeter ce paiement.";
    setTimeout(() => errorMessage.value = "", 5000);
  } finally {
    actionLoadingId.value = null;
  }
};

const resetFilters = () => {
  filtreStatut.value = "";
  searchQuery.value = "";
  loadPaiements();
};

// Helpers
const formatMontant = (montant) => {
  if (!montant) return "-";
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    minimumFractionDigits: 0 
  }).format(montant);
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

onMounted(loadPaiements);
</script>

<style scoped>
/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Skeleton loading */
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-header {
  background-color: #f8f9fa;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* Améliorations table */
.table th {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom-width: 2px;
}

.table td {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

/* Hover effects */
.btn {
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Card enhancements */
.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .avatar-circle {
    width: 28px !important;
    height: 28px !important;
    font-size: 10px !important;
  }
}

/* Modal backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>