import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * BACKEND ENVIRONMENT CONFIGURATION
 * -------------------------------------------------------------
 * Set USE_DEV_BACKEND = true  -> Connects to your local machine (Flask port 5000)
 * Set USE_DEV_BACKEND = false -> Connects to hosted production backend
 */
export const USE_DEV_BACKEND = true;

/**
 * DEV URL OPTIONS:
 * - Android Emulator: 'http://10.0.2.2:5000' (default for emulator)
 * - Physical Phone via USB: Run `adb reverse tcp:5000 tcp:5000` then use 'http://localhost:5000'
 * - Physical Phone via Wi-Fi: 'http://192.168.31.149:5000' (same Wi-Fi router)
 * - iOS Simulator: 'http://localhost:5000'
 */
const DEV_URL = Platform.select({
  android: 'http://10.0.2.2:5000', // Switch to 'http://192.168.31.149:5000' for physical phone over Wi-Fi
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const PROD_URL = 'https://embroidex-backend.merishiksha.com';

export const BASE_URL = USE_DEV_BACKEND ? DEV_URL : PROD_URL;

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Auto-inject JWT Bearer token on every request
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not read auth token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    
    console.error(`[API Error] ${error.config?.url}:`, message);
    const customError = new Error(message);
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export default API;
