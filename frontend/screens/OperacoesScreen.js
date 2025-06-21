import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

// Lista de tipos de operações
const TIPOS_OPERACAO = [
  { id: 'desparafinacao', nome: 'Desparafinação Térmica', abrev: 'Desp. Term', icone: 'flame', cor: '#FF9800' },
  { id: 'estanqueidade', nome: 'Teste de Estanqueidade', abrev: 'Test. Estanq', icone: 'water', cor: '#2196F3' },
  { id: 'limpeza', nome: 'Limpeza', abrev: 'Limpeza', icone: 'sparkles', cor: '#4CAF50' },
  { id: 'pig', nome: 'Deslocamento de PIG', abrev: 'Desl. PIG', icone: 'git-merge', cor: '#9C27B0' },
  { id: 'outros', nome: 'Outros', abrev: 'Outros', icone: 'ellipsis-horizontal', cor: '#607D8B' }
];

export default function OperacoesScreen({ navigation, route }) {
  // Estados para controlar o formulário
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para os dados da operação
  const [operacaoId, setOperacaoId] = useState(null);
  const [tipoOperacao, setTipoOperacao] = useState('');
  const [cidade, setCidade] = useState('');
  const [poco, setPoco] = useState('');
  const [representante, setRepresentante] = useState('');
  const [volume, setVolume] = useState('');
  const [temperaturaQuente, setTemperaturaQuente] = useState(false); // true=quente, false=fria
  const [pressao, setPressao] = useState('');
  const [atividades, setAtividades] = useState('');
  
  // Estados para controle de mobilização
  const [etapaAtual, setEtapaAtual] = useState('AGUARDANDO'); 
  // Etapas: AGUARDANDO, MOBILIZACAO, OPERACAO, DESMOBILIZACAO, FINALIZADO
  
  const [tempoMobilizacao, setTempoMobilizacao] = useState(0);
  const [inicioMobilizacao, setInicioMobilizacao] = useState(null);
  const [fimMobilizacao, setFimMobilizacao] = useState(null);
  
  const [tempoOperacao, setTempoOperacao] = useState(0);
  const [inicioOperacao, setInicioOperacao] = useState(null);
  const [fimOperacao, setFimOperacao] = useState(null);
  
  const [tempoDesmobilizacao, setTempoDesmobilizacao] = useState(0);
  const [inicioDesmobilizacao, setInicioDesmobilizacao] = useState(null);
  const [fimDesmobilizacao, setFimDesmobilizacao] = useState(null);
  
  // Referências para timers
  const timerMobilizacao = useRef(null);
  const timerOperacao = useRef(null);
  const timerDesmobilizacao = useRef(null);
  
  // Função para formatar o tempo (segundos para HH:MM:SS)
  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return [
      horas.toString().padStart(2, '0'),
      minutos.toString().padStart(2, '0'),
      segs.toString().padStart(2, '0')
    ].join(':');
  };

  // Verificar se há operação ativa ao entrar na tela
  useEffect(() => {
    verificarOperacaoAtiva();
  }, []);
  
  // Atualizar quando a tela receber foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      verificarOperacaoAtiva();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Controle do timer para mobilização
  useEffect(() => {
    if (etapaAtual === 'MOBILIZACAO' && inicioMobilizacao && !fimMobilizacao) {
      timerMobilizacao.current = setInterval(() => {
        setTempoMobilizacao(prev => prev + 1);
      }, 1000);
    } else {
      if (timerMobilizacao.current) {
        clearInterval(timerMobilizacao.current);
      }
    }
    
    return () => {
      if (timerMobilizacao.current) {
        clearInterval(timerMobilizacao.current);
      }
    };
  }, [etapaAtual, inicioMobilizacao, fimMobilizacao]);
  
  // Controle do timer para operação
  useEffect(() => {
    if (etapaAtual === 'OPERACAO' && inicioOperacao && !fimOperacao) {
      timerOperacao.current = setInterval(() => {
        setTempoOperacao(prev => prev + 1);
      }, 1000);
    } else {
      if (timerOperacao.current) {
        clearInterval(timerOperacao.current);
      }
    }
    
    return () => {
      if (timerOperacao.current) {
        clearInterval(timerOperacao.current);
      }
    };
  }, [etapaAtual, inicioOperacao, fimOperacao]);
  
  // Controle do timer para desmobilização
  useEffect(() => {
    if (etapaAtual === 'DESMOBILIZACAO' && inicioDesmobilizacao && !fimDesmobilizacao) {
      timerDesmobilizacao.current = setInterval(() => {
        setTempoDesmobilizacao(prev => prev + 1);
      }, 1000);
    } else {
      if (timerDesmobilizacao.current) {
        clearInterval(timerDesmobilizacao.current);
      }
    }
    
    return () => {
      if (timerDesmobilizacao.current) {
        clearInterval(timerDesmobilizacao.current);
      }
    };
  }, [etapaAtual, inicioDesmobilizacao, fimDesmobilizacao]);
  
  // Função para verificar se há operação ativa
  const verificarOperacaoAtiva = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/operacoes/ativa`);
      
      if (response.data) {
        const operacao = response.data;
        setOperacaoId(operacao.id);
        
        // Preencher campos do formulário com dados da operação
        setTipoOperacao(operacao.tipo_operacao || '');
        setCidade(operacao.cidade || '');
        setPoco(operacao.poco || '');
        setRepresentante(operacao.representante || '');
        setVolume(operacao.volume ? operacao.volume.toString() : '');
        setTemperaturaQuente(operacao.temperatura_quente);
        setPressao(operacao.pressao ? operacao.pressao.toString() : '');
        setAtividades(operacao.atividades || '');
        
        // Definir a etapa atual
        setEtapaAtual(operacao.etapa_atual);
        
        // Configurar tempos e datas para mobilização
        if (operacao.inicio_mobilizacao) {
          setInicioMobilizacao(new Date(operacao.inicio_mobilizacao));
          if (operacao.fim_mobilizacao) {
            setFimMobilizacao(new Date(operacao.fim_mobilizacao));
            setTempoMobilizacao(operacao.tempo_mobilizacao || 0);
          } else {
            // Calcular tempo decorrido
            const agora = new Date();
            const segundosDecorridos = Math.floor((agora - new Date(operacao.inicio_mobilizacao)) / 1000);
            setTempoMobilizacao(segundosDecorridos);
          }
        }
        
        // Configurar tempos e datas para operação
        if (operacao.inicio_operacao) {
          setInicioOperacao(new Date(operacao.inicio_operacao));
          if (operacao.fim_operacao) {
            setFimOperacao(new Date(operacao.fim_operacao));
            setTempoOperacao(operacao.tempo_operacao || 0);
          } else {
            // Calcular tempo decorrido
            const agora = new Date();
            const segundosDecorridos = Math.floor((agora - new Date(operacao.inicio_operacao)) / 1000);
            setTempoOperacao(segundosDecorridos);
          }
        }
        
        // Configurar tempos e datas para desmobilização
        if (operacao.inicio_desmobilizacao) {
          setInicioDesmobilizacao(new Date(operacao.inicio_desmobilizacao));
          if (operacao.fim_desmobilizacao) {
            setFimDesmobilizacao(new Date(operacao.fim_desmobilizacao));
            setTempoDesmobilizacao(operacao.tempo_desmobilizacao || 0);
          } else {
            // Calcular tempo decorrido
            const agora = new Date();
            const segundosDecorridos = Math.floor((agora - new Date(operacao.inicio_desmobilizacao)) / 1000);
            setTempoDesmobilizacao(segundosDecorridos);
          }
        }
      }
    } catch (err) {
      // Se não encontrou operação ativa, não é um erro
      if (err.response && err.response.status === 404) {
        console.log('Nenhuma operação ativa encontrada');
      } else {
        console.error('Erro ao verificar operação ativa:', err);
        setError('Erro ao verificar operação ativa');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar mobilização
  const iniciarMobilizacao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        etapa_atual: 'MOBILIZACAO',
        inicio_mobilizacao: new Date().toISOString()
      };
      
      let response;
      
      if (operacaoId) {
        // Atualizar operação existente
        response = await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      } else {
        // Criar nova operação
        response = await axios.post(`${API_URL}/operacoes`, dataOperacao);
        setOperacaoId(response.data.id);
      }
      
      // Atualizar estado
      setEtapaAtual('MOBILIZACAO');
      setInicioMobilizacao(new Date());
      setTempoMobilizacao(0);
      
      Alert.alert('Mobilização Iniciada', 'Equipe em montagem do equipamento.');
    } catch (err) {
      tratarErro(err, 'Erro ao iniciar mobilização');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para finalizar mobilização
  const finalizarMobilizacao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        etapa_atual: 'AGUARDANDO_OPERACAO',
        fim_mobilizacao: new Date().toISOString(),
        tempo_mobilizacao: tempoMobilizacao
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      // Atualizar estado
      setEtapaAtual('AGUARDANDO_OPERACAO');
      setFimMobilizacao(new Date());
      
      Alert.alert('Mobilização Finalizada', `Mobilização concluída em ${formatarTempo(tempoMobilizacao)}.`);
    } catch (err) {
      tratarErro(err, 'Erro ao finalizar mobilização');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar operação
  const iniciarOperacao = async () => {
    // Validação de campos obrigatórios
    if (!tipoOperacao) {
      setError('Tipo de operação é obrigatório');
      return;
    }
    
    if (!cidade) {
      setError('Cidade é obrigatória');
      return;
    }
    
    if (!poco) {
      setError('Poço/Serviço é obrigatório');
      return;
    }
    
    if (!representante) {
      setError('Representante da empresa é obrigatório');
      return;
    }
    
    if (!volume) {
      setError('Volume (bbl) é obrigatório');
      return;
    }
    
    if (!pressao) {
      setError('Pressão (PSI) é obrigatória');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const volumeNum = parseFloat(volume);
      const pressaoNum = parseFloat(pressao);
      
      if (isNaN(volumeNum)) {
        setError('Volume deve ser um número válido');
        setLoading(false);
        return;
      }
      
      if (isNaN(pressaoNum)) {
        setError('Pressão deve ser um número válido');
        setLoading(false);
        return;
      }
      
      const dataOperacao = {
        etapa_atual: 'OPERACAO',
        tipo_operacao: tipoOperacao,
        cidade,
        poco,
        representante,
        volume: volumeNum,
        temperatura_quente: temperaturaQuente,
        pressao: pressaoNum,
        atividades,
        inicio_operacao: new Date().toISOString()
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      // Atualizar estado
      setEtapaAtual('OPERACAO');
      setInicioOperacao(new Date());
      setTempoOperacao(0);
      
      Alert.alert('Operação Iniciada', `${tipoOperacao} iniciada com sucesso.`);
    } catch (err) {
      tratarErro(err, 'Erro ao iniciar operação');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para finalizar operação
  const finalizarOperacao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        etapa_atual: 'AGUARDANDO_DESMOBILIZACAO',
        fim_operacao: new Date().toISOString(),
        tempo_operacao: tempoOperacao
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      // Atualizar estado
      setEtapaAtual('AGUARDANDO_DESMOBILIZACAO');
      setFimOperacao(new Date());
      
      Alert.alert('Operação Finalizada', `Operação concluída em ${formatarTempo(tempoOperacao)}.`);
    } catch (err) {
      tratarErro(err, 'Erro ao finalizar operação');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar desmobilização
  const iniciarDesmobilizacao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        etapa_atual: 'DESMOBILIZACAO',
        inicio_desmobilizacao: new Date().toISOString()
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      // Atualizar estado
      setEtapaAtual('DESMOBILIZACAO');
      setInicioDesmobilizacao(new Date());
      setTempoDesmobilizacao(0);
      
      Alert.alert('Desmobilização Iniciada', 'Equipe em desmontagem do equipamento.');
    } catch (err) {
      tratarErro(err, 'Erro ao iniciar desmobilização');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para finalizar desmobilização
  const finalizarDesmobilizacao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        etapa_atual: 'FINALIZADO',
        fim_desmobilizacao: new Date().toISOString(),
        tempo_desmobilizacao: tempoDesmobilizacao
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      // Atualizar estado
      setEtapaAtual('FINALIZADO');
      setFimDesmobilizacao(new Date());
      
      Alert.alert('Desmobilização Finalizada', `Desmobilização concluída em ${formatarTempo(tempoDesmobilizacao)}.`);
    } catch (err) {
      tratarErro(err, 'Erro ao finalizar desmobilização');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar operação
  const salvarOperacao = async () => {
    // Validações básicas
    if (!tipoOperacao) {
      setError('Tipo de operação é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataOperacao = {
        tipo_operacao: tipoOperacao,
        cidade,
        poco,
        representante,
        volume: volume ? parseFloat(volume) : null,
        temperatura_quente: temperaturaQuente,
        pressao: pressao ? parseFloat(pressao) : null,
        atividades
      };
      
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, dataOperacao);
      
      Alert.alert('Operação Salva', 'Os dados da operação foram salvos com sucesso.');
    } catch (err) {
      tratarErro(err, 'Erro ao salvar operação');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para tratamento de erros
  const tratarErro = (err, mensagemPadrao) => {
    console.error(`${mensagemPadrao}:`, err);
    
    let mensagem = `${mensagemPadrao}: `;
    
    if (err.response) {
      const errorDetails = err.response.data?.error || err.message;
      mensagem += `${errorDetails} (${err.response.status})`;
    } else if (err.request) {
      mensagem += 'Sem resposta do servidor';
    } else {
      mensagem += err.message;
    }
    
    setError(mensagem);
  };
  
  // Renderização dos botões de acordo com a etapa atual
  const renderizarBotoes = () => {
    switch (etapaAtual) {
      case 'AGUARDANDO':
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={iniciarMobilizacao}
            disabled={loading}
          >
            <Ionicons name="construct" size={24} color="#fff" />
            <Text style={styles.buttonText}>INÍCIO MOBILIZAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'MOBILIZACAO':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF9800' }]}
            onPress={finalizarMobilizacao}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>FIM MOBILIZAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'AGUARDANDO_OPERACAO':
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={iniciarOperacao}
            disabled={loading}
          >
            <Ionicons name="play-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>INÍCIO OPERAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'OPERACAO':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF9800' }]}
            onPress={finalizarOperacao}
            disabled={loading}
          >
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>FIM OPERAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'AGUARDANDO_DESMOBILIZACAO':
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={iniciarDesmobilizacao}
            disabled={loading}
          >
            <Ionicons name="exit-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>INÍCIO DESMOBILIZAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'DESMOBILIZACAO':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF9800' }]}
            onPress={finalizarDesmobilizacao}
            disabled={loading}
          >
            <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>FIM DESMOBILIZAÇÃO</Text>
          </TouchableOpacity>
        );
        
      case 'FINALIZADO':
        return (
          <View style={styles.finalizadoContainer}>
            <Text style={styles.finalizadoText}>Operação Finalizada</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#2196F3' }]}
              onPress={() => {
                // Reset dos estados para iniciar nova operação
                setOperacaoId(null);
                setEtapaAtual('AGUARDANDO');
                setTipoOperacao('');
                setCidade('');
                setPoco('');
                setRepresentante('');
                setVolume('');
                setTemperaturaQuente(false);
                setPressao('');
                setAtividades('');
                setInicioMobilizacao(null);
                setFimMobilizacao(null);
                setTempoMobilizacao(0);
                setInicioOperacao(null);
                setFimOperacao(null);
                setTempoOperacao(0);
                setInicioDesmobilizacao(null);
                setFimDesmobilizacao(null);
                setTempoDesmobilizacao(0);
              }}
              disabled={loading}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.buttonText}>INICIAR NOVA OPERAÇÃO</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  // Renderização dos timers ativos
  const renderizarTimers = () => {
    return (
      <View style={styles.timersContainer}>
        {/* Timer de Mobilização */}
        {inicioMobilizacao && (
          <View style={styles.timerCard}>
            <Text style={styles.timerTitle}>Mobilização</Text>
            <Text style={styles.timerValue}>
              {formatarTempo(tempoMobilizacao)}
            </Text>
            <Text style={styles.timerStatus}>
              {etapaAtual === 'MOBILIZACAO' 
                ? 'Equipe em montagem do equipamento' 
                : 'Concluída'}
            </Text>
          </View>
        )}
        
        {/* Timer de Operação */}
        {inicioOperacao && (
          <View style={[styles.timerCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.timerTitle}>Operação</Text>
            <Text style={[styles.timerValue, { color: '#0D47A1' }]}>
              {formatarTempo(tempoOperacao)}
            </Text>
            <Text style={[styles.timerStatus, { color: '#1565C0' }]}>
              {etapaAtual === 'OPERACAO' 
                ? 'Em andamento' 
                : 'Concluída'}
            </Text>
          </View>
        )}
        
        {/* Timer de Desmobilização */}
        {inicioDesmobilizacao && (
          <View style={[styles.timerCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.timerTitle}>Desmobilização</Text>
            <Text style={[styles.timerValue, { color: '#E65100' }]}>
              {formatarTempo(tempoDesmobilizacao)}
            </Text>
            <Text style={[styles.timerStatus, { color: '#F57C00' }]}>
              {etapaAtual === 'DESMOBILIZACAO' 
                ? 'Equipe em desmontagem do equipamento' 
                : 'Concluída'}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Atualize a constante TIPOS_OPERACAO para usar abreviações mais concisas
const TIPOS_OPERACAO = [
  { id: 'desparafinacao', nome: 'Desparafinação Térmica', abrev: 'Desp. Term', icone: 'flame', cor: '#FF9800' },
  { id: 'estanqueidade', nome: 'Teste de Estanqueidade', abrev: 'Test. Estanq', icone: 'water', cor: '#2196F3' },
  { id: 'limpeza', nome: 'Limpeza', abrev: 'Limpeza', icone: 'sparkles', cor: '#4CAF50' },
  { id: 'pig', nome: 'Deslocamento de PIG', abrev: 'Desl. PIG', icone: 'git-merge', cor: '#9C27B0' },
  { id: 'outros', nome: 'Outros', abrev: 'Outros', icone: 'ellipsis-horizontal', cor: '#607D8B' }
];

// Dentro do componente, adicione um seletor de etapa
const renderizarSeletorEtapa = () => {
  return (
    <View style={styles.etapaSeletorContainer}>
      {/* Botão de iniciar mobilização na parte superior quando em estado AGUARDANDO */}
      {etapaAtual === 'AGUARDANDO' && (
        <TouchableOpacity
          style={styles.iniciarButton}
          onPress={iniciarMobilizacao}
          disabled={loading}
        >
          <Ionicons name="construct" size={22} color="#fff" />
          <Text style={styles.iniciarButtonText}>INICIAR MOBILIZAÇÃO</Text>
        </TouchableOpacity>
      )}
      
      {/* Seletor de etapas quando já iniciou */}
      {etapaAtual !== 'AGUARDANDO' && etapaAtual !== 'FINALIZADO' && (
        <View style={styles.etapaSelector}>
          <View style={styles.etapaTabs}>
            <TouchableOpacity
              style={[
                styles.etapaTab,
                (etapaAtual === 'MOBILIZACAO' || etapaAtual === 'AGUARDANDO_OPERACAO') && styles.etapaTabAtiva
              ]}
              disabled={etapaAtual !== 'MOBILIZACAO' && etapaAtual !== 'AGUARDANDO_OPERACAO'}
            >
              <Ionicons 
                name="construct" 
                size={20} 
                color={(etapaAtual === 'MOBILIZACAO' || etapaAtual === 'AGUARDANDO_OPERACAO') ? '#4CAF50' : '#999'} 
              />
              <Text style={(etapaAtual === 'MOBILIZACAO' || etapaAtual === 'AGUARDANDO_OPERACAO') 
                ? styles.etapaTabTextoAtivo : styles.etapaTabTexto}>
                Mobilização
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.etapaTab,
                (etapaAtual === 'OPERACAO') && styles.etapaTabAtiva
              ]}
              disabled={etapaAtual !== 'OPERACAO'}
            >
              <Ionicons 
                name="play-circle" 
                size={20} 
                color={etapaAtual === 'OPERACAO' ? '#2196F3' : '#999'} 
              />
              <Text style={etapaAtual === 'OPERACAO' ? styles.etapaTabTextoAtivo : styles.etapaTabTexto}>
                Operação
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.etapaTab,
                (etapaAtual === 'AGUARDANDO_DESMOBILIZACAO' || etapaAtual === 'DESMOBILIZACAO') && styles.etapaTabAtiva
              ]}
              disabled={etapaAtual !== 'AGUARDANDO_DESMOBILIZACAO' && etapaAtual !== 'DESMOBILIZACAO'}
            >
              <Ionicons 
                name="exit-outline" 
                size={20} 
                color={(etapaAtual === 'AGUARDANDO_DESMOBILIZACAO' || etapaAtual === 'DESMOBILIZACAO') ? '#FF9800' : '#999'} 
              />
              <Text style={(etapaAtual === 'AGUARDANDO_DESMOBILIZACAO' || etapaAtual === 'DESMOBILIZACAO') 
                ? styles.etapaTabTextoAtivo : styles.etapaTabTexto}>
                Desmobilização
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Botão de ação baseado na etapa atual */}
          <View style={styles.etapaAcao}>
            {etapaAtual === 'MOBILIZACAO' && (
              <TouchableOpacity
                style={[styles.acaoButton, { backgroundColor: '#4CAF50' }]}
                onPress={finalizarMobilizacao}
                disabled={loading}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.acaoButtonText}>FINALIZAR MOBILIZAÇÃO</Text>
              </TouchableOpacity>
            )}
            
            {etapaAtual === 'AGUARDANDO_OPERACAO' && (
              <TouchableOpacity
                style={[styles.acaoButton, { backgroundColor: '#2196F3' }]}
                onPress={iniciarOperacao}
                disabled={loading}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.acaoButtonText}>INICIAR OPERAÇÃO</Text>
              </TouchableOpacity>
            )}
            
            {etapaAtual === 'OPERACAO' && (
              <TouchableOpacity
                style={[styles.acaoButton, { backgroundColor: '#2196F3' }]}
                onPress={finalizarOperacao}
                disabled={loading}
              >
                <Ionicons name="stop-circle" size={20} color="#fff" />
                <Text style={styles.acaoButtonText}>FINALIZAR OPERAÇÃO</Text>
              </TouchableOpacity>
            )}
            
            {etapaAtual === 'AGUARDANDO_DESMOBILIZACAO' && (
              <TouchableOpacity
                style={[styles.acaoButton, { backgroundColor: '#FF9800' }]}
                onPress={iniciarDesmobilizacao}
                disabled={loading}
              >
                <Ionicons name="exit-outline" size={20} color="#fff" />
                <Text style={styles.acaoButtonText}>INICIAR DESMOBILIZAÇÃO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// Na parte inferior da tela, vamos adicionar o botão de finalizar desmobilização
// Atualize o renderizarBotoes() para:
const renderizarBotoesPrincipais = () => {
  if (etapaAtual === 'DESMOBILIZACAO') {
    return (
      <TouchableOpacity
        style={[styles.botaoPrincipal, { backgroundColor: '#FF9800' }]}
        onPress={finalizarDesmobilizacao}
        disabled={loading}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
        <Text style={styles.botaoPrincipalTexto}>FINALIZAR DESMOBILIZAÇÃO</Text>
      </TouchableOpacity>
    );
  }
  
  if (etapaAtual === 'FINALIZADO') {
    return (
      <TouchableOpacity
        style={[styles.botaoPrincipal, { backgroundColor: '#2196F3' }]}
        onPress={() => {
          // Reset dos estados para iniciar nova operação
          setOperacaoId(null);
          setEtapaAtual('AGUARDANDO');
          setTipoOperacao('');
          setCidade('');
          setPoco('');
          setRepresentante('');
          setVolume('');
          setTemperaturaQuente(false);
          setPressao('');
          setAtividades('');
          setInicioMobilizacao(null);
          setFimMobilizacao(null);
          setTempoMobilizacao(0);
          setInicioOperacao(null);
          setFimOperacao(null);
          setTempoOperacao(0);
          setInicioDesmobilizacao(null);
          setFimDesmobilizacao(null);
          setTempoDesmobilizacao(0);
        }}
        disabled={loading}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.botaoPrincipalTexto}>INICIAR NOVA OPERAÇÃO</Text>
      </TouchableOpacity>
    );
  }
  
  return null;
};
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="build" size={40} color="#4CAF50" />
          <Text style={styles.headerText}>
            {operacaoId ? `Operação #${operacaoId}` : 'Nova Operação'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={verificarOperacaoAtiva}
          >
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        {/* Seletor de etapa */}
        {renderizarSeletorEtapa()}
        
        {/* Timers de etapas */}
        {renderizarTimers()}
        
        {/* Mensagem de erro */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#D32F2F" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
        
        {/* Formulário de dados da operação */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Dados da Operação</Text>
          
          {/* Tipo de Operação - Versão mais compacta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Operação</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tipoOperacaoScroll}
            >
              <View style={styles.tiposContainer}>
                {TIPOS_OPERACAO.map((tipo) => (
                  <TouchableOpacity 
                    key={tipo.id} 
                    style={[
                      styles.tipoItem, 
                      tipoOperacao === tipo.nome && styles.tipoItemSelecionado,
                      tipoOperacao === tipo.nome && { backgroundColor: tipo.cor }
                    ]}
                    onPress={() => setTipoOperacao(tipo.nome)}
                    disabled={etapaAtual === 'FINALIZADO'}
                  >
                    <Ionicons 
                      name={tipo.icone} 
                      size={18} 
                      color={tipoOperacao === tipo.nome ? '#fff' : tipo.cor} 
                    />
                    <Text style={[
                      styles.tipoItemText,
                      tipoOperacao === tipo.nome && styles.tipoItemTextSelecionado
                    ]}>
                      {tipo.abrev}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Cidade */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome da cidade"
                value={cidade}
                onChangeText={setCidade}
                editable={etapaAtual !== 'FINALIZADO'}
              />
            </View>
          </View>
          
          {/* Poço/Serviço */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poço/Serviço</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="water" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Identificação do poço ou serviço"
                value={poco}
                onChangeText={setPoco}
                editable={etapaAtual !== 'FINALIZADO'}
              />
            </View>
          </View>
          
          {/* Representante da empresa */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Representante da Empresa</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome do representante"
                value={representante}
                onChangeText={setRepresentante}
                editable={etapaAtual !== 'FINALIZADO'}
              />
            </View>
          </View>
          
          <View style={styles.row}>
            {/* Volume (bbl) */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Volume (bbl)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flask" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={volume}
                  onChangeText={setVolume}
                  keyboardType="numeric"
                  editable={etapaAtual !== 'FINALIZADO'}
                />
              </View>
            </View>
            
            {/* Pressão (PSI) */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Pressão (PSI)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="speedometer" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={pressao}
                  onChangeText={setPressao}
                  keyboardType="numeric"
                  editable={etapaAtual !== 'FINALIZADO'}
                />
              </View>
            </View>
          </View>
          
          {/* Temperatura */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temperatura</Text>
            <View style={styles.temperatureContainer}>
              <View style={styles.temperatureOption}>
                <Text style={[
                  styles.temperatureText, 
                  !temperaturaQuente && styles.temperatureSelected
                ]}>
                  Fria (30°C)
                </Text>
                <Switch
                  value={temperaturaQuente}
                  onValueChange={setTemperaturaQuente}
                  trackColor={{ false: '#81c784', true: '#ffb74d' }}
                  thumbColor={temperaturaQuente ? '#f57c00' : '#388e3c'}
                  disabled={etapaAtual === 'FINALIZADO'}
                />
                <Text style={[
                  styles.temperatureText, 
                  temperaturaQuente && styles.temperatureSelected
                ]}>
                  Quente (95°C)
                </Text>
              </View>
            </View>
          </View>
          
          {/* Atividades */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Atividades (máx. 400 caracteres)</Text>
            <View style={[styles.inputWrapper, { height: 120 }]}>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Descreva as atividades realizadas"
                value={atividades}
                onChangeText={(text) => {
                  // Limitar a 400 caracteres
                  if (text.length <= 400) {
                    setAtividades(text);
                  }
                }}
                multiline={true}
                numberOfLines={4}
                maxLength={400}
                editable={etapaAtual !== 'FINALIZADO'}
              />
            </View>
            <Text style={styles.charCounter}>{atividades.length}/400</Text>
          </View>
        </View>
        
        {/* Botão principal na parte inferior */}
        {renderizarBotoesPrincipais()}
        
        {/* Botão para salvar operação (sempre disponível exceto em AGUARDANDO) */}
        {operacaoId && etapaAtual !== 'AGUARDANDO' && (
          <TouchableOpacity
            style={[styles.botaoSecundario, { backgroundColor: '#607D8B' }]}
            onPress={salvarOperacao}
            disabled={loading}
          >
            <Ionicons name="save" size={22} color="#fff" />
            <Text style={styles.botaoSecundarioTexto}>SALVAR OPERAÇÃO</Text>
          </TouchableOpacity>
        )}
        
        {/* Indicador de carregamento */}
        {loading && (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 10,
  },
  timersContainer: {
    marginBottom: 20,
  },
  timerCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '500',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginVertical: 5,
    fontVariant: ['tabular-nums'],
  },
  timerStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingRight: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  pickerItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#4CAF50',
  },
  pickerItemText: {
    color: '#555',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#fff',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  temperatureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  temperatureText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#888',
  },
  temperatureSelected: {
    fontWeight: 'bold',
    color: '#333',
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  actionButtons: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCDD2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  error: {
    color: '#D32F2F',
    marginLeft: 10,
    flex: 1,
  },
  loader: {
    marginTop: 20,
    marginBottom: 10,
  },
  finalizadoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  finalizadoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
  },
  termicaItem: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  estanqueidadeItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  limpezaItem: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pigItem: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  typeIcon: {
    marginRight: 6,
  },
  etapaSeletorContainer: {
    marginBottom: 15,
  },
  iniciarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 2,
  },
  iniciarButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  etapaSelector: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 2,
  },
  etapaTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  etapaTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  etapaTabAtiva: {
    borderBottomColor: '#4CAF50',
    backgroundColor: '#f9f9f9',
  },
  etapaTabTexto: {
    fontSize: 12,
    marginLeft: 5,
    color: '#999',
  },
  etapaTabTextoAtivo: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#333',
  },
  etapaAcao: {
    padding: 12,
  },
  acaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 4,
  },
  acaoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Styles para os botões principais
  botaoPrincipal: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  botaoPrincipalTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  botaoSecundario: {
    backgroundColor: '#607D8B',
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 2,
  },
  botaoSecundarioTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Styles para o tipo de operação
  tipoOperacaoScroll: {
    marginBottom: 5,
  },
  tiposContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  tipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tipoItemSelecionado: {
    backgroundColor: '#4CAF50',
  },
  tipoItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginLeft: 6,
  },
  tipoItemTextSelecionado: {
    color: '#fff',
  },
});