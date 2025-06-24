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
  Platform,
  Modal
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

// Lista de tipos de operações
const TIPOS_OPERACAO = [
  'Desparafinação Térmica',
  'Deslocamento Pig',
  'Limpeza',
  'Desparafinação Térmica e Pig',
  'Teste de Estanqueidade',
  'Outros'
];

// Lista de cidades disponíveis
const CIDADES = [
  'Maceió',
  'São Miguel dos Campos',
  'Satuba',
  'Pilar',
  'Rio Largo',
  'Coruripe',
  'Outros'
];

export default function OperacoesScreen({ navigation, route }) {
  // Estados para controlar o formulário
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para os dados da operação
  const [operacaoId, setOperacaoId] = useState(null);
  const [tipoOperacao, setTipoOperacao] = useState('');
  const [tipoOperacaoModalVisible, setTipoOperacaoModalVisible] = useState(false); // <-- ADICIONE ESTA LINHA
  const [cidade, setCidade] = useState('');
  const [poco, setPoco] = useState('');
  const [representante, setRepresentante] = useState('');
  const [volume, setVolume] = useState('');
  const [temperaturaQuente, setTemperaturaQuente] = useState(false); // true=quente, false=fria
  const [cidadeModalVisible, setCidadeModalVisible] = useState(false);
  const [pressao, setPressao] = useState('');
  const [atividades, setAtividades] = useState('');

  // Estados para controle de mobilização
  const [etapaAtual, setEtapaAtual] = useState('AGUARDANDO');
  // Etapas: AGUARDANDO, MOBILIZACAO, OPERACAO, DESMOBILIZACAO, FINALIZADO

  const [tempoOperacao, setTempoOperacao] = useState(0);
  const [inicioOperacao, setInicioOperacao] = useState(null);
  const [fimOperacao, setFimOperacao] = useState(null);
  // ...existing code...

  // Adicione estes estados junto com os outros useState no início do componente:
  const [operador, setOperador] = useState('');
  const [auxiliar, setAuxiliar] = useState('');

  // ...existing code...

  // Referências para timers
  const timerOperacao = useRef(null);

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

  // Novo estado para equipe ativa e data do dia
  const [equipeAtiva, setEquipeAtiva] = useState('Equipe 1'); // ou buscar da API se desejar
  const [dataHoje, setDataHoje] = useState(new Date());

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

  // Substitua a função iniciarOperacao existente por esta versão corrigida

  const iniciarOperacao = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validação mínima - apenas tipo de operação é obrigatório para iniciar
      if (!tipoOperacao) {
        setError('Selecione um tipo de operação para iniciar');
        setLoading(false);
        return;
      }

      // Preparar a data para atualização - apenas com os dados essenciais
      const inicioOperacaoNow = new Date();

      if (operacaoId) {
        // Se já existe operação, primeiro atualizamos a etapa
        await axios.put(`${API_URL}/operacoes/${operacaoId}/etapa`, {
          etapa: 'OPERACAO'
        });

        // Depois atualizamos os outros dados
        await axios.put(`${API_URL}/operacoes/${operacaoId}`, {
          tipo_operacao: tipoOperacao,
          inicio_operacao: inicioOperacaoNow.toISOString(),
          cidade: cidade || null,
          poco: poco || null,
          representante: representante || null,
          volume: volume ? parseFloat(volume) : null,
          pressao: pressao ? parseFloat(pressao) : null,
          temperatura_quente: temperaturaQuente,
          atividades: atividades || null
        });
      } else {
        // Se não há operação, criar nova
        const response = await axios.post(`${API_URL}/operacoes`, {
          tipo_operacao: tipoOperacao,
          inicio_operacao: inicioOperacaoNow.toISOString(),
          etapa_atual: 'OPERACAO',
          cidade: cidade || null,
          poco: poco || null,
          representante: representante || null,
          volume: volume ? parseFloat(volume) : null,
          pressao: pressao ? parseFloat(pressao) : null,
          temperatura_quente: temperaturaQuente,
          atividades: atividades || null
        });

        // Atualizar o ID da operação recém-criada
        setOperacaoId(response.data.id);
      }

      // Atualizar estado localmente
      setEtapaAtual('OPERACAO');
      setInicioOperacao(inicioOperacaoNow);
      setTempoOperacao(0);

      Alert.alert('Operação Iniciada', `${tipoOperacao} iniciada com sucesso.`);
    } catch (err) {
      console.error('Erro completo:', err);

      let mensagemErro = 'Erro ao iniciar operação';
      if (err.response && err.response.data && err.response.data.error) {
        mensagemErro += `: ${err.response.data.error}`;
      }

      setError(mensagemErro);
      Alert.alert('Erro', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Similar para as outras funções como finalizarOperacao
  const finalizarOperacao = async () => {
    // Verificar se há operação para finalizar
    if (!operacaoId) {
      setError('Nenhuma operação ativa para finalizar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Atualizar a etapa para AGUARDANDO_DESMOBILIZACAO
      await axios.put(`${API_URL}/operacoes/${operacaoId}/etapa`, {
        etapa: 'AGUARDANDO_DESMOBILIZACAO'
      });

      // Atualizar os dados da operação
      await axios.put(`${API_URL}/operacoes/${operacaoId}`, {
        tipo_operacao: tipoOperacao,
        cidade: cidade || null,
        poco: poco || null,
        representante: representante || null,
        volume: volume ? parseFloat(volume) : null,
        temperatura_quente: temperaturaQuente,
        pressao: pressao ? parseFloat(pressao) : null,
        atividades: atividades || null,
        fim_operacao: new Date().toISOString(),
        tempo_operacao: tempoOperacao
      });

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

  // Função para atualizar a etapa da operação
  const atualizarEtapaOperacao = async (etapa) => {
    try {
      setLoading(true);
      setError(null);

      if (!operacaoAtiva || !operacaoAtiva.id) {
        setError('Nenhuma operação ativa encontrada');
        return;
      }

      console.log(`Atualizando etapa da operação ${operacaoAtiva.id} para ${etapa}`);

      const response = await axios.put(
        `${API_URL}/operacoes/${operacaoAtiva.id}/etapa`,
        { etapa }
      );

      console.log('Etapa atualizada com sucesso:', response.data);

      // Atualizar a operação ativa
      await buscarOperacaoAtiva();

      // Atualizar a lista de operações
      await buscarOperacoes();

      // Mostrar confirmação
      Alert.alert(
        "Etapa Atualizada",
        `A operação foi atualizada para etapa de ${traduzirEtapa(etapa)}.`
      );

    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);

      let mensagemErro = 'Não foi possível atualizar a etapa da operação.';
      if (err.response && err.response.data && err.response.data.error) {
        mensagemErro += ` ${err.response.data.error}`;
      }

      setError(mensagemErro);
      Alert.alert("Erro", mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para traduzir os nomes das etapas
  const traduzirEtapa = (etapa) => {
    switch (etapa) {
      case 'MOBILIZACAO':
        return 'Mobilização';
      case 'INICIO_OPERACAO':
        return 'Início de Operação';
      case 'DESMOBILIZACAO':
        return 'Desmobilização';
      default:
        return etapa;
    }
  };

  // Renderização dos botões de acordo com a etapa atual
  const renderizarBotoes = () => {
    return (
      <View style={styles.botoesContainer}>
        <Text style={styles.botoesTitle}>Ações</Text>

        {/* Botão para salvar E finalizar operação */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF9800', marginTop: 10 }]}
          onPress={finalizarOperacao}
          disabled={loading}
        >
          <Ionicons name="stop-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>SALVAR E FINALIZAR OPERAÇÃO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Adicione este componente acima do renderizarBotoes()
  const renderizarEstadoAtual = () => {
    // Traduz o estado para uma mensagem amigável
    const getStatusInfo = () => {
      switch (etapaAtual) {
        case 'AGUARDANDO':
          return { texto: 'Aguardando início', cor: '#9E9E9E', icone: 'time' };
        case 'MOBILIZACAO':
          return { texto: 'Mobilização em andamento', cor: '#795548', icone: 'construct' };
        case 'AGUARDANDO_OPERACAO':
          return { texto: 'Pronto para operar', cor: '#4CAF50', icone: 'checkmark-circle' };
        case 'OPERACAO':
          return { texto: 'Operação em andamento', cor: '#FF9800', icone: 'play-circle' };
        case 'AGUARDANDO_DESMOBILIZACAO':
          return { texto: 'Aguardando desmobilização', cor: '#795548', icone: 'exit-outline' };
        case 'DESMOBILIZACAO':
          return { texto: 'Desmobilização em andamento', cor: '#9C27B0', icone: 'exit' };
        case 'FINALIZADO':
          return { texto: 'Operação finalizada', cor: '#2196F3', icone: 'checkmark-done-circle' };
        default:
          return { texto: 'Status desconhecido', cor: '#607D8B', icone: 'help-circle' };
      }
    };

    const statusInfo = getStatusInfo();

    return (
      <View style={[styles.statusContainer, { borderColor: statusInfo.cor }]}>
        <Ionicons name={statusInfo.icone} size={24} color={statusInfo.cor} />
        <Text style={[styles.statusText, { color: statusInfo.cor }]}>{statusInfo.texto}</Text>
      </View>
    );
  };

  // Estados para as abas
  const [activeTab, setActiveTab] = useState('dados');

  // Renderização do cabeçalho e abas
  const renderizarCabecalhoEAbas = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="people" size={28} color="#4CAF50" />
          <View>
            <Text style={styles.headerText}>{equipeAtiva}</Text>
            <Text style={{ color: '#888', fontSize: 14 }}>
              {dataHoje.toLocaleDateString()}
            </Text>
            <Text style={{ color: '#333', fontSize: 15, marginTop: 4 }}>
              Operador: <Text style={{ fontWeight: 'bold' }}>{operador || '-'}</Text>
            </Text>
            <Text style={{ color: '#333', fontSize: 15 }}>
              Auxiliar: <Text style={{ fontWeight: 'bold' }}>{auxiliar || '-'}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Função para buscar operação ativa
  const buscarOperacaoAtiva = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/operacoes/ativa`);
      if (response.data && response.data.id) {
        setOperacaoId(response.data.id);
        setTipoOperacao(response.data.tipo_operacao || '');
        setCidade(response.data.cidade || '');
        setPoco(response.data.poco || '');
        setRepresentante(response.data.representante || '');
        setVolume(response.data.volume ? String(response.data.volume) : '');
        setPressao(response.data.pressao ? String(response.data.pressao) : '');
        setTemperaturaQuente(response.data.temperatura_quente || false);
        setAtividades(response.data.atividades || '');
        setEtapaAtual(response.data.etapa_atual || 'AGUARDANDO');
        setInicioOperacao(response.data.inicio_operacao ? new Date(response.data.inicio_operacao) : null);
        setFimOperacao(response.data.fim_operacao ? new Date(response.data.fim_operacao) : null);
        // Adicione outros campos conforme necessário
      } else {
        setOperacaoId(null);
        setEtapaAtual('AGUARDANDO');
        setInicioOperacao(null);
        setFimOperacao(null);
      }
    } catch (err) {
      setOperacaoId(null);
      setEtapaAtual('AGUARDANDO');
      setInicioOperacao(null);
      setFimOperacao(null);
      // Não precisa mostrar erro se não houver operação ativa
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarOperacaoAtiva();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {renderizarCabecalhoEAbas()}

        {/* Mensagem de erro */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#D32F2F" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {/* Conteúdo baseado na tab ativa */}
        {activeTab === 'dados' && (
          <View>
            {/* Formulário de dados da operação */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.sectionTitle}>Dados da Operação</Text>

                {/* Botão para iniciar operação */}
                <TouchableOpacity
                  style={styles.iniciarOperacaoButton}
                  onPress={iniciarOperacao}
                  disabled={loading || etapaAtual === 'FINALIZADO'}
                >
                  <Ionicons name="play-circle" size={22} color="#fff" />
                  <Text style={styles.iniciarOperacaoText}>INICIAR</Text>
                </TouchableOpacity>
              </View>

              {/* Tipo de Operação - Versão mais compacta */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Operação</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setTipoOperacaoModalVisible(true)}
                  disabled={etapaAtual === 'FINALIZADO'}
                >
                  <Ionicons name="construct" size={20} color="#666" style={styles.inputIcon} />
                  <Text style={[styles.input, !tipoOperacao && styles.placeholderText]}>
                    {tipoOperacao || 'Selecione o tipo de operação'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
                </TouchableOpacity>

                {/* Modal para seleção do tipo de operação */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={tipoOperacaoModalVisible}
                  onRequestClose={() => setTipoOperacaoModalVisible(false)}
                >
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Selecione o Tipo de Operação</Text>
                        <TouchableOpacity onPress={() => setTipoOperacaoModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.modalList}>
                        {TIPOS_OPERACAO.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.cidadeItem,
                              tipoOperacao === item && styles.cidadeItemSelecionada
                            ]}
                            onPress={() => {
                              setTipoOperacao(item);
                              setTipoOperacaoModalVisible(false);
                            }}
                          >
                            <Text style={[
                              styles.cidadeItemText,
                              tipoOperacao === item && styles.cidadeItemTextSelecionado
                            ]}>
                              {item}
                            </Text>
                            {tipoOperacao === item && (
                              <Ionicons name="checkmark" size={20} color="#4CAF50" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonCancel]}
                          onPress={() => setTipoOperacaoModalVisible(false)}
                        >
                          <Text style={styles.modalButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        {tipoOperacao && (
                          <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonConfirm]}
                            onPress={() => setTipoOperacaoModalVisible(false)}
                          >
                            <Text style={[styles.modalButtonText, { color: '#fff' }]}>Confirmar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>

              {/* Cidade */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cidade</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setCidadeModalVisible(true)}
                  disabled={etapaAtual === 'FINALIZADO'}
                >
                  <Ionicons name="business" size={20} color="#666" style={styles.inputIcon} />
                  <Text style={[styles.input, !cidade && styles.placeholderText]}>
                    {cidade || 'Selecione uma cidade'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
                </TouchableOpacity>

                {/* Modal para seleção de cidade */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={cidadeModalVisible}
                  onRequestClose={() => setCidadeModalVisible(false)}
                >
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Selecione a Cidade</Text>
                        <TouchableOpacity onPress={() => setCidadeModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={styles.modalList}>
                        {CIDADES.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.cidadeItem,
                              cidade === item && styles.cidadeItemSelecionada
                            ]}
                            onPress={() => {
                              setCidade(item);
                              setCidadeModalVisible(false);
                            }}
                          >
                            <Text style={[
                              styles.cidadeItemText,
                              cidade === item && styles.cidadeItemTextSelecionado
                            ]}>
                              {item}
                            </Text>
                            {cidade === item && (
                              <Ionicons name="checkmark" size={20} color="#4CAF50" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Botões do modal */}
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonCancel]}
                          onPress={() => setCidadeModalVisible(false)}
                        >
                          <Text style={styles.modalButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        {cidade && (
                          <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonConfirm]}
                            onPress={() => setCidadeModalVisible(false)}
                          >
                            <Text style={[styles.modalButtonText, { color: '#fff' }]}>Confirmar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>

              {/* Local Trabalho */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Local Trabalho</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="water" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do local de trabalho"
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

              {/* Botão para salvar e finalizar operação */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF9800', marginTop: 10 }]}
                onPress={finalizarOperacao}
                disabled={loading}
              >
                <Ionicons name="stop-circle" size={24} color="#fff" />
                <Text style={styles.buttonText}>SALVAR E FINALIZAR OPERAÇÃO</Text>
              </TouchableOpacity>

              {/* Exibir hora de início e fim da operação */}
              {inicioOperacao && (
                <Text style={{ marginTop: 10, color: '#1565C0', fontWeight: 'bold' }}>
                  Início: {inicioOperacao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {fimOperacao && (
                <Text style={{ marginTop: 5, color: '#E65100', fontWeight: 'bold' }}>
                  Fim: {fimOperacao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'etapas' && (
          <View style={styles.tabContentContainer}>
            {/* Estado atual da operação */}
            {renderizarEstadoAtual()}

            <View style={styles.etapasContainer}>
              <Text style={styles.etapasTitle}>Gerenciamento de Etapas</Text>

              <View style={styles.etapaTimeline}>
                <View style={[
                  styles.etapaItem,
                  etapaAtual === 'MOBILIZACAO' && styles.etapaItemActive
                ]}>
                  <View style={[
                    styles.etapaCircle,
                    etapaAtual === 'MOBILIZACAO' && styles.etapaCircleCompleted
                  ]}>
                    <Ionicons name="construct" size={18} color="#fff" />
                  </View>
                  <Text style={styles.etapaText}>Mobilização</Text>
                </View>

                <View style={styles.etapaLine} />

                <View style={[
                  styles.etapaItem,
                  etapaAtual === 'OPERACAO' && styles.etapaItemActive
                ]}>
                  <View style={[
                    styles.etapaCircle,
                    (etapaAtual === 'OPERACAO' || inicioOperacao) && styles.etapaCircleCompleted
                  ]}>
                    <Ionicons name="build" size={18} color="#fff" />
                  </View>
                  <Text style={styles.etapaText}>Operação</Text>
                </View>

                <View style={styles.etapaLine} />

                <View style={[
                  styles.etapaItem,
                  etapaAtual === 'DESMOBILIZACAO' && styles.etapaItemActive
                ]}>
                  <View style={[
                    styles.etapaCircle,
                    etapaAtual === 'DESMOBILIZACAO' && styles.etapaCircleCompleted
                  ]}>
                    <Ionicons name="exit" size={18} color="#fff" />
                  </View>
                  <Text style={styles.etapaText}>Desmobilização</Text>
                </View>
              </View>

              {/* Botões específicos para cada etapa */}
              <View style={styles.etapaAcoes}>
                {/* Botão para iniciar operação - sempre visível */}
                <TouchableOpacity
                  style={[styles.acaoButton, { backgroundColor: '#1976D2', marginBottom: 10 }]}
                  onPress={iniciarOperacao}
                  disabled={loading}
                >
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.acaoButtonText}>Iniciar Operação</Text>
                </TouchableOpacity>

                {/* Botão para finalizar operação - sempre visível */}
                <TouchableOpacity
                  style={[styles.acaoButton, { backgroundColor: '#E65100', marginBottom: 10 }]}
                  onPress={finalizarOperacao}
                  disabled={loading}
                >
                  <Ionicons name="stop-circle" size={20} color="#fff" />
                  <Text style={styles.acaoButtonText}>Finalizar Operação</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'fotos' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.fotosContainer}>
              <Text style={styles.fotosTitle}>Fotos e Anexos</Text>

              <TouchableOpacity style={styles.addFotoButton}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.addFotoText}>Adicionar Foto</Text>
              </TouchableOpacity>

              <Text style={styles.placeholderText}>
                Nenhuma foto adicionada ainda. Use o botão acima para adicionar fotos da operação.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'historico' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.historicoContainer}>
              <Text style={styles.historicoTitle}>Histórico de Atividades</Text>

              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>22/06/2023 - 14:30</Text>
                  <Text style={styles.timelineEvent}>Operação iniciada</Text>
                  <Text style={styles.timelineDesc}>Desparafinação Térmica iniciada por João Silva</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>22/06/2023 - 12:15</Text>
                  <Text style={styles.timelineEvent}>Mobilização finalizada</Text>
                  <Text style={styles.timelineDesc}>Equipamentos montados e prontos para operação</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>22/06/2023 - 10:00</Text>
                  <Text style={styles.timelineEvent}>Mobilização iniciada</Text>
                  <Text style={styles.timelineDesc}>Equipe chegou no local e iniciou a montagem</Text>
                </View>
              </View>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginLeft: 8,
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
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
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
    backgroundColor: '#FF9800',
    borderRadius: 10,
    borderWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  botaoEtapaAtivo: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  botaoEtapaIcone: {
    marginBottom: 6,
  },
  botaoEtapaTexto: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    color: '#333',
    textAlign: 'center',
  },
  botaoEtapaTextoAtivo: {
    color: '#fff',
  },
  botoesContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  botoesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  iniciarOperacaoButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciarOperacaoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Styles para o modal de seleção de cidade
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalList: {
    maxHeight: 300,
  },
  cidadeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cidadeItemSelecionada: {
    backgroundColor: '#E8F5E9',
  },
  cidadeItemText: {
    fontSize: 16,
    color: '#333',
  },
  cidadeItemTextSelecionado: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // alinhamento à direita
    marginTop: 20,
    gap: 10, // espaço entre os botões (pode ser marginRight/marginLeft se não funcionar)
  },
  modalButton: {
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#bbb',
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#aaa',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  botaoFlutuante: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});