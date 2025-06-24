import axios from 'axios';
import { API_URL } from './config';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Get active operation data
 * @returns {Promise} Promise with response data
 */
export const getOperacaoAtiva = () => {
  return api.get('/operacoes/ativa');
};

export const getEquipeAtiva = () => api.get('/equipes/ativa');
export const getOperacoes = (page = 1, limit = 100) =>
  api.get(`/operacoes?page=${page}&limit=${limit}`);
export const getDeslocamentos = (operacaoId = null) =>
    api.get(`/deslocamentos${operacaoId ? `?operacao_id=${operacaoId}` : ''}`);
export const getAguardos = () => api.get('/aguardos');
export const getRefeicoes = () => api.get('/refeicoes');
export const getAbastecimentos = () => api.get('/abastecimentos');

/**
 * Error handling interceptor
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default api;