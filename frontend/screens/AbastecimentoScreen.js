import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  FlatList,
  Image
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function AbastecimentoScreen({ navigation }) {
  // Estados para controlar a tela
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para dados do abastecimento
  const [operacaoAtiva, setOperacaoAtiva] = useState(null);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [abastecimentoAtivo, setAbastecimentoAtivo] = useState(null);
  const [tipoAbastecimento, setTipoAbastecimento] = useState('');

  // Estado para modal
  const [modalVisivel, setModalVisivel] = useState(false);

  // Estado para o timer
  const [tempoAbastecimento, setTempoAbastecimento] = useState(0);
  const timerRef = useRef(null);

  // Carregar dados iniciais
  useEffect(() => {
    buscarOperacaoAtiva();
    buscarAbastecimentos();
  }, []);

  // Atualizar ao receber foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      buscarOperacaoAtiva();
      buscarAbastecimentos();
    });

    return unsubscribe;
  }, [navigation]);

  // Controlar timer do abastecimento ativo
  useEffect(() => {
    if (abastecimentoAtivo && !abastecimentoAtivo.fim_abastecimento) {
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setTempoAbastecimento(prev => prev + 1);
      }, 1000);
    } else {
      // Parar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [abastecimentoAtivo]);

  // Buscar operação ativa
  const buscarOperacaoAtiva = async () => {
    try {
      setLoading(true);
      console.log("Tentando buscar operação ativa...");
      const response = await axios.get(`${API_URL}/operacoes/ativa`);

      console.log("Resposta da API:", response.data);

      if (response.data) {
        setOperacaoAtiva(response.data);
        console.log("Operação ativa definida com ID:", response.data.id);
      } else {
        setOperacaoAtiva(null);
        console.log("API retornou dados vazios para operação ativa");
      }

      setError(null);
    } catch (err) {
      console.log('Erro ao buscar operação ativa:', err.message);
      // Importante: verificar se há uma mensagem específica no erro da API
      console.log('Detalhes do erro:', err.response?.data);
      setOperacaoAtiva(null);
    } finally {
      setLoading(false);
    }
  };

  // Buscar abastecimentos
  const buscarAbastecimentos = async () => {
    try {
      setLoading(true);
      try {
        // Tentativa de buscar abastecimentos
        const response = await axios.get(`${API_URL}/abastecimentos`);

        if (response.data) {
          setAbastecimentos(response.data);

          // Verificar se existe um abastecimento ativo
          const ativo = response.data.find(a => !a.fim_abastecimento);
          if (ativo) {
            setAbastecimentoAtivo(ativo);
            // Calcular tempo decorrido para o timer
            const inicio = new Date(ativo.inicio_abastecimento);
            const segundosDecorridos = Math.floor((new Date() - inicio) / 1000);
            setTempoAbastecimento(segundosDecorridos);
          } else {
            setAbastecimentoAtivo(null);
            setTempoAbastecimento(0);
          }
        } else {
          setAbastecimentos([]);
          setAbastecimentoAtivo(null);
        }
      } catch (err) {
        // Se a rota não existe, definir arrays vazios
        console.log("Erro ao buscar abastecimentos:", err.message);
        if (err.response && err.response.status === 404) {
          console.log("Endpoint de abastecimentos não encontrado. API precisa ser implementada.");
          // Enquanto a API não estiver pronta, usar arrays vazios
          setAbastecimentos([]);
          setAbastecimentoAtivo(null);
        } else {
          // Para outros erros, mostrar mensagem
          setError(`Erro ao buscar abastecimentos: ${err.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Iniciar abastecimento - abre o modal
  const iniciarAbastecimento = () => {
    // Verificar apenas se já existe um abastecimento ativo
    if (abastecimentoAtivo) {
      Alert.alert('Erro', 'Já existe um abastecimento em andamento.');
      return;
    }

    // Abrir modal para seleção de tipo
    setTipoAbastecimento('');
    setModalVisivel(true);
  };

  // Função para confirmar e criar o abastecimento
  const confirmarAbastecimento = async () => {
    if (!tipoAbastecimento) {
      Alert.alert('Erro', 'Por favor, selecione o tipo de abastecimento.');
      return;
    }

    try {
      setLoading(true);

      // Criar abastecimento sem exigir operação ativa
      const dados = {
        tipo_abastecimento: tipoAbastecimento,
        // Se tiver operação ativa, envia o ID, se não, envia null
        operacao_id: operacaoAtiva?.id || null
      };

      const response = await axios.post(`${API_URL}/abastecimentos`, dados);

      // Fechar modal
      setModalVisivel(false);

      // Recarregar dados
      await buscarAbastecimentos();

      // Mostrar mensagem de sucesso
      Alert.alert('Sucesso', 'Abastecimento iniciado com sucesso!');
    } catch (err) {
      console.error('Erro ao iniciar abastecimento:', err);
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível iniciar o abastecimento.');
    } finally {
      setLoading(false);
    }
  };

  // Finalizar abastecimento
  const finalizarAbastecimento = async () => {
    if (!abastecimentoAtivo) {
      Alert.alert('Erro', 'Não há abastecimento ativo para finalizar.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(`${API_URL}/abastecimentos/${abastecimentoAtivo.id}/finalizar`, {
        fim_abastecimento: new Date().toISOString(),
        tempo_abastecimento: tempoAbastecimento
      });

      if (response.data) {
        setAbastecimentoAtivo(null);
        buscarAbastecimentos();

        Alert.alert(
          'Sucesso',
          `Abastecimento finalizado! Tempo total: ${formatarTempo(tempoAbastecimento)}`
        );
      }
    } catch (err) {
      console.error('Erro ao finalizar abastecimento:', err);
      setError('Erro ao finalizar abastecimento');
      Alert.alert('Erro', 'Não foi possível finalizar o abastecimento.');
    } finally {
      setLoading(false);
    }
  };

  // Formatação de tempo (HH:MM:SS)
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

  // Formatação de data
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString();
  };

  // Verificar se existe uma operação ativa
  const verificarOperacaoAtiva = () => {
    if (!operacaoAtiva) {
      Alert.alert('Erro', 'Não há operação ativa. Inicie uma operação para continuar.');
      return false;
    }
    return true;
  };

  // Adicione uma função de debug para mostrar as condições dos estados
  useEffect(() => {
    console.log("DEBUG ABASTECIMENTO:");
    console.log("- operacaoAtiva:", operacaoAtiva ? "SIM" : "NÃO");
    console.log("- abastecimentoAtivo:", abastecimentoAtivo ? "SIM" : "NÃO");
    console.log("- Botão deve aparecer:", operacaoAtiva && !abastecimentoAtivo);
  }, [operacaoAtiva, abastecimentoAtivo]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={abastecimentoAtivo?.tipo_abastecimento === 'AGUA' ? 'water' : 'flame'}
          size={40}
          color={abastecimentoAtivo?.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800'}
        />
        <Text style={styles.headerText}>Controle de Abastecimento</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            buscarOperacaoAtiva();
            buscarAbastecimentos();
          }}
        >
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Informações da operação ativa */}
      {operacaoAtiva ? (
        <View style={styles.operacaoCard}>
          <Text style={styles.operacaoTitle}>
            Operação #{operacaoAtiva.id} - {operacaoAtiva.tipo_operacao || 'Sem tipo'}
          </Text>
          <Text style={styles.operacaoInfo}>
            {operacaoAtiva.poco || 'Sem poço'} | {operacaoAtiva.cidade || 'Sem cidade'}
          </Text>
        </View>
      ) : (
        <View style={styles.semOperacaoCard}>
          <Ionicons name="alert-circle-outline" size={30} color="#888" />
          <Text style={styles.semOperacaoText}>Nenhuma operação ativa</Text>
          <Text style={styles.semOperacaoSubText}>
            Inicie uma operação para poder registrar abastecimentos
          </Text>
        </View>
      )}

      {/* Abastecimento ativo com timer */}
      {abastecimentoAtivo && (
        <View style={[
          styles.abastecimentoAtivoCard,
          { backgroundColor: abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? '#E3F2FD' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.abastecimentoAtivoTitle,
            { color: abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? '#0D47A1' : '#E65100' }
          ]}>
            Abastecimento de {abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? 'Água' : 'Combustível'} em andamento
          </Text>

          <View style={styles.iconContainer}>
            {abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? (
              <Image
                source={require('../assets/water.png')}
                style={styles.abastecimentoIcon}
              />
            ) : (
              <Image
                source={require('../assets/fuel.png')}
                style={styles.abastecimentoIcon}
              />
            )}
          </View>

          <Text style={[
            styles.abastecimentoAtivoTimer,
            { color: abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? '#1565C0' : '#F57C00' }
          ]}>
            {formatarTempo(tempoAbastecimento)}
          </Text>

          <Text style={styles.abastecimentoAtivoInicio}>
            Iniciado em: {formatarData(abastecimentoAtivo.inicio_abastecimento)}
          </Text>

          <TouchableOpacity
            style={[
              styles.finalizarButton,
              { backgroundColor: abastecimentoAtivo.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800' }
            ]}
            onPress={finalizarAbastecimento}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.finalizarButtonText}>FINALIZAR ABASTECIMENTO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botão para iniciar abastecimento - simplificado */}
      {!abastecimentoAtivo ? (
        <View style={{ marginVertical: 10, borderWidth: 0 }}>
          <Text style={{ marginBottom: 5, textAlign: 'center', color: '#666' }}>
            Clique abaixo para iniciar um abastecimento
          </Text>
          <TouchableOpacity
            style={[styles.iniciarButton, { elevation: 4, backgroundColor: '#2196F3' }]}
            onPress={iniciarAbastecimento}
            disabled={loading}
          >
            <Ionicons name="water" size={24} color="#fff" />
            <Text style={styles.iniciarButtonText}>INICIAR ABASTECIMENTO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          Já existe um abastecimento em andamento
        </Text>
      )}

      {/* Lista de abastecimentos anteriores */}
      <View style={styles.historicoContainer}>
        <Text style={styles.historicoTitle}>Histórico de Abastecimentos</Text>

        {abastecimentos.length === 0 && !loading ? (
          <View style={styles.semHistoricoContainer}>
            <Ionicons name="water" size={40} color="#ddd" />
            <Text style={styles.semHistoricoText}>Nenhum abastecimento registrado</Text>
          </View>
        ) : (
          <FlatList
            data={abastecimentos.filter(a => a.fim_abastecimento)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[
                styles.abastecimentoItem,
                { borderLeftColor: item.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800' }
              ]}>
                <View style={styles.abastecimentoItemHeader}>
                  <Text style={styles.abastecimentoItemTipo}>
                    <Ionicons
                      name={item.tipo_abastecimento === 'AGUA' ? 'water' : 'flame'}
                      size={16}
                      color={item.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800'}
                    />
                    {' '}
                    {item.tipo_abastecimento === 'AGUA' ? 'Água' : 'Combustível'}
                  </Text>

                  <View style={[
                    styles.abastecimentoItemTempoContainer,
                    { backgroundColor: item.tipo_abastecimento === 'AGUA' ? '#E3F2FD' : '#FFF3E0' }
                  ]}>
                    <Ionicons name="time-outline" size={16} color={item.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800'} />
                    <Text style={[
                      styles.abastecimentoItemTempo,
                      { color: item.tipo_abastecimento === 'AGUA' ? '#1565C0' : '#F57C00' }
                    ]}>
                      {formatarTempo(item.tempo_abastecimento)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.abastecimentoItemData}>
                  {formatarData(item.inicio_abastecimento)} até {formatarData(item.fim_abastecimento)}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal para escolher tipo de abastecimento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Tipo de Abastecimento</Text>

            <View style={styles.tiposContainer}>
              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoAbastecimento === 'COMBUSTIVEL' && styles.tipoButtonActive
                ]}
                onPress={() => setTipoAbastecimento('COMBUSTIVEL')}
              >
                <Ionicons
                  name="speedometer"
                  size={24}
                  color={tipoAbastecimento === 'COMBUSTIVEL' ? '#fff' : '#333'}
                />
                <Text style={[
                  styles.tipoText,
                  tipoAbastecimento === 'COMBUSTIVEL' && styles.tipoTextActive
                ]}>Combustível</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoAbastecimento === 'AGUA' && styles.tipoButtonActive
                ]}
                onPress={() => setTipoAbastecimento('AGUA')}
              >
                <Ionicons
                  name="water"
                  size={24}
                  color={tipoAbastecimento === 'AGUA' ? '#fff' : '#333'}
                />
                <Text style={[
                  styles.tipoText,
                  tipoAbastecimento === 'AGUA' && styles.tipoTextActive
                ]}>Água</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmarAbastecimento}
                disabled={!tipoAbastecimento}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Indicador de carregamento */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={styles.loader}
        />
      )}

      {/* Mensagem de erro */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  refreshButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
  },
  operacaoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  operacaoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  operacaoInfo: {
    fontSize: 14,
    color: '#666',
  },
  semOperacaoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  semOperacaoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
  },
  semOperacaoSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  abastecimentoAtivoCard: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  abastecimentoAtivoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  iconContainer: {
    marginVertical: 10,
  },
  abastecimentoIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  abastecimentoAtivoTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  abastecimentoAtivoInicio: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  iniciarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  iniciarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  finalizarButton: {
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 2,
  },
  finalizarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historicoContainer: {
    flex: 1,
    marginTop: 10,
  },
  historicoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  semHistoricoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  semHistoricoText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  abastecimentoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  abastecimentoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  abastecimentoItemTipo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  abastecimentoItemTempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  abastecimentoItemTempo: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  abastecimentoItemData: {
    fontSize: 12,
    color: '#888',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  tiposContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  tipoButton: {
    alignItems: 'center',
    padding: 10,
    width: '45%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  tipoButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  tipoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  tipoTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCDD2',
    padding: 12,
    borderRadius: 6,
    marginTop: 15,
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 10,
    flex: 1,
  },
});