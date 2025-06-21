import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function CadastroEquipeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para formulário
  const [operador, setOperador] = useState('');
  const [auxiliar, setAuxiliar] = useState('');
  const [unidade, setUnidade] = useState('');
  const [placa, setPlaca] = useState('');

  // Função para cadastrar equipe
  const cadastrarEquipe = async () => {
    // Validação de campos
    if (!operador.trim()) {
      setError('O nome do operador é obrigatório');
      return;
    }

    if (!auxiliar.trim()) {
      setError('O nome do auxiliar é obrigatório');
      return;
    }

    if (!unidade.trim()) {
      setError('O nome da unidade é obrigatório');
      return;
    }

    if (!placa.trim()) {
      setError('A placa do veículo é obrigatória');
      return;
    }

    // Regex para validar placa no novo padrão brasileiro (ABC1234 ou ABC1D23)
    const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;
    if (!placaRegex.test(placa)) {
      setError('Formato de placa inválido. Use o formato ABC1234 ou ABC1D23');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Enviando dados de equipe:', { operador, auxiliar, unidade, placa });

      const response = await axios.post(`${API_URL}/equipes`, {
        operador,
        auxiliar,
        unidade,
        placa
      });

      console.log('Resposta:', response.data);

      // Limpar campos após sucesso
      setOperador('');
      setAuxiliar('');
      setUnidade('');
      setPlaca('');

      // Navegar para a Home
      Alert.alert(
        "Sucesso!",
        "Equipe cadastrada com sucesso.",
        [{ text: "OK", onPress: () => navigation.navigate('Home') }]
      );

    } catch (err) {
      console.error('Erro completo:', err);

      let mensagem = 'Erro ao cadastrar equipe: ';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={30} color="#4CAF50" />
        <Text style={styles.headerText}>Cadastro de Equipe</Text>
      </View>

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
          <Text style={styles.label}>Nome do Operador</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do operador"
              value={operador}
              onChangeText={setOperador}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Auxiliar</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do auxiliar"
              value={auxiliar}
              onChangeText={setAuxiliar}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Unidade</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da unidade"
              value={unidade}
              onChangeText={setUnidade}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Placa do Veículo</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="car" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ABC-1234"
              value={placa}
              onChangeText={text => setPlaca(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={cadastrarEquipe}
          >
            <Text style={styles.buttonText}>ENTRAR</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    marginBottom: 30,
    marginTop: 1,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
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
    marginBottom: 5,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
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