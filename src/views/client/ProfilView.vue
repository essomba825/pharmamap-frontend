<template>
  <div>
    <NavBar />
    <div class="container py-4" style="max-width: 720px;">
      <h1 class="h4 mb-3">Mon profil</h1>
      <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" />
      <AlerteMessage v-if="successMessage" :message="successMessage" type="success" />

      <div v-if="authStore.user" class="card">
        <div class="card-body">
          <form class="row g-3" @submit.prevent="saveProfile">
            <div class="col-md-6">
              <label class="form-label">Prenom</label>
              <input v-model="form.prenom" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Nom</label>
              <input v-model="form.nom" class="form-control" />
            </div>
            <div class="col-12">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-control" />
            </div>
            <div class="col-12">
              <label class="form-label">Telephone</label>
              <input v-model="form.telephone" class="form-control" />
            </div>
            <div class="col-12">
              <label class="form-label">Username</label>
              <input :value="authStore.user.username || '-'" class="form-control" disabled />
            </div>
            <div class="col-12 d-flex justify-content-end">
              <button class="btn btn-primary" :disabled="saving">
                {{ saving ? "Enregistrement..." : "Enregistrer" }}
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
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const errorMessage = ref("");
const successMessage = ref("");
const saving = ref(false);
const form = reactive({
  prenom: "",
  nom: "",
  email: "",
  telephone: ""
});
onMounted(async () => {
  try {
    const user = await authStore.fetchProfile();
    form.prenom = user?.prenom || "";
    form.nom = user?.nom || "";
    form.email = user?.email || "";
    form.telephone = user?.telephone || "";
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de recuperer le profil.";
  }
});

const saveProfile = async () => {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const payload = {
      prenom: form.prenom,
      nom: form.nom,
      email: form.email,
      telephone: form.telephone
    };
    const updated = await authStore.updateProfile(payload);
    form.prenom = updated?.prenom || "";
    form.nom = updated?.nom || "";
    form.email = updated?.email || "";
    form.telephone = updated?.telephone || "";
    successMessage.value = "Profil mis a jour.";
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Mise a jour impossible.";
  } finally {
    saving.value = false;
  }
};
</script>
