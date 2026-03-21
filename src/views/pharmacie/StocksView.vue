<template>
  <div class="stock-manager">
    <NavBar />
    
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-title">
          <h1>Gestion des Stocks</h1>
          <p class="subtitle">{{ stats.total }} articles en inventaire</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="showAddForm = !showAddForm">
            <i class="bi" :class="showAddForm ? 'bi-x-lg' : 'bi-plus-lg'"></i>
            {{ showAddForm ? 'Fermer' : 'Nouveau stock' }}
          </button>
          <button class="btn-secondary" @click="showImport = !showImport">
            <i class="bi bi-upload"></i>
            Import SQL
          </button>
        </div>
      </header>

      <!-- Stats Dashboard -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">
            <i class="bi bi-box-seam"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">Total articles</div>
          </div>
          <div class="stat-trend">100%</div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.disponibles }}</div>
            <div class="stat-label">Disponibles</div>
          </div>
          <div class="stat-trend">{{ Math.round((stats.disponibles / stats.total) * 100) || 0 }}%</div>
        </div>

        <div class="stat-card danger">
          <div class="stat-icon">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.en_rupture }}</div>
            <div class="stat-label">Ruptures</div>
          </div>
          <div class="stat-trend alert">{{ Math.round((stats.en_rupture / stats.total) * 100) || 0 }}%</div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">
            <i class="bi bi-graph-down-arrow"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ lowStockCount }}</div>
            <div class="stat-label">Stock faible</div>
          </div>
          <div class="stat-trend warning">Alerte</div>
        </div>
      </div>

      <!-- Formulaire d'ajout (Collapsible) -->
      <Transition name="slide-down">
        <div v-if="showAddForm" class="form-section">
          <div class="form-card">
            <div class="form-header">
              <h3>Ajouter / Recharger un stock</h3>
              <button class="btn-close" @click="showAddForm = false">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            
            <form @submit.prevent="addStock" class="form-grid">
              <div class="form-group search-article">
                <label>Rechercher un article</label>
                <div class="search-input-wrapper">
                  <i class="bi bi-search"></i>
                  <input 
                    v-model="articleSearch" 
                    type="text" 
                    class="form-control" 
                    placeholder="Ex: Paracétamol, Ibuprofène..."
                  />
                  <div v-if="filteredArticles.length && articleSearch" class="search-results">
                    <div 
                      v-for="article in filteredArticles.slice(0, 5)" 
                      :key="article.id"
                      class="search-item"
                      @click="selectArticle(article)"
                    >
                      <i class="bi bi-capsule"></i>
                      <span>{{ article.nom }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Article sélectionné</label>
                <div class="selected-article" :class="{ 'empty': !newStock.article_id }">
                  <template v-if="newStock.article_id">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <span>{{ selectedArticleName }}</span>
                  </template>
                  <template v-else>
                    <i class="bi bi-circle text-muted"></i>
                    <span class="text-muted">Aucun article sélectionné</span>
                  </template>
                </div>
                <small v-if="selectedStock" class="form-hint">
                  Stock actuel: <strong>{{ selectedStock.quantite }}</strong> unités · 
                  Prix: <strong>{{ selectedStock.prix }}</strong> FCFA
                </small>
              </div>

              <div class="form-group">
                <label>Quantité</label>
                <div class="input-stepper">
                  <button type="button" @click="newStock.quantite = Math.max(1, newStock.quantite - 1)">
                    <i class="bi bi-dash"></i>
                  </button>
                  <input v-model.number="newStock.quantite" type="number" min="1" required />
                  <button type="button" @click="newStock.quantite++">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Prix unitaire (FCFA)</label>
                <div class="input-currency">
                  <input v-model.number="newStock.prix" type="number" min="0" required />
                  <span class="currency">FCFA</span>
                </div>
              </div>

              <div class="form-group">
                <label>Seuil d'alerte</label>
                <input 
                  v-model.number="newStock.seuil_alerte" 
                  type="number" 
                  min="0" 
                  class="form-control"
                />
                <small class="form-hint">Niveau minimum avant alerte "stock faible"</small>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-text" @click="showAddForm = false">Annuler</button>
                <button type="submit" class="btn-primary" :disabled="saving || !newStock.article_id">
                  <span v-if="saving" class="spinner-sm"></span>
                  <i v-else class="bi bi-check-lg"></i>
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Import SQL (Collapsible) -->
      <Transition name="slide-down">
        <div v-if="showImport" class="form-section import-section">
          <div class="form-card">
            <div class="form-header">
              <h3>Importer une base SQL</h3>
              <button class="btn-close" @click="showImport = false">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="import-area">
              <div class="file-dropzone" 
                   :class="{ 'dragging': isDragging }"
                   @dragover.prevent="isDragging = true"
                   @dragleave.prevent="isDragging = false"
                   @drop.prevent="handleDrop">
                <input 
                  type="file" 
                  ref="fileInput"
                  accept=".sql" 
                  @change="onImportFile"
                  class="file-input"
                />
                <div class="dropzone-content">
                  <i class="bi bi-cloud-upload"></i>
                  <p>Glissez votre fichier .sql ici ou <span @click="$refs.fileInput.click()">cliquez pour parcourir</span></p>
                  <small>Formats supportés: .sql (MySQL, PostgreSQL)</small>
                </div>
              </div>
              
              <div v-if="importFile" class="file-selected">
                <div class="file-info">
                  <i class="bi bi-file-earmark-text"></i>
                  <div>
                    <div class="filename">{{ importFile.name }}</div>
                    <small>{{ formatFileSize(importFile.size) }}</small>
                  </div>
                </div>
                <button 
                  class="btn-primary" 
                  :disabled="importing" 
                  @click="importSql"
                >
                  <span v-if="importing" class="spinner-sm"></span>
                  {{ importing ? 'Importation...' : 'Importer' }}
                </button>
              </div>

              <div v-if="importSummary" class="import-summary" :class="{ 'success': importSummary.articles_cres > 0 }">
                <div class="summary-title">
                  <i class="bi bi-check-circle-fill"></i>
                  Import terminé
                </div>
                <div class="summary-stats">
                  <div class="summary-stat">
                    <span class="value success">{{ importSummary.articles_crees }}</span>
                    <span class="label">articles créés</span>
                  </div>
                  <div class="summary-stat">
                    <span class="value info">{{ importSummary.stocks_mis_a_jour }}</span>
                    <span class="label">stocks mis à jour</span>
                  </div>
                  <div class="summary-stat" v-if="importSummary.lignes_ignorees">
                    <span class="value warning">{{ importSummary.lignes_ignorees }}</span>
                    <span class="label">lignes ignorées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Barre d'outils -->
      <div class="toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Rechercher un produit..." 
          />
          <button v-if="searchTerm" class="clear-btn" @click="searchTerm = ''">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="toolbar-filters">
          <button 
            v-for="filter in stockFilters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-chip', { active: activeFilter === filter.value }]"
          >
            {{ filter.label }}
            <span class="count">{{ filter.count }}</span>
          </button>
        </div>
      </div>

      <!-- Bulk Actions Bar (flottante) -->
      <Transition name="slide-up">
        <div v-if="selectedIds.length" class="bulk-bar">
          <div class="bulk-info">
            <i class="bi bi-check2-square"></i>
            <span><strong>{{ selectedIds.length }}</strong> article{{ selectedIds.length > 1 ? 's' : '' }} sélectionné{{ selectedIds.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="bulk-actions">
            <button class="btn-text" @click="selectedIds = []">Tout désélectionner</button>
            <button class="btn-danger" :disabled="bulkDeleting" @click="removeSelected">
              <i class="bi bi-trash"></i>
              {{ bulkDeleting ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Desktop Table -->
      <div class="table-container desktop-only">
        <div class="table-header">
          <label class="checkbox-wrapper">
            <input 
              type="checkbox" 
              :checked="allSelected" 
              @change="toggleSelectAll"
            />
            <span class="checkmark"></span>
          </label>
          <div class="header-cell product">Produit</div>
          <div class="header-cell stock">Niveau de stock</div>
          <div class="header-cell price">Prix</div>
          <div class="header-cell status">Statut</div>
          <div class="header-cell actions">Actions</div>
        </div>

        <div v-if="loading && !stocks.length" class="skeleton-list">
          <div v-for="n in 5" :key="n" class="skeleton-row">
            <div class="skeleton-checkbox"></div>
            <div class="skeleton-text long"></div>
            <div class="skeleton-bar"></div>
            <div class="skeleton-text short"></div>
            <div class="skeleton-badge"></div>
          </div>
        </div>

        <div v-else-if="!filteredStocks.length" class="empty-table">
          <i class="bi bi-inbox"></i>
          <p>Aucun stock trouvé</p>
          <button v-if="searchTerm || activeFilter" class="btn-text" @click="resetFilters">
            Réinitialiser les filtres
          </button>
        </div>

        <div v-else class="table-body">
          <div 
            v-for="stock in paginatedStocks" 
            :key="stock.id"
            class="table-row"
            :class="{ 
              'editing': editId === stock.id, 
              'selected': selectedIds.includes(stock.id),
              'low-stock': isLowStock(stock),
              'out-of-stock': !stock.disponible || stock.quantite === 0
            }"
          >
            <label class="checkbox-wrapper" @click.stop>
              <input 
                type="checkbox" 
                :checked="selectedIds.includes(stock.id)"
                @change="toggleSelect(stock.id)"
              />
              <span class="checkmark"></span>
            </label>

            <!-- Mode Affichage -->
            <template v-if="editId !== stock.id">
              <div class="cell product">
                <div class="product-info">
                  <div class="product-icon" :class="getStockClass(stock)">
                    <i class="bi bi-capsule-pill"></i>
                  </div>
                  <div class="product-details">
                    <div class="product-name">{{ stock.article_nom }}</div>
                    <div class="product-meta">
                      Seuil: {{ stock.seuil_alerte || 5 }} unités
                    </div>
                  </div>
                </div>
              </div>

              <div class="cell stock">
                <div class="stock-visual">
                  <div class="stock-bar-bg">
                    <div 
                      class="stock-bar-fill" 
                      :class="getStockClass(stock)"
                      :style="{ width: Math.min(100, (stock.quantite / Math.max(stock.seuil_alerte * 2, stock.quantite)) * 100) + '%' }"
                    ></div>
                  </div>
                  <div class="stock-numbers">
                    <span class="current" :class="getStockClass(stock)">{{ stock.quantite }}</span>
                    <span class="separator">/</span>
                    <span class="threshold">{{ stock.seuil_alerte || 5 }} min</span>
                  </div>
                </div>
              </div>

              <div class="cell price">
                <span class="price-tag">{{ formatPrice(stock.prix) }}</span>
              </div>

              <div class="cell status">
                <span class="status-badge" :class="stock.disponible ? 'available' : 'unavailable'">
                  <span class="dot"></span>
                  {{ stock.disponible ? 'Disponible' : 'Indisponible' }}
                </span>
              </div>

              <div class="cell actions">
                <button class="btn-icon" @click="startEdit(stock)" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-icon danger" @click="confirmDelete(stock)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </template>

            <!-- Mode Édition -->
            <template v-else>
              <div class="edit-row">
                <div class="edit-title">
                  <i class="bi bi-pencil-square"></i>
                  Modifier {{ stock.article_nom }}
                </div>
                <div class="edit-fields">
                  <div class="edit-field">
                    <label>Quantité</label>
                    <input v-model.number="editForm.quantite" type="number" min="0" />
                  </div>
                  <div class="edit-field">
                    <label>Prix (FCFA)</label>
                    <input v-model.number="editForm.prix" type="number" min="0" />
                  </div>
                  <div class="edit-field">
                    <label>Seuil</label>
                    <input v-model.number="editForm.seuil_alerte" type="number" min="0" />
                  </div>
                  <div class="edit-field toggle-field">
                    <label>Disponible</label>
                    <label class="switch">
                      <input type="checkbox" v-model="editForm.disponible" />
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
                <div class="edit-actions">
                  <button class="btn-text" @click="cancelEdit">Annuler</button>
                  <button class="btn-primary" :disabled="actionId === stock.id" @click="saveEdit(stock.id)">
                    <span v-if="actionId === stock.id" class="spinner-sm"></span>
                    <span v-else>Sauvegarder</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="table-footer">
          <div class="pagination">
            <button :disabled="currentPage === 1" @click="currentPage--">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
            <button :disabled="currentPage === totalPages" @click="currentPage++">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Cards -->
      <div class="mobile-cards mobile-only">
        <div 
          v-for="stock in paginatedStocks" 
          :key="stock.id"
          class="stock-card"
          :class="{ 'low-stock': isLowStock(stock), 'out': !stock.disponible }"
        >
          <div class="card-header">
            <div class="product-main">
              <div class="icon" :class="getStockClass(stock)">
                <i class="bi bi-capsule"></i>
              </div>
              <div class="info">
                <h4>{{ stock.article_nom }}</h4>
                <span class="price">{{ formatPrice(stock.prix) }}</span>
              </div>
            </div>
            <label class="checkbox-wrapper">
              <input 
                type="checkbox" 
                :checked="selectedIds.includes(stock.id)"
                @change="toggleSelect(stock.id)"
              />
              <span class="checkmark"></span>
            </label>
          </div>

          <div class="card-body">
            <div class="stock-indicator">
              <div class="bar-bg">
                <div 
                  class="bar-fill" 
                  :class="getStockClass(stock)"
                  :style="{ width: Math.min(100, (stock.quantite / Math.max(stock.seuil_alerte * 2, 10)) * 100) + '%' }"
                ></div>
              </div>
              <div class="stock-text">
                <span :class="getStockClass(stock)">{{ stock.quantite }} unités</span>
                <span class="sep">•</span>
                <span>Seuil: {{ stock.seuil_alerte }}</span>
              </div>
            </div>
            <div class="status-row">
              <span class="badge" :class="stock.disponible ? 'ok' : 'ko'">
                {{ stock.disponible ? '✓ Disponible' : '✗ Indisponible' }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button @click="startEdit(stock)" class="btn-outline">
              <i class="bi bi-pencil"></i> Modifier
            </button>
            <button @click="confirmDelete(stock)" class="btn-outline danger">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation suppression -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content">
          <div class="modal-icon danger">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Confirmer la suppression</h3>
          <p>Êtes-vous sûr de vouloir supprimer <strong>{{ itemToDelete?.article_nom }}</strong> du stock ?</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showDeleteModal = false">Annuler</button>
            <button class="btn-danger" :disabled="!!actionId" @click="executeDelete">
              <span v-if="actionId" class="spinner-sm"></span>
              <span v-else>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toasts -->
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
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import coreApi from "@/api/core";

// State
const stocks = ref([]);
const articles = ref([]);
const stats = reactive({ total: 0, disponibles: 0, en_rupture: 0 });
const loading = ref(false);
const saving = ref(false);
const actionId = ref(null);
const editId = ref(null);
const showAddForm = ref(false);
const showImport = ref(false);
const isDragging = ref(false);
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const toasts = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const activeFilter = ref('');
const searchTerm = ref('');
const articleSearch = ref('');
const importFile = ref(null);
const importing = ref(false);
const importSummary = ref(null);
const selectedIds = ref([]);
const bulkDeleting = ref(false);
const fileInput = ref(null);

const newStock = reactive({
  article_id: "",
  quantite: 1,
  prix: 0,
  seuil_alerte: 5
});

const editForm = reactive({
  quantite: 0,
  prix: 0,
  seuil_alerte: 5,
  disponible: true
});

// Computed
const selectedArticleName = computed(() => {
  const article = articles.value.find(a => a.id === newStock.article_id);
  return article?.nom || 'Article inconnu';
});

const filteredArticles = computed(() => {
  const term = articleSearch.value.trim().toLowerCase();
  if (!term) return articles.value;
  return articles.value.filter(a => (a.nom || "").toLowerCase().includes(term));
});

const selectedStock = computed(() => {
  if (!newStock.article_id) return null;
  return stocks.value.find(s => s.article_id === newStock.article_id) || null;
});

const lowStockCount = computed(() => {
  return stocks.value.filter(s => s.quantite > 0 && s.quantite <= (s.seuil_alerte || 5)).length;
});

const stockFilters = computed(() => [
  { value: '', label: 'Tous', count: stocks.value.length },
  { value: 'available', label: 'Disponibles', count: stats.disponibles },
  { value: 'low', label: 'Stock faible', count: lowStockCount.value },
  { value: 'out', label: 'Rupture', count: stats.en_rupture }
]);

const filteredStocks = computed(() => {
  let result = [...stocks.value];
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(s => (s.article_nom || "").toLowerCase().includes(term));
  }
  
  if (activeFilter.value === 'available') result = result.filter(s => s.disponible);
  if (activeFilter.value === 'low') result = result.filter(s => s.quantite > 0 && s.quantite <= (s.seuil_alerte || 5));
  if (activeFilter.value === 'out') result = result.filter(s => !s.disponible || s.quantite === 0);
  
  return result.sort((a, b) => {
    // Sort by urgency: rupture > low stock > normal
    const aUrgent = !a.disponible || a.quantite === 0 ? 2 : (a.quantite <= (a.seuil_alerte || 5) ? 1 : 0);
    const bUrgent = !b.disponible || b.quantite === 0 ? 2 : (b.quantite <= (b.seuil_alerte || 5) ? 1 : 0);
    return bUrgent - aUrgent;
  });
});

const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage));
const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredStocks.value.slice(start, start + itemsPerPage);
});

