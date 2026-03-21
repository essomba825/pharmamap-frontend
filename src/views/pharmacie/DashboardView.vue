<template>
  <div class="dashboard-pharma">
    <NavBar />
    
    <div class="dashboard-container">
      <!-- Header avec salutation dynamique -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">Tableau de bord</h1>
          <p class="dashboard-subtitle">{{ greeting }}</p>
        </div>
        <div class="header-date">
          <span class="date-badge">
            <i class="bi bi-calendar3"></i>
            {{ currentDate }}
          </span>
        </div>
      </div>

      <!-- Alerte -->
      <Transition name="fade">
        <div v-if="errorMessage" class="alert-custom alert-danger">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorMessage }}</span>
          <button @click="errorMessage = ''" class="btn-close-alert">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="pharmacieMissing" class="alert-custom alert-warning">
          <i class="bi bi-exclamation-circle-fill"></i>
          <span>
            Aucune pharmacie enregistree. Completez vos informations pour lancer la validation.
          </span>
          <router-link class="alert-action" to="/pharmacie/ma-pharmacie">
            Completer
          </router-link>
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="pharmaciePending" class="alert-custom alert-warning">
          <i class="bi bi-shield-exclamation"></i>
          <span>
            Validation en cours. Une equipe va verifier votre pharmacie. Elle n'est pas visible pour le moment.
          </span>
          <router-link class="alert-action" to="/pharmacie/ma-pharmacie">
            Voir la fiche
          </router-link>
        </div>
      </Transition>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card kpi">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
        <div class="skeleton-card chart"></div>
        <div class="skeleton-card actions"></div>
      </div>

      <!-- Contenu principal -->
      <div v-else class="dashboard-grid">
        <!-- KPI Cards -->
        <div class="kpi-section">
          <div class="kpi-card" v-for="(kpi, index) in kpis" :key="index" :class="kpi.type">
            <div class="kpi-icon-wrapper" :class="kpi.type">
              <i :class="kpi.icon"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">{{ kpi.label }}</span>
              <span class="kpi-value">{{ kpi.value }}</span>
              <span class="kpi-trend" v-if="kpi.trend">
                <i :class="kpi.trendIcon"></i>
                {{ kpi.trend }}
              </span>
            </div>
            <div class="kpi-decoration"></div>
          </div>
        </div>

        <!-- Graphique et Actions -->
        <div class="main-grid">
          <!-- Graphique d'activité -->
          <div class="card-glass chart-card">
            <div class="card-header-glass">
              <div class="header-title">
                <i class="bi bi-activity text-primary"></i>
                <span>Activité (7 jours)</span>
              </div>
              <span class="badge-total">{{ totalCommandes }} commandes</span>
            </div>
            
            <div class="card-body">
              <div v-if="!dailySeries.length" class="empty-state">
                <i class="bi bi-graph-down"></i>
                <span>Aucune activité récente</span>
              </div>
              
              <div v-else class="chart-container">
                <div class="chart-header">
                  <span class="chart-big-number">{{ Math.max(...dailySeries.map(d => d.count)) }}</span>
                  <span class="chart-label">max/jour</span>
                </div>
                
                <div class="sparkline-wrapper">
                  <svg viewBox="0 0 300 100" class="sparkline-svg">
                    <defs>
                      <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#02c39a;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#0d3b2e;stop-opacity:1" />
                      </linearGradient>
                      <linearGradient id="gradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#02c39a;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#02c39a;stop-opacity:0" />
                      </linearGradient>
                    </defs>
                    
                    <!-- Zone remplie -->
                    <path :d="sparklineAreaPath" fill="url(#gradientArea)" />
                    
                    <!-- Ligne -->
                    <path :d="sparklinePath" fill="none" stroke="url(#gradientLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    
                    <!-- Points -->
                    <circle v-for="(point, i) in sparklinePointsArray" :key="i" 
                      :cx="point.x" :cy="point.y" r="4" 
                      fill="white" stroke="#02c39a" stroke-width="2"
                      class="chart-point"
                    />
                  </svg>
                  
                  <div class="chart-labels">
                    <span v-for="(item, i) in dailySeries" :key="i" class="chart-label">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="card-glass actions-card">
            <div class="card-header-glass">
              <div class="header-title">
                <i class="bi bi-lightning-charge-fill text-warning"></i>
                <span>Actions rapides</span>
              </div>
            </div>
            
            <div class="actions-list">
              <router-link
                v-for="(link, index) in quickLinks"
                :key="link.id"
                :to="link.link"
                class="action-item"
                :style="{ animationDelay: index * 0.1 + 's' }"
              >
                <div class="action-icon" :class="link.id">
                  <i :class="link.icon"></i>
                </div>
                <div class="action-content">
                  <span class="action-title">{{ link.title }}</span>
                  <span class="action-desc">{{ link.description }}</span>
                </div>
                <div class="action-arrow">
                  <i class="bi bi-chevron-right"></i>
                </div>
                <div class="action-shine"></div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Répartition des commandes -->
        <div class="card-glass stats-card">
          <div class="card-header-glass">
            <div class="header-title">
              <i class="bi bi-pie-chart-fill text-info"></i>
              <span>Répartition des commandes</span>
            </div>
          </div>
          
          <div class="card-body">
            <div v-if="!commandesSeries.length" class="empty-state">
              <i class="bi bi-inbox"></i>
              <span>Aucune commande à afficher</span>
            </div>
            
            <div v-else class="stats-list">
              <div v-for="item in commandesSeries" :key="item.label" class="stat-item">
                <div class="stat-info">
                  <div class="stat-header">
                    <span class="stat-dot" :style="{ background: item.color }"></span>
                    <span class="stat-label">{{ item.label }}</span>
                    <span class="stat-count">{{ item.count }}</span>
                  </div>
                  <div class="stat-bar-bg">
                    <div class="stat-bar-fill" :style="{ 
                      width: item.percent + '%', 
                      background: item.color,
                      boxShadow: '0 2px 8px ' + item.color + '40'
                    }"></div>
                  </div>
                </div>
                <span class="stat-percent">{{ item.percent }}%</span>
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
const pharmacieInfo = ref(null);
const pharmacieMissing = ref(false);
const dashboard = reactive({
  commandes: 0,
  revenus: 0,
  stock_critique: 0
});
const commandes = ref([]);

