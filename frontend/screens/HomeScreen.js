import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function HomeScreen({ navigation }) {
  const [equipeAtiva, setEquipeAtiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operacaoAtiva, setOperacaoAtiva] = useState(null); // Inicializar como null

  // Menu de opções atualizado
  const menuOptions = [
    { id: '1', title: 'Operações', icon: 'build-outline', color: '#4CAF50', screen: 'Operacoes' },
    { id: '2', title: 'Deslocamento', icon: 'navigate-circle-outline', color: '#2196F3', screen: 'Deslocamento' },
    { id: '3', title: 'Aguardo', icon: 'time-outline', color: '#FF9800', screen: 'Aguardo' },
    { id: '4', title: 'Resumo', icon: 'document-text-outline', color: '#673AB7', screen: 'Resumo' },
  ];

  // Buscar equipe ativa e operação ativa quando o componente for montado
  useEffect(() => {
    fetchEquipeAtiva();
    buscarOperacaoAtiva();

    // Atualizar quando a tela recebe foco
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEquipeAtiva();
      buscarOperacaoAtiva();
    });

    return unsubscribe;
  }, [navigation]);

  // Função para buscar equipe ativa com melhor tratamento de erros
  const fetchEquipeAtiva = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/equipes/ativa`);
      setEquipeAtiva(response.data);

    } catch (err) {
      console.error('Erro ao buscar equipe:', err);

      // Tratamento específico baseado no erro
      if (err.response) {
        // O servidor respondeu com um código de status diferente de 2xx
        if (err.response.status === 404) {
          // Não há equipe ativa - isso é um estado válido, não um erro
          setEquipeAtiva(null);
          setError(null);
        } else {
          setError(`Erro do servidor: ${err.response.status}`);
        }
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        // Algo aconteceu na configuração da requisição
        setError(`Erro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar operação ativa
  const buscarOperacaoAtiva = async () => {
    try {
      const response = await axios.get(`${API_URL}/operacoes/ativa`);

      if (response.data) {
        setOperacaoAtiva(response.data);
      } else {
        setOperacaoAtiva(null);
      }
    } catch (err) {
      console.log('Nenhuma operação ativa encontrada');
      setOperacaoAtiva(null);
    }
  };

  // Função para verificar operação ativa antes de navegar - MODIFICADA
  const verificarOperacaoENavegar = (screen) => {
    // Removida a verificação de operação ativa
    navigation.navigate(screen);
  };

  // Função para verificar operação ativa (mantida para compatibilidade) - MODIFICADA
  const verificarOperacaoAtiva = () => {
    return true; // Sempre retorna true, ignorando a verificação
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchEquipeAtiva}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!equipeAtiva) {
    return (
      <View style={styles.centered}>
        <Ionicons name="people-outline" size={50} color="#666" />
        <Text style={styles.noEquipeText}>Nenhuma equipe está ativa no momento</Text>
        <TouchableOpacity
          style={styles.cadastrarButton}
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.cadastrarButtonText}>Cadastrar Equipe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Informações da equipe */}
      <View style={styles.equipeCard}>
        <Text style={styles.equipeTitle}>Equipe Ativa</Text>
        <View style={styles.equipeInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Operador:</Text>
            <Text style={styles.infoValue}>{equipeAtiva.operador}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Auxiliar:</Text>
            <Text style={styles.infoValue}>{equipeAtiva.auxiliar}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Unidade:</Text>
            <Text style={styles.infoValue}>{equipeAtiva.unidade}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="car" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Placa:</Text>
            <Text style={styles.infoValue}>{equipeAtiva.placa}</Text>
          </View>
        </View>
      </View>

      {/* Informações da operação ativa (se houver) */}
      {operacaoAtiva ? (
        <View style={styles.operacaoCard}>
          <View style={styles.operacaoHeader}>
            <Ionicons name="build" size={20} color="#4CAF50" />
            <Text style={styles.operacaoTitle}>Operação Ativa</Text>
          </View>
          <View style={styles.operacaoInfo}>
            <Text style={styles.operacaoTipo}>
              {operacaoAtiva.tipo_operacao || 'Tipo não especificado'} - Poço: {operacaoAtiva.poco || 'N/A'}
            </Text>
            <Text style={styles.operacaoCidade}>
              <Ionicons name="location" size={14} color="#666" /> {operacaoAtiva.cidade || 'Local não especificado'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.semOperacaoCard}>
          <Ionicons name="alert-circle-outline" size={22} color="#FFC107" />
          <Text style={styles.semOperacaoText}>Nenhuma operação ativa. Inicie uma operação.</Text>
        </View>
      )}

      {/* Menu de opções */}
      <Text style={styles.menuTitle}>Menu de Opções</Text>
      <FlatList
        data={menuOptions}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: item.color }]}
            onPress={() => verificarOperacaoENavegar(item.screen)}
          >
            <Ionicons name={item.icon} size={40} color="#fff" />
            <Text style={styles.menuItemText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.menuGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  noEquipeText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cadastrarButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cadastrarButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  equipeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  equipeInfo: {
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  menuGrid: {
    padding: 8,
  },
  menuItem: {
    flex: 1,
    height: 130,
    margin: 8,
    padding: 15,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.23,
    shadowRadius: 6,
    elevation: 6,
  },
  menuItemText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
  },
  operacaoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  operacaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  operacaoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  operacaoInfo: {
    marginLeft: 28,
  },
  operacaoTipo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  operacaoCidade: {
    fontSize: 13,
    color: '#666',
  },
  semOperacaoCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  semOperacaoText: {
    fontSize: 14,
    color: '#F57F17',
    marginLeft: 8,
    flex: 1,
  },
});