const allSelected = computed(() => {
  if (!paginatedStocks.value.length) return false;
  return paginatedStocks.value.every(s => selectedIds.value.includes(s.id));
});

// Methods
const addToast = (message, type = 'success') => {
  const icons = {
    success: 'bi bi-check-circle-fill',
    error: 'bi bi-x-circle-fill',
    warning: 'bi bi-exclamation-triangle-fill'
  };
  const id = Date.now();
  toasts.value.push({ id, message, type, icon: icons[type] });
  setTimeout(() => removeToast(id), 5000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

const selectArticle = (article) => {
  newStock.article_id = article.id;
  articleSearch.value = article.nom;
};

const isLowStock = (stock) => {
  return stock.quantite > 0 && stock.quantite <= (stock.seuil_alerte || 5);
};

const getStockClass = (stock) => {
  if (!stock.disponible || stock.quantite === 0) return 'danger';
  if (isLowStock(stock)) return 'warning';
  return 'success';
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length) {
    importFile.value = files[0];
    importSummary.value = null;
  }
};

const onImportFile = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    importFile.value = file;
    importSummary.value = null;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [{ data: stockData }, { data: statsData }, { data: articlesData }] = await Promise.all([
      coreApi.getPharmacieStocks(),
      coreApi.getPharmacieStockStats(),
      coreApi.getArticles()
    ]);
    stocks.value = stockData.stocks || [];
    stats.total = statsData.total || 0;
    stats.disponibles = statsData.disponibles || 0;
    stats.en_rupture = statsData.en_rupture || 0;
    articles.value = articlesData.articles || [];
    selectedIds.value = [];
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de chargement", 'error');
  } finally {
    loading.value = false;
  }
};

