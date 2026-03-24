<template>
  <div class="app-shell">
    <router-view />

    <Transition name="fade-up">
      <div v-if="showInstallToast" class="install-toast" role="status">
        <div class="toast-content">
          <div class="toast-title">Installer PharmaMap</div>
          <div class="toast-text">
            Acces rapide et mode plein ecran. Ajoutez l'app sur votre appareil.
          </div>
        </div>
        <div class="toast-actions">
          <button class="btn-toast ghost" type="button" @click="dismissToast">
            Plus tard
          </button>
          <button class="btn-toast primary" type="button" @click="installNow">
            Installer
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const installPrompt = ref(window.__pwaInstallPrompt || null);
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;
const showInstallToast = ref(false);
const toastTimer = ref(null);

// ── Keep-alive Render (évite le spin down après inactivité) ─────────────
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "https://pharmamap-j9aa.onrender.com/api";
let keepAliveInterval = null;

const pingBackend = () => {
  fetch(`${BACKEND_URL}/pharmacies/`, { method: "GET", mode: "no-cors" }).catch(() => {});
};

const startKeepAlive = () => {
  // Premier ping immédiat
  pingBackend();
  // Ensuite toutes les 14 minutes (Render spin down = 15 min d'inactivité)
  keepAliveInterval = setInterval(pingBackend, 14 * 60 * 1000);
};

const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};
// ────────────────────────────────────────────────────────────────────────

const canInstall = () => Boolean(installPrompt.value);

const hideUntilKey = "pwa_install_toast_hide_until";

const shouldShowToast = () => {
  if (isStandalone) return false;
  const until = Number(localStorage.getItem(hideUntilKey) || "0");
  return Date.now() > until;
};

const scheduleToast = () => {
  if (!shouldShowToast()) return;
  toastTimer.value = setTimeout(() => {
    showInstallToast.value = true;
    setTimeout(() => {
      showInstallToast.value = false;
    }, 7000);
  }, 2000);
};

const dismissToast = () => {
  showInstallToast.value = false;
  const oneDay = 24 * 60 * 60 * 1000;
  localStorage.setItem(hideUntilKey, String(Date.now() + oneDay));
};

const installNow = async () => {
  if (canInstall()) {
    const prompt = installPrompt.value;
    installPrompt.value = null;
    window.__pwaInstallPrompt = null;
    showInstallToast.value = false;
    await prompt.prompt();
    try {
      await prompt.userChoice;
    } catch {}
    return;
  }
  showInstallToast.value = false;
  router.push("/install");
};

const onBeforeInstallPrompt = (event) => {
  event.preventDefault();
  installPrompt.value = event;
  window.__pwaInstallPrompt = event;
};

const onAppInstalled = () => {
  installPrompt.value = null;
  window.__pwaInstallPrompt = null;
  showInstallToast.value = false;
  localStorage.setItem(
    hideUntilKey,
    String(Date.now() + 365 * 24 * 60 * 60 * 1000)
  );
};

onMounted(() => {
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
  scheduleToast();
  startKeepAlive();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.removeEventListener("appinstalled", onAppInstalled);
  if (toastTimer.value) clearTimeout(toastTimer.value);
  stopKeepAlive();
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.install-toast {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
  background: #0d3b2e;
  color: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 18px 40px rgba(13, 59, 46, 0.35);
  z-index: 1400;
}

.toast-title {
  font-weight: 700;
  font-size: 1rem;
}

.toast-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.toast-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-toast {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-toast.primary {
  background: #02c39a;
  color: #0d3b2e;
}

.btn-toast.ghost {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.25s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (min-width: 768px) {
  .install-toast {
    left: auto;
    right: 24px;
    bottom: 24px;
    max-width: 380px;
  }
}
</style>