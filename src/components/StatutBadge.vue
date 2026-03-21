<template>
  <span class="status-badge" :class="current.cls">
    <span class="status-dot" aria-hidden="true"></span>
    {{ current.label }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: { type: String, default: "inconnu" }
});

// Palette raffinée — jamais de rouge pour les états négatifs
// Rouge = urgence critique (sang, danger) → pas adapté à "indisponible" ou "annulé"
const statusMap = {
  // Disponibilité médicament
  disponible:          { cls: "s-green",  label: "Disponible" },
  indisponible:        { cls: "s-slate",  label: "Indisponible" },
  // Pharmacie
  ouvert:              { cls: "s-green",  label: "Ouvert" },
  ferme:               { cls: "s-slate",  label: "Fermé" },
  garde:               { cls: "s-blue",   label: "De garde" },
  rupture:             { cls: "s-amber",  label: "Rupture" },
  livraison:           { cls: "s-blue",   label: "Livraison (bientôt)" },
  // Commande
  en_attente:          { cls: "s-slate",  label: "En attente" },
  attente_paiement:    { cls: "s-amber",  label: "Attente paiement" },
  paiement_soumis:     { cls: "s-teal",   label: "Paiement soumis" },
  confirme:            { cls: "s-green",  label: "Confirmé" },
  pret:                { cls: "s-teal",   label: "Prêt" },
  en_livraison:        { cls: "s-blue",   label: "En livraison (bientôt)" },
  livre:               { cls: "s-green",  label: "Livré" },
  recupere:            { cls: "s-green",  label: "Récupéré" },
  annule:              { cls: "s-slate",  label: "Annulé" },
  // Générique
  pending:             { cls: "s-slate",  label: "En attente" },
  soumis:              { cls: "s-teal",   label: "Soumis" },
  rejete:              { cls: "s-muted",  label: "Rejeté" },
  inconnu:             { cls: "s-muted",  label: "Inconnu" }
};

const current = computed(() => statusMap[props.status] || statusMap.inconnu);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  line-height: 1.5;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Vert : actif, disponible, confirmé ─────────────────────────────────────── */
.s-green {
  background: #e6f5ee;
  color: #0a6644;
}
.s-green .status-dot { background: #0a7c5c; }

/* ── Bleu : livraison, garde, soumis ────────────────────────────────────────── */
.s-blue {
  background: #e8f0fd;
  color: #1a4fa0;
}
.s-blue .status-dot { background: #2563eb; }

/* ── Teal : pret, paiement soumis ───────────────────────────────────────────── */
.s-teal {
  background: #e0f6f2;
  color: #0e6e60;
}
.s-teal .status-dot { background: #0d9488; }

/* ── Amber : rupture, attente paiement ──────────────────────────────────────── */
.s-amber {
  background: #fef4e0;
  color: #92610a;
}
.s-amber .status-dot { background: #d97706; }

/* ── Slate : fermé, indisponible, annulé — JAMAIS rouge ────────────────────── */
.s-slate {
  background: #f0f2f1;
  color: #4a5e56;
}
.s-slate .status-dot { background: #7a8f86; }

/* ── Muted : inconnu, rejeté ────────────────────────────────────────────────── */
.s-muted {
  background: #f4f4f4;
  color: #6b7280;
}
.s-muted .status-dot { background: #9ca3af; }
</style>