// Salutation dynamique
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonne matinée ! Voici votre activité.";
  if (hour < 18) return "Bon après-midi ! Voici votre activité.";
  return "Bonsoir ! Voici votre activité.";
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString("fr-FR", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
});

const pharmaciePending = computed(() => {
  if (!pharmacieInfo.value) return false;
  return pharmacieInfo.value.validee === false;
});

const kpis = computed(() => [
  {
    label: "Commandes reçues",
    value: dashboard.commandes,
    icon: "bi bi-bag-check-fill",
    type: "primary",
    trend: "+12%",
    trendIcon: "bi bi-arrow-up-short"
  },
  {
    label: "Revenus estimés",
    value: formatFcfa(dashboard.revenus),
    icon: "bi bi-currency-exchange",
    type: "success",
    trend: "+8%",
    trendIcon: "bi bi-arrow-up-short"
  },
  {
    label: "Alertes stock",
    value: dashboard.stock_critique,
    icon: "bi bi-exclamation-triangle-fill",
    type: dashboard.stock_critique > 0 ? "warning" : "neutral",
    trend: dashboard.stock_critique > 0 ? "À vérifier" : "OK",
    trendIcon: dashboard.stock_critique > 0 ? "bi bi-exclamation-circle" : "bi bi-check-circle"
  }
]);

const quickLinks = [
  {
    id: "stocks",
    title: "Gestion des stocks",
    description: "Mettre à jour les quantités",
    icon: "bi bi-box-seam",
    link: "/pharmacie/stocks"
  },
  {
    id: "commandes",
    title: "Commandes clients",
    description: "Traiter les nouvelles commandes",
    icon: "bi bi-clipboard-check",
    link: "/pharmacie/commandes"
  },
  {
    id: "paiements",
    title: "Paiements",
    description: "Vérifier les transactions",
    icon: "bi bi-credit-card",
    link: "/pharmacie/paiements"
  },
  {
    id: "support",
    title: "Centre d'aide",
    description: "Contactez le support",
    icon: "bi bi-headset",
    link: "/support"
  }
];