const addStock = async () => {
  saving.value = true;
  try {
    await coreApi.createPharmacieStock({
      article_id: newStock.article_id,
      quantite: Number(newStock.quantite) || 0,
      prix: Number(newStock.prix) || 0,
      seuil_alerte: Number(newStock.seuil_alerte) || 0,
      disponible: true
    });
    await loadData();
    addToast("Stock ajouté avec succès");
    showAddForm.value = false;
    newStock.article_id = "";
    newStock.quantite = 1;
    newStock.prix = 0;
    newStock.seuil_alerte = 5;
    articleSearch.value = "";
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur lors de l'ajout", 'error');
  } finally {
    saving.value = false;
  }
};

const startEdit = (stock) => {
  editId.value = stock.id;
  editForm.quantite = Number(stock.quantite) || 0;
  editForm.prix = Number(stock.prix) || 0;
  editForm.seuil_alerte = Number(stock.seuil_alerte ?? 5) || 0;
  editForm.disponible = Boolean(stock.disponible);
};

const cancelEdit = () => {
  editId.value = null;
};

const saveEdit = async (stockId) => {
  actionId.value = stockId;
  try {
    await coreApi.updatePharmacieStock(stockId, {
      quantite: Number(editForm.quantite) || 0,
      prix: Number(editForm.prix) || 0,
      seuil_alerte: Number(editForm.seuil_alerte) || 0,
      disponible: Boolean(editForm.disponible)
    });
    await loadData();
    addToast("Modifications sauvegardées");
    editId.value = null;
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de modification", 'error');
  } finally {
    actionId.value = null;
  }
};

