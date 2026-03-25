import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { triggerUnauthorized } from "./authEvents";

const API = axios.create({
  baseURL: "https://habitax.onrender.com/api", // http://192.168.29.211:5000
  timeout: 10000, // 10s timeout — detects network issues faster
});

// Request interceptor — attach token
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + network errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and force re-login
      await AsyncStorage.removeItem("token");
      triggerUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default API;