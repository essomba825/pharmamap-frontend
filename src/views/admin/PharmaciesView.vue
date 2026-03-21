<template>
  <div class="admin-pharma">
    <NavBar />
    
    <div class="page-container">
      <!-- Header avec stats -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Gestion des pharmacies</h1>
            <p class="subtitle">{{ filteredPharmacies.length }} pharmacie{{ filteredPharmacies.length > 1 ? 's' : '' }} sur {{ pharmacies.length }}</p>
          </div>
          
          <div class="stats-cards">
            <div class="stat-card pending">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">En attente</div>
            </div>
            <div class="stat-card validated">
              <div class="stat-value">{{ validatedCount }}</div>
              <div class="stat-label">Validées</div>
            </div>
            <div class="stat-card inactive">
              <div class="stat-value">{{ inactiveCount }}</div>
              <div class="stat-label">Inactives</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Filtres et recherche -->
      <div class="controls-section" :class="{ 'sticky': isScrolled }">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Rechercher par nom, ville ou adresse..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>

        <div class="filters-group">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-chip', { active: activeFilter === filter.value }]"
          >
            {{ filter.label }}
            <span v-if="filter.count" class="count">{{ filter.count }}</span>
          </button>
        </div>

        <button class="refresh-btn" :disabled="loading" @click="loadPharmacies" :class="{ 'spinning': loading }">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !pharmacies.length" class="skeleton-loader">
        <div v-for="n in 5" :key="n" class="skeleton-row">
          <div class="skeleton-cell avatar"></div>
          <div class="skeleton-cell text"></div>
          <div class="skeleton-cell text short"></div>
          <div class="skeleton-cell badge"></div>
          <div class="skeleton-cell badge"></div>
          <div class="skeleton-cell actions"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!filteredPharmacies.length" class="empty-state">
        <div class="empty-icon">
          <i class="bi bi-shop"></i>
        </div>
        <h3>Aucune pharmacie trouvée</h3>
        <p>Essayez de modifier vos critères de recherche ou de filtres</p>
        <button v-if="searchQuery || activeFilter" @click="resetFilters" class="btn-reset">
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Desktop Table -->
      <div v-else class="table-container desktop-only">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="col-pharmacy">Pharmacie</th>
              <th class="col-location">Localisation</th>
              <th class="col-contact">Contact</th>
              <th class="col-status">Validation</th>
              <th class="col-state">État</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="pharmacie in paginatedPharmacies" 
              :key="pharmacie.id"
              :class="{ 'highlight': actionId === pharmacie.id }"
            >
              <td class="col-pharmacy">
                <div class="pharma-info">
                  <div class="pharma-avatar" :class="{ 'validated': pharmacie.validee }">
                    {{ initials(pharmacie.nom) }}
                  </div>
                  <div class="pharma-details">
                    <div class="pharma-name">{{ pharmacie.nom }}</div>
                    <div class="pharma-address">{{ truncate(pharmacie.adresse, 40) }}</div>
                  </div>
                </div>
              </td>
              
              <td class="col-location">
                <div class="location-info">
                  <i class="bi bi-geo-alt"></i>
                  <span>{{ pharmacie.ville || 'Non spécifiée' }}</span>
                </div>
              </td>
              
              <td class="col-contact">
                <div v-if="pharmacie.telephone" class="contact-info">
                  <i class="bi bi-telephone"></i>
                  <span>{{ formatPhone(pharmacie.telephone) }}</span>
                </div>
                <span v-else class="text-muted">-</span>
              </td>
              
              <td class="col-status">
                <span class="status-badge" :class="pharmacie.validee ? 'success' : 'warning'">
                  <i :class="pharmacie.validee ? 'bi bi-check-circle-fill' : 'bi bi-clock-fill'"></i>
                  {{ pharmacie.validee ? 'Validée' : 'En attente' }}
                </span>
              </td>
              
              <td class="col-state">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    :checked="pharmacie.active"
                    @change="confirmToggleActive(pharmacie)"
                    :disabled="actionId === pharmacie.id"
                  />
                  <span class="slider"></span>
                  <span class="switch-label">{{ pharmacie.active ? 'Active' : 'Inactive' }}</span>
                </label>
              </td>
              
              <td class="col-actions">
                <div class="action-dropdown">
                  <button 
                    class="action-btn validate" 
                    @click="confirmValidation(pharmacie)"
                    :disabled="actionId === pharmacie.id || pharmacie.validee"
                    :class="{ 'done': pharmacie.validee }"
                  >
                    <i :class="pharmacie.validee ? 'bi bi-check-lg' : 'bi bi-check-circle'"></i>
                    <span>{{ pharmacie.validee ? 'Validée' : 'Valider' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            :disabled="currentPage === 1" 
            @click="currentPage--"
            class="page-btn"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
          <button 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
            class="page-btn"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Cards -->
      <div class="mobile-cards mobile-only">
        <div 
          v-for="pharmacie in paginatedPharmacies" 
          :key="pharmacie.id"
          class="pharma-card"
          :class="{ 'processing': actionId === pharmacie.id }"
        >
          <div class="card-header">
            <div class="pharma-avatar" :class="{ 'validated': pharmacie.validee }">
              {{ initials(pharmacie.nom) }}
            </div>
            <div class="pharma-title">
              <h3>{{ pharmacie.nom }}</h3>
              <span class="address">{{ truncate(pharmacie.adresse, 35) }}</span>
            </div>
            <div class="menu-dots">
              <button @click="toggleMenu(pharmacie.id)" class="btn-icon">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <div v-if="openMenuId === pharmacie.id" class="dropdown-menu">
                <button 
                  @click="confirmValidation(pharmacie); openMenuId = null"
                  :disabled="pharmacie.validee"
                >
                  <i class="bi bi-check-circle"></i>
                  {{ pharmacie.validee ? 'Déjà validée' : 'Valider' }}
                </button>
                <button @click="openMenuId = null">
                  <i class="bi bi-pencil"></i> Modifier
                </button>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <i class="bi bi-geo-alt"></i>
              <span>{{ pharmacie.ville || 'Ville non spécifiée' }}</span>
            </div>
            <div v-if="pharmacie.telephone" class="info-row">
              <i class="bi bi-telephone"></i>
              <span>{{ formatPhone(pharmacie.telephone) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="validation-status" :class="{ 'valid': pharmacie.validee }">
              <i :class="pharmacie.validee ? 'bi bi-shield-check' : 'bi bi-shield-exclamation'"></i>
              <span>{{ pharmacie.validee ? 'Validée' : 'En attente de validation' }}</span>
            </div>
            
            <label class="switch small">
              <input 
                type="checkbox" 
                :checked="pharmacie.active"
                @change="confirmToggleActive(pharmacie)"
                :disabled="actionId === pharmacie.id"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <Transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-content">
            <div class="modal-icon" :class="modalAction.type">
              <i :class="modalAction.icon"></i>
            </div>
            <h3>{{ modalAction.title }}</h3>
            <p>{{ modalAction.message }}</p>
            <div class="modal-actions">
              <button @click="showModal = false" class="btn-secondary">Annuler</button>
              <button 
                @click="executeAction" 
                class="btn-primary"
                :class="modalAction.type"
                :disabled="!!actionId"
              >
                <span v-if="actionId" class="spinner-sm"></span>
                <span v-else>{{ modalAction.confirmText }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Toast Notifications -->
      <div class="toast-container">
        <TransitionGroup name="toast">
          <div 
            v-for="toast in toasts" 
            :key="toast.id" 
            class="toast"
            :class="toast.type"
          >
            <i :class="toast.icon"></i>
            <span>{{ toast.message }}</span>
            <button @click="removeToast(toast.id)" class="toast-close">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import coreApi from "@/api/core";

// State
const pharmacies = ref([]);
const loading = ref(false);
const actionId = ref(null);
const searchQuery = ref("");
const activeFilter = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const isScrolled = ref(false);
const openMenuId = ref(null);
const showModal = ref(false);
const modalAction = ref({});
const toasts = ref([]);

// Filters config
const filters = computed(() => [
  { value: "", label: "Toutes", count: pharmacies.value.length },
  { value: "pending", label: "En attente", count: pendingCount.value },
  { value: "validated", label: "Validées", count: validatedCount.value },
  { value: "inactive", label: "Inactives", count: inactiveCount.value }
]);

// Computed stats
const pendingCount = computed(() => pharmacies.value.filter(p => !p.validee).length);
const validatedCount = computed(() => pharmacies.value.filter(p => p.validee).length);
const inactiveCount = computed(() => pharmacies.value.filter(p => !p.active).length);

// Filtering logic
const filteredPharmacies = computed(() => {
  let result = pharmacies.value;

  // Text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.nom?.toLowerCase().includes(query) ||
      p.ville?.toLowerCase().includes(query) ||
      p.adresse?.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (activeFilter.value === "pending") result = result.filter(p => !p.validee);
  if (activeFilter.value === "validated") result = result.filter(p => p.validee);
  if (activeFilter.value === "inactive") result = result.filter(p => !p.active);

  return result;
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredPharmacies.value.length / itemsPerPage));
const paginatedPharmacies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredPharmacies.value.slice(start, start + itemsPerPage);
});

// Watch filter changes to reset page
watch([searchQuery, activeFilter], () => {
  currentPage.value = 1;
});

// Helper functions
const initials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

const truncate = (text, length) => {
  if (!text) return "-";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

const formatPhone = (phone) => {
  if (!phone) return "-";
  // Simple formatting for Cameroon/France style
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id;
};

// Toast system
const addToast = (message, type = "success") => {
  const id = Date.now();
  const icons = {
    success: "bi bi-check-circle-fill",
    error: "bi bi-x-circle-fill",
    warning: "bi bi-exclamation-triangle-fill"
  };
  toasts.value.push({ id, message, type, icon: icons[type] });
  setTimeout(() => removeToast(id), 5000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

// Modal confirmation system
const confirmValidation = (pharmacie) => {
  if (pharmacie.validee) return;
  
  modalAction.value = {
    type: "success",
    icon: "bi bi-check-circle",
    title: "Valider la pharmacie",
    message: `Êtes-vous sûr de vouloir valider "${pharmacie.nom}" ? Cela lui permettra d'apparaître dans les résultats de recherche.`,
    confirmText: "Valider",
    action: () => executeValidation(pharmacie)
  };
  showModal.value = true;
};

const confirmToggleActive = (pharmacie) => {
  const willActivate = !pharmacie.active;
  modalAction.value = {
    type: willActivate ? "success" : "warning",
    icon: willActivate ? "bi bi-power" : "bi bi-power",
    title: willActivate ? "Activer la pharmacie" : "Désactiver la pharmacie",
    message: willActivate 
      ? `"${pharmacie.nom}" sera visible et accessible par les utilisateurs.`
      : `"${pharmacie.nom}" sera temporairement masquée. Les utilisateurs ne pourront plus la voir.`,
    confirmText: willActivate ? "Activer" : "Désactiver",
    action: () => executeToggleActive(pharmacie)
  };
  showModal.value = true;
};

const executeAction = async () => {
  if (modalAction.value.action) {
    await modalAction.value.action();
  }
  showModal.value = false;
};

// API Actions (original logic preserved)
const loadPharmacies = async () => {
  loading.value = true;
  try {
    const { data } = await coreApi.getAdminPharmacies();
    pharmacies.value = data.pharmacies || [];
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de chargement", "error");
  } finally {
    loading.value = false;
  }
};

const executeValidation = async (pharmacie) => {
  actionId.value = pharmacie.id;
  try {
    await coreApi.updateAdminPharmacieStatus(pharmacie.id, { validee: true });
    addToast(`${pharmacie.nom} a été validée avec succès`);
    await loadPharmacies();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Action impossible", "error");
  } finally {
    actionId.value = null;
  }
};

const executeToggleActive = async (pharmacie) => {
  actionId.value = pharmacie.id;
  try {
    await coreApi.updateAdminPharmacieStatus(pharmacie.id, { active: !pharmacie.active });
    addToast(
      pharmacie.active 
        ? `${pharmacie.nom} a été désactivée` 
        : `${pharmacie.nom} est maintenant active`
    );
    await loadPharmacies();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Action impossible", "error");
  } finally {
    actionId.value = null;
  }
};

const resetFilters = () => {
  searchQuery.value = "";
  activeFilter.value = "";
};

// Scroll handling
onMounted(() => {
  loadPharmacies();
  window.addEventListener("scroll", () => {
    isScrolled.value = window.scrollY > 100;
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-dots")) openMenuId.value = null;
  });
});
</script>

<style scoped>
/* Design System */
.admin-pharma {
  --color-primary: #0d9488;
  --color-primary-light: #ccfbf1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --radius: 12px;
  
  background-color: var(--color-gray-50);
  min-height: 100vh;
  overflow-x: hidden;
}

.admin-pharma,
.admin-pharma * {
  box-sizing: border-box;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
  max-width: 100%;
}

.title-section h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.subtitle {
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

.stats-cards {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  max-width: 100%;
}

.stat-card {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  text-align: center;
  min-width: 100px;
  flex: 1 1 140px;
  border-top: 3px solid;
}

.stat-card.pending { border-top-color: var(--color-warning); }
.stat-card.validated { border-top-color: var(--color-success); }
.stat-card.inactive { border-top-color: var(--color-gray-500); }

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

/* Controls Section */
.controls-section {
  background: white;
  padding: 1.25rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  transition: all 0.3s;
  width: 100%;
}

.controls-section.sticky {
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: var(--shadow-lg);
  border-radius: 0 0 var(--radius) var(--radius);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-500);
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: var(--color-gray-50);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-gray-500);
  cursor: pointer;
  padding: 0.25rem;
}

.filters-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-200);
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filter-chip .count {
  background: rgba(255,255,255,0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

.refresh-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-200);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.refresh-btn.spinning i {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Skeleton Loading */
.skeleton-loader {
  background: white;
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.skeleton-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.skeleton-cell {
  background: linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-cell.avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.skeleton-cell.text { flex: 1; height: 20px; }
.skeleton-cell.text.short { flex: 0.5; }
.skeleton-cell.badge { width: 100px; height: 24px; border-radius: 12px; }
.skeleton-cell.actions { width: 120px; height: 36px; }

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: var(--color-gray-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: var(--color-gray-500);
}

.empty-state h3 {
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-gray-500);
  margin-bottom: 1.5rem;
}

.btn-reset {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

/* Modern Table */
.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
}

.modern-table th {
  background: var(--color-gray-50);
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-500);
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-gray-200);
}

.modern-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.modern-table tr:hover td {
  background: var(--color-gray-50);
}

.modern-table tr.highlight td {
  background: var(--color-primary-light);
  transition: background 0.3s;
}

/* Table Columns */
.pharma-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pharma-avatar {
  width: 40px;
  height: 40px;
  background: var(--color-gray-200);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.pharma-avatar.validated {
  background: var(--color-primary);
  color: white;
}

.pharma-name {
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 0.25rem;
}

.pharma-address {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.location-info, .contact-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: var(--color-gray-300);
  border-radius: 24px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

input:checked + .slider {
  background-color: var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.switch-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.switch.small .slider {
  width: 36px;
  height: 20px;
}

.switch.small .slider:before {
  height: 14px;
  width: 14px;
}

.switch.small input:checked + .slider:before {
  transform: translateX(16px);
}

/* Action Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-gray-200);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.validate.done {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-gray-200);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-600);
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

/* Mobile Cards */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.pharma-card {
  background: white;
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  width: 100%;
}

.pharma-card.processing {
  opacity: 0.7;
  pointer-events: none;
}

.card-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;
}

.pharma-title h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--color-gray-900);
}

.pharma-title .address {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.menu-dots {
  margin-left: auto;
  position: relative;
}

.btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  z-index: 50;
  overflow: hidden;
  border: 1px solid var(--color-gray-100);
}

.dropdown-menu button {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-gray-700);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-menu button:hover {
  background: var(--color-gray-50);
}

.dropdown-menu button:disabled {
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.card-body {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-gray-600);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-warning);
  font-weight: 500;
}

.validation-status.valid {
  color: var(--color-success);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: var(--radius);
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  animation: modal-pop 0.3s ease;
}

@keyframes modal-pop {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.75rem;
}

.modal-icon.success { background: #d1fae5; color: #065f46; }
.modal-icon.warning { background: #fef3c7; color: #92400e; }

.modal-content h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-gray-900);
}

.modal-content p {
  color: var(--color-gray-500);
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-secondary, .btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0f766e;
}

.btn-primary.success { background: var(--color-success); }
.btn-primary.warning { background: var(--color-warning); }

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: calc(100% - 2rem);
}

.toast {
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  max-width: 100%;
  animation: slide-in 0.3s ease;
  border-left: 4px solid;
}

.toast.success { border-left-color: var(--color-success); }
.toast.error { border-left-color: var(--color-danger); }

@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Responsive */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 968px) {
  .page-container {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-cards {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat-card {
    flex: 1;
    min-width: auto;
    padding: 0.75rem;
  }
  
  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .filters-group {
    overflow-x: visible;
    padding-bottom: 0;
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }
  
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: flex;
  }
  
  .toast-container {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }
  
  .toast {
    min-width: auto;
  }
}
</style>
