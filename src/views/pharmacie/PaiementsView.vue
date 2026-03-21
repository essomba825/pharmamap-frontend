<template>
  <div>
    <NavBar />
    <div class="container py-4">
      <h1 class="h4 mb-3">Paiements recus</h1>
      <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" />
      <AlerteMessage v-if="successMessage" :message="successMessage" type="success" />

      <div class="d-flex gap-2 align-items-center mb-3">
        <select v-model="filtreStatut" class="form-select" style="max-width: 220px;">
          <option value="">Tous les statuts</option>
          <option value="soumis">Soumis</option>
          <option value="confirme">Confirme</option>
          <option value="rejete">Rejete</option>
          <option value="pending">Pending</option>
        </select>
        <button class="btn btn-outline-secondary" @click="loadPaiements" :disabled="loading">
          {{ loading ? "Chargement..." : "Actualiser" }}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Commande</th>
              <th>Client</th>
              <th>Article</th>
              <th>Montant</th>
              <th>Expediteur</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paiements" :key="p.id">
              <td>{{ p.id }}</td>
              <td>{{ p.commande_id }}</td>
              <td>{{ p.client || "-" }}</td>
              <td>{{ p.article || "-" }}</td>
              <td>{{ p.montant }}</td>
              <td>{{ p.numero_expediteur || "-" }}</td>
              <td><StatutBadge :status="p.statut || 'inconnu'" /></td>
              <td>{{ p.created_at || "-" }}</td>
              <td>
                <div class="d-flex gap-2">
                  <button
                    class="btn btn-sm btn-success"
                    :disabled="actionLoadingId === p.id || p.statut !== 'soumis'"
                    @click="confirmer(p)"
                  >
                    Confirmer
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    :disabled="actionLoadingId === p.id || p.statut !== 'soumis'"
                    @click="rejeter(p)"
                  >
                    Rejeter
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

const paiements = ref([]);
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);
const actionLoadingId = ref(null);
const filtreStatut = ref("");

const loadPaiements = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const params = filtreStatut.value ? { statut: filtreStatut.value } : {};
    const { data } = await coreApi.getPharmaciePaiements(params);
    paiements.value = data.paiements || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de charger les paiements.";
  } finally {
    loading.value = false;
  }
};

const confirmer = async (paiement) => {
  actionLoadingId.value = paiement.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await coreApi.confirmPaiement(paiement.id, { note: "Confirme par la pharmacie" });
    successMessage.value = "Paiement confirme.";
    await loadPaiements();
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de confirmer ce paiement.";
  } finally {
    actionLoadingId.value = null;
  }
};

const rejeter = async (paiement) => {
  const note = window.prompt("Motif du rejet (optionnel):", "Paiement invalide");
  if (note === null) return;

  actionLoadingId.value = paiement.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await coreApi.rejectPaiement(paiement.id, { note });
    successMessage.value = "Paiement rejete.";
    await loadPaiements();
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de rejeter ce paiement.";
  } finally {
    actionLoadingId.value = null;
  }
};

onMounted(loadPaiements);
</script>
