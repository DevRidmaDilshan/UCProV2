import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
// export const getAllObservations = () => api.get('/observations');
export const getAllObservations = () => {
  return axios.get(`${API_BASE_URL}/observations`); // This should match the mounted route
};
// Recheck API functions
export const getAllRechecks = () => {
  return axios.get('/api/rechecks');
};

export const getRecheckById = (recheckNo) => {
  return axios.get(`/api/rechecks/${recheckNo}`);
};

export const createRecheck = (recheckData) => {
  return axios.post('/api/rechecks', recheckData);
};

export const updateRecheck = (recheckNo, recheckData) => {
  return axios.put(`/api/rechecks/${recheckNo}`, recheckData);
};

export const deleteRecheck = (recheckNo) => {
  return axios.delete(`/api/rechecks/${recheckNo}`);
};

export const getRegisterForRecheck = (id) => {
  return axios.get(`/api/rechecks/register/${id}`);
};

export const getRegistersWithObservations = () => {
  return axios.get('/api/rechecks/registers/with-observations');
};