<template>
  <div class="articles-app">
    <NavBar />
    
    <div class="container-fluid container-xl py-4">
      <!-- Header -->
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb" class="mb-2">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Admin</a></li>
              <li class="breadcrumb-item active">Catalogue médical</li>
            </ol>
          </nav>
          <h1 class="h3 mb-0 d-flex align-items-center gap-2">
            <span class="bg-primary bg-gradient text-white rounded-3 p-2 d-inline-flex">
              <i class="bi bi-capsule-pill fs-4"></i>
            </span>
            Gestion des articles
          </h1>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="exportData" :disabled="!articles.length">
            <i class="bi bi-download me-1"></i> Exporter
          </button>
          <button class="btn btn-primary" @click="showCreateModal = true">
            <i class="bi bi-plus-lg me-1"></i> Nouvel article
          </button>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" v-for="stat in stats" :key="stat.label">
          <div class="card border-0 shadow-sm stat-card">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="stat-icon rounded-3 p-3" :class="stat.bgClass">
                <i class="bi fs-4" :class="stat.icon"></i>
              </div>
              <div>
                <h6 class="text-muted mb-1 small text-uppercase">{{ stat.label }}</h6>
                <h3 class="mb-0 fw-bold">{{ stat.value }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control" 
                  placeholder="Rechercher par nom, générique ou catégorie..."
                  ref="searchInput"
                >
                <span class="input-group-text bg-light" v-if="searchQuery">
                  <button class="btn btn-link p-0 text-decoration-none" @click="searchQuery = ''">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </span>
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="filtreCategorie" class="form-select">
                <option value="">Toutes les catégories</option>
                <option v-for="cat in categoriesUniques" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="btn-group w-100">
                <button class="btn btn-outline-secondary" :class="{ active: filtreOrdonnance === null }" @click="filtreOrdonnance = null">Tous</button>
                <button class="btn btn-outline-secondary" :class="{ active: filtreOrdonnance === true }" @click="filtreOrdonnance = true">
                  <i class="bi bi-prescription2 me-1"></i>Ordonnance
                </button>
                <button class="btn btn-outline-secondary" :class="{ active: filtreOrdonnance === false }" @click="filtreOrdonnance = false">
                  Libre
                </button>
              </div>
            </div>
          </div>
          <div class="mt-2 d-flex gap-2 flex-wrap">
            <span class="badge bg-light text-dark border" v-if="searchQuery">
              <i class="bi bi-search me-1"></i>{{ searchQuery }}
              <i class="bi bi-x-circle ms-1 cursor-pointer" @click="searchQuery = ''"></i>
            </span>
            <span class="badge bg-light text-dark border" v-if="filtreCategorie">
              <i class="bi bi-tag me-1"></i>{{ filtreCategorie }}
              <i class="bi bi-x-circle ms-1 cursor-pointer" @click="filtreCategorie = ''"></i>
            </span>
            <span class="badge bg-light text-dark border" v-if="filtreOrdonnance !== null">
              <i class="bi bi-prescription2 me-1"></i>{{ filtreOrdonnance ? 'Ordonnance' : 'Libre' }}
              <i class="bi bi-x-circle ms-1 cursor-pointer" @click="filtreOrdonnance = null"></i>
            </span>
            <button v-if="hasActiveFilters" class="btn btn-link btn-sm p-0 text-decoration-none" @click="resetFilters">
              Réinitialiser tout
            </button>
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="fw-semibold text-muted small" style="width: 60px;">ID</th>
                <th class="fw-semibold text-muted small">Article</th>
                <th class="fw-semibold text-muted small">Catégorie</th>
                <th class="fw-semibold text-muted small text-center" style="width: 100px;">Type</th>
                <th class="text-end" style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" v-for="n in 5" :key="n">
                <td colspan="5" class="p-3">
                  <div class="skeleton-line" style="height: 40px;"></div>
                </td>
              </tr>

              <tr v-else-if="!filteredArticles.length">
                <td colspan="5" class="text-center py-5">
                  <i class="bi bi-inbox display-4 text-muted mb-3 d-block"></i>
                  <h5 class="text-muted">Aucun article trouvé</h5>
                  <button v-if="hasActiveFilters" class="btn btn-outline-primary btn-sm mt-2" @click="resetFilters">
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>

              <!-- Mode lecture -->
              <tr 
                v-for="article in paginatedArticles" 
                :key="article.id"
                v-show="editId !== article.id"
                class="hover-row"
              >
                <td class="font-monospace text-muted">#{{ article.id }}</td>
                <td>
                  <div class="d-flex align-items-center gap-3">
                    <div class="article-icon rounded-3 p-2" :class="article.ordonnance ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'">
                      <i class="bi fs-5" :class="article.ordonnance ? 'bi-capsule' : 'bi-tablets'"></i>
                    </div>
                    <div>
                      <div class="fw-bold">{{ article.nom }}</div>
                      <small class="text-muted" v-if="article.nom_generique">
                        {{ article.nom_generique }}
                      </small>
                      <small class="text-muted d-block text-truncate" style="max-width: 300px;" v-if="article.description">
                        {{ article.description }}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge bg-light text-dark border">{{ article.categorie || "Non classé" }}</span>
                </td>
                <td class="text-center">
                  <span class="badge rounded-pill" :class="article.ordonnance ? 'bg-warning text-dark' : 'bg-success'">
                    <i class="bi me-1" :class="article.ordonnance ? 'bi-prescription2' : 'bi-check-circle'"></i>
                    {{ article.ordonnance ? 'Ordonnance' : 'Libre' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="startEdit(article)" title="Modifier">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="confirmDelete(article)" title="Supprimer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Mode édition inline -->
              <tr v-if="editId === article?.id" v-for="article in [editingArticle]" :key="'edit-'+article.id" class="table-primary">
                <td class="font-monospace text-muted">#{{ article.id }}</td>
                <td colspan="3">
                  <div class="row g-2">
                    <div class="col-md-4">
                      <label class="form-label small fw-bold">Nom</label>
                      <input v-model="editForm.nom" class="form-control form-control-sm" :class="{ 'is-invalid': errors.nom }" />
                      <div class="invalid-feedback">{{ errors.nom }}</div>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small fw-bold">Nom générique</label>
                      <input v-model="editForm.nom_generique" class="form-control form-control-sm" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small fw-bold">Catégorie</label>
                      <div class="input-group input-group-sm">
                        <input 
                          v-model="editForm.categorie" 
                          class="form-control" 
                          list="categories-list"
                          placeholder="Sélectionnez ou tapez..."
                        />
                        <datalist id="categories-list">
                          <option v-for="cat in categoriesUniques" :key="cat" :value="cat" />
                        </datalist>
                      </div>
                    </div>
                    <div class="col-md-8">
                      <label class="form-label small fw-bold">Description</label>
                      <textarea v-model="editForm.description" class="form-control form-control-sm" rows="2"></textarea>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small fw-bold">Type</label>
                      <div class="form-check form-switch mt-1">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          v-model="editForm.ordonnance"
                          id="edit-ordonnance"
                        />
                        <label class="form-check-label" for="edit-ordonnance">
                          <span v-if="editForm.ordonnance" class="text-warning">
                            <i class="bi bi-prescription2 me-1"></i> Nécessite ordonnance
                          </span>
                          <span v-else class="text-success">
                            <i class="bi bi-check-circle me-1"></i> Vente libre
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-end">
                  <div class="d-flex flex-column gap-2">
                    <button class="btn btn-sm btn-success w-100" :disabled="!isEditValid || saving" @click="saveArticle(article.id)">
                      <i class="bi bi-check-lg me-1"></i> {{ saving ? '...' : 'Sauver' }}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary w-100" @click="cancelEdit">
                      <i class="bi bi-x-lg me-1"></i> Annuler
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="card-footer bg-light d-flex justify-content-between align-items-center">
          <small class="text-muted">
            {{ filteredArticles.length }} articles total
          </small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="currentPage--"><i class="bi bi-chevron-left"></i></a>
              </li>
              <li 
                v-for="page in displayedPages" 
                :key="page" 
                class="page-item"
                :class="{ active: currentPage === page, disabled: page === '...' }"
              >
                <a class="page-link" href="#" @click.prevent="page !== '...' && (currentPage = page)">
                  {{ page }}
                </a>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="currentPage++"><i class="bi bi-chevron-right"></i></a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal Création -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-wrapper" @click.self="showCreateModal = false">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-plus-circle me-2"></i>Nouvel article</h5>
              <button type="button" class="btn-close btn-close-white" @click="showCreateModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="createArticle" class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Nom de l'article <span class="text-danger">*</span></label>
                  <input 
                    v-model="createForm.nom" 
                    class="form-control" 
                    :class="{ 'is-invalid': createErrors.nom }"
                    placeholder="Ex: Doliprane 500mg"
                    required
                  />
                  <div class="invalid-feedback">{{ createErrors.nom }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Nom générique</label>
                  <input 
                    v-model="createForm.nom_generique" 
                    class="form-control" 
                    placeholder="Ex: Paracétamol"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Catégorie</label>
                  <div class="input-group">
                    <input 
                      v-model="createForm.categorie" 
                      class="form-control" 
                      list="create-categories"
                      placeholder="Sélectionnez ou créez..."
                    />
                    <datalist id="create-categories">
                      <option v-for="cat in categoriesUniques" :key="cat" :value="cat" />
                    </datalist>
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      <i class="bi bi-tags"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li v-for="cat in categoriesPopulaires" :key="cat">
                        <a class="dropdown-item" href="#" @click.prevent="createForm.categorie = cat">{{ cat }}</a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Type de vente</label>
                  <div class="d-flex gap-3 mt-2">
                    <div class="form-check">
                      <input class="form-check-input" type="radio" v-model="createForm.ordonnance" :value="false" id="vente-libre">
                      <label class="form-check-label text-success" for="vente-libre">
                        <i class="bi bi-check-circle me-1"></i> Vente libre
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" v-model="createForm.ordonnance" :value="true" id="ordonnance-requise">
                      <label class="form-check-label text-warning" for="ordonnance-requise">
                        <i class="bi bi-prescription2 me-1"></i> Ordonnance requise
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Description</label>
                  <textarea 
                    v-model="createForm.description" 
                    class="form-control" 
                    rows="3"
                    placeholder="Description détaillée de l'article..."
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" @click="showCreateModal = false">Annuler</button>
              <button type="button" class="btn btn-primary" :disabled="!createForm.nom || saving" @click="createArticle">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-check-lg me-1"></i>
                Créer l'article
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmation Suppression -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-wrapper" @click.self="showDeleteModal = false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirmer la suppression</h5>
              <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
            </div>
            <div class="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer <strong>{{ articleToDelete?.nom }}</strong> ?</p>
              <div class="alert alert-warning d-flex align-items-center">
                <i class="bi bi-info-circle-fill me-2"></i>
                <div>Cette action est irréversible.</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" @click="showDeleteModal = false">Annuler</button>
              <button type="button" class="btn btn-danger" :disabled="deleting" @click="executeDelete">
                <span v-if="deleting" class="spinner-border spinner-border-sm me-1"></span>
                Supprimer définitivement
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
          :class="toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-warning'"
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
import { ref, computed, reactive, onMounted, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import coreApi from "@/api/core";

// État
const articles = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editId = ref(null);
const searchQuery = ref("");
const filtreCategorie = ref("");
const filtreOrdonnance = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;
const toasts = ref([]);

// Modals
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const articleToDelete = ref(null);

// Formulaires
const createForm = reactive({
  nom: "",
  nom_generique: "",
  description: "",
  categorie: "",
  ordonnance: false
});

const createErrors = reactive({ nom: "" });

const editForm = reactive({
  nom: "",
  nom_generique: "",
  description: "",
  categorie: "",
  ordonnance: false
});

const errors = reactive({ nom: "" });

// Computed
const stats = computed(() => [
  { label: "Total articles", value: articles.value.length, icon: "bi-capsule", bgClass: "bg-primary bg-opacity-10 text-primary" },
  { label: "Ordonnance", value: articles.value.filter(a => a.ordonnance).length, icon: "bi-prescription2", bgClass: "bg-warning bg-opacity-10 text-warning" },
  { label: "Vente libre", value: articles.value.filter(a => !a.ordonnance).length, icon: "bi-check-circle", bgClass: "bg-success bg-opacity-10 text-success" },
  { label: "Catégories", value: categoriesUniques.value.length, icon: "bi-tags", bgClass: "bg-info bg-opacity-10 text-info" }
]);

const categoriesUniques = computed(() => {
  const cats = articles.value.map(a => a.categorie).filter(Boolean);
  return [...new Set(cats)].sort();
});

const categoriesPopulaires = computed(() => {
  const counts = {};
  articles.value.forEach(a => {
    if (a.categorie) counts[a.categorie] = (counts[a.categorie] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);
});

const hasActiveFilters = computed(() => 
  searchQuery.value || filtreCategorie.value || filtreOrdonnance.value !== null
);

const filteredArticles = computed(() => {
  let result = articles.value;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(a => 
      (a.nom?.toLowerCase().includes(q)) ||
      (a.nom_generique?.toLowerCase().includes(q)) ||
      (a.categorie?.toLowerCase().includes(q))
    );
  }
  
  if (filtreCategorie.value) {
    result = result.filter(a => a.categorie === filtreCategorie.value);
  }
  
  if (filtreOrdonnance.value !== null) {
    result = result.filter(a => a.ordonnance === filtreOrdonnance.value);
  }
  
  return result;
});

const totalPages = computed(() => 
  Math.ceil(filteredArticles.value.length / itemsPerPage)
);

const displayedPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages.value);
    }
  }
  return pages;
});

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredArticles.value.slice(start, start + itemsPerPage);
});

