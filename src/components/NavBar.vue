<template>
  <nav class="pharma-nav" :class="{ 'nav-scrolled': scrolled }">
    <div class="container-xl nav-inner">
      <router-link class="nav-brand" to="/">
        <PharmaMapLogo />
      </router-link>

      <ul class="nav-links">
        <li v-for="item in menuItems" :key="item.to">
          <router-link
            class="nav-link-item"
            :to="item.to"
            active-class="is-active"
            exact-active-class="is-active"
          >
            <div class="link-icon">
              <i :class="item.icon" aria-hidden="true"></i>
            </div>
            <span>{{ item.label }}</span>
          </router-link>
        </li>
      </ul>

      <div class="nav-actions">
        <button
          v-if="showInstall"
          class="btn-soft"
          type="button"
          @click="onInstallClick"
        >
          <span>Installer</span>
        </button>
        <template v-if="!authStore.isAuthenticated">
          <button class="btn-soft" @click="onLoginClick">
            <span>Connexion</span>
          </button>
          <router-link class="btn-soft btn-soft-primary" to="/auth/register">
            <span>Inscription</span>
          </router-link>
        </template>
        <template v-else>
          <div class="user-menu">
            <div class="user-avatar">
              <i class="fa-solid fa-user" aria-hidden="true"></i>
            </div>
            <span class="user-name">{{ authStore.user?.name || "Mon compte" }}</span>
            <button class="btn-icon" @click="onLogout" title="Déconnexion">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </template>
      </div>

      <button
        class="nav-hamburger"
        :class="{ 'is-open': mobileOpen }"
        @click="mobileOpen = !mobileOpen"
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div v-if="showBack" class="nav-back-row">
      <div class="container-xl nav-back-inner">
        <button
          class="nav-back"
          type="button"
          @click="goBack"
          aria-label="Retour"
          title="Retour"
        >
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          <span>Retour</span>
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="mobileOpen" class="mobile-menu">
        <div class="mobile-menu-inner">
          <ul class="mobile-links">
            <li v-for="item in menuItems" :key="item.to">
              <router-link
                class="mobile-link-item"
                :to="item.to"
                active-class="is-active"
                @click="mobileOpen = false"
              >
                <div class="mobile-icon">
                  <i :class="item.icon" aria-hidden="true"></i>
                </div>
                <span>{{ item.label }}</span>
                <i class="fa-solid fa-chevron-right arrow-icon"></i>
              </router-link>
            </li>
          </ul>
          <div class="mobile-actions">
            <button
              v-if="showInstall"
              class="mobile-btn mobile-btn-secondary"
              type="button"
              @click="onInstallClick"
            >
              Installer l'app
            </button>
            <template v-if="!authStore.isAuthenticated">
              <button class="mobile-btn mobile-btn-secondary" @click="onLoginClick">
                Connexion
              </button>
              <router-link class="mobile-btn mobile-btn-primary" to="/auth/register" @click="mobileOpen = false">
                Inscription
              </router-link>
            </template>
            <template v-else>
              <button class="mobile-btn mobile-btn-secondary" @click="onLogout">
                <i class="fa-solid fa-arrow-right-from-bracket me-2"></i>
                Déconnexion
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import PharmaMapLogo from "@/components/PharmaMapLogo.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const mobileOpen = ref(false);
const scrolled = ref(false);
const installPrompt = ref(window.__pwaInstallPrompt || null);
const isStandalone = ref(
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
);

