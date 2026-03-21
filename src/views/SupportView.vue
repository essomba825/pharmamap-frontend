<template>
  <div class="support-app">
    <NavBar />
    
    <div class="support-container">
      <!-- Mobile Header (visible only on small screens) -->
      <div v-if="isMobile && authStore.isAuthenticated" class="mobile-header">
        <button v-if="showChat" @click="showChat = false" class="btn-back">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="mobile-title">{{ mobileTitle }}</span>
        <div class="spacer"></div>
      </div>

      <!-- Sidebar (Conversations & Contacts) -->
      <aside 
        class="sidebar" 
        :class="{ 
          'hidden-mobile': isMobile && showChat,
          'staff-mode': isStaffRole 
        }"
      >
        <div class="sidebar-header">
          <h2>{{ isStaffRole ? 'Boîte de réception' : 'Support' }}</h2>
          <div class="header-actions">
            <button 
              v-if="isPharmacieRole" 
              @click="startDirectSession('admin')"
              class="btn-icon primary"
              title="Contacter l'admin"
            >
              <i class="bi bi-plus-lg"></i>
            </button>
            <button @click="refreshData" class="btn-icon" :class="{ 'spinning': inboxLoading }">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="sidebar-search">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input 
              v-if="isStaffRole"
              v-model="sessionSearch" 
              type="text" 
              placeholder="Rechercher une conversation..."
            />
            <input 
              v-else
              v-model="pharmacieSearch" 
              type="text" 
              placeholder="Rechercher une pharmacie..."
            />
          </div>
        </div>

        <!-- Staff: Inbox List -->
        <div v-if="isStaffRole" class="conversations-list">
          <div v-if="filteredSessions.length === 0" class="empty-state-small">
            <i class="bi bi-inbox"></i>
            <p>Aucune conversation</p>
          </div>
          
          <div 
            v-for="session in filteredSessions" 
            :key="getSessionId(session) || session.id"
            @click="openSession(session)"
            class="conversation-item"
            :class="{ 
              active: chatSessionId === getSessionId(session),
              unread: session.unread_count > 0,
              'is-owner': session.is_owner 
            }"
          >
            <div class="avatar" :class="session.user?.role">
              {{ getInitials(session.user?.username) }}
            </div>
            <div class="conversation-content">
              <div class="conversation-top">
                <span class="name">{{ getSessionName(session) }}</span>
                <span class="time">{{ formatTime(session.updated_at) }}</span>
              </div>
              <div class="conversation-bottom">
                <span class="preview">{{ session.last_message || 'Nouvelle conversation' }}</span>
                <span v-if="session.unread_count" class="badge">{{ session.unread_count }}</span>
              </div>
              <div class="meta">
                <span class="role-badge" :class="session.user?.role">
                  {{ session.user?.role || 'client' }}
                </span>
                <span v-if="session.pharmacie?.nom" class="pharmacy-tag">
                  {{ truncate(session.pharmacie.nom, 20) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Client: Contacts & Ticket -->
        <div v-else class="client-sidebar">
          <!-- Admin Contact -->
          <div class="contact-section">
            <h3>Assistance générale</h3>
            <button 
              @click="selectAdminContact"
              class="contact-card"
              :class="{ active: contactType === 'admin' && !selectedPharmacieId }"
              type="button"
            >
              <div class="avatar admin">A</div>
              <div class="contact-info">
                <div class="name">Admin PharmaMap</div>
                <div class="status">
                  <span class="dot online"></span>
                  Support technique
                </div>
              </div>
            </button>
          </div>

          <!-- Pharmacies -->
          <div class="contact-section">
            <div class="section-header">
              <h3>Pharmacies</h3>
              <span class="count">{{ filteredPharmacies.length }}</span>
            </div>
            
            <div v-if="filteredPharmacies.length === 0" class="empty-state-small">
              <p>Aucune pharmacie trouvée</p>
            </div>

            <div class="pharmacies-grid">
              <button
                v-for="ph in filteredPharmacies.slice(0, 10)"
                :key="ph.id"
                @click="startSessionWithPharmacie(ph)"
                class="contact-card pharmacy"
                :class="{ active: selectedPharmacieId === ph.id }"
                type="button"
              >
                <div class="avatar pharmacy">{{ getInitials(ph.nom) }}</div>
                <div class="contact-info">
                  <div class="name">{{ truncate(ph.nom, 25) }}</div>
                  <div class="address">{{ truncate(ph.adresse, 30) }}</div>
                </div>
              </button>
            </div>
            
            <button 
              v-if="filteredPharmacies.length > 10" 
              @click="showAllPharmacies = true"
              class="btn-text full-width"
            >
              Voir toutes les pharmacies ({{ filteredPharmacies.length }})
            </button>
          </div>

          <!-- Ticket Form -->
          <div class="ticket-section">
            <h3>Signaler un problème</h3>
            <form @submit.prevent="submitTicket" class="ticket-form">
              <div class="form-group">
                <input 
                  v-model="ticketForm.sujet" 
                  type="text" 
                  placeholder="Sujet"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <textarea 
                  v-model="ticketForm.message" 
                  rows="3" 
                  placeholder="Décrivez votre problème..."
                  required
                  class="form-input"
                ></textarea>
              </div>
              <button 
                type="submit" 
                class="btn-submit"
                :disabled="submittingTicket"
              >
                <span v-if="submittingTicket" class="spinner-sm"></span>
                <i v-else class="bi bi-send"></i>
                {{ submittingTicket ? 'Envoi...' : 'Envoyer un ticket' }}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main 
        class="chat-area"
        :class="{ 
          'hidden-mobile': isMobile && !showChat,
          'empty': !chatSessionId 
        }"
      >
        <!-- Chat Header -->
        <header v-if="chatSessionId" class="chat-header">
          <div class="chat-header-info">
            <div class="avatar" :class="chatHeaderClass">
              {{ chatHeaderInitial }}
            </div>
            <div class="header-text">
              <h3>{{ chatHeader }}</h3>
              <span class="status">
                <span class="dot online"></span>
                {{ chatHeaderSubtitle }}
              </span>
            </div>
          </div>
          
          <div class="chat-header-actions">
            <button 
              v-if="isStaffRole && currentSession?.pharmacie"
              @click="viewPharmacyDetails"
              class="btn-icon"
              title="Voir la pharmacie"
            >
              <i class="bi bi-shop"></i>
            </button>
            <button @click="toggleChatInfo" class="btn-icon">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </header>

        <!-- Empty State (CORRECTION ICI) -->
        <div v-else class="chat-header empty">
          <div class="empty-chat">
            <div class="empty-icon">
              <i class="bi bi-chat-dots"></i>
            </div>
            <h3>{{ isStaffRole ? 'Sélectionnez une conversation' : 'Commencez une conversation' }}</h3>
            <p>{{ isStaffRole ? 'Choisissez une discussion dans la liste' : 'Sélectionnez un contact pour discuter' }}</p>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="chatSessionId" ref="chatBoxRef" class="messages-container">
          <div v-if="chatMessages.length === 0" class="empty-messages">
            <div class="welcome-bubble">
              <i class="bi bi-hand-waving"></i>
              <p>Envoyez un message pour commencer la conversation...</p>
            </div>
          </div>

          <div v-else class="messages-list">
            <div 
              v-for="(msg, index) in chatMessages" 
              :key="msg.id"
              :class="['message-group', messageClass(msg)]"
            >
              <!-- Date separator -->
              <div 
                v-if="isNewDay(index)" 
                class="date-separator"
              >
                <span>{{ formatDate(msg.created_at) }}</span>
              </div>

              <div class="message-bubble">
                <div class="message-content">
                  {{ msg.message }}
                </div>
                <div class="message-meta">
                  <span class="time">{{ formatTime(msg.created_at) }}</span>
                  <span v-if="isMine(msg)" class="status">
                    <i class="bi bi-check2-all"></i>
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="sendingMessage" class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <footer v-if="chatSessionId" class="chat-input-area">
          <form @submit.prevent="sendMessage" class="input-form">
            <button type="button" class="btn-attach">
              <i class="bi bi-paperclip"></i>
            </button>
            
            <div class="input-wrapper">
              <textarea
                v-model="chatInput"
                ref="messageInput"
                rows="1"
                placeholder="Écrivez votre message..."
                @keydown.enter.prevent="handleEnter"
                @input="autoResize"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              class="btn-send"
              :disabled="!chatInput.trim() || sendingMessage"
            >
              <i v-if="!sendingMessage" class="bi bi-send-fill"></i>
              <span v-else class="spinner-sm"></span>
            </button>
          </form>
          <div class="input-hint">
            <span>Entrée pour envoyer • Maj+Entrée pour nouvelle ligne</span>
          </div>
        </footer>
      </main>

      <!-- Info Panel (Right side) -->
      <aside v-if="showInfoPanel && chatSessionId" class="info-panel">
        <div class="panel-header">
          <h3>Informations</h3>
          <button @click="showInfoPanel = false" class="btn-close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="panel-content">
          <div class="info-section">
            <h4>Conversation</h4>
            <div class="info-item">
              <span class="label">ID</span>
              <span class="value">#{{ chatSessionId?.slice(-8) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Démarrée</span>
              <span class="value">{{ formatDateFull(currentSession?.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type</span>
              <span class="value">{{ currentSession?.is_owner ? 'Sortante' : 'Entrante' }}</span>
            </div>
          </div>
          
          <div v-if="currentSession?.pharmacie" class="info-section">
            <h4>Pharmacie</h4>
            <div class="pharmacy-card">
              <div class="name">{{ currentSession.pharmacie.nom }}</div>
              <div class="address">{{ currentSession.pharmacie.adresse }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <Transition name="fade">
      <div v-if="showAllPharmacies" class="modal-overlay" @click.self="showAllPharmacies = false">
        <div class="modal-content pharmacies-modal">
          <div class="modal-header">
            <h3>Sélectionner une pharmacie</h3>
            <button @click="showAllPharmacies = false" class="btn-close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="search-box large">
              <i class="bi bi-search"></i>
              <input 
                v-model="pharmacieSearch" 
                type="text" 
                placeholder="Rechercher par nom ou ville..."
                autofocus
              />
            </div>
            <div class="pharmacies-list">
              <button
                v-for="ph in filteredPharmacies"
                :key="ph.id"
                @click="startSessionWithPharmacie(ph); showAllPharmacies = false"
                class="pharmacy-item"
                type="button"
              >
                <div class="avatar pharmacy">{{ getInitials(ph.nom) }}</div>
                <div class="info">
                  <div class="name">{{ ph.nom }}</div>
                  <div class="address">{{ ph.adresse }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="toast"
          :class="toast.type"
        >
          <i :class="toast.icon"></i>
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- Auth Prompt -->
    <div v-if="!authStore.isAuthenticated" class="auth-prompt">
      <div class="prompt-card">
        <i class="bi bi-shield-lock"></i>
        <h2>Connexion requise</h2>
        <p>Connectez-vous pour accéder au support et discuter avec nos équipes.</p>
        <router-link to="/auth/login" class="btn-primary">
          Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import NavBar from "@/components/NavBar.vue";
import coreApi from "@/api/core";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

// State
const errorMessage = ref("");
const successMessage = ref("");
const tickets = ref([]);
const submittingTicket = ref(false);
const ticketForm = ref({ sujet: "", message: "" });
const contactType = ref("admin");
const chatSessionId = ref(null);
const chatMessages = ref([]);
const chatInput = ref("");
const sendingMessage = ref(false);
const inboxSessions = ref([]);
const inboxLoading = ref(false);
const pharmacies = ref([]);
const pharmacieSearch = ref("");
const sessionSearch = ref("");
const selectedPharmacieId = ref(null);
const showChat = ref(false);
const showInfoPanel = ref(false);
const showAllPharmacies = ref(false);
const isMobile = ref(window.innerWidth < 992);
const chatBoxRef = ref(null);
const messageInput = ref(null);
const currentSession = ref(null);
const toasts = ref([]);

let pollTimer;

// Computed
const isStaffRole = computed(() => ["admin", "pharmacie"].includes(authStore.role));
const isPharmacieRole = computed(() => authStore.role === "pharmacie");
const myUserId = computed(() => authStore.user?.id);
const myRole = computed(() => authStore.role || "client");

const mobileTitle = computed(() => {
  if (showChat.value && chatSessionId.value) return chatHeader.value;
  return isStaffRole.value ? 'Conversations' : 'Support';
});

const filteredSessions = computed(() => {
  if (!sessionSearch.value) return inboxSessions.value;
  const term = sessionSearch.value.toLowerCase();
  return inboxSessions.value.filter(s => 
    s.user?.username?.toLowerCase().includes(term) ||
    s.pharmacie?.nom?.toLowerCase().includes(term)
  );
});

const filteredPharmacies = computed(() => {
  const term = pharmacieSearch.value.trim().toLowerCase();
  if (!term) return pharmacies.value;
  return pharmacies.value.filter(ph => 
    (ph.nom || "").toLowerCase().includes(term) ||
    (ph.ville || "").toLowerCase().includes(term) ||
    (ph.adresse || "").toLowerCase().includes(term)
  );
});

const chatHeader = computed(() => {
  if (isStaffRole.value) {
    const session = currentSession.value;
    if (!session) return 'Conversation';
    if (session.is_owner) return `→ ${session.target_role}`;
    return session.user?.username || 'Utilisateur';
  }
  if (selectedPharmacieId.value) {
    const ph = pharmacies.value.find(p => p.id === selectedPharmacieId.value);
    return ph?.nom || 'Pharmacie';
  }
  return 'Admin PharmaMap';
});

const chatHeaderInitial = computed(() => {
  const name = chatHeader.value;
  return name ? name.charAt(0).toUpperCase() : 'C';
});

const chatHeaderClass = computed(() => {
  if (isStaffRole.value) return currentSession.value?.user?.role || 'client';
  if (selectedPharmacieId.value) return 'pharmacie';
  return 'admin';
});

const chatHeaderSubtitle = computed(() => {
  if (!chatSessionId.value) return 'Sélectionnez un contact';
  if (isStaffRole.value) {
    return currentSession.value?.pharmacie?.nom || 'Support direct';
  }
  return 'En ligne';
});

// Methods
const addToast = (message, type = 'success') => {
  const icons = {
    success: 'bi bi-check-circle-fill',
    error: 'bi bi-x-circle-fill',
    info: 'bi bi-info-circle-fill'
  };
  const id = Date.now();
  toasts.value.push({ id, message, type, icon: icons[type] });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

const formatDateFull = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('fr-FR');
};

const isNewDay = (index) => {
  if (index === 0) return true;
  const curr = new Date(chatMessages.value[index].created_at).toDateString();
  const prev = new Date(chatMessages.value[index - 1].created_at).toDateString();
  return curr !== prev;
};

const isMine = (msg) => {
  if (myRole.value === 'admin') return msg.sender === 'admin';
  if (myRole.value === 'pharmacie') return msg.sender === 'pharmacie';
  return msg.sender === 'client';
};

const messageClass = (msg) => {
  const classes = [];
  if (isMine(msg)) classes.push('mine');
  else classes.push(msg.sender); // admin, pharmacie, client, bot
  return classes;
};

const getSessionName = (session) => {
  if (session.is_owner) return `→ ${session.target_role}`;
  return session.user?.username || 'Anonyme';
};

const getSessionId = (session) => session?.id || session?.session_id || session?.pk || null;

const handleEnter = (e) => {
  if (e.shiftKey) {
    // New line handled by default
    return;
  }
  sendMessage();
};

const autoResize = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

const refreshData = async () => {
  if (isStaffRole.value) {
    await loadInbox();
  } else {
    await loadPharmacies();
  }
  addToast('Actualisé', 'success');
};

// API Calls
const loadTickets = async () => {
  try {
    const { data } = await coreApi.getSupportTickets();
    tickets.value = data.tickets || [];
  } catch {}
};

const submitTicket = async () => {
  submittingTicket.value = true;
  try {
    await coreApi.createSupportTicket(ticketForm.value);
    addToast('Ticket envoyé avec succès');
    ticketForm.value = { sujet: "", message: "" };
    await loadTickets();
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur d'envoi", 'error');
  } finally {
    submittingTicket.value = false;
  }
};

const selectAdminContact = async () => {
  contactType.value = "admin";
  selectedPharmacieId.value = null;
  await startSession();
  if (isMobile.value) showChat.value = true;
};

const startSession = async () => {
  if (isStaffRole.value) return;
  try {
    let data;
    if (contactType.value === "pharmacie" && selectedPharmacieId.value) {
      const res = await coreApi.createChatSession({
        target_role: "pharmacie",
        pharmacie_id: selectedPharmacieId.value
      });
      data = res.data;
    } else {
      const res = await coreApi.createChatSession({ target_role: "admin" });
      data = res.data;
    }
    chatSessionId.value = getSessionId(data.session);
    currentSession.value = data.session;
    await loadMessages();
    if (isMobile.value) showChat.value = true;
  } catch (error) {
    addToast(error.response?.data?.erreur || "Impossible de créer la session", 'error');
  }
};

const startSessionWithPharmacie = async (ph) => {
  selectedPharmacieId.value = ph.id;
  contactType.value = "pharmacie";
  await startSession();
};

const openSession = async (session) => {
  chatSessionId.value = getSessionId(session);
  currentSession.value = session;
  if (isMobile.value) showChat.value = true;
  try {
    await loadMessages();
  } catch (error) {
    addToast("Impossible de charger les messages", 'error');
  }
};

const startDirectSession = async (target) => {
  try {
    const { data } = await coreApi.createChatSession({ target_role: target });
    chatSessionId.value = getSessionId(data.session);
    currentSession.value = data.session;
    await loadMessages();
    await loadInbox();
    if (isMobile.value) showChat.value = true;
  } catch (error) {
    addToast(error.response?.data?.erreur || "Erreur", 'error');
  }
};

const loadMessages = async () => {
  if (!chatSessionId.value) return;
  try {
    const { data } = await coreApi.getChatMessages(chatSessionId.value);
    chatMessages.value = data.messages || [];
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load messages', error);
  }
};

const sendMessage = async () => {
  if (!chatSessionId.value || !chatInput.value.trim()) return;
  
  const message = chatInput.value;
  chatInput.value = '';
  if (messageInput.value) messageInput.value.style.height = 'auto';
  
  sendingMessage.value = true;
  
  // Optimistic update
  const tempId = Date.now();
  chatMessages.value.push({
    id: tempId,
    message: message,
    sender: myRole.value,
    created_at: new Date().toISOString(),
    pending: true
  });
  
  scrollToBottom();
  
  try {
    const { data } = await coreApi.sendChatMessage(chatSessionId.value, { message });
    chatMessages.value = data.messages || [];
  } catch (error) {
    addToast("Message non envoyé", 'error');
    // Remove optimistic message
    chatMessages.value = chatMessages.value.filter(m => m.id !== tempId);
  } finally {
    sendingMessage.value = false;
    scrollToBottom();
  }
};

const loadInbox = async () => {
  if (!isStaffRole.value) return;
  inboxLoading.value = true;
  try {
    const { data } = await coreApi.getChatInbox();
    inboxSessions.value = (data.sessions || []).map(s => ({
      ...s,
      is_owner: s.user?.id === myUserId.value
    }));
    if (!isMobile.value && !chatSessionId.value && inboxSessions.value.length > 0) {
      await openSession(inboxSessions.value[0]);
    }
  } catch (error) {
    addToast("Erreur de chargement de la boîte de réception", 'error');
  } finally {
    inboxLoading.value = false;
  }
};

const loadPharmacies = async () => {
  try {
    const { data } = await coreApi.getPharmacies();
    pharmacies.value = data.pharmacies || [];
  } catch {}
};

const viewPharmacyDetails = () => {
  if (currentSession.value?.pharmacie?.id) {
    addToast('Détails pharmacie: ' + currentSession.value.pharmacie.nom, 'info');
  }
};

const toggleChatInfo = () => {
  showInfoPanel.value = !showInfoPanel.value;
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 992;
  if (!isMobile.value) showChat.value = false;
};

// Lifecycle
onMounted(async () => {
  window.addEventListener('resize', handleResize);
  
  if (authStore.isAuthenticated) {
    await loadTickets();
    if (isStaffRole.value) {
      await loadInbox();
    } else {
      await loadPharmacies();
      if (!isMobile.value) {
        await startSession();
      } else {
        showChat.value = false;
      }
    }
    
    // Polling
    pollTimer = setInterval(async () => {
      if (document.hidden) return;
      if (chatSessionId.value) await loadMessages();
      if (isStaffRole.value) await loadInbox();
    }, 10000);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (pollTimer) clearInterval(pollTimer);
});

// Watch
watch(() => chatMessages.value.length, scrollToBottom);
</script>

<style scoped>
.support-app {
  --color-primary: #0a7c5c;
  --color-primary-light: #e9f7f2;
  --color-admin: #6366f1;
  --color-pharmacie: #0a7c5c;
  --color-client: #3b82f6;
  --color-bot: #8b5cf6;
  --color-bg: #f3f4f6;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --radius: 12px;
  --radius-sm: 8px;
  
  height: calc(100vh - 60px);
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.support-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text);
  padding: 4px;
  cursor: pointer;
}

.mobile-title {
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.spacer {
  width: 32px;
}

/* Sidebar */
.sidebar {
  width: 380px;
  background: var(--color-surface);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.btn-icon.primary {
  background: var(--color-primary);
  color: white;
}

.btn-icon.spinning i {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.sidebar-search {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.search-box.large input {
  padding: 14px 16px 14px 44px;
  font-size: 1rem;
}

/* Conversations List */
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}

.conversation-item:hover {
  background: var(--color-bg);
}

.conversation-item.active {
  background: var(--color-primary-light);
}

.conversation-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 40%;
  background: var(--color-primary);
  border-radius: 0 4px 4px 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  font-size: 1rem;
}

.avatar.admin { background: var(--color-admin); }
.avatar.pharmacie { background: var(--color-pharmacie); }
.avatar.client { background: var(--color-client); }

.conversation-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.conversation-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-top .name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9375rem;
}

.conversation-top .time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.conversation-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conversation-bottom .preview {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.conversation-bottom .badge {
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.role-badge {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
  background: #e5e7eb;
  color: var(--color-text-secondary);
}

.role-badge.admin { background: #e0e7ff; color: var(--color-admin); }
.role-badge.pharmacie { background: #d1fae5; color: var(--color-pharmacie); }
.role-badge.client { background: #dbeafe; color: var(--color-client); }

.pharmacy-tag {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Client Sidebar */
.client-sidebar {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.contact-section {
  margin-bottom: 24px;
}

.contact-section h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header .count {
  background: #e5e7eb;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  margin-bottom: 8px;
}

.contact-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.contact-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-info .name {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-info .status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.contact-info .address {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.dot.online { background: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }

.pharmacies-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Ticket Form */
.ticket-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
  margin-top: 20px;
}

.ticket-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(10, 124, 92, 0.1);
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #095c44;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 8px;
}

.btn-text.full-width {
  width: 100%;
  text-align: center;
  margin-top: 8px;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
}

.chat-area.empty {
  align-items: center;
  justify-content: center;
}

/* Chat Header */
.chat-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.chat-header.empty {
  background: transparent;
  border: none;
  box-shadow: none;
  flex-direction: column;
  text-align: center;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-text h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.header-text .status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

/* Empty Chat State */
.empty-chat {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.empty-chat h3 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 1.125rem;
}

.empty-chat p {
  margin: 0;
  font-size: 0.875rem;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-bubble {
  background: white;
  padding: 24px 32px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  text-align: center;
  color: var(--color-text-secondary);
}

.welcome-bubble i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 12px;
  display: block;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-separator {
  text-align: center;
  margin: 16px 0;
  position: relative;
}

.date-separator::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #e5e7eb;
}

.date-separator span {
  background: #f8fafc;
  padding: 0 12px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  position: relative;
  text-transform: capitalize;
}

.message-group {
  display: flex;
  margin-bottom: 8px;
  max-width: 70%;
}

.message-group.mine {
  margin-left: auto;
  justify-content: flex-end;
}

.message-group.admin { color: var(--color-admin); }
.message-group.pharmacie { color: var(--color-pharmacie); }
.message-group.client { color: var(--color-client); }

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.message-group:not(.mine) .message-bubble {
  background: white;
  color: var(--color-text);
  border-bottom-left-radius: 4px;
}

.message-group.mine .message-bubble {
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-group.admin:not(.mine) .message-bubble {
  border-left: 3px solid var(--color-admin);
}

.message-group.pharmacie:not(.mine) .message-bubble {
  border-left: 3px solid var(--color-pharmacie);
}

.message-content {
  font-size: 0.9375rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.75rem;
  opacity: 0.8;
}

.message-meta .time {
  font-size: 0.6875rem;
}

.message-group.mine .message-meta {
  justify-content: flex-end;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  width: fit-content;
  box-shadow: var(--shadow-sm);
  margin-top: 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Input Area */
.chat-input-area {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
}

.input-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 24px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.input-form:focus-within {
  background: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(10, 124, 92, 0.1);
}

.btn-attach {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-attach:hover {
  color: var(--color-text);
  background: #e5e7eb;
}

.input-wrapper {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  align-items: center;
}

.input-wrapper textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 0.9375rem;
  line-height: 1.5;
  padding: 8px 0;
}

.btn-send {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  background: #095c44;
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

/* Info Panel */
.info-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.info-item .label {
  color: var(--color-text-secondary);
}

.info-item .value {
  font-weight: 500;
  color: var(--color-text);
}

.pharmacy-card {
  background: var(--color-bg);
  padding: 16px;
  border-radius: var(--radius-sm);
}

.pharmacy-card .name {
  font-weight: 600;
  margin-bottom: 4px;
}

.pharmacy-card .address {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: modal-up 0.3s ease;
}

@keyframes modal-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.pharmacies-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pharmacy-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  text-align: left;
  width: 100%;
}

.pharmacy-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.pharmacy-item .info {
  flex: 1;
}

.pharmacy-item .name {
  font-weight: 600;
  margin-bottom: 2px;
}

.pharmacy-item .address {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Empty States */
.empty-state-small {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
}

.empty-state-small i {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
  opacity: 0.5;
}

.empty-state-small p {
  margin: 0;
  font-size: 0.875rem;
}

/* Auth Prompt */
.auth-prompt {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.prompt-card {
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.prompt-card i {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: 16px;
}

.prompt-card h2 {
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.prompt-card p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #095c44;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Toasts */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  background: white;
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  animation: slide-in 0.3s ease;
  border-left: 4px solid;
}

.toast.success { border-left-color: var(--color-primary); }
.toast.error { border-left-color: #ef4444; }

.toast i {
  font-size: 1.25rem;
}

.toast.success i { color: var(--color-primary); }
.toast.error i { color: #ef4444; }

@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 991px) {
  .support-app {
    height: calc(100vh - 60px);
  }
  
  .mobile-header {
    display: flex;
  }
  
  .sidebar {
    width: 100%;
    position: absolute;
    inset: 0;
    z-index: 5;
  }
  
  .sidebar.hidden-mobile {
    display: none;
  }
  
  .chat-area {
    position: absolute;
    inset: 0;
    z-index: 10;
  }
  
  .chat-area.hidden-mobile {
    display: none;
  }
  
  .info-panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 20;
    box-shadow: -4px 0 12px rgba(0,0,0,0.1);
  }
  
  .messages-container {
    padding: 16px;
  }
  
  .message-group {
    max-width: 85%;
  }
  
  .toast-container {
    left: 20px;
    right: 20px;
    top: auto;
    bottom: 20px;
  }
  
  .toast {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .chat-input-area {
    padding: 12px 16px;
  }
  
  .input-hint {
    display: none;
  }
}
</style>
