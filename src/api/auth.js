import api from "./index";

export const login = (payload) => api.post("/users/login/", payload);
export const register = (payload) => api.post("/users/register/", payload);
export const registerPharmacie = (payload) => api.post("/users/register-pharmacie/", payload);
export const googleLogin = (payload) => api.post("/users/google/", payload);
export const fetchProfile = () => api.get("/users/profil/");
export const updateProfile = (payload) => api.put("/users/profil/modifier/", payload);
export const logout = () => api.post("/users/logout/");
