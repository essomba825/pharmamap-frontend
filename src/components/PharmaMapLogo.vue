<template>
  <div class="brand-container" role="banner">
    <div class="logo-wrapper">
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 64 64" 
        xmlns="http://www.w3.org/2000/svg"
        class="brand-logo"
        aria-hidden="true"
      >
        <defs>
          <!-- Gradient doux pour le fond -->
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0D3B2E;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#145A45;stop-opacity:1" />
          </linearGradient>
          
          <!-- Glow subtil pour l'accent -->
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Fond avec coins plus arrondis et gradient -->
        <rect 
          width="64" 
          height="64" 
          rx="18" 
          fill="url(#bgGradient)" 
          class="logo-bg"
        />
        
        <!-- Icône de localisation pharmacie -->
        <path
          d="M32 12 C24.5 12 19 17.5 19 24 C19 34 32 47 32 47 C32 47 45 34 45 24 C45 17.5 39.5 12 32 12Z"
          fill="none"
          stroke="#02C39A"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="location-pin"
          filter="url(#softGlow)"
        />
        
        <!-- Point central -->
        <circle 
          cx="32" 
          cy="24" 
          r="4" 
          fill="#02C39A" 
          class="pin-center"
          filter="url(#softGlow)"
        />
        
        <!-- Croix médicale stylisée -->
        <g transform="translate(32,22) rotate(-35) scale(0.9)">
          <rect 
            x="-8" 
            y="-3.5" 
            width="8" 
            height="7" 
            rx="3.5" 
            fill="#02C39A"
            class="cross-left"
          />
          <rect 
            x="0" 
            y="-3.5" 
            width="8" 
            height="7" 
            rx="3.5" 
            fill="#FFFFFF" 
            fill-opacity="0.95"
            class="cross-right"
          />
          <line 
            x1="0" 
            y1="-4" 
            x2="0" 
            y2="4" 
            stroke="#0D3B2E" 
            stroke-width="1.5" 
            stroke-linecap="round"
          />
        </g>
      </svg>
      
      <!-- Indicateur de statut optionnel (online/offline) -->
      <span v-if="showStatus" class="status-indicator" :class="{ 'is-online': isOnline }"></span>
    </div>
    
    <div class="brand-text">
      <span class="brand-name">
        Pharma<span class="brand-accent">Map</span>
      </span>
      <span v-if="showTagline" class="brand-tagline">Trouvez votre pharmacie</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showTagline: {
    type: Boolean,
    default: false
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.brand-container {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 6px;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.brand-container:hover {
  background: rgba(2, 195, 154, 0.04);
  transform: translateY(-1px);
}

.brand-container:active {
  transform: translateY(0);
}

.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 6px rgba(13, 59, 46, 0.08));
  transition: filter 0.3s ease;
}

.brand-container:hover .logo-wrapper {
  filter: drop-shadow(0 6px 12px rgba(13, 59, 46, 0.12));
}

.brand-logo {
  display: block;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.brand-container:hover .brand-logo {
  transform: scale(1.05) rotate(2deg);
}

/* Animation subtile du pin au hover */
.location-pin {
  transition: all 0.3s ease;
  transform-origin: center;
}

.brand-container:hover .location-pin {
  stroke: #03E5B0;
  filter: url(#softGlow) brightness(1.1);
}

.pin-center {
  transition: all 0.3s ease;
  transform-origin: center;
}

.brand-container:hover .pin-center {
  transform: scale(1.2);
  fill: #03E5B0;
}

/* Texte */
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-name {
  color: #0D3B2E;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.5px;
  transition: color 0.2s ease;
  line-height: 1.2;
}

.brand-container:hover .brand-name {
  color: #0A2E23;
}

.brand-accent {
  color: #02C39A;
  font-weight: 700;
  position: relative;
  transition: color 0.2s ease;
}

.brand-container:hover .brand-accent {
  color: #03E5B0;
}

/* Tagline optionnelle */
.brand-tagline {
  font-size: 0.7rem;
  color: #6B8A7E;
  font-family: system-ui, -apple-system, sans-serif;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin-top: 2px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.brand-container:hover .brand-tagline {
  opacity: 1;
}

/* Indicateur de statut */
.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #E0E0E0;
  border: 2px solid #FFFFFF;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-indicator.is-online {
  background: #02C39A;
  animation: pulse-soft 2s infinite;
}

@keyframes pulse-soft {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(2, 195, 154, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(2, 195, 154, 0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .brand-name {
    font-size: 1.1rem;
  }
  
  .brand-logo {
    width: 36px;
    height: 36px;
  }
  
  .brand-container {
    gap: 10px;
  }
}

/* Mode sombre (optionnel) */
@media (prefers-color-scheme: dark) {
  .brand-name {
    color: #E8F5F1;
  }
  
  .brand-container:hover {
    background: rgba(2, 195, 154, 0.08);
  }
  
  .brand-tagline {
    color: #8FA89E;
  }
}

/* Accessibilité : focus visible */
.brand-container:focus-visible {
  outline: 2px solid #02C39A;
  outline-offset: 4px;
  background: rgba(2, 195, 154, 0.06);
}
</style>