const confirmDelete = (stock) => {
  itemToDelete.value = stock;
  showDeleteModal.value = true;
};

const executeDelete = async () => {
  if (!itemToDelete.value) return;
  actionId.value = itemToDelete.value.id;
  try {
    await coreApi.deletePharmacieStock(itemToDelete.value.id);
    await loadData();
    addToast("Stock supprimé");
    showDeleteModal.value = false;
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de suppression", 'error');
  } finally {
    actionId.value = null;
    itemToDelete.value = null;
  }
};

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !paginatedStocks.value.find(s => s.id === id));
  } else {
    paginatedStocks.value.forEach(s => {
      if (!selectedIds.value.includes(s.id)) selectedIds.value.push(s.id);
    });
  }
};

const removeSelected = async () => {
  if (!selectedIds.value.length) return;
  if (!confirm(`Supprimer ${selectedIds.value.length} articles ?`)) return;
  
  bulkDeleting.value = true;
  let failed = 0;
  for (const id of selectedIds.value) {
    try {
      await coreApi.deletePharmacieStock(id);
    } catch {
      failed++;
    }
  }
  await loadData();
  selectedIds.value = [];
  if (failed) addToast(`${failed} erreurs lors de la suppression`, 'error');
  else addToast("Articles supprimés");
  bulkDeleting.value = false;
};