const editingArticle = computed(() => 
  articles.value.find(a => a.id === editId.value)
);

const isEditValid = computed(() => {
  return editForm.nom.trim().length >= 2;
});

// Méthodes
const loadArticles = async () => {
  loading.value = true;
  try {
    const { data } = await coreApi.getAdminArticles();
    articles.value = data.articles || [];
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de chargement", 'error');
  } finally {
    loading.value = false;
  }
};

const createArticle = async () => {
  createErrors.nom = "";
  
  if (!createForm.nom.trim()) {
    createErrors.nom = "Le nom est requis";
    return;
  }
  
  saving.value = true;
  try {
    await coreApi.createAdminArticle({ ...createForm });
    addToast(`Article "${createForm.nom}" créé avec succès`, 'success');
    
    // Reset form
    Object.keys(createForm).forEach(key => {
      createForm[key] = key === 'ordonnance' ? false : "";
    });
    
    showCreateModal.value = false;
    await loadArticles();
  } catch (error) {
    createErrors.nom = error.response?.data?.erreur || "Erreur lors de la création";
  } finally {
    saving.value = false;
  }
};

const startEdit = (article) => {
  editId.value = article.id;
  Object.assign(editForm, {
    nom: article.nom || "",
    nom_generique: article.nom_generique || "",
    description: article.description || "",
    categorie: article.categorie || "",
    ordonnance: Boolean(article.ordonnance)
  });
  errors.nom = "";
};

