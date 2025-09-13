import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/registers',
});

// Request interceptor to log requests
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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
export const getNextObservationNumber = (type) => api.get(`/observation-number/${type}`);
export const getDashboardData = () => api.get('/dashboard');
export const generateReport = (filters) => api.post('/reports', filters);
export const getDailyReportData = () => api.get('/dailyReport');
