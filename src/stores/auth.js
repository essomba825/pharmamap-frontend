import { computed, ref } from "vue";
import { defineStore } from "pinia";
import * as authApi from "@/api/auth";
import { SESSION_FLAG_KEY, USER_KEY } from "@/api";

const roleRedirectMap = {
  admin: "/admin/dashboard",
  pharmacie: "/pharmacie/dashboard",
  client: "/client/commandes"
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);

  const role = computed(() => user.value?.role || null);
  const isAuthenticated = computed(() => Boolean(user.value));
  const redirectPathByRole = computed(() => roleRedirectMap[role.value] || "/");

  const saveToStorage = () => {
    if (user.value) {
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
      localStorage.setItem(SESSION_FLAG_KEY, "1");
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_FLAG_KEY);
    }
  };

  const initialize = () => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      user.value = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      user.value = null;
      saveToStorage();
    }
  };

  const setSession = ({ profile }) => {
    user.value = profile || null;
    saveToStorage();
  };

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setSession({
      profile: data.user
    });
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    if (data.user) {
      setSession({ profile: data.user });
    }
    return data;
  };

  const registerPharmacie = async (payload) => {
    const { data } = await authApi.registerPharmacie(payload);
    if (data.user) {
      setSession({ profile: data.user });
    }
    return data;
  };

  const googleLogin = async (idToken) => {
    const { data } = await authApi.googleLogin({ id_token: idToken });
    setSession({
      profile: data.user
    });
    return data;
  };

  const fetchProfile = async () => {
    const { data } = await authApi.fetchProfile();
    user.value = data.user;
    saveToStorage();
    return data.user;
  };

  const updateProfile = async (payload) => {
    const { data } = await authApi.updateProfile(payload);
    user.value = data.user;
    saveToStorage();
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    user.value = null;
    saveToStorage();
  };

  return {
    user,
    role,
    isAuthenticated,
    redirectPathByRole,
    initialize,
    login,
    register,
    registerPharmacie,
    googleLogin,
    fetchProfile,
    updateProfile,
    logout
  };
});