const byRole = {
  guest: [
    { label: "Accueil", to: "/", icon: "fa-solid fa-house" },
    { label: "Recherche", to: "/resultats", icon: "fa-solid fa-magnifying-glass" },
    { label: "Aide", to: "/support", icon: "fa-solid fa-circle-question" }
  ],
  client: [
    { label: "Accueil", to: "/", icon: "fa-solid fa-house" },
    { label: "Explorer", to: "/carte", icon: "fa-solid fa-map-location-dot" },
    { label: "Commandes", to: "/client/commandes", icon: "fa-solid fa-clipboard-list" },
    { label: "Support", to: "/support", icon: "fa-solid fa-comments" },
    { label: "Profil", to: "/client/profil", icon: "fa-solid fa-user" }
  ],
  pharmacie: [
    { label: "Dashboard", to: "/pharmacie/dashboard", icon: "fa-solid fa-chart-pie" },
    { label: "Stocks", to: "/pharmacie/stocks", icon: "fa-solid fa-boxes-stacked" },
    { label: "Commandes", to: "/pharmacie/commandes", icon: "fa-solid fa-bag-shopping" },
    { label: "Support", to: "/support", icon: "fa-solid fa-comments" },
    { label: "Paramètres", to: "/pharmacie/ma-pharmacie", icon: "fa-solid fa-gear" }
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: "fa-solid fa-chart-line" },
    { label: "Pharmacies", to: "/admin/pharmacies", icon: "fa-solid fa-store" },
    { label: "Articles", to: "/admin/articles", icon: "fa-solid fa-pills" },
    { label: "Support", to: "/support", icon: "fa-solid fa-comments" },
    { label: "Finances", to: "/admin/paiements", icon: "fa-solid fa-wallet" }
  ]
};

const menuItems = computed(() => byRole[authStore.role || "guest"] || byRole.guest);
const canInstall = computed(() => Boolean(installPrompt.value));
const showInstall = computed(() => !isStandalone.value);
const showBack = computed(() => {
  const path = route.path;
  return path !== "/" && path !== "/home";
});

const onScroll = () => {
  scrolled.value = window.scrollY > 20;
};

const onBeforeInstallPrompt = (event) => {
  event.preventDefault();
  installPrompt.value = event;
  window.__pwaInstallPrompt = event;
  window.dispatchEvent(new Event("pwa-install-available"));
};

const onAppInstalled = () => {
  installPrompt.value = null;
  window.__pwaInstallPrompt = null;
  isStandalone.value = true;
};

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.removeEventListener("appinstalled", onAppInstalled);
});

const onLogout = async () => {
  mobileOpen.value = false;
  await authStore.logout();
  router.push("/");
};

const onLoginClick = () => {
  mobileOpen.value = false;
  router.push("/auth/login");
};

const goBack = () => {
  mobileOpen.value = false;
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
};

const promptInstall = async () => {
  if (!installPrompt.value) return;
  const prompt = installPrompt.value;
  installPrompt.value = null;
  window.__pwaInstallPrompt = null;
  await prompt.prompt();
  try {
    await prompt.userChoice;
  } catch {}
};

const onInstallClick = () => {
  if (canInstall.value) {
    promptInstall();
  } else {
    router.push("/install");
  }
};
</script>

<style scoped>
.pharma-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(223, 231, 227, 0.6);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pharma-nav.nav-scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 30px rgba(13, 59, 46, 0.08);
  border-bottom-color: rgba(223, 231, 227, 0.8);
}

.nav-inner {
  display: flex;
  align-items: center;
  height: 72px;
  gap: 24px;
}

.nav-back-row {
  background: rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(223, 231, 227, 0.6);
}

.nav-back-inner {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.nav-back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: none;
  background: rgba(13, 59, 46, 0.08);
  color: #0d3b2e;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-back:hover {
  background: rgba(13, 59, 46, 0.16);
}

