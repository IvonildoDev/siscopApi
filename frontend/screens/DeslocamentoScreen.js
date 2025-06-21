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
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function DeslocamentoScreen({ navigation, route }) {
  // Estados para controlar o formulário
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para controle de deslocamento
  const [deslocamentoAtivo, setDeslocamentoAtivo] = useState(false);
  const [deslocamentoId, setDeslocamentoId] = useState(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [horaInicio, setHoraInicio] = useState(null);
  
  // Referência para timer
  const timerRef = useRef(null);
  
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

  // Iniciar contagem de tempo
  useEffect(() => {
    if (deslocamentoAtivo) {
      timerRef.current = setInterval(() => {
        setTempoDecorrido(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [deslocamentoAtivo]);
  
  // Verificar se há deslocamento ativo ao entrar na tela
  useEffect(() => {
    verificarDeslocamentoAtivo();
  }, []);
  
  // Função para verificar se há deslocamento ativo
  const verificarDeslocamentoAtivo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/deslocamentos/ativo`);
      
      if (response.data) {
        const deslocamento = response.data;
        setDeslocamentoAtivo(true);
        setDeslocamentoId(deslocamento.id);
        setOrigem(deslocamento.origem);
        setDestino(deslocamento.destino);
        setKmInicial(deslocamento.km_inicial.toString());
        setObservacoes(deslocamento.observacoes || '');
        
        // Calcular tempo decorrido
        const dataInicio = new Date(deslocamento.hora_inicio);
        setHoraInicio(dataInicio);
        const agora = new Date();
        const segundosDecorridos = Math.floor((agora - dataInicio) / 1000);
        setTempoDecorrido(segundosDecorridos);
      }
      
    } catch (err) {
      // Se não encontrou deslocamento ativo, não é um erro
      if (err.response && err.response.status === 404) {
        console.log('Nenhum deslocamento ativo encontrado');
      } else {
        console.error('Erro ao verificar deslocamento ativo:', err);
        setError('Erro ao verificar deslocamento ativo');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Iniciar deslocamento
  const iniciarDeslocamento = async () => {
    // Validação de campos
    if (!origem.trim()) {
      setError('A origem é obrigatória');
      return;
    }
    
    if (!destino.trim()) {
      setError('O destino é obrigatório');
      return;
    }
    
    if (!kmInicial.trim()) {
      setError('O KM inicial é obrigatório');
      return;
    }
    
    // Validar se KM inicial é um número
    const kmInicialNum = parseFloat(kmInicial);
    if (isNaN(kmInicialNum)) {
      setError('O KM inicial deve ser um número válido');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataDeslocamento = {
        origem,
        destino,
        km_inicial: kmInicialNum,
        observacoes,
        status: 'EM_ANDAMENTO',
        hora_inicio: new Date().toISOString()
      };
      
      console.log('Iniciando deslocamento:', dataDeslocamento);
      
      const response = await axios.post(`${API_URL}/deslocamentos`, dataDeslocamento);
      
      console.log('Deslocamento iniciado:', response.data);
      
      // Atualizar estado
      setDeslocamentoAtivo(true);
      setDeslocamentoId(response.data.id);
      setHoraInicio(new Date());
      setTempoDecorrido(0);
      
      Alert.alert(
        "Deslocamento Iniciado",
        "O deslocamento foi iniciado com sucesso!",
        [{ text: "OK" }]
      );
      
    } catch (err) {
      console.error('Erro ao iniciar deslocamento:', err);
      
      let mensagem = 'Erro ao iniciar deslocamento: ';
      
      if (err.response) {
        const errorDetails = err.response.data?.error || err.message;
        mensagem += `${errorDetails} (${err.response.status})`;
      } else if (err.request) {
        mensagem += 'Sem resposta do servidor';
      } else {
        mensagem += err.message;
      }
      
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };
  
  // Finalizar deslocamento
  const finalizarDeslocamento = async () => {
    // Validação do KM final
    if (!kmFinal.trim()) {
      setError('O KM final é obrigatório');
      return;
    }
    
    const kmFinalNum = parseFloat(kmFinal);
    if (isNaN(kmFinalNum)) {
      setError('O KM final deve ser um número válido');
      return;
    }
    
    const kmInicialNum = parseFloat(kmInicial);
    if (kmFinalNum < kmInicialNum) {
      setError('O KM final não pode ser menor que o KM inicial');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataFinalizacao = {
        km_final: kmFinalNum,
        hora_fim: new Date().toISOString(),
        status: 'FINALIZADO',
        tempo_total: tempoDecorrido // em segundos
      };
      
      console.log('Finalizando deslocamento:', dataFinalizacao);
      
      const response = await axios.put(`${API_URL}/deslocamentos/${deslocamentoId}/finalizar`, dataFinalizacao);
      
      console.log('Deslocamento finalizado:', response.data);
      
      // Resetar estados
      setDeslocamentoAtivo(false);
      setDeslocamentoId(null);
      clearInterval(timerRef.current);
      
      // Limpar campos do formulário
      setOrigem('');
      setDestino('');
      setKmInicial('');
      setKmFinal('');
      setObservacoes('');
      setTempoDecorrido(0);
      
      Alert.alert(
        "Deslocamento Finalizado",
        `O deslocamento foi finalizado com sucesso!\n
        Tempo total: ${formatarTempo(tempoDecorrido)}\n
        Distância percorrida: ${(kmFinalNum - kmInicialNum).toFixed(1)} km`,
        [{ text: "OK", onPress: () => navigation.navigate('Registros') }]
      );
      
    } catch (err) {
      console.error('Erro ao finalizar deslocamento:', err);
      
      let mensagem = 'Erro ao finalizar deslocamento: ';
      
      if (err.response) {
        const errorDetails = err.response.data?.error || err.message;
        mensagem += `${errorDetails} (${err.response.status})`;
      } else if (err.request) {
        mensagem += 'Sem resposta do servidor';
      } else {
        mensagem += err.message;
      }
      
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancelar deslocamento (função emergencial)
  const cancelarDeslocamento = async () => {
    Alert.alert(
      "Confirmar Cancelamento",
      "Tem certeza que deseja cancelar este deslocamento? Esta ação não pode ser desfeita.",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", style: "destructive", onPress: async () => {
          try {
            setLoading(true);
            await axios.put(`${API_URL}/deslocamentos/${deslocamentoId}/cancelar`);
            
            // Resetar estados
            setDeslocamentoAtivo(false);
            setDeslocamentoId(null);
            clearInterval(timerRef.current);
            
            // Limpar campos do formulário
            setOrigem('');
            setDestino('');
            setKmInicial('');
            setKmFinal('');
            setObservacoes('');
            setTempoDecorrido(0);
            
            Alert.alert("Deslocamento Cancelado", "O deslocamento foi cancelado com sucesso.");
          } catch (err) {
            console.error('Erro ao cancelar deslocamento:', err);
            setError('Erro ao cancelar deslocamento: ' + err.message);
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="navigate-circle" size={40} color="#4CAF50" />
          <Text style={styles.headerText}>
            {deslocamentoAtivo ? 'Deslocamento em Andamento' : 'Novo Deslocamento'}
          </Text>
        </View>
        
        {/* Exibir timer quando deslocamento estiver ativo */}
        {deslocamentoAtivo && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Tempo de Deslocamento</Text>
            <Text style={styles.timer}>{formatarTempo(tempoDecorrido)}</Text>
          </View>
        )}
        
        {/* Mensagem de erro */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#D32F2F" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.formContainer}>
          {/* Formulário */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origem</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Local de origem"
                value={origem}
                onChangeText={setOrigem}
                editable={!deslocamentoAtivo}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destino</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Local de destino"
                value={destino}
                onChangeText={setDestino}
                editable={!deslocamentoAtivo}
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>KM Inicial</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="speedometer-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={kmInicial}
                  onChangeText={setKmInicial}
                  keyboardType="numeric"
                  editable={!deslocamentoAtivo}
                />
              </View>
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>KM Final</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="speedometer" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={kmFinal}
                  onChangeText={setKmFinal}
                  keyboardType="numeric"
                  editable={deslocamentoAtivo}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações (opcional)</Text>
            <View style={[styles.inputWrapper, { height: 100 }]}>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Adicione observações sobre o deslocamento"
                value={observacoes}
                onChangeText={setObservacoes}
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
          ) : (
            <>
              {!deslocamentoAtivo ? (
                // Botão para iniciar o deslocamento
                <TouchableOpacity
                  style={styles.button}
                  onPress={iniciarDeslocamento}
                >
                  <Ionicons name="play-circle" size={24} color="#fff" />
                  <Text style={styles.buttonText}>INICIAR DESLOCAMENTO</Text>
                </TouchableOpacity>
              ) : (
                // Botão para finalizar o deslocamento
                <View>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF9800' }]}
                    onPress={finalizarDeslocamento}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.buttonText}>FINALIZAR DESLOCAMENTO</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#F44336', marginTop: 10 }]}
                    onPress={cancelarDeslocamento}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                    <Text style={styles.buttonText}>CANCELAR DESLOCAMENTO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
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
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
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
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
});