import api from "./index";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default {
  getPharmacies(params = {}) {
    return api.get("/pharmacies/", { params });
  },
  searchPharmacies(query, params = {}) {
    return api.get("/rechercher/", { params: { q: query, ...params } });
  },
  getItineraire(params = {}) {
    return api.get("/itineraire/", { params });
  },
  reverseGeocode(params = {}) {
    return api.get("/geocoder/reverse/", { params });
  },
  getSuggestions(query, useAI = false) {
    return api.get("/suggestions/", { params: { q: query, ai: useAI } });
  },
  getArticles(params = {}) {
    return api.get("/articles/", { params });
  },
  createCommande(payload) {
    return api.post("/commandes/creer/", payload);
  },
  getClientCommandes() {
    return api.get("/commandes/");
  },
  getClientCommandeDetail(id) {
    return api.get(`/commandes/${id}/`);
  },
  initierPaiement(payload) {
    return api.post("/paiements/initier/", payload);
  },
  soumettrePaiement(paiementId, payload) {
    return api.post(`/paiements/${paiementId}/soumettre/`, payload);
  },
  confirmPaiement(paiementId, payload = {}) {
    return api.post(`/paiements/${paiementId}/confirmer/`, payload);
  },
  rejectPaiement(paiementId, payload = {}) {
    return api.post(`/paiements/${paiementId}/rejeter/`, payload);
  },
  getClientPaiements() {
    return api.get("/paiements/");
  },
  getClientProfile() {
    return api.get("/users/profil/");
  },
  async getPharmacieDashboard() {
    const [commandesRes, stocksRes] = await Promise.all([
      api.get("/pharmacie/commandes/"),
      api.get("/stocks/")
    ]);

    const commandes = commandesRes.data?.commandes || [];
    const stocks = stocksRes.data?.stocks || [];
    const revenus = commandes
      .filter((c) => ["confirme", "pret", "en_livraison", "livre", "recupere"].includes(c.statut))
      .reduce((sum, c) => sum + toNumber(c.montant_total), 0);

    return {
      data: {
        commandes: commandes.length,
        revenus,
        stock_critique: stocks.filter((s) => s.stock_bas).length
      }
    };
  },
  getPharmacieStocks() {
    return api.get("/stocks/");
  },
  getPharmacieStockStats() {
    return api.get("/stocks/stats/");
  },
  createPharmacieStock(payload) {
    return api.post("/stocks/ajouter/", payload);
  },
  updatePharmacieStock(id, payload) {
    return api.put(`/stocks/${id}/modifier/`, payload);
  },
  deletePharmacieStock(id) {
    return api.delete(`/stocks/${id}/supprimer/`);
  },
  getPharmacieCommandes(params = {}) {
    return api.get("/pharmacie/commandes/", { params });
  },
  changePharmacieCommandeStatut(id, payload) {
    return api.post(`/pharmacie/commandes/${id}/statut/`, payload);
  },
  getMaPharmacie() {
    return api.get("/pharmacie/moi/");
  },
  createMaPharmacie(payload) {
    return api.post("/pharmacie/creer/", payload);
  },
  updateMaPharmacie(payload) {
    return api.put("/pharmacie/modifier/", payload);
  },
  importPharmacieSql(file) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/pharmacie/import-sql/", formData, { params: { ai: true } });
  },
  getPharmaciePaiements(params = {}) {
    return api.get("/pharmacie/paiements/", { params });
  },
  async getAdminDashboard() {
    return api.get("/admin/dashboard-stats/");
  },
  getAdminPharmacies() {
    return api.get("/admin/pharmacies/");
  },
  validateAdminPharmacie(id) {
    return api.post(`/admin/pharmacies/${id}/valider/`);
  },
  updateAdminPharmacieStatus(id, payload) {
    return api.post(`/admin/pharmacies/${id}/statut/`, payload);
  },
  getAdminPaiements(params = {}) {
    return api.get("/admin/paiements/", { params });
  },
  getSupportTickets() {
    return api.get("/support/tickets/");
  },
  createSupportTicket(payload) {
    return api.post("/support/tickets/", payload);
  },
  createChatSession(payload) {
    return api.post("/chat/sessions/", payload);
  },
  getChatInbox() {
    return api.get("/chat/sessions/inbox/");
  },
  getChatMessages(sessionId) {
    return api.get(`/chat/sessions/${sessionId}/messages/`);
  },
  sendChatMessage(sessionId, payload) {
    return api.post(`/chat/sessions/${sessionId}/messages/`, payload);
  },
  getAdminArticles() {
    return api.get("/articles/");
  },
  createAdminArticle(payload) {
    return api.post("/articles/creer/", payload);
  },
  updateAdminArticle(id, payload) {
    return api.put(`/articles/${id}/modifier/`, payload);
  },
  deleteAdminArticle(id) {
    return api.delete(`/articles/${id}/supprimer/`);
  }
};