const cancelEdit = () => {
  editId.value = null;
};

const saveArticle = async (id) => {
  errors.nom = "";
  
  if (!editForm.nom.trim()) {
    errors.nom = "Le nom est requis";
    return;
  }
  
  saving.value = true;
  try {
    await coreApi.updateAdminArticle(id, { ...editForm });
    addToast("Article modifié avec succès", 'success');
    editId.value = null;
    await loadArticles();
  } catch (error) {
    errors.nom = error.response?.data?.erreur || "Erreur de modification";
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (article) => {
  articleToDelete.value = article;
  showDeleteModal.value = true;
};

const executeDelete = async () => {
  if (!articleToDelete.value) return;
  
  deleting.value = true;
  try {
    await coreApi.deleteAdminArticle(articleToDelete.value.id);
    addToast(`Article "${articleToDelete.value.nom}" supprimé`, 'success');
    showDeleteModal.value = false;
    articleToDelete.value = null;
    await loadArticles();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur de suppression", 'error');
  } finally {
    deleting.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = "";
  filtreCategorie.value = "";
  filtreOrdonnance.value = null;
  currentPage.value = 1;
};

const exportData = () => {
  const headers = ['ID', 'Nom', 'Nom générique', 'Catégorie', 'Ordonnance', 'Description'];
  const rows = filteredArticles.value.map(a => [
    a.id, a.nom, a.nom_generique, a.categorie, a.ordonnance ? 'Oui' : 'Non', a.description
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell || ''}"`).join(';'))
    .join('\n');
    
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `articles_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  addToast('Export CSV téléchargé', 'success');
};

const addToast = (message, type = 'success') => {
  const icons = {
    success: 'bi-check-circle',
    error: 'bi-exclamation-circle',
    warning: 'bi-exclamation-triangle'
  };
  const id = Date.now();
  toasts.value.push({ id, message, type, icon: icons[type] });
  setTimeout(() => removeToast(id), 4000);
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) toasts.value.splice(index, 1);
};

// Watch
watch([searchQuery, filtreCategorie, filtreOrdonnance], () => {
  currentPage.value = 1;
});

onMounted(loadArticles);
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1) !important;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-row {
  transition: background-color 0.15s;
}

.hover-row:hover {
  background-color: rgba(0,0,0,0.02);
}

.skeleton-line {
  height: 40px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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

.cursor-pointer {
  cursor: pointer;
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

/* Form validation styles */
.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}
</style>