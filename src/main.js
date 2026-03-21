import { createApp } from "vue";
import { createPinia } from "pinia";
import mapboxgl from "mapbox-gl";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./assets/theme.css";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const authStore = useAuthStore();
authStore.initialize();
if (authStore.user) {
  authStore.fetchProfile().catch(() => {
    authStore.logout();
  });
}

app.use(router);
app.mount("#app");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
