<template>
  <div>
    <NavBar />
    <div class="container-xl py-4" style="max-width: 760px;">
      <div class="page-header">
        <div>
          <h1 class="page-title">Paiement Mobile Money</h1>
          <p class="page-subtitle">Selectionnez la commande et suivez les instructions.</p>
        </div>
      </div>
      <AlerteMessage v-if="message" :message="message" :type="isError ? 'danger' : 'success'" />

      <form @submit.prevent="initialiserPaiement">
        <div class="row g-2">
          <div class="col-12">
            <label class="form-label">Commande a payer</label>
            <select v-model="form.commande_id" class="form-select" required>
              <option disabled value="">Selectionner une commande</option>
              <option
                v-for="commande in commandes"
                :key="commande.id"
                :value="String(commande.id)"
              >
                #{{ commande.id }} · {{ commande.article }} · {{ commande.pharmacie }} · {{ commande.statut_label || commande.statut }}
              </option>
            </select>
            <small v-if="payableCommandes.length" class="text-muted">
              Commandes en attente: {{ payableCommandes.length }} (statuts paiement).
            </small>
          </div>
          <div class="col-md-6">
            <label class="form-label">Operateur</label>
            <select v-model="form.methode" class="form-select">
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN MoMo</option>
            </select>
          </div>
          <div class="col-md-6 d-flex align-items-end">
            <button class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" :disabled="loading">
              <i class="bi bi-file-earmark-text" aria-hidden="true"></i>
              <span>{{ loading ? "Chargement..." : "1) Generer instructions" }}</span>
            </button>
          </div>
        </div>
      </form>

      <div v-if="selectedCommande" class="card mt-3">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div class="fw-semibold">Commande #{{ selectedCommande.id }}</div>
              <small class="text-muted">{{ selectedCommande.article }} · {{ selectedCommande.pharmacie }}</small>
            </div>
            <span class="badge bg-light text-dark border">
              {{ selectedCommande.statut_label || selectedCommande.statut }}
            </span>
          </div>
          <div class="small text-muted mt-2">
            Total: {{ selectedCommande.montant_total }} FCFA · Mode: {{ selectedCommande.mode }}
          </div>
        </div>
      </div>

      <div v-if="instructions" class="card mt-3">
        <div class="card-body">
          <h2 class="h6">{{ instructions.titre }}</h2>
          <div class="small mb-2">
            <div><strong>Beneficiaire:</strong> {{ instructions.beneficiaire }}</div>
            <div><strong>Numero:</strong> {{ instructions.numero }}</div>
            <div><strong>Montant:</strong> {{ instructions.montant }} FCFA</div>
            <div><strong>USSD:</strong> <code>{{ instructions.ussd_code || "-" }}</code></div>
          </div>
          <div class="alert alert-warning py-2 small mb-2">
            {{ instructions.single_payment_rule || "Un seul paiement actif par commande." }}
          </div>
          <ol class="small mb-2 ps-3">
            <li v-for="step in instructions.etapes || []" :key="step">{{ step }}</li>
          </ol>

          <div class="row g-2 mb-2">
            <div class="col-md-6">
              <label class="form-label">Numero expediteur</label>
              <input v-model="form.numero_expediteur" class="form-control" placeholder="Ex: 677001122" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Reference client (optionnel)</label>
              <input v-model="form.reference_client" class="form-control" />
            </div>
          </div>

          <div class="d-grid gap-2">
            <button type="button" class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2" @click="ouvrirClavierTelephonique">
              <i class="bi bi-telephone" aria-hidden="true"></i>
              <span>Ouvrir clavier telephonique (USSD)</span>
            </button>
            <button
              type="button"
              class="btn btn-success d-flex align-items-center justify-content-center gap-2"
              :disabled="!paiementId || loading || paiementSoumis"
              @click="soumettrePaiement"
            >
              <i class="bi bi-check2-circle" aria-hidden="true"></i>
              <span>{{ loading ? "Envoi..." : "2) J'ai effectue le paiement" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import coreApi from "@/api/core";

const route = useRoute();
const router = useRouter();

const commandes = ref([]);

const form = ref({
  commande_id: "",
  methode: "orange",
  numero_expediteur: "",
  reference_client: ""
});

const loading = ref(false);
const message = ref("");
const isError = ref(false);
const instructions = ref(null);
const paiementId = ref(null);
const paiementSoumis = ref(false);

const payableCommandes = computed(() =>
  commandes.value.filter((commande) =>
    ["attente_paiement", "paiement_soumis"].includes(commande.statut)
  )
);

const selectedCommande = computed(() =>
  commandes.value.find((commande) => String(commande.id) === String(form.value.commande_id))
);

const initialiserPaiement = async () => {
  if (loading.value) return;

  loading.value = true;
  isError.value = false;
  message.value = "";
  paiementSoumis.value = false;

  try {
    const init = await coreApi.initierPaiement({
      commande_id: form.value.commande_id,
      methode: form.value.methode
    });
    const paiement = init.data?.paiement;
    instructions.value = init.data?.instructions || null;

    if (!paiement) {
      throw new Error("Paiement introuvable");
    }
    paiementId.value = paiement.id;

    if (paiement.statut === "soumis") {
      paiementSoumis.value = true;
      message.value = "Paiement deja soumis. En attente de validation pharmacie/admin.";
      return;
    }

    if (paiement.statut === "confirme") {
      paiementSoumis.value = true;
      message.value = "Paiement deja confirme.";
      return;
    }

    message.value = "Instructions generees. Faites le depot puis confirmez ci-dessous.";
  } catch (error) {
    isError.value = true;
    message.value = error.response?.data?.erreur || "Echec de l'initialisation paiement.";
  } finally {
    loading.value = false;
  }
};

const ouvrirClavierTelephonique = () => {
  const href = instructions.value?.tel_ussd || "";
  if (!href) return;
  window.location.href = href;
};

const soumettrePaiement = async () => {
  if (!paiementId.value || loading.value || paiementSoumis.value) return;

  loading.value = true;
  isError.value = false;
  message.value = "";

  try {
    await coreApi.soumettrePaiement(paiementId.value, {
      methode: form.value.methode,
      numero_expediteur: form.value.numero_expediteur,
      reference_client: form.value.reference_client
    });
    paiementSoumis.value = true;
    message.value = "Paiement soumis. Redirection vers le suivi de commande...";
    setTimeout(() => {
      router.push(`/client/commandes/${form.value.commande_id}`);
    }, 900);
  } catch (error) {
    isError.value = true;
    message.value = error.response?.data?.erreur || "Impossible de soumettre ce paiement.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const commandeId = typeof route.query.commande_id === "string" ? route.query.commande_id : "";
  try {
    const { data } = await coreApi.getClientCommandes();
    commandes.value = data.commandes || [];
  } catch {}

  if (commandeId) {
    form.value.commande_id = commandeId;
    await initialiserPaiement();
    return;
  }

  if (payableCommandes.value.length) {
    form.value.commande_id = String(payableCommandes.value[0].id);
  }
});
</script>
