<template>
  <div class="commandes-app">
    <NavBar />
    
    <div class="container-fluid container-xl py-4">
      <!-- Header avec workflow visuel -->
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb" class="mb-2">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Pharmacie</a></li>
              <li class="breadcrumb-item active">Commandes reçues</li>
            </ol>
          </nav>
          <h1 class="h3 mb-0 d-flex align-items-center gap-2">
            <span class="bg-success bg-gradient text-white rounded-3 p-2 d-inline-flex">
              <i class="bi bi-box-seam fs-4"></i>
            </span>
            Gestion des commandes
          </h1>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary d-flex align-items-center gap-2" @click="exportCSV" :disabled="!commandes.length">
            <i class="bi bi-download"></i>
            <span class="d-none d-sm-inline">Exporter</span>
          </button>
          <button class="btn btn-success d-flex align-items-center gap-2" @click="loadCommandes" :disabled="loading">
            <i class="bi" :class="loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'"></i>
            <span class="d-none d-sm-inline">Actualiser</span>
          </button>
        </div>
      </div>

      <!-- Pipeline visuel des statuts -->
      <div class="card border-0 shadow-sm mb-4 pipeline-card">
        <div class="card-body p-3">
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            <button 
              v-for="stat in statutsAvecCompte" 
              :key="stat.value"
              class="btn position-relative"
              :class="filtreStatut === stat.value ? 'btn-dark' : 'btn-outline-secondary'"
              @click="filtreStatut = filtreStatut === stat.value ? '' : stat.value; loadCommandes()"
            >
              <div class="d-flex align-items-center gap-2">
                <i class="bi" :class="stat.icon"></i>
                <span class="d-none d-md-inline">{{ stat.label }}</span>
                <span class="badge rounded-pill" :class="filtreStatut === stat.value ? 'bg-white text-dark' : 'bg-secondary'">
                  {{ stat.count }}
                </span>
              </div>
              <div v-if="stat.value === 'attente_paiement' && stat.count > 0" class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span class="visually-hidden">Nouvelles commandes</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Barre d'outils -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control" 
                  placeholder="Rechercher par client, article ou n° commande..."
                >
                <button v-if="searchQuery" class="btn btn-outline-secondary" @click="searchQuery = ''">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div class="col-12 col-md-6 text-md-end">
              <span class="text-muted small" v-if="filteredCommandes.length">
                <i class="bi bi-info-circle me-1"></i>
                {{ filteredCommandes.length }} commande(s) affichée(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau des commandes -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="fw-semibold text-muted small">#Cmd</th>
                <th class="fw-semibold text-muted small">Client</th>
                <th class="fw-semibold text-muted small">Article</th>
                <th class="fw-semibold text-muted small text-center">Qté</th>
                <th class="fw-semibold text-muted small">Mode</th>
                <th class="fw-semibold text-muted small text-end">Total</th>
                <th class="fw-semibold text-muted small text-center">Statut actuel</th>
                <th class="fw-semibold text-muted small" style="width: 200px;">Nouveau statut</th>
                <th class="text-center" style="width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- Skeleton -->
              <tr v-if="loading && !commandes.length" v-for="n in 5" :key="n">
                <td colspan="9" class="p-3">
                  <div class="skeleton-line w-100" style="height: 40px;"></div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-else-if="!filteredCommandes.length">
                <td colspan="9" class="text-center py-5">
                  <div class="empty-state">
                    <i class="bi bi-inbox display-4 text-muted mb-3 d-block"></i>
                    <h5 class="text-muted">Aucune commande trouvée</h5>
                    <p class="text-muted mb-0" v-if="searchQuery || filtreStatut">
                      Essayez de modifier vos critères de recherche
                    </p>
                    <button v-if="searchQuery || filtreStatut" class="btn btn-outline-primary btn-sm mt-3" @click="resetFilters">
                      Réinitialiser les filtres
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Data -->
              <tr 
                v-for="commande in filteredCommandes" 
                :key="commande.id"
                :class="{ 'table-warning': hasUnsavedChanges(commande.id), 'opacity-75': actionId === commande.id }"
              >
                <td class="font-monospace fw-bold text-primary">#{{ commande.id }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle bg-success text-white me-2">
                      {{ getInitials(commande.client) }}
                    </div>
                    <span class="fw-medium">{{ commande.client || "N/A" }}</span>
                  </div>
                </td>
                <td>
                  <div class="fw-medium">{{ commande.article || "-" }}</div>
                  <small class="text-muted" v-if="commande.pharmacie">Chez {{ commande.pharmacie }}</small>
                </td>
                <td class="text-center">
                  <span class="badge bg-light text-dark border">{{ commande.quantite }}</span>
                </td>
                <td>
                  <span class="badge bg-info bg-opacity-10 text-info">
                    <i class="bi bi-truck me-1" v-if="commande.mode === 'livraison'"></i>
                    <i class="bi bi-shop me-1" v-else></i>
                    {{ commande.mode || "Standard" }}
                  </span>
                </td>
                <td class="text-end fw-bold font-monospace">
                  {{ formatMontant(commande.montant_total) }}
                </td>
                <td class="text-center">
                  <span class="badge rounded-pill" :class="getStatusClass(commande.statut)">
                    <i class="bi me-1" :class="getStatusIcon(commande.statut)"></i>
                    {{ formatStatut(commande.statut) }}
                  </span>
                </td>
                <td>
                  <div class="position-relative">
                    <select 
                      v-model="edits[commande.id].statut" 
                      class="form-select form-select-sm"
                      :class="{ 'border-warning': hasUnsavedChanges(commande.id) }"
                      :disabled="actionId === commande.id"
                    >
                      <option v-for="s in statutsMaj" :key="s.value" :value="s.value">
                        {{ s.label }}
                      </option>
                    </select>
                    <div v-if="hasUnsavedChanges(commande.id)" class="position-absolute top-0 end-0 translate-middle">
                      <span class="badge bg-warning rounded-pill p-1" style="font-size: 8px;">
                        <i class="bi bi-pencil-fill"></i>
                      </span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <button 
                    class="btn btn-sm btn-primary d-flex align-items-center gap-1 mx-auto"
                    :disabled="!hasUnsavedChanges(commande.id) || actionId === commande.id"
                    @click="confirmSave(commande)"
                  >
                    <span v-if="actionId === commande.id" class="spinner-border spinner-border-sm" style="width: 0.8rem; height: 0.8rem;"></span>
                    <i v-else class="bi bi-check-lg"></i>
                    <span class="d-none d-lg-inline">Valider</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation changement de statut -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="modal-wrapper" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header" :class="isCriticalChange ? 'bg-warning' : 'bg-primary'">
              <h5 class="modal-title text-white">
                <i class="bi me-2" :class="isCriticalChange ? 'bi-exclamation-triangle-fill' : 'bi-arrow-repeat'"></i>
                Confirmer le changement
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Commande <strong>#{{ selectedCommande?.id }}</strong> - 
                <strong>{{ selectedCommande?.client }}</strong>
              </p>
              
              <div class="d-flex align-items-center justify-content-center gap-3 mb-4 p-3 bg-light rounded">
                <div class="text-center">
                  <span class="badge rounded-pill mb-1" :class="getStatusClass(selectedCommande?.statut)">
                    {{ formatStatut(selectedCommande?.statut) }}
                  </span>
                  <div class="small text-muted">Actuel</div>
                </div>
                <i class="bi bi-arrow-right fs-4 text-muted"></i>
                <div class="text-center">
                  <span class="badge rounded-pill mb-1" :class="getStatusClass(edits[selectedCommande?.id]?.statut)">
                    {{ formatStatut(edits[selectedCommande?.id]?.statut) }}
                  </span>
                  <div class="small text-muted">Nouveau</div>
                </div>
              </div>

              <div v-if="isCriticalChange" class="alert alert-warning d-flex align-items-center">
                <i class="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                <div>
                  <strong>Attention !</strong> Ce changement est irréversible et peut déclencher des notifications client.
                </div>
              </div>
            </div>
            <div class="modal-footer border-top-0">
              <button type="button" class="btn btn-light" @click="closeModal">Annuler</button>
              <button 
                type="button" 
                :class="isCriticalChange ? 'btn btn-warning' : 'btn btn-primary'"
                @click="executeSave"
                :disabled="actionId"
              >
                <span v-if="actionId" class="spinner-border spinner-border-sm me-1"></span>
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toasts -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          class="toast show align-items-center text-white border-0 mb-2"
          :class="toast.type === 'success' ? 'bg-success' : toast.type === 'warning' ? 'bg-warning text-dark' : 'bg-danger'"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body">
              <i class="bi me-2" :class="toast.icon"></i>
              {{ toast.message }}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(toast.id)"></button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import NavBar from "@/components/NavBar.vue";
import coreApi from "@/api/core";

const commandes = ref([]);
const edits = reactive({});
const filtreStatut = ref("");
const loading = ref(false);
const actionId = ref(null);
const searchQuery = ref("");
const toasts = ref([]);
const showConfirmModal = ref(false);
const selectedCommande = ref(null);

const statuts = [
  { value: "attente_paiement", label: "Attente paiement", icon: "bi-hourglass" },
  { value: "paiement_soumis", label: "Paiement soumis", icon: "bi-credit-card" },
  { value: "confirme", label: "Confirmé", icon: "bi-check-circle" },
  { value: "pret", label: "Prêt", icon: "bi-box-seam" },
  { value: "en_livraison", label: "En livraison", icon: "bi-truck" },
  { value: "livre", label: "Livré", icon: "bi-house-check" },
  { value: "recupere", label: "Récupéré", icon: "bi-bag-check" },
  { value: "annule", label: "Annulé", icon: "bi-x-octagon" }
];

const statutsMaj = [
  { value: "confirme", label: "✓ Confirmé" },
  { value: "pret", label: "📦 Prêt" },
  { value: "en_livraison", label: "🚚 En livraison" },
  { value: "livre", label: "✅ Livré" },
  { value: "recupere", label: "🎒 Récupéré" },
  { value: "annule", label: "❌ Annulé" }
];

// Computed
const statutsAvecCompte = computed(() => {
  return statuts.map(s => ({
    ...s,
    count: commandes.value.filter(c => c.statut === s.value).length
  }));
});

const filteredCommandes = computed(() => {
  let result = commandes.value;
  
  if (filtreStatut.value) {
    result = result.filter(c => c.statut === filtreStatut.value);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      (c.client?.toLowerCase().includes(query)) ||
      (c.article?.toLowerCase().includes(query)) ||
      (c.id?.toString().includes(query))
    );
  }
  
  return result;
});

