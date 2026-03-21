<template>
  <div>
    <NavBar />
    <div class="container-xl py-5 auth-shell">
      <!-- Background décoratif -->
      <img class="auth-bg auth-bg--tl" src="/arriere-plan1.jpg" alt="" aria-hidden="true" />
      <img class="auth-bg auth-bg--br" src="/arriere-plan4.jpg" alt="" aria-hidden="true" />

      <!-- Overlay Modal pour choix du type de compte -->
      <Teleport to="body">
        <div v-if="showRoleSelector" class="role-overlay" @click.self="showRoleSelector = false">
          <div class="role-modal">
            <div class="text-center mb-4">
              <div class="role-icon-bg mx-auto mb-3">
                <i class="bi bi-person-plus-fill display-4 text-primary"></i>
              </div>
              <h2 class="h3 mb-2">Créer un compte</h2>
              <p class="text-muted">Choisissez le type de compte qui vous correspond</p>
            </div>

            <div class="row g-3">
              <!-- Option Client -->
              <div class="col-md-6">
                <button 
                  class="role-card btn btn-light w-100 h-100 p-4 text-start border-2"
                  :class="{ 'border-primary': selectedRole === 'client' }"
                  @click="selectRole('client')"
                >
                  <div class="d-flex align-items-start gap-3">
                    <div class="role-icon client-icon">
                      <i class="bi bi-person fs-3"></i>
                    </div>
                    <div>
                      <h5 class="mb-1">Client</h5>
                      <p class="text-muted small mb-0">Commandez vos médicaments en ligne et faites-vous livrer</p>
                      <span class="badge bg-success mt-2">Inscription immédiate</span>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Option Pharmacie -->
              <div class="col-md-6">
                <button 
                  class="role-card btn btn-light w-100 h-100 p-4 text-start border-2"
                  :class="{ 'border-warning': selectedRole === 'pharmacie' }"
                  @click="selectRole('pharmacie')"
                >
                  <div class="d-flex align-items-start gap-3">
                    <div class="role-icon pharmacie-icon">
                      <i class="bi bi-shop fs-3"></i>
                    </div>
                    <div>
                      <h5 class="mb-1">Pharmacie</h5>
                      <p class="text-muted small mb-0">Gérez votre officine et recevez des commandes en ligne</p>
                      <span class="badge bg-warning text-dark mt-2">
                        <i class="bi bi-clock me-1"></i>Vérification requise
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Warning Pharmacie -->
            <div v-if="selectedRole === 'pharmacie'" class="alert alert-warning d-flex align-items-start mt-4 mb-0">
              <i class="bi bi-exclamation-triangle-fill fs-4 me-3 mt-1"></i>
              <div>
                <h6 class="alert-heading fw-bold">Processus de validation</h6>
                <p class="mb-0 small">
                  Après inscription, une équipe se déplacera à votre pharmacie pour vérifier :
                </p>
                <ul class="mb-0 mt-2 small">
                  <li>L'authenticité de votre licence d'exercice</li>
                  <li>La conformité de votre officine</li>
                  <li>Votre identité en tant que pharmacien responsable</li>
                </ul>
                <hr class="my-2">
                <p class="mb-0 small fw-bold text-warning">
                  <i class="bi bi-clock-history me-1"></i>
                  Délai estimé : 24 à 48 heures ouvrées
                </p>
              </div>
            </div>

            <div class="d-flex gap-2 mt-4">
              <button class="btn btn-light flex-fill" @click="showRoleSelector = false">Annuler</button>
              <button 
                class="btn btn-primary flex-fill" 
                :disabled="!selectedRole"
                @click="confirmRole"
              >
                Continuer
                <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Formulaire principal -->
      <div class="auth-card card mx-auto">
        <!-- En-tête avec indicateur d'étape -->
        <div class="card-header bg-white border-bottom-0 pt-4 px-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <button 
              v-if="currentStep > 1" 
              class="btn btn-link text-decoration-none p-0"
              @click="currentStep--"
            >
              <i class="bi bi-arrow-left me-1"></i> Retour
            </button>
            <span class="text-muted small">Étape {{ currentStep }} sur {{ totalSteps }}</span>
          </div>
          
          <!-- Progress bar -->
          <div class="progress" style="height: 4px;">
            <div 
              class="progress-bar bg-primary" 
              :style="{ width: (currentStep / totalSteps * 100) + '%' }"
            ></div>
          </div>
        </div>

        <div class="card-body p-4">
          <h1 class="h4 mb-1">{{ stepTitle }}</h1>
          <p class="text-muted small mb-4">{{ stepDescription }}</p>

          <!-- Alerte -->
          <div v-if="message" class="alert" :class="isError ? 'alert-danger' : 'alert-success'" role="alert">
            <i class="bi me-2" :class="isError ? 'bi-exclamation-circle' : 'bi-check-circle'"></i>
            {{ message }}
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- Étape 1 : Informations de base -->
            <div v-if="currentStep === 1">
              <div class="mb-3">
                <label class="form-label fw-bold">
                  Nom d'utilisateur <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input 
                    v-model="form.username" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.username }"
                    placeholder="votre_nom"
                    required
                    autocomplete="username"
                  />
                  <div class="invalid-feedback">{{ errors.username }}</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">
                  Email <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                  <input 
                    v-model="form.email" 
                    type="email" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="vous@exemple.com"
                    required
                    autocomplete="email"
                  />
                  <div class="invalid-feedback">{{ errors.email }}</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">
                  Téléphone <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                  <input 
                    v-model="form.telephone" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.telephone }"
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                  <div class="invalid-feedback">{{ errors.telephone }}</div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-bold">
                  Mot de passe <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input 
                    v-model="form.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.password }"
                    placeholder="••••••••"
                    required
                    minlength="8"
                    autocomplete="new-password"
                  />
                  <button 
                    class="btn btn-outline-secondary" 
                    type="button"
                    @click="showPassword = !showPassword"
                  >
                    <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                  <div class="invalid-feedback">{{ errors.password }}</div>
                </div>
                <div class="form-text">
                  <i class="bi bi-info-circle me-1"></i>
                  Minimum 8 caractères
                </div>
              </div>
            </div>

            <!-- Étape 2 : Informations Pharmacie (conditionnel) -->
            <div v-if="currentStep === 2 && form.role === 'pharmacie'">
              <!-- Warning sticky -->
              <div class="alert alert-warning alert-dismissible fade show mb-4" role="alert">
                <div class="d-flex align-items-center">
                  <i class="bi bi-shield-check fs-4 me-3"></i>
                  <div>
                    <h6 class="alert-heading mb-1">Vérification sur place requise</h6>
                    <p class="mb-0 small">
                      Une équipe sera envoyée pour valider votre pharmacie. 
                      Assurez-vous d'avoir votre licence d'exercice disponible.
                    </p>
                  </div>
                </div>
                <button type="button" class="btn-close" @click="showWarning = false"></button>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">
                  Nom de la pharmacie <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-shop"></i></span>
                  <input 
                    v-model="form.pharmacie.nom" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.pharmacie_nom }"
                    placeholder="Pharmacie du Centre"
                    required
                  />
                  <div class="invalid-feedback">{{ errors.pharmacie_nom }}</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">
                  Adresse complète <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                  <textarea 
                    v-model="form.pharmacie.adresse" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.pharmacie_adresse }"
                    placeholder="Rue, quartier, point de repère..."
                    rows="2"
                    required
                  ></textarea>
                  <div class="invalid-feedback">{{ errors.pharmacie_adresse }}</div>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Ville</label>
                  <select v-model="form.pharmacie.ville" class="form-select">
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Bafoussam">Bafoussam</option>
                    <option value="Bamenda">Bamenda</option>
                    <option value="Garoua">Garoua</option>
                    <option value="Maroua">Maroua</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Téléphone pharmacie</label>
                  <input 
                    v-model="form.pharmacie.telephone" 
                    class="form-control" 
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <!-- Sélecteur de position GPS -->
              <div class="mb-3">
                <label class="form-label fw-bold">
                  Position sur la carte <span class="text-danger">*</span>
                  <span class="badge bg-info ms-2" v-if="form.pharmacie.latitude">
                    <i class="bi bi-check-circle me-1"></i>Position définie
                  </span>
                </label>
                <div class="map-container rounded-3 overflow-hidden border mb-2" style="height: 250px;">
                  <MapPositionPicker
                    v-model:latitude="form.pharmacie.latitude"
                    v-model:longitude="form.pharmacie.longitude"
                  />
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">Lat</span>
                      <input 
                        v-model.number="form.pharmacie.latitude" 
                        type="number" 
                        step="any" 
                        class="form-control" 
                        readonly
                      />
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">Lng</span>
                      <input 
                        v-model.number="form.pharmacie.longitude" 
                        type="number" 
                        step="any" 
                        class="form-control" 
                        readonly
                      />
                    </div>
                  </div>
                </div>
                <div class="form-text text-muted small">
                  <i class="bi bi-info-circle me-1"></i>
                  Cliquez sur la carte pour définir la position exacte de votre pharmacie
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Email pharmacie</label>
                <input 
                  v-model="form.pharmacie.email" 
                  type="email" 
                  class="form-control" 
                  placeholder="Optionnel - si différent de l'email personnel"
                />
              </div>
            </div>

            <!-- Étape 3 : Récapitulatif -->
            <div v-if="currentStep === 3 || (currentStep === 2 && form.role === 'client')">
              <div class="card bg-light border-0 mb-4">
                <div class="card-body">
                  <h6 class="card-title mb-3">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    Récapitulatif
                  </h6>
                  
                  <div class="row g-3">
                    <div class="col-md-6">
                      <small class="text-muted d-block">Type de compte</small>
                      <span class="badge" :class="form.role === 'pharmacie' ? 'bg-warning text-dark' : 'bg-success'">
                        <i class="bi me-1" :class="form.role === 'pharmacie' ? 'bi-shop' : 'bi-person'"></i>
                        {{ form.role === 'pharmacie' ? 'Pharmacie' : 'Client' }}
                      </span>
                    </div>
                    <div class="col-md-6">
                      <small class="text-muted d-block">Nom d'utilisateur</small>
                      <strong>{{ form.username }}</strong>
                    </div>
                    <div class="col-md-6">
                      <small class="text-muted d-block">Email</small>
                      <strong>{{ form.email }}</strong>
                    </div>
                    <div class="col-md-6">
                      <small class="text-muted d-block">Téléphone</small>
                      <strong>{{ form.telephone }}</strong>
                    </div>
                    
                    <template v-if="form.role === 'pharmacie'">
                      <div class="col-12"><hr class="my-2"></div>
                      <div class="col-md-6">
                        <small class="text-muted d-block">Pharmacie</small>
                        <strong>{{ form.pharmacie.nom }}</strong>
                      </div>
                      <div class="col-md-6">
                        <small class="text-muted d-block">Ville</small>
                        <strong>{{ form.pharmacie.ville }}</strong>
                      </div>
                      <div class="col-12">
                        <small class="text-muted d-block">Adresse</small>
                        <strong>{{ form.pharmacie.adresse }}</strong>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Conditions pour pharmacie -->
              <div v-if="form.role === 'pharmacie'" class="alert alert-info d-flex align-items-start">
                <i class="bi bi-info-circle-fill fs-4 me-3 mt-1"></i>
                <div>
                  <h6 class="alert-heading">Prochaines étapes</h6>
                  <ol class="mb-0 small ps-3">
                    <li>Validation de votre inscription par notre équipe</li>
                    <li>Visite de vérification sur place (24-48h)</li>
                    <li>Activation de votre compte pharmacie</li>
                    <li>Accès complet au tableau de bord</li>
                  </ol>
                </div>
              </div>

              <div class="form-check mb-4">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  v-model="acceptTerms"
                  id="terms"
                  required
                >
                <label class="form-check-label small" for="terms">
                  J'accepte les <a href="#" @click.prevent>conditions d'utilisation</a>
                  et la <a href="#" @click.prevent>politique de confidentialité</a>
                  <span v-if="form.role === 'pharmacie'">
                    , et je confirme être titulaire d'une licence d'exercice valide
                  </span>
                </label>
              </div>
            </div>

            <!-- Boutons de navigation -->
            <div class="d-flex gap-2">
              <button 
                v-if="currentStep < totalSteps" 
                type="button" 
                class="btn btn-primary w-100"
                @click="nextStep"
                :disabled="!isStepValid"
              >
                Continuer
                <i class="bi bi-arrow-right ms-1"></i>
              </button>
              
              <button 
                v-else 
                type="submit" 
                class="btn btn-success w-100"
                :disabled="loading || !acceptTerms"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-lg me-2"></i>
                {{ loading ? "Création..." : "Confirmer l'inscription" }}
              </button>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="card-footer bg-light text-center py-3">
          <p class="mb-0 text-muted small">
            Déjà un compte ? 
            <router-link to="/login" class="text-decoration-none">Se connecter</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { useAuthStore } from "@/stores/auth";
