import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/registers',
});

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