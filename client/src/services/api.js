import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com/api/registers' 
    : 'http://localhost:5000/api/registers',
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Received response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);
export const getNextObservationNumber = () => api.get('/observation-numbers');
export const createRegister = (data) => api.post('/', data);
export const getAllRegisters = () => api.get('/');
export const getRegisterById = (id) => api.get(`/${id}`);
export const updateRegister = (id, data) => api.put(`/${id}`, data);
export const deleteRegister = (id) => api.delete(`/${id}`);
export const getInitialData = () => api.get('/initial-data');
export const getDealerByView = (dealerView) => api.get(`/dealer/${dealerView}`);
export const getSizesByBrand = (brand) => api.get(`/sizes/${brand}`);
export const getSizeDetails = (size) => api.get(`/size-details/${size}`);
export const getAllConsultants = () => api.get('/consultants/all');
export const generateReport = (filters) => api.post('/reports', filters);
export const getDashboardData = () => api.get('/dashboard');