import MapPositionPicker from "@/components/MapPositionPicker.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// État
const showRoleSelector = ref(true);
const selectedRole = ref("");
const currentStep = ref(1);
const showPassword = ref(false);
const acceptTerms = ref(false);
const showWarning = ref(true);
const loading = ref(false);
const message = ref("");
const isError = ref(false);

const form = ref({
  username: "",
  email: "",
  password: "",
  role: "client",
  telephone: "",
  pharmacie: {
    nom: "",
    adresse: "",
    ville: "Douala",
    telephone: "",
    email: "",
    latitude: null,
    longitude: null
  }
});

const errors = reactive({
  username: "",
  email: "",
  telephone: "",
  password: "",
  pharmacie_nom: "",
  pharmacie_adresse: ""
});

// Computed
const totalSteps = computed(() => form.value.role === 'pharmacie' ? 3 : 2);

const stepTitle = computed(() => {
  const titles = {
    1: "Informations personnelles",
    2: form.value.role === 'pharmacie' ? "Informations de la pharmacie" : "Validation",
    3: "Récapitulatif"
  };
  return titles[currentStep.value];
});

const stepDescription = computed(() => {
  const desc = {
    1: "Créez vos identifiants de connexion",
    2: form.value.role === 'pharmacie' ? "Détails de votre officine" : "Vérifiez vos informations",
    3: "Confirmez votre inscription"
  };
  return desc[currentStep.value];
});

