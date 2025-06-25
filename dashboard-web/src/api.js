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
export const getMobilizacoes = (operacaoId = null) =>
  api.get(`/mobilizacoes${operacaoId ? `?operacao_id=${operacaoId}` : ''}`);
export const getDesmobilizacoes = (operacaoId = null) =>
  api.get(`/desmobilizacoes${operacaoId ? `?operacao_id=${operacaoId}` : ''}`);

// Funções de debug para verificar dados
export const debugAllData = async () => {
  try {
    console.log('=== DEBUG: Verificando todos os dados do backend ===');

    // Testar equipe ativa
    const equipeResponse = await getEquipeAtiva();
    console.log('Equipe Ativa:', equipeResponse.data);

    // Testar operação ativa
    const operacaoResponse = await getOperacaoAtiva();
    console.log('Operação Ativa:', operacaoResponse.data);

    // Testar operações
    const operacoesResponse = await getOperacoes(1, 10);
    console.log('Operações (estrutura completa):', operacoesResponse);
    console.log('Operações (dados):', operacoesResponse.data);

    // Testar deslocamentos
    const deslocamentosResponse = await getDeslocamentos();
    console.log('Deslocamentos:', deslocamentosResponse.data);

    // Testar aguardos
    const aguardosResponse = await getAguardos();
    console.log('Aguardos:', aguardosResponse.data);

    // Testar refeições
    const refeicoesResponse = await getRefeicoes();
    console.log('Refeições:', refeicoesResponse.data);

    // Testar abastecimentos
    const abastecimentosResponse = await getAbastecimentos();
    console.log('Abastecimentos:', abastecimentosResponse.data);

    // Testar mobilizações com mais detalhes
    const mobilizacoesResponse = await getMobilizacoes();
    console.log('=== MOBILIZAÇÕES ===');
    console.log('Resposta completa:', mobilizacoesResponse);
    console.log('Status da resposta:', mobilizacoesResponse.status);
    console.log('Headers da resposta:', mobilizacoesResponse.headers);
    console.log('Dados:', mobilizacoesResponse.data);
    console.log('Estrutura dos dados:', typeof mobilizacoesResponse.data);
    console.log('É array?', Array.isArray(mobilizacoesResponse.data));
    if (Array.isArray(mobilizacoesResponse.data)) {
      console.log('Quantidade de mobilizações:', mobilizacoesResponse.data.length);
      if (mobilizacoesResponse.data.length > 0) {
        console.log('Primeira mobilização:', mobilizacoesResponse.data[0]);
        console.log('Campos disponíveis:', Object.keys(mobilizacoesResponse.data[0]));
      }
    } else if (mobilizacoesResponse.data && typeof mobilizacoesResponse.data === 'object') {
      console.log('Estrutura do objeto:', Object.keys(mobilizacoesResponse.data));
      if (mobilizacoesResponse.data.data) {
        console.log('Dados aninhados:', mobilizacoesResponse.data.data);
        console.log('É array aninhado?', Array.isArray(mobilizacoesResponse.data.data));
      }
    }

    // Testar desmobilizações com mais detalhes
    const desmobilizacoesResponse = await getDesmobilizacoes();
    console.log('=== DESMOBILIZAÇÕES ===');
    console.log('Resposta completa:', desmobilizacoesResponse);
    console.log('Status da resposta:', desmobilizacoesResponse.status);
    console.log('Headers da resposta:', desmobilizacoesResponse.headers);
    console.log('Dados:', desmobilizacoesResponse.data);
    console.log('Estrutura dos dados:', typeof desmobilizacoesResponse.data);
    console.log('É array?', Array.isArray(desmobilizacoesResponse.data));
    if (Array.isArray(desmobilizacoesResponse.data)) {
      console.log('Quantidade de desmobilizações:', desmobilizacoesResponse.data.length);
      if (desmobilizacoesResponse.data.length > 0) {
        console.log('Primeira desmobilização:', desmobilizacoesResponse.data[0]);
        console.log('Campos disponíveis:', Object.keys(desmobilizacoesResponse.data[0]));
      }
    } else if (desmobilizacoesResponse.data && typeof desmobilizacoesResponse.data === 'object') {
      console.log('Estrutura do objeto:', Object.keys(desmobilizacoesResponse.data));
      if (desmobilizacoesResponse.data.data) {
        console.log('Dados aninhados:', desmobilizacoesResponse.data.data);
        console.log('É array aninhado?', Array.isArray(desmobilizacoesResponse.data.data));
      }
    }

    console.log('=== FIM DO DEBUG ===');

    return {
      equipe: equipeResponse.data,
      operacao: operacaoResponse.data,
      operacoes: operacoesResponse.data,
      deslocamentos: deslocamentosResponse.data,
      aguardos: aguardosResponse.data,
      refeicoes: refeicoesResponse.data,
      abastecimentos: abastecimentosResponse.data,
      mobilizacoes: mobilizacoesResponse.data,
      desmobilizacoes: desmobilizacoesResponse.data
    };
  } catch (error) {
    console.error('Erro no debug:', error);
    throw error;
  }
};

