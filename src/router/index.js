import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import HomeView from "@/views/HomeView.vue";
import ResultatsView from "@/views/ResultatsView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import RegisterView from "@/views/auth/RegisterView.vue";

import ClientCommandesView from "@/views/client/CommandesView.vue";
import ClientCommandeDetailView from "@/views/client/CommandeDetailView.vue";
import ClientPaiementView from "@/views/client/PaiementView.vue";
import ClientProfilView from "@/views/client/ProfilView.vue";

import PharmacieDashboardView from "@/views/pharmacie/DashboardView.vue";
import PharmacieStocksView from "@/views/pharmacie/StocksView.vue";
import PharmacieCommandesView from "@/views/pharmacie/CommandesView.vue";
import MaPharmacieView from "@/views/pharmacie/MaPharmacieView.vue";
import PharmaciePaiementsView from "@/views/pharmacie/PaiementsView.vue";

import AdminDashboardView from "@/views/admin/DashboardView.vue";
import AdminPharmaciesView from "@/views/admin/PharmaciesView.vue";
import AdminPaiementsView from "@/views/admin/PaiementsView.vue";
import AdminArticlesView from "@/views/admin/ArticlesView.vue";
import SupportView from "@/views/SupportView.vue";
import InstallView from "@/views/InstallView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/home", name: "home-alias", component: HomeView },
  { path: "/carte", name: "carte", component: HomeView },
  { path: "/resultats", name: "resultats", component: ResultatsView },
  { path: "/auth/login", name: "login", component: LoginView, meta: { guestOnly: true } },
  { path: "/auth/register", name: "register", component: RegisterView, meta: { guestOnly: true } },
  { path: "/client/commandes", name: "client-commandes", component: ClientCommandesView, meta: { role: "client" } },
  { path: "/client/commandes/:id", name: "client-commande-detail", component: ClientCommandeDetailView, meta: { role: "client" } },
  { path: "/client/paiement", name: "client-paiement", component: ClientPaiementView, meta: { role: "client" } },
  { path: "/client/profil", name: "client-profil", component: ClientProfilView, meta: { role: "client" } },
  { path: "/pharmacie/dashboard", name: "pharmacie-dashboard", component: PharmacieDashboardView, meta: { role: "pharmacie" } },
  { path: "/pharmacie/stocks", name: "pharmacie-stocks", component: PharmacieStocksView, meta: { role: "pharmacie" } },
  { path: "/pharmacie/commandes", name: "pharmacie-commandes", component: PharmacieCommandesView, meta: { role: "pharmacie" } },
  { path: "/pharmacie/ma-pharmacie", name: "ma-pharmacie", component: MaPharmacieView, meta: { role: "pharmacie" } },
  { path: "/pharmacie/paiements", name: "pharmacie-paiements", component: PharmaciePaiementsView, meta: { role: "pharmacie" } },
  { path: "/admin/dashboard", name: "admin-dashboard", component: AdminDashboardView, meta: { role: "admin" } },
  { path: "/admin/pharmacies", name: "admin-pharmacies", component: AdminPharmaciesView, meta: { role: "admin" } },
  { path: "/admin/paiements", name: "admin-paiements", component: AdminPaiementsView, meta: { role: "admin" } },
  { path: "/admin/articles", name: "admin-articles", component: AdminArticlesView, meta: { role: "admin" } },
  { path: "/support", name: "support", component: SupportView },
  { path: "/install", name: "install", component: InstallView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const role = authStore.role;

  if ((to.path === "/" || to.path === "/home") && (role === "admin" || role === "pharmacie")) {
    return authStore.redirectPathByRole;
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.redirectPathByRole;
  }

  if (to.meta.role) {
    if (!authStore.isAuthenticated) {
      return "/auth/login";
    }

    if (authStore.role !== to.meta.role) {
      return authStore.redirectPathByRole;
    }
  }

  return true;
});

export default router;