const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return form.value.username.length >= 3 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email) &&
           form.value.telephone.length >= 9 &&
           form.value.password.length >= 8;
  }
  if (currentStep.value === 2 && form.value.role === 'pharmacie') {
    return form.value.pharmacie.nom &&
           form.value.pharmacie.adresse &&
           form.value.pharmacie.latitude &&
           form.value.pharmacie.longitude;
  }
  return true;
});

// Méthodes
const selectRole = (role) => {
  selectedRole.value = role;
};

const confirmRole = () => {
  if (!selectedRole.value) return;
  form.value.role = selectedRole.value;
  showRoleSelector.value = false;
  
  // Si pharmacie, montrer le warning immédiatement
  if (selectedRole.value === 'pharmacie') {
    showWarning.value = true;
  }
};

const validateStep = () => {
  errors.username = "";
  errors.email = "";
  errors.telephone = "";
  errors.password = "";
  
  let valid = true;
  
  if (currentStep.value === 1) {
    if (form.value.username.length < 3) {
      errors.username = "Minimum 3 caractères";
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errors.email = "Email invalide";
      valid = false;
    }
    if (form.value.telephone.length < 9) {
      errors.telephone = "Numéro invalide";
      valid = false;
    }
    if (form.value.password.length < 8) {
      errors.password = "Minimum 8 caractères";
      valid = false;
    }
  }
  
  return valid;
};

