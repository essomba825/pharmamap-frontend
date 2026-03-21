<template>
  <div>
    <NavBar />
    <div class="container py-4">
      <h1 class="h4 mb-3">Detail commande #{{ route.params.id }}</h1>
      <AlerteMessage v-if="errorMessage" :message="errorMessage" type="danger" />

      <div v-if="commande" class="card">
        <div class="card-body">
          <p><strong>Pharmacie:</strong> {{ commande.pharmacie || "-" }}</p>
          <p><strong>Article:</strong> {{ commande.article || "-" }}</p>
          <p><strong>Quantite:</strong> {{ commande.quantite || "-" }}</p>
          <p><strong>Montant:</strong> {{ commande.montant_total || "-" }}</p>
          <p class="mb-0"><strong>Statut:</strong> {{ commande.statut || "-" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import AlerteMessage from "@/components/AlerteMessage.vue";
import coreApi from "@/api/core";

const route = useRoute();
const commande = ref(null);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const { data } = await coreApi.getClientCommandeDetail(route.params.id);
    commande.value = data.commande;
  } catch (error) {
    errorMessage.value = error.response?.data?.erreur || "Impossible de charger cette commande.";
  }
});
</script>