.nav-brand {
  text-decoration: none;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.nav-brand:hover {
  transform: scale(1.02);
}

.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a6358;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-link-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(2, 195, 154, 0.1) 0%, rgba(2, 195, 154, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.nav-link-item:hover {
  color: #0a7c5c;
  transform: translateY(-1px);
}

.nav-link-item:hover::before {
  opacity: 1;
}

.nav-link-item.is-active {
  color: #0a7c5c;
  font-weight: 600;
  background: rgba(2, 195, 154, 0.12);
}

.link-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(2, 195, 154, 0.08);
  color: #02c39a;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.nav-link-item:hover .link-icon {
  background: rgba(2, 195, 154, 0.15);
  transform: scale(1.1);
}

.nav-link-item.is-active .link-icon {
  background: rgba(2, 195, 154, 0.2);
  color: #0a7c5c;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-soft {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
  background: rgba(223, 231, 227, 0.5);
  color: #4a6358;
  text-decoration: none;
}

.btn-soft:hover {
  background: rgba(223, 231, 227, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 59, 46, 0.08);
}

.btn-soft-primary {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(13, 59, 46, 0.2);
}

.btn-soft-primary:hover {
  background: linear-gradient(135deg, #155745 0%, #1a6350 100%);
  box-shadow: 0 6px 20px rgba(13, 59, 46, 0.3);
  transform: translateY(-2px);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 16px;
  background: rgba(223, 231, 227, 0.4);
  border-radius: 50px;
  border: 1px solid rgba(223, 231, 227, 0.6);
  transition: all 0.3s ease;
}

.user-menu:hover {
  background: rgba(223, 231, 227, 0.6);
  box-shadow: 0 4px 12px rgba(13, 59, 46, 0.08);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #02c39a 0%, #00d9b5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0d3b2e;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  color: #8a3030;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: rgba(138, 48, 48, 0.1);
  transform: rotate(180deg);
}

.nav-hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  margin-left: auto;
  border: none;
  background: rgba(223, 231, 227, 0.5);
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 44px;
  height: 44px;
}

.nav-hamburger:hover {
  background: rgba(223, 231, 227, 0.8);
}

.nav-hamburger span {
  display: block;
  width: 20px;
  height: 2.5px;
  background: #0d3b2e;
  border-radius: 3px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 auto;
}

.nav-hamburger.is-open span:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
}

.nav-hamburger.is-open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.nav-hamburger.is-open span:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(223, 231, 227, 0.8);
  box-shadow: 0 20px 40px rgba(13, 59, 46, 0.1);
  max-height: calc(100vh - 72px);
  overflow-y: auto;
}

.mobile-menu-inner {
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
}


.mobile-links {
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-link-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  color: #4a6358;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.mobile-link-item:hover {
  background: rgba(2, 195, 154, 0.05);
  border-color: rgba(2, 195, 154, 0.2);
  color: #0a7c5c;
  transform: translateX(4px);
}

.mobile-link-item.is-active {
  background: rgba(2, 195, 154, 0.1);
  border-color: rgba(2, 195, 154, 0.3);
  color: #0a7c5c;
  font-weight: 600;
}

.mobile-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(2, 195, 154, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #02c39a;
  font-size: 1.1rem;
}

.mobile-link-item.is-active .mobile-icon {
  background: rgba(2, 195, 154, 0.2);
  color: #0a7c5c;
}

.arrow-icon {
  margin-left: auto;
  font-size: 0.85rem;
  color: rgba(74, 99, 88, 0.4);
  transition: transform 0.3s ease;
}

.mobile-link-item:hover .arrow-icon {
  transform: translateX(4px);
  color: #02c39a;
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid rgba(223, 231, 227, 0.6);
}

.mobile-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
}

.mobile-btn-secondary {
  background: rgba(223, 231, 227, 0.5);
  color: #4a6358;
}

.mobile-btn-secondary:hover {
  background: rgba(223, 231, 227, 0.8);
}

.mobile-btn-primary {
  background: linear-gradient(135deg, #0d3b2e 0%, #155745 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(13, 59, 46, 0.2);
}

.mobile-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 59, 46, 0.3);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 991px) {
  .nav-links,
  .nav-actions {
    display: none;
  }
  .nav-hamburger {
    display: flex;
  }
  .nav-inner {
    height: 64px;
  }
}
</style>
