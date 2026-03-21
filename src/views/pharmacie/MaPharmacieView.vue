<template>
  <div>
    <NavBar />
    <div class="container py-4" style="max-width: 960px;">
      <h1 class="h4 mb-3">Ma pharmacie</h1>
      <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" />
      <AlerteMessage v-if="successMessage" :message="successMessage" type="success" />
      <AlerteMessage
        v-if="needsCreation"
        message="Votre pharmacie n'est pas encore enregistree. Completez le formulaire pour l'inscrire."
        type="info"
        :dismissible="false"
      />

      <div class="card">
        <div class="card-body">
          <form class="row g-3" @submit.prevent="savePharmacie">
            <div class="col-md-6">
              <label class="form-label">Nom</label>
              <input v-model="form.nom" class="form-control" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Telephone</label>
              <input v-model="form.telephone" class="form-control" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Ville</label>
              <input v-model="form.ville" class="form-control" />
            </div>
            <div class="col-12">
              <label class="form-label">Adresse</label>
              <textarea v-model="form.adresse" class="form-control" rows="2" required></textarea>
            </div>
            <div class="col-12">
              <label class="form-label">Position GPS sur carte</label>
              <MapPositionPicker v-model:latitude="form.latitude" v-model:longitude="form.longitude" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Latitude</label>
              <input v-model.number="form.latitude" type="number" step="any" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Longitude</label>
              <input v-model.number="form.longitude" type="number" step="any" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Horaires (JSON simple)</label>
              <input v-model="horairesRaw" class="form-control" placeholder='{"lun-dim":"08:00-22:00"}' />
            </div>
            <div class="col-md-6 d-flex gap-4 align-items-end pb-1">
              <div class="form-check">
                <input id="garde" v-model="form.garde" class="form-check-input" type="checkbox" />
                <label for="garde" class="form-check-label">De garde</label>
              </div>
              <div class="small text-muted">
                Validation: <strong>{{ form.validee ? "Oui" : "Non" }}</strong>
              </div>
            </div>
            <div class="col-12">
              <div class="alert alert-info py-2 mb-0">
                Le service de livraison sera bientôt disponible. Pour l'instant, les pharmacies ne sont pas liées à la livraison.
              </div>
            </div>
            <div class="col-12 d-flex justify-content-end">
              <button class="btn btn-primary" :disabled="loading || saving">
                {{
                  saving
                    ? needsCreation
                      ? "Creation..."
                      : "Enregistrement..."
                    : needsCreation
                      ? "Creer ma pharmacie"
                      : "Enregistrer"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import MapPositionPicker from "@/components/MapPositionPicker.vue";
import coreApi from "@/api/core";

const loading = ref(false);
const saving = ref(false);
const horairesRaw = ref("{}");
const errorMessage = ref("");
const successMessage = ref("");
const needsCreation = ref(false);

const form = reactive({
  nom: "",
  adresse: "",
  ville: "",
  telephone: "",
  email: "",
  garde: false,
  horaires: {},
  latitude: null,
  longitude: null,
  validee: false
});

const resetMessages = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const applyPharmacie = (pharmacie) => {
  form.nom = pharmacie.nom || "";
  form.adresse = pharmacie.adresse || "";
  form.ville = pharmacie.ville || "";
  form.telephone = pharmacie.telephone || "";
  form.email = pharmacie.email || "";
  form.garde = Boolean(pharmacie.garde);
  form.horaires = pharmacie.horaires || {};
  form.latitude = pharmacie.latitude ?? null;
  form.longitude = pharmacie.longitude ?? null;
  form.validee = Boolean(pharmacie.validee);
  horairesRaw.value = JSON.stringify(form.horaires);
};

const loadPharmacie = async () => {
  loading.value = true;
  resetMessages();
  needsCreation.value = false;
  try {
    const { data } = await coreApi.getMaPharmacie();
    applyPharmacie(data.pharmacie || {});
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) {
      needsCreation.value = true;
      applyPharmacie({});
    } else {
      errorMessage.value = error.response?.data?.erreur || "Impossible de charger les informations.";
    }
  } finally {
    loading.value = false;
  }
};

const parseHoraires = () => {
  if (!horairesRaw.value?.trim()) return {};
  try {
    const parsed = JSON.parse(horairesRaw.value);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    throw new Error("Le champ horaires doit etre un JSON valide.");
  }
};

const savePharmacie = async () => {
  saving.value = true;
  resetMessages();
  try {
    const horaires = parseHoraires();
    const payload = {
      nom: form.nom,
      adresse: form.adresse,
      ville: form.ville,
      telephone: form.telephone,
      email: form.email,
      livraison: false,
      garde: form.garde,
      horaires,
      latitude: form.latitude,
      longitude: form.longitude
    };
    const { data } = needsCreation.value
      ? await coreApi.createMaPharmacie(payload)
      : await coreApi.updateMaPharmacie(payload);
    applyPharmacie(data.pharmacie || payload);
    if (needsCreation.value) {
      needsCreation.value = false;
      successMessage.value = "Pharmacie enregistree. En attente de validation.";
    } else {
      successMessage.value = "Informations de la pharmacie mises a jour.";
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || error.message || "Mise a jour impossible.";
  } finally {
    saving.value = false;
  }
};

onMounted(loadPharmacie);
</script>
