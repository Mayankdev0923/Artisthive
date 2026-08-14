import axios from 'axios';
import Session from 'supertokens-web-js/recipe/session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (await Session.doesSessionExist()) {
    config.headers.Authorization = `Bearer ${await Session.getAccessToken()}`;
  }
  return config;
});

export default api;