// Função específica para testar mobilizações e desmobilizações
export const testMobilizacoesDesmobilizacoes = async () => {
  try {
    console.log('=== TESTE DE MOBILIZAÇÕES E DESMOBILIZAÇÕES ===');

    // Buscar operações primeiro
    const operacoesRes = await getOperacoes(1, 100);
    let operacoesArray = [];

    if (Array.isArray(operacoesRes.data)) {
      operacoesArray = operacoesRes.data;
    } else if (Array.isArray(operacoesRes.data?.data)) {
      operacoesArray = operacoesRes.data.data;
    } else if (Array.isArray(operacoesRes.data?.items)) {
      operacoesArray = operacoesRes.data.items;
    } else if (Array.isArray(operacoesRes.data?.operacoes)) {
      operacoesArray = operacoesRes.data.operacoes;
    }

    console.log('Operações encontradas:', operacoesArray.length);
    console.log('Primeira operação:', operacoesArray[0]);

    if (operacoesArray.length === 0) {
      console.log('Nenhuma operação encontrada');
      return;
    }

    // Buscar todas as mobilizações
    const mobilizacoesRes = await getMobilizacoes();
    console.log('Resposta completa de mobilizações:', mobilizacoesRes);

    let mobilizacoesArray = [];
    if (Array.isArray(mobilizacoesRes.data)) {
      mobilizacoesArray = mobilizacoesRes.data;
    } else if (Array.isArray(mobilizacoesRes.data?.data)) {
      mobilizacoesArray = mobilizacoesRes.data.data;
    } else if (Array.isArray(mobilizacoesRes.data?.items)) {
      mobilizacoesArray = mobilizacoesRes.data.items;
    } else if (Array.isArray(mobilizacoesRes.data?.mobilizacoes)) {
      mobilizacoesArray = mobilizacoesRes.data.mobilizacoes;
    }

    console.log('Total de mobilizações:', mobilizacoesArray.length);
    console.log('Primeira mobilização:', mobilizacoesArray[0]);

    // Buscar todas as desmobilizações
    const desmobilizacoesRes = await getDesmobilizacoes();
    console.log('Resposta completa de desmobilizações:', desmobilizacoesRes);

    let desmobilizacoesArray = [];
    if (Array.isArray(desmobilizacoesRes.data)) {
      desmobilizacoesArray = desmobilizacoesRes.data;
    } else if (Array.isArray(desmobilizacoesRes.data?.data)) {
      desmobilizacoesArray = desmobilizacoesRes.data.data;
    } else if (Array.isArray(desmobilizacoesRes.data?.items)) {
      desmobilizacoesArray = desmobilizacoesRes.data.items;
    } else if (Array.isArray(desmobilizacoesRes.data?.desmobilizacoes)) {
      desmobilizacoesArray = desmobilizacoesRes.data.desmobilizacoes;
    }

    console.log('Total de desmobilizações:', desmobilizacoesArray.length);
    console.log('Primeira desmobilização:', desmobilizacoesArray[0]);

    // Testar filtro por equipe_id
    const primeiraOperacao = operacoesArray[0];
    console.log('Testando com primeira operação:', primeiraOperacao);

    const mobilizacoesDaEquipe = mobilizacoesArray.filter(m => m.equipe_id === primeiraOperacao.equipe_id);
    const desmobilizacoesDaEquipe = desmobilizacoesArray.filter(d => d.equipe_id === primeiraOperacao.equipe_id);

    console.log(`Mobilizações para equipe ${primeiraOperacao.equipe_id}:`, mobilizacoesDaEquipe.length);
    console.log(`Desmobilizações para equipe ${primeiraOperacao.equipe_id}:`, desmobilizacoesDaEquipe.length);

    if (mobilizacoesDaEquipe.length > 0) {
      console.log('Exemplo de mobilização da equipe:', mobilizacoesDaEquipe[0]);
    }

    if (desmobilizacoesDaEquipe.length > 0) {
      console.log('Exemplo de desmobilização da equipe:', desmobilizacoesDaEquipe[0]);
    }

    // Mostrar todos os equipe_ids únicos nas mobilizações
    const equipeIdsMobilizacoes = [...new Set(mobilizacoesArray.map(m => m.equipe_id))];
    console.log('Equipe IDs nas mobilizações:', equipeIdsMobilizacoes);

    // Mostrar todos os equipe_ids únicos nas desmobilizações
    const equipeIdsDesmobilizacoes = [...new Set(desmobilizacoesArray.map(d => d.equipe_id))];
    console.log('Equipe IDs nas desmobilizações:', equipeIdsDesmobilizacoes);

    // Mostrar todos os equipe_ids únicos nas operações
    const equipeIdsOperacoes = [...new Set(operacoesArray.map(op => op.equipe_id))];
    console.log('Equipe IDs nas operações:', equipeIdsOperacoes);

  } catch (error) {
    console.error('Erro no teste:', error);
  }
};

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