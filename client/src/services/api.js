import axios from 'axios';

// Single source of truth for the backend host. Set via REACT_APP_API_URL in
// client/.env — never hardcode a host/IP in component code or use relative
// '/api/...' paths, since those resolve against whatever origin the page was
// loaded from (e.g. localhost:3000) instead of the backend.
const API_HOST = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_HOST}/api`,
});

// Request interceptor to log requests
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
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

// ------------------- Registers (/api/registers/*) -------------------
export const createRegister = (data) => api.post('/registers', data);
export const getAllRegisters = () => api.get('/registers');
export const getRegisterById = (id) => api.get(`/registers/${id}`);
export const updateRegister = (id, data) => api.put(`/registers/${id}`, data);
export const deleteRegister = (id) => api.delete(`/registers/${id}`);
export const getInitialData = () => api.get('/registers/initial-data');
export const getDealerByView = (dealerView) => api.get(`/registers/dealer/${dealerView}`);
export const getSizesByBrand = (brand) => api.get(`/registers/sizes/${brand}`);
export const getSizeDetails = (size) => api.get(`/registers/size-details/${size}`);
export const getAllConsultants = () => api.get('/registers/consultants/all');
export const getAllLocations = () => api.get('/registers/locations/all');
export const getAllStacks = () => api.get('/registers/stacks/all');
export const getNextObservationNumber = (type) => api.get(`/registers/observation-number/${type}`);
export const generateReport = (filters) => api.post('/registers/reports', filters);
export const getAllRegistersForDropdown = () => api.get('/registers/dropdown/registers');
export const getBrandReportInitialData = () => api.get('/registers/initial-data');
export const getBrandReport = (params) => api.get('/registers/brand-report', { params });
export const getMenuDashboardData = (params) => api.get('/registers/menu-dashboard', { params });

// ------------------- Dashboard (/api/dashboard) -------------------
export const getDashboardData = (startDate, endDate) =>
  api.get('/dashboard', { params: { startDate, endDate } });

// ------------------- Daily report (/api/dailyReport/*) -------------------
export const getDailyReportConsultants = () => api.get('/dailyReport/consultants');
export const getDailyReportData = (params) => api.get('/dailyReport', { params });

// ------------------- Observations (/api/observations) -------------------
export const getAllObservations = () => api.get('/observations');

// ------------------- Rechecks (/api/rechecks/*) -------------------
export const getRegisterListForRecheck = () => api.get('/rechecks/register-list');
export const getRegisterDetailsForRecheck = (searchType, value) =>
  api.get('/rechecks/register-details', { params: { searchType, value } });
export const saveRecheck = (data) => api.post('/rechecks/save', data);
export const updateRecheck = (id, data) => api.put(`/rechecks/${id}`, data);
export const deleteRecheck = (id) => api.delete(`/rechecks/${id}`);
export const getAllRechecks = () => api.get('/rechecks/all');

export default api;