const importSql = async () => {
  if (!importFile.value) return;
  importing.value = true;
  try {
    const { data } = await coreApi.importPharmacieSql(importFile.value);
    importSummary.value = data.import || null;
    addToast("Import terminé avec succès");
    await loadData();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur d'import", 'error');
  } finally {
    importing.value = false;
  }
};

const resetFilters = () => {
  searchTerm.value = '';
  activeFilter.value = '';
};

// Watch
watch(() => newStock.article_id, (id) => {
  if (!id) {
    newStock.quantite = 1;
    newStock.prix = 0;
    newStock.seuil_alerte = 5;
    return;
  }
  const existing = stocks.value.find(s => s.article_id === id);
  if (existing) {
    newStock.quantite = existing.quantite;
    newStock.prix = existing.prix;
    newStock.seuil_alerte = existing.seuil_alerte || 5;
  }
});

watch([searchTerm, activeFilter], () => {
  currentPage.value = 1;
});

onMounted(loadData);
</script>

<style scoped>
.stock-manager {
  --color-primary: #0d9488;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --radius: 12px;
  
  background-color: var(--color-gray-50);
  min-height: 100vh;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.subtitle {
  color: var(--color-gray-600);
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn-primary, .btn-secondary, .btn-danger, .btn-text, .btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0f766e;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: white;
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-gray-200);
  color: var(--color-gray-600);
}