const isCriticalChange = computed(() => {
  if (!selectedCommande.value) return false;
  const newStatus = edits[selectedCommande.value.id]?.statut;
  return ['annule', 'recupere'].includes(newStatus);
});

// Méthodes
const initializeEdits = () => {
  commandes.value.forEach((commande) => {
    edits[commande.id] = {
      statut: commande.statut,
      originalStatut: commande.statut
    };
  });
};

const hasUnsavedChanges = (id) => {
  return edits[id] && edits[id].statut !== edits[id].originalStatut;
};

const loadCommandes = async () => {
  loading.value = true;
  try {
    const params = filtreStatut.value ? { statut: filtreStatut.value } : {};
    const { data } = await coreApi.getPharmacieCommandes(params);
    commandes.value = data.commandes || [];
    initializeEdits();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de chargement", 'error');
  } finally {
    loading.value = false;
  }
};

const confirmSave = (commande) => {
  selectedCommande.value = commande;
  showConfirmModal.value = true;
};

const closeModal = () => {
  showConfirmModal.value = false;
  selectedCommande.value = null;
};

const executeSave = async () => {
  if (!selectedCommande.value) return;
  
  const id = selectedCommande.value.id;
  actionId.value = id;
  
  try {
    const edit = edits[id];
    await coreApi.changePharmacieCommandeStatut(id, { statut: edit.statut });
    
    // Mettre à jour l'original après succès
    edits[id].originalStatut = edit.statut;
    
    addToast(`Commande #${id} mise à jour vers "${formatStatut(edit.statut)}"`, 'success');
    closeModal();
    
    // Recharger après un court délai pour laisser voir le toast
    setTimeout(() => loadCommandes(), 500);
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de mise à jour", 'error');
  } finally {
    actionId.value = null;
  }
};

