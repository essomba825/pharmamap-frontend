<template>
  <div class="install-page">
    <NavBar />

    <div class="container-xl install-container">
      <div class="install-hero">
        <div class="hero-text">
          <span class="badge">PharmaMap PWA</span>
          <h1>Installer l'application</h1>
          <p>
            Installez PharmaMap pour un acces rapide, un mode plein ecran
            et une meilleure experience mobile.
          </p>

          <div v-if="isInstalled" class="install-status success">
            L'application est deja installee sur cet appareil.
          </div>
          <div v-else class="install-actions">
            <button
              class="btn btn-primary"
              :disabled="!canInstall"
              @click="installNow"
            >
              Installer maintenant
            </button>
            <span class="helper-text">
              Si le bouton est desactive, suivez les instructions ci-dessous.
            </span>
          </div>
        </div>

        <div class="hero-card">
          <div class="logo-badge">
            <img src="/pharmamap-logo.svg" alt="PharmaMap" />
          </div>
          <div class="hero-list">
            <div class="hero-item">
              <i class="bi bi-phone-fill"></i>
              <span>Acces en 1 clic sur l'ecran d'accueil</span>
            </div>
            <div class="hero-item">
              <i class="bi bi-wifi-off"></i>
              <span>Ouverture meme sans connexion</span>
            </div>
            <div class="hero-item">
              <i class="bi bi-lightning-charge-fill"></i>
              <span>Chargements plus rapides</span>
            </div>
          </div>
        </div>
      </div>

      <div class="install-grid">
        <div class="install-card">
          <h2>Android / Chrome</h2>
          <ol>
            <li>Ouvrez PharmaMap dans Chrome.</li>
            <li>Appuyez sur le menu 3 points.</li>
            <li>Selectionnez \"Installer l'application\".</li>
          </ol>
          <div class="hint">Astuce : si le bouton \"Installer\" apparait dans la barre du navigateur, utilisez-le.</div>
        </div>

        <div class="install-card">
          <h2>Firefox</h2>
          <ol>
            <li>Ouvrez PharmaMap dans Firefox.</li>
            <li>Appuyez sur le menu.</li>
            <li>Choisissez \"Ajouter a l'ecran d'accueil\".</li>
          </ol>
          <div class="hint">Sur Firefox, le bouton installer n'apparait pas toujours.</div>
        </div>

        <div class="install-card">
          <h2>iPhone / Safari</h2>
          <ol>
            <li>Ouvrez PharmaMap dans Safari.</li>
            <li>Appuyez sur le bouton \"Partager\".</li>
            <li>Choisissez \"Ajouter a l'ecran d'accueil\".</li>
          </ol>
          <div v-if="isIOS" class="hint">Vous etes sur iOS. Cette methode est la plus fiable.</div>
        </div>

        <div class="install-card">
          <h2>Mode hors ligne</h2>
          <p>
            L'application garde les ecrans principaux et certains contenus en cache.
            En cas de coupure, vous pourrez toujours ouvrir l'app.
          </p>
          <div class="hint">Les donnees live seront mises a jour des le retour d'internet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import NavBar from "@/components/NavBar.vue";

const installPrompt = ref(window.__pwaInstallPrompt || null);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isInstalled = ref(isStandalone);

const canInstall = computed(() => Boolean(installPrompt.value));

const installNow = async () => {
  if (!installPrompt.value) return;
  const prompt = installPrompt.value;
  installPrompt.value = null;
  window.__pwaInstallPrompt = null;
  await prompt.prompt();
  try {
    await prompt.userChoice;
  } catch {}
};

const handleInstallAvailable = () => {
  installPrompt.value = window.__pwaInstallPrompt || null;
};

const handleAppInstalled = () => {
  installPrompt.value = null;
  window.__pwaInstallPrompt = null;
  isInstalled.value = true;
};

onMounted(() => {
  window.addEventListener("pwa-install-available", handleInstallAvailable);
  window.addEventListener("appinstalled", handleAppInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener("pwa-install-available", handleInstallAvailable);
  window.removeEventListener("appinstalled", handleAppInstalled);
});
</script>

<style scoped>
.install-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f9f7 0%, #e8f4f1 100%);
}

.install-container {
  padding: 28px 24px 60px;
}

.install-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: center;
  margin-bottom: 32px;
}

.hero-text h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #0d3b2e;
}

.hero-text p {
  color: #4a6358;
  font-size: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(2, 195, 154, 0.15);
  color: #0a7c5c;
  border-radius: 999px;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 0.8rem;
}

.install-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.helper-text {
  color: #6b8a7d;
  font-size: 0.85rem;
}

.install-status {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
  font-weight: 600;
  margin-top: 12px;
}

.hero-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 16px 40px rgba(13, 59, 46, 0.15);
}

.logo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(2, 195, 154, 0.12);
  border-radius: 14px;
  margin-bottom: 16px;
}

.logo-badge img {
  width: 140px;
}

.hero-list {
  display: grid;
  gap: 12px;
}

.hero-item {
  display: flex;
  gap: 10px;
  align-items: center;
  color: #0d3b2e;
  font-weight: 600;
}

.hero-item i {
  color: #02c39a;
  font-size: 1.1rem;
}

.install-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.install-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 30px rgba(13, 59, 46, 0.1);
}

.install-card h2 {
  font-size: 1.1rem;
  color: #0d3b2e;
  margin-bottom: 12px;
}

.install-card ol {
  padding-left: 18px;
  color: #4a6358;
}

.install-card li {
  margin-bottom: 6px;
}

.hint {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #6b8a7d;
}
</style>
