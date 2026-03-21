<template>
  <div class="admin-dashboard">
    <NavBar />
    
    <div class="dashboard-wrapper">
      <!-- Header Executive -->
      <header class="dash-header">
        <div class="header-left">
          <h1 class="dash-title">Tableau de bord Administrateur</h1>
          <p class="dash-subtitle">Vue d'ensemble de l'écosystème PharmaMap</p>
        </div>
        <div class="header-right">
          <div class="status-badge">
            <span class="status-dot online"></span>
            Système opérationnel
          </div>
          <div class="last-update">
            <i class="bi bi-clock-history"></i>
            Mis à jour à {{ currentTime }}
          </div>
        </div>
      </header>

      <!-- Alertes -->
      <Transition name="slide-down">
        <div v-if="errorMessage" class="alert-premium alert-danger">
          <div class="alert-icon">
            <i class="bi bi-shield-exclamation"></i>
          </div>
          <div class="alert-content">
            <strong>Erreur système</strong>
            <span>{{ errorMessage }}</span>
          </div>
          <button class="alert-close" @click="errorMessage = ''">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="loading" class="skeleton-executive">
        <div class="skeleton-kpi-grid">
          <div v-for="i in 4" :key="i" class="skeleton-kpi-card">
            <div class="skeleton-icon"></div>
            <div class="skeleton-lines">
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
        <div class="skeleton-charts">
          <div class="skeleton-chart-main"></div>
          <div class="skeleton-chart-side"></div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="dashboard-content">
        <!-- KPI Grid -->
        <div class="kpi-executive">
          <div 
            v-for="(kpi, index) in kpis" 
            :key="kpi.key"
            class="kpi-card-exec"
            :class="kpi.color"
            :style="{ animationDelay: index * 0.1 + 's' }"
          >
            <div class="kpi-bg-icon">
              <i :class="kpi.icon"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-header">
                <span class="kpi-label">{{ kpi.label }}</span>
                <div class="kpi-trend" :class="kpi.trend > 0 ? 'up' : 'neutral'">
                  <i :class="kpi.trend > 0 ? 'bi bi-trending-up' : 'bi bi-dash'"></i>
                  {{ kpi.trend }}%
                </div>
              </div>
              <div class="kpi-value-exec">{{ kpi.value }}</div>
              <div class="kpi-footer">
                <span class="kpi-subtext">{{ kpi.subtext }}</span>
              </div>
            </div>
            <div class="kpi-progress" :style="{ width: kpi.fill + '%' }"></div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="analytics-grid">
          <!-- Chart Section -->
          <div class="analytics-card main">
            <div class="card-header-exec">
              <div class="header-title-group">
                <div class="header-icon blue">
                  <i class="bi bi-bar-chart-fill"></i>
                </div>
                <div>
                  <h3>Répartition des paiements</h3>
                  <p class="header-subtitle">Distribution par statut transactionnel</p>
                </div>
              </div>
              <div class="header-actions">
                <button class="btn-icon-sm" title="Actualiser" @click="loadDashboard">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>

            <div class="card-body-exec">
              <div v-if="!paiementsSeries.length" class="empty-state-exec">
                <div class="empty-icon-large">
                  <i class="bi bi-inbox"></i>
                </div>
                <h4>Aucune donnée disponible</h4>
                <p>Les paiements apparaîtront ici une fois les premières transactions effectuées.</p>
              </div>

              <div v-else class="chart-executive">
                <!-- Visual Bars -->
                <div class="exec-bars-container">
                  <div 
                    v-for="item in paiementsChart" 
                    :key="item.label"
                    class="exec-bar-wrapper"
                  >
                    <div class="exec-bar-track">
                      <div 
                        class="exec-bar-fill"
                        :style="{ 
                          height: item.height + '%', 
                          background: item.color,
                          boxShadow: '0 4px 12px ' + item.color + '40'
                        }"
                      >
                        <span class="exec-bar-value">{{ item.count }}</span>
                      </div>
                    </div>
                    <div class="exec-bar-label">{{ item.label }}</div>
                  </div>
                </div>

                <!-- Detailed Stats -->
                <div class="stats-details">
                  <div 
                    v-for="item in paiementsSeries" 
                    :key="item.label"
                    class="stat-row"
                  >
                    <div class="stat-info">
                      <span class="stat-dot" :style="{ background: item.color }"></span>
                      <span class="stat-name">{{ item.label }}</span>
                      <span class="stat-count">{{ item.count }}</span>
                    </div>
                    <div class="stat-bar-bg">
                      <div 
                        class="stat-bar-fill-smooth"
                        :style="{ width: item.percent + '%', background: item.color }"
                      ></div>
                    </div>
                    <span class="stat-percent">{{ item.percent }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="analytics-card side">
            <div class="card-header-exec">
              <div class="header-title-group">
                <div class="header-icon amber">
                  <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <div>
                  <h3>Actions rapides</h3>
                  <p class="header-subtitle">Gestion administrative</p>
                </div>
              </div>
            </div>

            <div class="actions-executive">
              <router-link
                v-for="(link, idx) in quickLinks"
                :key="link.id"
                :to="link.link"
                class="action-item-exec"
                :style="{ animationDelay: idx * 0.08 + 's' }"
              >
                <div class="action-visual" :class="link.id">
                  <i :class="link.icon"></i>
                </div>
                <div class="action-details">
                  <span class="action-name">{{ link.title }}</span>
                  <span class="action-desc">{{ link.description }}</span>
                </div>
                <div class="action-arrow">
                  <i class="bi bi-chevron-right"></i>
                </div>
              </router-link>
            </div>

            <!-- Mini Stats -->
            <div class="mini-stats">
              <div class="mini-stat">
                <i class="bi bi-check-circle-fill text-success"></i>
                <span>{{ dashboard.pharmacies || 0 }} pharmacies actives</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import coreApi from "@/api/core";

const loading = ref(true);
const errorMessage = ref("");
const currentTime = ref(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

const dashboard = reactive({
  pharmacies: 0,
  utilisateurs: 0,
  paiements: 0,
  articles: 0,
  paiements_par_statut: {}
});

const quickLinks = [
  {
    id: "admin-pharmacies",
    title: "Gestion Pharmacies",
    description: "Validation et supervision",
    icon: "fa-solid fa-hospital",
    link: "/admin/pharmacies"
  },
  {
    id: "admin-paiements",
    title: "Contrôle Paiements",
    description: "Vérification transactions",
    icon: "fa-solid fa-coins",
    link: "/admin/paiements"
  },
  {
    id: "admin-articles",
    title: "Catalogue Articles",
    description: "Gestion du référentiel",
    icon: "fa-solid fa-capsules",
    link: "/admin/articles"
  },
  {
    id: "admin-support",
    title: "Support Client",
    description: "Assistance utilisateurs",
    icon: "fa-solid fa-headset",
    link: "/support"
  }
];

const kpis = computed(() => [
  {
    key: 'pharmacies',
    label: 'Pharmacies',
    value: dashboard.pharmacies,
    icon: 'fa-solid fa-store',
    color: 'teal',
    trend: 12,
    subtext: 'partenaires actifs',
    fill: 75
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    value: dashboard.utilisateurs,
    icon: 'fa-solid fa-users',
    color: 'blue',
    trend: 8,
    subtext: 'comptes enregistrés',
    fill: 60
  },
  {
    key: 'paiements',
    label: 'Transactions',
    value: dashboard.paiements,
    icon: 'fa-solid fa-credit-card',
    color: 'purple',
    trend: 24,
    subtext: 'paiements traités',
    fill: 85
  },
  {
    key: 'articles',
    label: 'Articles',
    value: dashboard.articles,
    icon: 'fa-solid fa-pills',
    color: 'amber',
    trend: 5,
    subtext: 'produits référencés',
    fill: 45
  }
]);

const paiementsSeries = computed(() => {
  const map = dashboard.paiements_par_statut || {};
  const total = Object.values(map).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  const labels = [
    { key: "pending", label: "En attente", color: "#6c757d" },
    { key: "soumis", label: "Soumis", color: "#0d6efd" },
    { key: "confirme", label: "Confirmé", color: "#198754" },
    { key: "rejete", label: "Rejeté", color: "#dc3545" }
  ];
  return labels
    .map((item) => ({
      ...item,
      count: Number(map[item.key] || 0),
      percent: Math.round((Number(map[item.key] || 0) / total) * 100)
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
});

const paiementsChart = computed(() => {
  const max = Math.max(...paiementsSeries.value.map((item) => item.count), 1);
  return paiementsSeries.value.map((item) => ({
    ...item,
    height: Math.max(Math.round((item.count / max) * 100), 15) // Minimum 15% pour visibilité
  }));
});

const loadDashboard = async () => {
  loading.value = true;
  errorMessage.value = "";
  currentTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  try {
    const { data } = await coreApi.getAdminDashboard();
    dashboard.pharmacies = data.pharmacies || 0;
    dashboard.utilisateurs = data.utilisateurs || 0;
    dashboard.paiements = data.paiements || 0;
    dashboard.articles = data.articles || 0;
    dashboard.paiements_par_statut = data.paiements_par_statut || {};
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de charger le dashboard admin.";
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 600);
  }
};

onMounted(() => {
  loadDashboard();
  // Mise à jour de l'heure toutes les minutes
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, 60000);
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafb 0%, #f0f4f8 100%);
  font-family: system-ui, -apple-system, sans-serif;
}

.dashboard-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Header Executive */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dash-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0;
  letter-spacing: -0.02em;
}

.dash-subtitle {
  color: #718096;
  margin: 6px 0 0 0;
  font-size: 1rem;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(25, 135, 84, 0.1);
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #198754;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #198754;
  animation: pulse-dot 2s infinite;
}

.status-dot.online {
  background: #10b981;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.last-update {
  font-size: 0.85rem;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Alert Premium */
.alert-premium {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(220, 53, 69, 0.05);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(220, 53, 69, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: 1.2rem;
}

.alert-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.alert-content strong {
  color: #dc3545;
  font-weight: 700;
  font-size: 0.9rem;
}

.alert-content span {
  color: #a0aec0;
  font-size: 0.9rem;
}

.alert-close {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

/* Skeleton */
.skeleton-executive {
  animation: fade-in 0.3s ease;
}

.skeleton-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.skeleton-kpi-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e0 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-lines div {
  height: 12px;
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e0 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

.skeleton-lines div:first-child {
  width: 60%;
}

.skeleton-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.skeleton-chart-main,
.skeleton-chart-side {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  height: 400px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dashboard Content */
.dashboard-content {
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* KPI Executive */
.kpi-executive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.kpi-card-exec {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: all 0.3s ease;
  animation: slide-up 0.5s ease backwards;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-card-exec:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
}

.kpi-bg-icon {
  position: absolute;
  right: -10px;
  top: -10px;
  font-size: 6rem;
  opacity: 0.03;
  transform: rotate(15deg);
  transition: all 0.3s ease;
}

.kpi-card-exec:hover .kpi-bg-icon {
  opacity: 0.06;
  transform: rotate(0deg) scale(1.1);
}

.kpi-content {
  position: relative;
  z-index: 1;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 50px;
}

.kpi-trend.up {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.kpi-trend.neutral {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.kpi-value-exec {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 8px;
  font-family: 'SF Mono', monospace;
}

.kpi-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-subtext {
  font-size: 0.875rem;
  color: #94a3b8;
}

.kpi-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.2;
  transition: width 1s ease;
}

.kpi-card-exec.teal { color: #0d9488; }
.kpi-card-exec.blue { color: #3b82f6; }
.kpi-card-exec.purple { color: #8b5cf6; }
.kpi-card-exec.amber { color: #f59e0b; }

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-charts {
    grid-template-columns: 1fr;
  }
}

.analytics-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.analytics-card.main {
  min-height: 500px;
}

.card-header-exec {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-title-group {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.header-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.header-icon.amber {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.card-header-exec h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.header-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.btn-icon-sm {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: #f8fafc;
  color: #0f172a;
  transform: rotate(180deg);
}

.card-body-exec {
  padding: 24px;
}

/* Chart Executive */
.chart-executive {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.exec-bars-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 20px 0;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.exec-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 80px;
}

.exec-bar-track {
  width: 100%;
  height: 160px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.exec-bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 12px;
  transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.exec-bar-value {
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.exec-bar-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
}

/* Stats Details */
.stats-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.stat-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-name {
  font-weight: 600;
  color: #334155;
  flex: 1;
}

.stat-count {
  font-weight: 700;
  color: #0f172a;
  min-width: 30px;
  text-align: right;
}

.stat-bar-bg {
  height: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  overflow: hidden;
  grid-column: 1;
}

.stat-bar-fill-smooth {
  height: 100%;
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-percent {
  font-weight: 700;
  color: #64748b;
  font-size: 0.875rem;
  grid-column: 2;
}

/* Actions Executive */
.actions-executive {
  padding: 16px;
}

.action-item-exec {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slide-in-right 0.4s ease backwards;
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.action-item-exec:hover {
  background: white;
  border-color: rgba(13, 148, 136, 0.2);
  transform: translateX(8px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
}

.action-visual {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.action-item-exec:hover .action-visual {
  transform: scale(1.1) rotate(-5deg);
}

.action-visual.admin-pharmacies {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
}

.action-visual.admin-paiements {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.action-visual.admin-articles {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.action-visual.admin-support {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.action-desc {
  font-size: 0.85rem;
  color: #64748b;
}

.action-arrow {
  color: #cbd5e1;
  transition: all 0.3s ease;
}

.action-item-exec:hover .action-arrow {
  color: #0d9488;
  transform: translateX(4px);
}

/* Mini Stats */
.mini-stats {
  margin: 0 16px 16px;
  padding: 16px;
  background: rgba(25, 135, 84, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(25, 135, 84, 0.1);
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #198754;
  font-weight: 600;
}

/* Empty State */
.empty-state-exec {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #cbd5e1;
}

.empty-state-exec h4 {
  color: #475569;
  margin: 0 0 8px 0;
  font-size: 1.125rem;
}

.empty-state-exec p {
  margin: 0;
  font-size: 0.9rem;
  max-width: 300px;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-wrapper {
    padding: 20px 16px;
  }
  
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    align-items: flex-start;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .kpi-executive {
    grid-template-columns: 1fr;
  }
  
  .kpi-value-exec {
    font-size: 1.875rem;
  }
  
  .exec-bars-container {
    height: 160px;
  }
  
  .exec-bar-track {
    height: 120px;
  }
}
</style>