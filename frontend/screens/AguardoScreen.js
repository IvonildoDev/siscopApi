import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// URL da API (certifique-se que seja a mesma em toda aplicação)
const API_URL = 'http://192.168.1.106:3000';

export default function AguardoScreen({ navigation, route }) {
  // Estados para controlar a tela
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para dados do aguardo
  const [operacaoAtiva, setOperacaoAtiva] = useState(null);
  const [aguardos, setAguardos] = useState([]);
  const [aguardoAtivo, setAguardoAtivo] = useState(null);

  // Estados para o modal
  const [motivoAguardo, setMotivoAguardo] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);

  // Timer para aguardo ativo
  const [tempoAguardo, setTempoAguardo] = useState(0);
  const timerAguardo = useRef(null);

  // Adicione este estado para armazenar as observações
  const [observacoes, setObservacoes] = useState('');

  // Buscar operação ativa e aguardos ao carregar a tela
  useEffect(() => {
    buscarOperacaoAtiva();
    buscarAguardos();
  }, []);

  // Atualizar quando a tela receber foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      buscarOperacaoAtiva();
      buscarAguardos();
    });

    return unsubscribe;
  }, [navigation]);

  // Controlar timer do aguardo ativo
  useEffect(() => {
    if (aguardoAtivo && !aguardoAtivo.fim_aguardo) {
      // Iniciar o cronômetro
      timerAguardo.current = setInterval(() => {
        setTempoAguardo(prev => prev + 1);
      }, 1000);
    } else {
      // Limpar o cronômetro
      if (timerAguardo.current) {
        clearInterval(timerAguardo.current);
      }
    }

    return () => {
      if (timerAguardo.current) {
        clearInterval(timerAguardo.current);
      }
    };
  }, [aguardoAtivo]);

  // Função para buscar operação ativa
  const buscarOperacaoAtiva = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/operacoes/ativa`);

      if (response.data) {
        setOperacaoAtiva(response.data);
      } else {
        setOperacaoAtiva(null);
      }
    } catch (err) {
      console.log('Nenhuma operação ativa encontrada');
      setOperacaoAtiva(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar aguardos da operação ativa
  const buscarAguardos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/aguardos`);

      if (response.data) {
        setAguardos(response.data);

        // Verificar se existe aguardo ativo
        const aguardoAtivo = response.data.find(a => !a.fim_aguardo);
        if (aguardoAtivo) {
          setAguardoAtivo(aguardoAtivo);

          // Calcular tempo decorrido
          const inicio = new Date(aguardoAtivo.inicio_aguardo);
          const agora = new Date();
          const segundosDecorridos = Math.floor((agora - inicio) / 1000);
          setTempoAguardo(segundosDecorridos);
        } else {
          setAguardoAtivo(null);
          setTempoAguardo(0);
        }
      } else {
        setAguardos([]);
      }
    } catch (err) {
      console.error('Erro ao buscar aguardos:', err);
      setAguardos([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para iniciar um novo aguardo
  const iniciarAguardo = () => {
    // Remover verificação de operação ativa
    // if (!verificarOperacaoAtiva()) {
    //   return;
    // }

    // Verificar apenas se já existe aguardo ativo
    if (aguardoAtivo) {
      Alert.alert('Erro', 'Já existe um aguardo em andamento.');
      return;
    }

    // Abrir modal para entrada do motivo
    setMotivoAguardo('');
    setModalVisivel(true);
  };

  // Função para confirmar e criar o aguardo
  const confirmarAguardo = async () => {
    if (!motivoAguardo.trim()) {
      Alert.alert('Erro', 'Por favor, informe o motivo do aguardo.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/aguardos`, {
        motivo: motivoAguardo,
        operacao_id: operacaoAtiva?.id || null // Enviar ID da operação se existir, senão null
      });

      // Fechar modal
      setModalVisivel(false);

      // Buscar aguardo recém-criado
      await buscarAguardos();

      // Mostrar mensagem de sucesso
      Alert.alert('Sucesso', 'Aguardo iniciado com sucesso!');

    } catch (err) {
      console.error('Erro ao iniciar aguardo:', err);
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível iniciar o aguardo.');
    } finally {
      setLoading(false);
    }
  };

  // Função para finalizar aguardo - adicionar ou modificar para melhor tratamento de erros
  const finalizarAguardo = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!aguardoAtivo || !aguardoAtivo.id) {
        setError('Nenhum aguardo ativo encontrado');
        return;
      }

      // Verificar se observações é undefined e passar um objeto vazio se for o caso
      const payload = {};
      if (observacoes && observacoes.trim()) {
        payload.observacoes = observacoes;
      }

      console.log(`Finalizando aguardo ${aguardoAtivo.id} com payload:`, payload);

      const response = await axios.put(
        `${API_URL}/aguardos/${aguardoAtivo.id}/finalizar`,
        payload
      );

      console.log('Resposta da API ao finalizar aguardo:', response.data);

      // Atualizar estados
      setAguardoAtivo(null);
      setTempoAguardo(0);

      // Mostrar o tempo de aguardo ao usuário
      Alert.alert(
        "Aguardo Finalizado",
        `O aguardo foi finalizado com sucesso!\nTempo total: ${formatarTempo(response.data.tempo_aguardo || 0)}`,
        [{ text: "OK", onPress: () => navigation.navigate('Home') }]
      );

      // Atualizar a lista após finalizar
      await buscarAguardos();

    } catch (err) {
      console.error('Erro completo ao finalizar aguardo:', JSON.stringify(err, null, 2));
      let mensagemErro = 'Erro ao finalizar aguardo';

      if (err.response) {
        // O servidor retornou um código de status diferente de 2xx
        console.error(`Erro ${err.response.status} ao finalizar aguardo:`, err.response.data);

        if (err.response.data && err.response.data.error) {
          mensagemErro += `: ${err.response.data.error}`;
        } else {
          mensagemErro += ` (Código: ${err.response.status})`;
        }

        // Para erro 500, adicione mais detalhes
        if (err.response.status === 500) {
          mensagemErro += '. Erro interno do servidor. Tente novamente em alguns instantes ou contate o suporte.';
        }
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Sem resposta do servidor ao finalizar aguardo:', err.request);
        mensagemErro += ': Sem resposta do servidor. Verifique sua conexão.';
      } else {
        // Erro na configuração da requisição
        console.error('Erro ao configurar requisição:', err.message);
        mensagemErro += `: ${err.message}`;
      }

      setError(mensagemErro);

      Alert.alert(
        "Erro",
        mensagemErro,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar o tempo em HH:MM:SS
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

  // Formatar data para exibição
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

  // Adicione este código antes do return para debug
  useEffect(() => {
    console.log("Estado operacaoAtiva:", operacaoAtiva ? operacaoAtiva.id : 'null');
    console.log("Estado aguardoAtivo:", aguardoAtivo ? aguardoAtivo.id : 'null');
    console.log("Deve mostrar botão:", operacaoAtiva && !aguardoAtivo);
  }, [operacaoAtiva, aguardoAtivo]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={40} color="#FFC107" />
        <Text style={styles.headerText}>Controle de Aguardo</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            buscarOperacaoAtiva();
            buscarAguardos();
          }}
        >
          <Ionicons name="refresh" size={24} color="#FFC107" />
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
            Inicie uma operação para poder registrar aguardos
          </Text>
        </View>
      )}

      {/* Timer do aguardo ativo */}
      {aguardoAtivo && (
        <View style={styles.aguardoAtivoCard}>
          <Text style={styles.aguardoAtivoTitle}>Aguardo em andamento</Text>
          <Text style={styles.aguardoAtivoTimer}>{formatarTempo(tempoAguardo)}</Text>
          <Text style={styles.aguardoAtivoMotivo}>{aguardoAtivo.motivo}</Text>
          <Text style={styles.aguardoAtivoInicio}>
            Iniciado em: {formatarData(aguardoAtivo.inicio_aguardo)}
          </Text>

          {/* Campo de observações para finalização do aguardo */}
          <TextInput
            style={styles.observacoesInput}
            placeholder="Observações (opcional)"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline={true}
            numberOfLines={2}
          />

          <TouchableOpacity
            style={styles.finalizarButton}
            onPress={finalizarAguardo}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.finalizarButtonText}>FINALIZAR AGUARDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botão para iniciar novo aguardo - simplificado */}
      {!aguardoAtivo && (
        <View style={{ marginVertical: 10, borderWidth: 0 }}>
          <Text style={{ marginBottom: 5, textAlign: 'center', color: '#666' }}>
            Clique abaixo para iniciar um aguardo
          </Text>
          <TouchableOpacity
            style={[styles.iniciarButton, { elevation: 4, backgroundColor: '#FF9800' }]}
            onPress={iniciarAguardo}
            disabled={loading}
          >
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.iniciarButtonText}>INICIAR AGUARDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de aguardos anteriores */}
      <View style={styles.historicoContainer}>
        <Text style={styles.historicoTitle}>Histórico de Aguardos</Text>

        {aguardos.length === 0 && !loading ? (
          <View style={styles.semHistoricoContainer}>
            <Ionicons name="time-outline" size={40} color="#ddd" />
            <Text style={styles.semHistoricoText}>Nenhum aguardo registrado</Text>
          </View>
        ) : (
          <FlatList
            data={aguardos.filter(a => a.fim_aguardo)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.aguardoItem}>
                <View style={styles.aguardoItemHeader}>
                  <Text style={styles.aguardoItemMotivo}>{item.motivo}</Text>
                  <View style={styles.aguardoItemTempoContainer}>
                    <Ionicons name="time-outline" size={16} color="#FFC107" />
                    <Text style={styles.aguardoItemTempo}>
                      {formatarTempo(item.tempo_aguardo)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.aguardoItemData}>
                  {formatarData(item.inicio_aguardo)} até {formatarData(item.fim_aguardo)}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal para informar motivo do aguardo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Motivo do Aguardo</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Digite o motivo do aguardo (obrigatório)"
              value={motivoAguardo}
              onChangeText={setMotivoAguardo}
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmarAguardo}
              >
                <Text style={styles.modalButtonConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading indicator */}
      {loading && (
        <ActivityIndicator size="large" color="#FFC107" style={styles.loader} />
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
  aguardoAtivoCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  aguardoAtivoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F57F17',
    marginBottom: 10,
  },
  iconContainer: {
    marginVertical: 10,
  },
  aguardoIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  aguardoAtivoTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  aguardoAtivoInicio: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  iniciarButton: {
    backgroundColor: '#FF9800',
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
    backgroundColor: '#FF9800',
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
  aguardoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  aguardoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  aguardoItemMotivo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  aguardoItemTempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aguardoItemTempo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F57F17',
    marginLeft: 4,
  },
  aguardoItemData: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelarButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmarButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    marginLeft: 5,
    alignItems: 'center',
  },
  confirmarButtonDisabled: {
    backgroundColor: '#FFB74D',
  },
  confirmarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  observacoesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
    marginRight: 5,
  },
  modalButtonConfirm: {
    backgroundColor: '#FF9800',
    marginLeft: 5,
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});