const resetFilters = () => {
  filtreStatut.value = "";
  searchQuery.value = "";
  loadCommandes();
};

const formatStatut = (value) => {
  const statut = statuts.find(s => s.value === value);
  return statut ? statut.label : value;
};

const formatMontant = (montant) => {
  if (!montant) return "-";
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    minimumFractionDigits: 0 
  }).format(montant);
};

const getStatusClass = (status) => {
  const map = {
    attente_paiement: 'bg-warning text-dark',
    paiement_soumis: 'bg-info',
    confirme: 'bg-primary',
    pret: 'bg-secondary',
    en_livraison: 'bg-info',
    livre: 'bg-success',
    recupere: 'bg-dark',
    annule: 'bg-danger'
  };
  return map[status] || 'bg-secondary';
};

const getStatusIcon = (status) => {
  const map = {
    attente_paiement: 'bi-hourglass-split',
    paiement_soumis: 'bi-credit-card',
    confirme: 'bi-check-circle',
    pret: 'bi-box-seam',
    en_livraison: 'bi-truck',
    livre: 'bi-house-check',
    recupere: 'bi-bag-check',
    annule: 'bi-x-octagon'
  };
  return map[status] || 'bi-question';
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const addToast = (message, type = 'success') => {
  const icons = {
    success: 'bi-check-circle',
    error: 'bi-exclamation-circle',
    warning: 'bi-exclamation-triangle'
  };
  const id = Date.now();
  toasts.value.push({ id, message, type, icon: icons[type] });
  setTimeout(() => removeToast(id), 5000);
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) toasts.value.splice(index, 1);
};

const exportCSV = () => {
  const headers = ['ID', 'Client', 'Article', 'Quantité', 'Mode', 'Montant', 'Statut'];
  const rows = filteredCommandes.value.map(c => [
    c.id, c.client, c.article, c.quantite, c.mode, c.montant_total, c.statut
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell || ''}"`).join(';'))
    .join('\n');
    
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  addToast('Export CSV téléchargé', 'success');
};

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (e.key === 'Escape' && showConfirmModal.value) {
    closeModal();
  }
};

onMounted(() => {
  loadCommandes();
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.pipeline-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-line {
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Hover effects */
.btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.table tbody tr {
  transition: background-color 0.2s;
}

.badge {
  font-weight: 500;
}
</style>