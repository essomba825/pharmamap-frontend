<template>
  <div>
    <NavBar />
    <div class="container-xl py-5 auth-shell">
      <img class="auth-bg auth-bg--tl" src="/arriere-plan2.png" alt="" aria-hidden="true" />
      <img class="auth-bg auth-bg--br" src="/arriere-plan2.png" alt="" aria-hidden="true" />

      <div class="auth-card card mx-auto p-4">
        <h1 class="h4 mb-4">Connexion</h1>
        <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" />

        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input v-model="form.username" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Mot de passe</label>
            <input v-model="form.password" type="password" class="form-control" required />
          </div>
          <button class="btn btn-primary w-100" :disabled="loading">
            {{ loading ? "Connexion..." : "Se connecter" }}
          </button>
        </form>
        <div class="mt-3 text-center">
          <router-link :to="registerLink" class="small text-decoration-none">
            Nouveau ? Creer un compte client express
          </router-link>
          <button class="btn btn-link btn-link-pharmacie" type="button" @click="showPharmacieOverlay = true">
            Vous etes une pharmacie ?
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPharmacieOverlay" class="overlay-backdrop">
      <div class="overlay-card">
        <div class="overlay-icon">
          <i class="bi bi-shield-check"></i>
        </div>
        <h2 class="overlay-title">Inscription pharmacie</h2>
        <p class="overlay-text">
          Une equipe passera verifier et valider votre pharmacie.
          Tant que la validation n'est pas faite, elle ne sera pas visible aux clients.
        </p>
        <div class="overlay-actions">
          <button class="btn btn-outline-secondary" type="button" @click="showPharmacieOverlay = false">
            Annuler
          </button>
          <button class="btn btn-primary" type="button" @click="goToPharmacieRegister">
            Continuer l'inscription
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: "",
  password: ""
});

const loading = ref(false);
const errorMessage = ref("");
const showPharmacieOverlay = ref(false);

const registerLink = computed(() => ({
  path: "/auth/register",
  query: {
    next: typeof route.query.next === "string" ? route.query.next : "/",
    express: "1"
  }
}));

const pharmacieRegisterLink = computed(() => ({
  path: "/auth/register",
  query: {
    role: "pharmacie",
    next: typeof route.query.next === "string" ? route.query.next : "/"
  }
}));

const submit = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    await authStore.login(form.value);
    const nextPath = typeof route.query.next === "string" ? route.query.next : "";
    if (nextPath && authStore.role === "client") {
      router.push(nextPath);
    } else {
      router.push(authStore.redirectPathByRole);
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Identifiants invalides.";
  } finally {
    loading.value = false;
  }
};

const goToPharmacieRegister = () => {
  showPharmacieOverlay.value = false;
  router.push(pharmacieRegisterLink.value);
};
</script>

<style scoped>
.auth-shell {
  position: relative;
}

.auth-card {
  max-width: 520px;
}

.auth-bg {
  position: absolute;
  width: 190px;
  opacity: 0.28;
  z-index: 0;
  pointer-events: none;
}

.auth-bg--tl {
  top: 10px;
  left: 10px;
  transform: rotate(-6deg);
}

.auth-bg--br {
  bottom: 20px;
  right: 30px;
  transform: rotate(8deg);
}

.auth-card {
  position: relative;
  z-index: 1;
}

.btn-link-pharmacie {
  display: inline-flex;
  margin-top: 6px;
  font-size: 0.85rem;
  color: #0d3b2e;
}

.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 21, 16, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1200;
  backdrop-filter: blur(6px);
}

.overlay-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 28px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(13, 59, 46, 0.25);
  text-align: center;
}

.overlay-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(13, 59, 46, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #0d3b2e;
  margin-bottom: 12px;
}

.overlay-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #0d3b2e;
}

.overlay-text {
  color: #4a6358;
  font-size: 0.95rem;
  margin-bottom: 18px;
}

.overlay-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .auth-bg {
    display: none;
  }
}
</style>
