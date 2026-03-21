<template>
  <div>
    <NavBar />
    <div class="container-xl py-4">
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes commandes</h1>
          <p class="page-subtitle">Suivez vos commandes et paiements. Livraison bientôt disponible.</p>
        </div>
      </div>

      <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" class="mb-3" />

      <div v-if="!commandes.length" class="card">
        <div class="card-body text-muted">Aucune commande pour le moment.</div>
      </div>

      <div v-else class="row g-3">
        <div v-for="commande in commandes" :key="commande.id" class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div class="fw-semibold">Commande #{{ commande.id }}</div>
                  <div class="text-muted small">
                    {{ commande.article }} · {{ commande.pharmacie }}
                  </div>
                </div>
                <StatutBadge :status="commande.statut || 'inconnu'" />
              </div>

              <div class="small text-muted mt-2">
                Date: {{ commande.created_at || "Date indisponible" }}
              </div>

              <div class="d-flex flex-wrap gap-3 mt-3 small">
                <div><strong>Total:</strong> {{ commande.montant_total }} FCFA</div>
                <div><strong>Mode:</strong> {{ commande.mode }}</div>
              </div>

              <div class="d-flex flex-wrap gap-2 mt-3">
                <router-link class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" :to="`/client/commandes/${commande.id}`">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                  <span>Voir details</span>
                </router-link>
                <router-link
                  v-if="canPay(commande)"
                  class="btn btn-sm btn-primary d-flex align-items-center gap-2"
                  :to="`/client/paiement?commande_id=${commande.id}`"
                >
                  <i class="bi bi-credit-card" aria-hidden="true"></i>
                  <span>Payer</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import StatutBadge from "@/components/StatutBadge.vue";
import coreApi from "@/api/core";

const commandes = ref([]);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const { data } = await coreApi.getClientCommandes();
    commandes.value = data.commandes || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de charger vos commandes.";
  }
});

const canPay = (commande) => {
  return ["attente_paiement", "paiement_soumis"].includes(commande.statut);
};
</script>
