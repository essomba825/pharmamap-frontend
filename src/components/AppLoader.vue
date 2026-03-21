<template>
  <Transition name="fade-slow">
    <div v-if="visible" class="app-loader">
      <div class="loader-background">
        <div class="bg-circle c1"></div>
        <div class="bg-circle c2"></div>
        <div class="bg-circle c3"></div>
      </div>

      <div class="loader-content">
        <!-- Logo animé -->
        <div class="logo-container">
          <div class="logo-pulse"></div>
          <svg width="80" height="80" viewBox="0 0 64 64" class="logo-svg">
            <rect width="64" height="64" rx="16" fill="#0D3B2E" />
            <path
              d="M32 9 C23 9 16 16 16 24 C16 36 32 52 32 52 C32 52 48 36 48 24 C48 16 41 9 32 9Z"
              fill="none"
              stroke="#02C39A"
              stroke-width="2.5"
            />
            <g transform="translate(32,23) rotate(-35)">
              <rect x="-9" y="-4" width="9" height="8" rx="4" fill="#02C39A" />
              <rect x="0" y="-4" width="9" height="8" rx="4" fill="white" opacity="0.9" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#0D3B2E" stroke-width="1.5" />
            </g>
          </svg>
        </div>

        <h1 class="loader-title">
          Pharma<span class="text-accent">Map</span>
        </h1>

        <!-- Barre de progression -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ progress }}%</span>
        </div>

        <!-- Messages rotatifs -->
        <div class="message-container">
          <Transition name="slide-fade" mode="out-in">
            <p :key="currentMessageIndex" class="info-message">
              <i class="fa-solid fa-circle-info me-2"></i>
              {{ currentMessage }}
            </p>
          </Transition>
        </div>

        <!-- Indicateur étapes -->
        <div class="steps-indicator">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="step-dot"
            :class="{ active: currentStep >= index, completed: currentStep > index }"
          ></div>
        </div>
      </div>

      <div class="loader-footer">
        <small class="version-text">Version 1.0 · PharmaMap</small>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 3000 // 3 secondes minimum
  }
})

const progress = ref(0)
const currentStep = ref(0)
const currentMessageIndex = ref(0)

const messages = [
  "Localisation des pharmacies près de chez vous...",
  "Vérification des stocks en temps réel...",
  "Mise à jour des tarifs...",
  "Préparation de la carte interactive...",
  "Plus de 500 pharmacies partenaires au Cameroun",
  "Trouvez vos médicaments en moins de 2 minutes",
  "Service de géolocalisation précis activé",
  "Commandez et retirez en pharmacie sous 30 min"
]

const steps = [
  "Connexion",
  "Géolocalisation", 
  "Chargement données",
  "Prêt"
]

const currentMessage = computed(() => messages[currentMessageIndex.value])

let progressInterval
let messageInterval
let stepInterval

onMounted(() => {
  // Animation progression
  const increment = 100 / (props.duration / 50)
  progressInterval = setInterval(() => {
    if (progress.value < 100) {
      progress.value = Math.min(progress.value + increment, 100)
    }
  }, 50)

  // Changement messages toutes les 2.5s
  messageInterval = setInterval(() => {
    currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length
  }, 2500)

  // Étapes
  stepInterval = setInterval(() => {
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    }
  }, props.duration / steps.length)
})

onUnmounted(() => {
  clearInterval(progressInterval)
  clearInterval(messageInterval)
  clearInterval(stepInterval)
})
</script>

<style scoped>
.app-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #fafcfb 0%, #f0f7f4 50%, #e8f4f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Background animé */
.loader-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(2, 195, 154, 0.05);
  animation: float 20s infinite ease-in-out;
}

.bg-circle.c1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.bg-circle.c2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  background: rgba(13, 59, 46, 0.03);
  animation-delay: -5s;
}

.bg-circle.c3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(2, 195, 154, 0.08);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Contenu */
.loader-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

.logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.logo-pulse {
  position: absolute;
  inset: -20px;
  background: rgba(2, 195, 154, 0.2);
  border-radius: 50%;
  animation: logoPulse 2s infinite;
}

.logo-svg {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 10px 30px rgba(13, 59, 46, 0.2));
  animation: gentleBounce 2s infinite ease-in-out;
}

@keyframes logoPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0; }
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.loader-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0d3b2e;
  margin: 0 0 32px 0;
  letter-spacing: -0.02em;
}

.text-accent {
  color: #02c39a;
  position: relative;
}

/* Barre progression */
.progress-container {
  margin-bottom: 24px;
  position: relative;
}

.progress-bar {
  width: 280px;
  height: 6px;
  background: rgba(223, 231, 227, 0.6);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #02c39a 0%, #0d3b2e 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  position: absolute;
  right: 0;
  top: -24px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0a7c5c;
}

/* Messages */
.message-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.info-message {
  color: #6b8a7d;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
  max-width: 320px;
}

.info-message i {
  color: #02c39a;
}

/* Étapes */
.steps-indicator {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(223, 231, 227, 0.8);
  transition: all 0.3s ease;
  position: relative;
}

.step-dot.active {
  background: #02c39a;
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(2, 195, 154, 0.2);
}

.step-dot.completed {
  background: #0d3b2e;
}

/* Footer */
.loader-footer {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
}

.version-text {
  color: #9ab5a8;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Transitions */
.fade-slow-enter-active,
.fade-slow-leave-active {
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.fade-slow-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Mobile */
@media (max-width: 480px) {
  .loader-content {
    padding: 24px;
  }
  
  .loader-title {
    font-size: 1.6rem;
  }
  
  .progress-bar {
    width: 240px;
  }
  
  .bg-circle.c1 {
    width: 250px;
    height: 250px;
  }
  
  .bg-circle.c2 {
    width: 180px;
    height: 180px;
  }
}
</style>