.btn-outline.danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.btn-text {
  background: transparent;
  color: var(--color-gray-600);
  padding: 0.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card.total { border-left: 4px solid #6366f1; }
.stat-card.success { border-left: 4px solid var(--color-success); }
.stat-card.danger { border-left: 4px solid var(--color-danger); }
.stat-card.warning { border-left: 4px solid var(--color-warning); }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-card.total .stat-icon { background: #e0e7ff; color: #6366f1; }
.stat-card.success .stat-icon { background: #d1fae5; color: var(--color-success); }
.stat-card.danger .stat-icon { background: #fee2e2; color: var(--color-danger); }
.stat-card.warning .stat-icon { background: #fef3c7; color: var(--color-warning); }

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-gray-600);
}

.stat-trend {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: var(--color-gray-100);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-600);
}

.stat-trend.alert { background: #fee2e2; color: var(--color-danger); }
.stat-trend.warning { background: #fef3c7; color: var(--color-warning); }

/* Forms */
.form-section {
  margin-bottom: 2rem;
}

.form-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.form-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-gray-900);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.btn-close:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.form-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-control {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper > i {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-input-wrapper input {
  padding-left: 2.5rem;
  width: 100%;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
}

.search-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.search-item:hover {
  background: var(--color-gray-50);
}

.selected-article {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
}

.selected-article.empty {
  color: var(--color-gray-400);
}

.input-stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.input-stepper button {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-gray-50);
  cursor: pointer;
  color: var(--color-gray-600);
  transition: all 0.2s;
}

.input-stepper button:hover {
  background: var(--color-gray-100);
}

.input-stepper input {
  width: 60px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--color-gray-200);
  border-right: 1px solid var(--color-gray-200);
  font-weight: 600;
}

.input-currency {
  position: relative;
}

.input-currency input {
  width: 100%;
  padding-right: 60px;
}

.currency {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-100);
}

/* Import Area */
.import-section .form-card {
  background: #f8fafc;
}

.file-dropzone {
  border: 2px dashed var(--color-gray-300);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  position: relative;
}

.file-dropzone.dragging {
  border-color: var(--color-primary);
  background: rgba(13, 148, 136, 0.05);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.dropzone-content i {
  font-size: 2rem;
  color: var(--color-gray-400);
  margin-bottom: 0.75rem;
}

.dropzone-content p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.dropzone-content span {
  color: var(--color-primary);
  font-weight: 500;
  cursor: pointer;
}

.file-selected {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-info i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.filename {
  font-weight: 500;
  color: var(--color-gray-900);
}

.import-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
}

.import-summary.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-success);
  margin-bottom: 0.75rem;
}

.summary-stats {
  display: flex;
  gap: 1.5rem;
}

.summary-stat {
  display: flex;
  flex-direction: column;
}

.summary-stat .value {
  font-size: 1.25rem;
  font-weight: 700;
}

.summary-stat .value.success { color: var(--color-success); }
.summary-stat .value.info { color: #3b82f6; }
.summary-stat .value.warning { color: var(--color-warning); }

.summary-stat .label {
  font-size: 0.75rem;
  color: var(--color-gray-600);
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-box input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
}

.toolbar-filters {
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
  color: var(--color-gray-600);
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
  background: rgba(0,0,0,0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

/* Bulk Bar */
.bulk-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-gray-900);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.bulk-actions {
  display: flex;
  gap: 1rem;
}

.bulk-bar .btn-text {
  color: rgba(255,255,255,0.8);
}

.bulk-bar .btn-text:hover {
  color: white;
}

.bulk-bar .btn-danger {
  background: var(--color-danger);
  padding: 0.5rem 1rem;
}

/* Table */
.table-container {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 2fr 2fr 1fr 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-500);
  letter-spacing: 0.05em;
  align-items: center;
}

.table-body {
  max-height: 600px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 2fr 2fr 1fr 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
  align-items: center;
  transition: all 0.2s;
}

.table-row:hover {
  background: var(--color-gray-50);
}

.table-row.selected {
  background: #f0fdfa;
}

.table-row.editing {
  grid-template-columns: 1fr;
  background: #f8fafc;
}

.table-row.low-stock {
  border-left: 3px solid var(--color-warning);
}

.table-row.out-of-stock {
  border-left: 3px solid var(--color-danger);
  opacity: 0.8;
}

/* Checkbox */
.checkbox-wrapper {
  position: relative;
  cursor: pointer;
  width: 20px;
  height: 20px;
}

.checkbox-wrapper input {
  opacity: 0;
  position: absolute;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-gray-300);
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-wrapper input:checked + .checkmark {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-wrapper input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Cells */
.product-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.product-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.product-icon.success { background: #d1fae5; color: var(--color-success); }
.product-icon.warning { background: #fef3c7; color: #d97706; }
.product-icon.danger { background: #fee2e2; color: var(--color-danger); }

.product-name {
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 0.25rem;
}

.product-meta {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

/* Stock Visual */
.stock-visual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stock-bar-bg {
  height: 6px;
  background: var(--color-gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.stock-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stock-bar-fill.success { background: var(--color-success); }
.stock-bar-fill.warning { background: var(--color-warning); }
.stock-bar-fill.danger { background: var(--color-danger); }

.stock-numbers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.stock-numbers .current {
  font-weight: 700;
}

.stock-numbers .current.success { color: var(--color-success); }
.stock-numbers .current.warning { color: var(--color-warning); }
.stock-numbers .current.danger { color: var(--color-danger); }

.stock-numbers .separator {
  color: var(--color-gray-400);
}

.stock-numbers .threshold {
  color: var(--color-gray-500);
  font-size: 0.75rem;
}

.price-tag {
  font-weight: 600;
  color: var(--color-gray-900);
  font-variant-numeric: tabular-nums;
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

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-badge.available {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.available .dot { background: var(--color-success); }

.status-badge.unavailable {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.unavailable .dot { background: var(--color-danger); }

/* Edit Row */
.edit-row {
  padding: 1rem;
}

.edit-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-gray-900);
}

.edit-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-600);
}

.edit-field input, .edit-field select {
  padding: 0.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-300);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Icons */
.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-gray-500);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.btn-icon.danger:hover {
  background: #fee2e2;
  color: var(--color-danger);
}

/* Skeleton */
.skeleton-list {
  padding: 1rem;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 40px 2fr 2fr 1fr 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.skeleton-checkbox {
  width: 20px;
  height: 20px;
  background: var(--color-gray-200);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

.skeleton-text {
  height: 16px;
  background: var(--color-gray-200);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

.skeleton-text.long { width: 100%; }
.skeleton-text.short { width: 60px; }

.skeleton-bar {
  height: 6px;
  background: var(--color-gray-200);
  border-radius: 3px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty State */
.empty-table {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-gray-400);
}

.empty-table i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Pagination */
.table-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination button {
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

.pagination button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-gray-600);
}

/* Mobile Cards */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-card {
  background: white;
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  border-left: 4px solid transparent;
}

.stock-card.low-stock { border-left-color: var(--color-warning); }
.stock-card.out { border-left-color: var(--color-danger); opacity: 0.8; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.product-main {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.product-main .icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.product-main .icon.success { background: #d1fae5; color: var(--color-success); }
.product-main .icon.warning { background: #fef3c7; color: #d97706; }
.product-main .icon.danger { background: #fee2e2; color: var(--color-danger); }

.product-main .info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--color-gray-900);
}

.product-main .info .price {
  font-weight: 600;
  color: var(--color-primary);
}

.card-body {
  margin-bottom: 1rem;
}

.stock-indicator {
  margin-bottom: 0.75rem;
}

.bar-bg {
  height: 8px;
  background: var(--color-gray-100);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stock-text {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  align-items: center;
}

.stock-text .sep {
  color: var(--color-gray-400);
}

.status-row .badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-row .badge.ok {
  background: #d1fae5;
  color: #065f46;
}

.status-row .badge.ko {
  background: #fee2e2;
  color: #991b1b;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.card-actions button {
  flex: 1;
  justify-content: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
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
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
}

.modal-icon.danger {
  background: #fee2e2;
  color: var(--color-danger);
}

.modal-content h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-gray-900);
}

.modal-content p {
  color: var(--color-gray-600);
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-actions .btn-secondary {
  background: var(--color-gray-100);
}

/* Toasts */
.toast-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  animation: toast-in 0.3s ease;
  border-left: 4px solid;
}

.toast.success { border-left-color: var(--color-success); }
.toast.error { border-left-color: var(--color-danger); }

@keyframes toast-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast i {
  font-size: 1.25rem;
}

.toast.success i { color: var(--color-success); }
.toast.error i { color: var(--color-danger); }

.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
}

/* Spinner */
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 800px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  
  .header-title h1 {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .toolbar-filters {
    overflow-x: visible;
    flex-wrap: wrap;
    padding-bottom: 0;
    row-gap: 0.5rem;
  }
  
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: flex;
  }
  
  .bulk-bar {
    left: 1rem;
    right: 1rem;
    transform: none;
    border-radius: 12px;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .toast-container {
    left: 1rem;
    right: 1rem;
    top: auto;
    bottom: 1rem;
  }
  
  .toast {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
    justify-content: center;
  }
}
</style>
