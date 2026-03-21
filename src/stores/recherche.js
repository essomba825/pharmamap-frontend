import { defineStore } from "pinia";
import coreApi from "@/api/core";

const USE_AI_SUGGESTIONS = import.meta.env.VITE_USE_AI_SUGGESTIONS === "true";

export const useRechercheStore = defineStore("recherche", {
  state: () => ({
    query: "",
    results: [],
    articleResults: [],
    suggestions: [],
    loading: false,
    error: "",
    selectedPharmacy: null
  }),
  actions: {
    async search(query, params = {}) {
      this.query = query;
      this.loading = true;
      this.error = "";
      try {
        const { data } = await coreApi.searchPharmacies(query, params);
        this.articleResults = data.results || [];
        this.suggestions = data.suggestions || [];

        const flattened = [];
        this.articleResults.forEach((entry) => {
          const article = entry.article || {};
          (entry.pharmacies_avec || []).forEach((p) => {
            flattened.push({
              ...p,
              article_id: article.id,
              article_nom: article.nom,
              statut: p.statut || "disponible"
            });
          });
          (entry.pharmacies_sans || []).forEach((p) => {
            flattened.push({
              ...p,
              article_id: article.id,
              article_nom: article.nom,
              statut: p.statut || "indisponible"
            });
          });
        });
        this.results = flattened;
      } catch (error) {
        this.error = error.response?.data?.erreur || "Recherche impossible";
      } finally {
        this.loading = false;
      }
    },
    async loadAllPharmacies() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await coreApi.getPharmacies();
        this.results = (data.pharmacies || []).map((p) => ({
          ...p,
          statut: p.livraison ? "bientot" : "inconnu"
        }));
        this.articleResults = [];
      } catch (error) {
        this.error = error.response?.data?.erreur || "Impossible de charger les pharmacies";
      } finally {
        this.loading = false;
      }
    },
    async fetchSuggestions(query) {
      if (!query || query.length < 2) {
        this.suggestions = [];
        return;
      }
      try {
        const { data } = await coreApi.getSuggestions(query, USE_AI_SUGGESTIONS);
        this.suggestions = data.suggestions || [];
      } catch {
        this.suggestions = [];
      }
    },
    setSelectedPharmacy(pharmacy) {
      this.selectedPharmacy = pharmacy;
    },
    clearSearch() {
      this.query = "";
      this.results = [];
      this.articleResults = [];
      this.suggestions = [];
      this.error = "";
    }
  }
});