const commandesSeries = computed(() => {
  const counts = commandes.value.reduce((acc, cmd) => {
    acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  
  const labels = [
    { key: "attente_paiement", label: "Attente paiement", color: "#6c757d" },
    { key: "paiement_soumis", label: "Paiement soumis", color: "#0d6efd" },
    { key: "confirme", label: "Confirmé", color: "#198754" },
    { key: "en_livraison", label: "En livraison", color: "#20c997" },
    { key: "livre", label: "Livré", color: "#6f42c1" },
    { key: "annule", label: "Annulé", color: "#dc3545" }
  ];

  return labels
    .map((item) => ({
      ...item,
      count: counts[item.key] || 0,
      percent: Math.round(((counts[item.key] || 0) / total) * 100)
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
});

const totalCommandes = computed(() => commandes.value.length);

const parseCommandeDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const [datePart] = value.split(" ");
  const [day, month, year] = (datePart || "").split("/");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const dailySeries = computed(() => {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ 
      key, 
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), 
      count: 0 
    });
  }

  commandes.value.forEach((cmd) => {
    const dateObj = parseCommandeDate(cmd.created_at);
    if (!dateObj) return;
    const key = dateObj.toISOString().slice(0, 10);
    const day = days.find((item) => item.key === key);
    if (day) day.count += 1;
  });

  return days;
});

// Calcul amélioré pour le SVG
const sparklinePointsArray = computed(() => {
  if (!dailySeries.value.length) return [];
  const width = 300;
  const height = 100;
  const padding = 20;
  const max = Math.max(...dailySeries.value.map((d) => d.count), 1);
  const step = (width - padding * 2) / (dailySeries.value.length - 1 || 1);
  
  return dailySeries.value.map((item, index) => ({
    x: padding + index * step,
    y: height - padding - (item.count / max) * (height - padding * 2),
    count: item.count
  }));
});

const sparklinePath = computed(() => {
  if (!sparklinePointsArray.value.length) return "";
  return sparklinePointsArray.value
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
});

const sparklineAreaPath = computed(() => {
  if (!sparklinePointsArray.value.length) return "";
  const height = 100;
  const padding = 20;
  const first = sparklinePointsArray.value[0];
  const last = sparklinePointsArray.value[sparklinePointsArray.value.length - 1];
  
  return `M ${first.x} ${height - padding} ` +
    sparklinePointsArray.value.map(p => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${last.x} ${height - padding} Z`;
});

const formatFcfa = (value) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;

const loadDashboard = async () => {
  loading.value = true;
  errorMessage.value = "";
  pharmacieMissing.value = false;
  pharmacieInfo.value = null;
  try {
    const phRes = await coreApi.getMaPharmacie();
    pharmacieInfo.value = phRes.data?.pharmacie || null;
  } catch (phError) {
    const status = phError.response?.status;
    if (status === 404) {
      pharmacieMissing.value = true;
    } else {
      errorMessage.value = phError.response?.data?.erreur || "Impossible de charger la pharmacie.";
    }
  }
  try {
    const { data } = await coreApi.getPharmacieDashboard();
    dashboard.commandes = data.commandes || 0;
    dashboard.revenus = data.revenus || 0;
    dashboard.stock_critique = data.stock_critique || 0;
    const commandesRes = await coreApi.getPharmacieCommandes();
    commandes.value = commandesRes.data?.commandes || [];
  } catch (error) {
    const status = error.response?.status;
    if (!(status === 403 && pharmacieMissing.value)) {
      errorMessage.value = error.response?.data?.erreur || "Impossible de charger le dashboard.";
    }
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 800); // Petit délai pour l'effet visuel
  }
};

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard-pharma {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f9f7 0%, #e8f4f1 100%);
  padding-bottom: 40px;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0d3b2e;
  margin: 0;
  letter-spacing: -0.02em;
}

.dashboard-subtitle {
  color: #6b8a7d;
  margin: 4px 0 0 0;
  font-size: 1.05rem;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(223, 231, 227, 0.6);
  border-radius: 50px;
  color: #4a6358;
  font-weight: 500;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
}

/* Alert */
.alert-custom {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid;
  animation: slideIn 0.3s ease;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.08);
  border-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.alert-warning {
  background: rgba(255, 193, 7, 0.12);
  border-color: rgba(255, 193, 7, 0.35);
  color: #8a6a00;
}

.alert-action {
  margin-left: auto;
  color: inherit;
  font-weight: 600;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(138, 106, 0, 0.3);
  transition: all 0.2s ease;
}

.alert-action:hover {
  background: rgba(138, 106, 0, 0.08);
}

.btn-close-alert {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-close-alert:hover {
  opacity: 1;
}

/* Skeleton Loading */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(223, 231, 227, 0.4);
  animation: pulse 2s infinite;
}

.skeleton-card.kpi {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 120px;
}

.skeleton-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f0f4f2 25%, #e8f0ec 50%, #f0f4f2 75%);
  background-size: 200% 100%;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f4f2 25%, #e8f0ec 50%, #f0f4f2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-card.chart {
  height: 300px;
  grid-column: span 2;
}

.skeleton-card.actions {
  height: 300px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Dashboard Grid */
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* KPI Section */
.kpi-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.kpi-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 20px rgba(13, 59, 46, 0.06);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(13, 59, 46, 0.12);
}

.kpi-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.kpi-icon-wrapper.primary {
  background: linear-gradient(135deg, rgba(2, 195, 154, 0.15) 0%, rgba(2, 195, 154, 0.05) 100%);
  color: #02c39a;
}

.kpi-icon-wrapper.success {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(25, 135, 84, 0.05) 100%);
  color: #198754;
}

.kpi-icon-wrapper.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  color: #f59e0b;
}

.kpi-icon-wrapper.neutral {
  background: linear-gradient(135deg, rgba(108, 117, 125, 0.15) 0%, rgba(108, 117, 125, 0.05) 100%);
  color: #6c757d;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.kpi-label {
  font-size: 0.9rem;
  color: #6b8a7d;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0d3b2e;
  letter-spacing: -0.02em;
}

.kpi-trend {
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.kpi-trend .bi-arrow-up-short {
  color: #198754;
}

.kpi-trend .bi-check-circle {
  color: #198754;
}

.kpi-trend .bi-exclamation-circle {
  color: #f59e0b;
}

.kpi-decoration {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(2, 195, 154, 0.03) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 991px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-card.chart {
    grid-column: span 1;
  }
}

/* Cards Glass */
.card-glass {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(13, 59, 46, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header-glass {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(223, 231, 227, 0.4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(248, 250, 249, 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #0d3b2e;
  font-size: 1.1rem;
}

.header-title i {
  font-size: 1.2rem;
}

.badge-total {
  background: rgba(2, 195, 154, 0.1);
  color: #0a7c5c;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
}

.card-body {
  padding: 24px;
  flex: 1;
}

/* Chart */
.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
}

.chart-big-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0d3b2e;
  line-height: 1;
}

.chart-label {
  color: #6b8a7d;
  font-size: 0.9rem;
  font-weight: 500;
}

.sparkline-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sparkline-svg {
  width: 100%;
  height: 120px;
  overflow: visible;
}

.chart-point {
  transition: r 0.2s ease;
  cursor: pointer;
}

.chart-point:hover {
  r: 6;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 10px;
}

.chart-label {
  font-size: 0.75rem;
  color: #9ab5a8;
  font-weight: 500;
}

/* Actions */
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.action-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(248, 250, 249, 0.6);
  border: 1px solid rgba(223, 231, 227, 0.4);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInRight 0.4s ease backwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.action-item:hover {
  background: white;
  border-color: rgba(2, 195, 154, 0.3);
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(13, 59, 46, 0.08);
}

.action-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.action-item:hover .action-shine {
  left: 100%;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.action-item:hover .action-icon {
  transform: scale(1.1) rotate(-5deg);
}

.action-icon.stocks { background: rgba(2, 195, 154, 0.1); color: #02c39a; }
.action-icon.commandes { background: rgba(13, 110, 253, 0.1); color: #0d6efd; }
.action-icon.paiements { background: rgba(111, 66, 193, 0.1); color: #6f42c1; }
.action-icon.support { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-title {
  font-weight: 700;
  color: #0d3b2e;
  font-size: 0.95rem;
}

.action-desc {
  font-size: 0.85rem;
  color: #6b8a7d;
}

.action-arrow {
  color: #9ab5a8;
  transition: transform 0.3s ease, color 0.3s;
}

.action-item:hover .action-arrow {
  transform: translateX(4px);
  color: #02c39a;
}

/* Stats Card */
.stats-card {
  margin-top: 0;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-label {
  font-weight: 600;
  color: #4a6358;
  flex: 1;
}

.stat-count {
  font-weight: 700;
  color: #0d3b2e;
  font-size: 0.95rem;
}

.stat-bar-bg {
  height: 8px;
  background: rgba(223, 231, 227, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-percent {
  font-size: 0.9rem;
  font-weight: 700;
  color: #6b8a7d;
  min-width: 40px;
  text-align: right;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #9ab5a8;
  gap: 12px;
}

.empty-state i {
  font-size: 2.5rem;
  opacity: 0.5;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .dashboard-title {
    font-size: 1.5rem;
  }
  
  .kpi-section {
    grid-template-columns: 1fr;
  }
  
  .kpi-card {
    padding: 20px;
  }
  
  .kpi-value {
    font-size: 1.5rem;
  }
  
  .date-badge {
    display: none;
  }
  
  .chart-big-number {
    font-size: 2rem;
  }
}
</style>
