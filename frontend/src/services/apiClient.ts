import axios from 'axios';
import { clientMetrics } from './metricsService';

// API base URL - adjust for your environment
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:3001';

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens and tracking
apiClient.interceptors.request.use(
  (config) => {
    // Add request start time for metrics
    config.metadata = { startTime: Date.now() };
    
    // Add auth token from localStorage if available
    const token = localStorage.getItem('accessToken');
    console.log('🔧 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🔧 Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔧 Authorization header set');
    } else {
      console.log('🔧 No authorization header - token missing');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and tracking
apiClient.interceptors.response.use(
  (response) => {
    // Track successful request
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    clientMetrics.track(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration
    );
    
    return response;
  },
  (error) => {
    // Track failed request
    if (error.config) {
      const duration = Date.now() - (error.config.metadata?.startTime || Date.now());
      clientMetrics.track(
        error.config.method?.toUpperCase() || 'GET',
        error.config.url || '',
        error.response?.status || 0,
        duration
      );
    }
    
    // Handle common errors
    console.log('🔧 API Response Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login if needed
      console.warn('🔧 401 Unauthorized - token may be invalid or expired');
      const token = localStorage.getItem('accessToken');
      console.warn('🔧 Current token in localStorage:', token ? 'Present' : 'Missing');
    }
    
    if (error.response?.status === 404) {
      console.warn('🔧 404 Resource not found');
    }
    
    if (error.response?.status >= 500) {
      console.error('🔧 Server error');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;