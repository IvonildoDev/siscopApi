import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function HomeScreen({ navigation }) {
  const [equipeAtiva, setEquipeAtiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operacaoAtiva, setOperacaoAtiva] = useState(null);

  // Use useEffect para buscar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Atualizar quando a tela ganhar foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarDados();
    });
    return unsubscribe;
  }, [navigation]);

  // Função para carregar dados
  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar equipe ativa
      const resEquipe = await axios.get(`${API_URL}/equipes/ativa`);
      setEquipeAtiva(resEquipe.data);

      // Buscar operação ativa
      const resOperacao = await axios.get(`${API_URL}/operacoes/ativa`);
      setOperacaoAtiva(resOperacao.data);

      setError(null);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // Traduzir etapa para texto mais amigável
  const traduzirEtapa = (etapa) => {
    const traducoes = {
      'MOBILIZACAO': 'Mobilização',
      'AGUARDANDO_OPERACAO': 'Aguardando operação',
      'OPERACAO': 'Em operação',
      'AGUARDANDO_DESMOBILIZACAO': 'Aguardando desmob.',
      'DESMOBILIZACAO': 'Desmobilização',
      'FINALIZADO': 'Finalizada'
    };

    return traducoes[etapa] || etapa;
  };

  // Opções do menu principal - removidos os itens que agora estão na barra inferior
  const menuOptions = [
    {
      id: '1',
      title: 'Cadastro de Equipe',
      icon: 'people',
      color: '#9C27B0',
      onPress: () => navigation.navigate('CadastroEquipe')
    },
    {
      id: '2',
      title: 'Resumo de Atividades',
      icon: 'document-text',
      color: '#2196F3',
      onPress: () => navigation.navigate('ResumoAtividades')
    },
    {
      id: '3',
      title: 'Refeição',
      icon: 'restaurant',
      color: '#F44336',
      onPress: () => navigation.navigate('Refeicao')
    }
  ];

  // Renderizar card de equipe ativa
  const renderEquipeAtiva = () => {
    if (!equipeAtiva) {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('CadastroEquipe')}
        >
          <Ionicons name="people" size={24} color="#9C27B0" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Nenhuma equipe ativa</Text>
            <Text style={styles.cardSubtitle}>Toque para cadastrar equipe</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CadastroEquipe')}
      >
        <Ionicons name="people" size={24} color="#9C27B0" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Equipe Ativa</Text>
          <Text style={styles.cardSubtitle}>
            {equipeAtiva.operador} / {equipeAtiva.auxiliar}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>
    );
  };

  // Renderizar card da operação ativa
  const renderOperacaoAtiva = () => {
    if (!operacaoAtiva) {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Operacoes')}
        >
          <Ionicons name="build" size={24} color="#4CAF50" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Nenhuma operação em andamento</Text>
            <Text style={styles.cardSubtitle}>Toque para iniciar operação</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      );
    }

    const etapaTraduzida = traduzirEtapa(operacaoAtiva.etapa_atual);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Operacoes')}
      >
        <Ionicons name="build" size={24} color="#4CAF50" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {operacaoAtiva.tipo_operacao} - {operacaoAtiva.poco}
          </Text>
          <Text style={styles.cardSubtitle}>
            {etapaTraduzida} - {operacaoAtiva.cidade}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SICOP</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={carregarDados}
          >
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : (
          <>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#D32F2F" />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Status Atual</Text>
            {renderEquipeAtiva()}
            {renderOperacaoAtiva()}

            <Text style={styles.sectionTitle}>Menu</Text>
            <FlatList
              data={menuOptions}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: item.color }]}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon} size={32} color="#fff" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.menuGrid}
              scrollEnabled={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingBottom: 32, // ou mais, conforme a altura da tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  loader: {
    marginTop: 50,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menuGrid: {
    paddingBottom: 20,
  },
  menuItem: {
    flex: 1,
    margin: 8,
    height: 100,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuItemText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  }
});