const nextStep = () => {
  if (!validateStep()) return;
  currentStep.value++;
};

const handleSubmit = async () => {
  if (!acceptTerms.value) return;
  
  loading.value = true;
  message.value = "";
  isError.value = false;

  try {
    if (form.value.role === "pharmacie") {
      const pharmaciePayload = {
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        telephone: form.value.telephone,
        pharmacie: {
          nom: form.value.pharmacie.nom,
          adresse: form.value.pharmacie.adresse,
          ville: form.value.pharmacie.ville,
          telephone: form.value.pharmacie.telephone || form.value.telephone,
          email: form.value.pharmacie.email || form.value.email,
          latitude: form.value.pharmacie.latitude,
          longitude: form.value.pharmacie.longitude
        }
      };
      await authStore.registerPharmacie(pharmaciePayload);
      
      // Redirection spéciale pour pharmacie avec message de confirmation
      router.push({
        path: '/inscription-confirmation',
        query: { 
          type: 'pharmacie',
          message: 'Votre inscription est en attente de validation. Une équipe vous contactera sous 48h.'
        }
      });
    } else {
      await authStore.register({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        role: "client",
        telephone: form.value.telephone
      });
      
      message.value = "Compte créé avec succès !";
      const nextPath = typeof route.query.next === "string" ? route.query.next : "";
      setTimeout(() => {
        router.push(nextPath || authStore.redirectPathByRole);
      }, 1000);
    }
  } catch (error) {
    isError.value = true;
    message.value = error.response?.data?.erreur || "Inscription impossible. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
};

// Si role dans URL, préselectionner
onMounted(() => {
  if (route.query.role === "pharmacie") {
    selectedRole.value = "pharmacie";
  }
});
</script>

<style scoped>
.auth-shell {
  position: relative;
  min-height: 100vh;
}

.auth-card {
  max-width: 600px;
  position: relative;
  z-index: 1;
  border: none;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.auth-bg {
  position: fixed;
  width: 300px;
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.auth-bg--tl {
  top: 0;
  left: 0;
}

.auth-bg--br {
  bottom: 0;
  right: 0;
}

/* Overlay sélecteur de rôle */
.role-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.role-modal {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-icon-bg {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-card {
  border-radius: 16px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.role-card.border-primary {
  border-color: #0d6efd;
  background: #f8f9ff;
}

.role-card.border-warning {
  border-color: #ffc107;
  background: #fffbf0;
}

.role-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.client-icon {
  background: #d1fae5;
  color: #059669;
}

.pharmacie-icon {
  background: #fef3c7;
  color: #d97706;
}

/* Map container */
.map-container {
  background: #f8f9fa;
  position: relative;
}

/* Progress bar */
.progress {
  background-color: #e9ecef;
  border-radius: 2px;
}

.progress-bar {
  transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-bg {
    display: none;
  }
  
  .role-modal {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .role-card {
    padding: 1rem !important;
  }
}

/* Form validation */
.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  font-size: 0.875em;
  color: #dc3545;
  margin-top: 0.25rem;
}
</style>