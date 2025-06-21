import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function RegistrosScreen({ navigation }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios', 'deslocamentos' ou 'operacoes'
    const [deslocamentos, setDeslocamentos] = useState([]);
    const [operacoes, setOperacoes] = useState([]);

    // Buscar os registros quando o componente for montado
    useEffect(() => {
        if (activeTab === 'usuarios') {
            fetchRegistros();
        } else if (activeTab === 'deslocamentos') {
            fetchDeslocamentos();
        } else if (activeTab === 'operacoes') {
            fetchOperacoes();
        }
    }, [activeTab]);

    // Função para buscar registros da API
    const fetchRegistros = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/usuarios`);
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar registros:', err);
            let mensagem = 'Erro ao carregar registros: ';

            if (err.response) {
                mensagem += `Erro ${err.response.status}: ${err.response.data?.error || err.message}`;
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

    // Função para buscar deslocamentos
    const fetchDeslocamentos = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/deslocamentos`);
            setDeslocamentos(response.data);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar deslocamentos:', err);
            setError('Erro ao carregar deslocamentos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Função para buscar operações
    const fetchOperacoes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/operacoes`);
            setOperacoes(response.data);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar operações:', err);
            setError('Erro ao carregar operações: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Função para deletar um registro
    const deletarRegistro = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_URL}/usuarios/${id}`);
            // Recarregar lista
            fetchRegistros();
        } catch (err) {
            console.error('Erro ao deletar registro:', err);
            setError('Erro ao deletar registro: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando registros...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Registros Cadastrados</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchRegistros}
                >
                    <Ionicons name="refresh" size={24} color="#4CAF50" />
                </TouchableOpacity>
            </View>

            {/* Tabs para Usuários, Deslocamentos e Operações */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'usuarios' ? styles.activeTab : null]}
                    onPress={() => setActiveTab('usuarios')}
                >
                    <Text style={[styles.tabText, activeTab === 'usuarios' ? styles.activeTabText : null]}>Usuários</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'deslocamentos' ? styles.activeTab : null]}
                    onPress={() => setActiveTab('deslocamentos')}
                >
                    <Text style={[styles.tabText, activeTab === 'deslocamentos' ? styles.activeTabText : null]}>Deslocamentos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'operacoes' ? styles.activeTab : null]}
                    onPress={() => setActiveTab('operacoes')}
                >
                    <Text style={[styles.tabText, activeTab === 'operacoes' ? styles.activeTabText : null]}>Operações</Text>
                </TouchableOpacity>
            </View>

            {/* Mensagem de erro */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Lista de registros, deslocamentos ou operações */}
            {activeTab === 'usuarios' ? (
                <>
                    {/* Lista de registros */}
                    {data.length === 0 && !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.listHeader}>
                                <Text style={styles.headerText}>Nome</Text>
                                <Text style={styles.headerText}>Idade</Text>
                                <Text style={styles.headerText}>Ações</Text>
                            </View>

                            <FlatList
                                data={data}
                                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.item}>
                                        <Text style={styles.itemName}>{item.nome}</Text>
                                        <Text style={styles.itemIdade}>{item.idade} anos</Text>
                                        <TouchableOpacity
                                            onPress={() => deletarRegistro(item.id)}
                                            style={styles.deleteButton}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        </>
                    )}
                </>
            ) : activeTab === 'deslocamentos' ? (
                // Renderiza a lista de deslocamentos
                <FlatList
                    data={deslocamentos}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                        <View style={styles.deslocamentoItem}>
                            <View style={styles.deslocamentoHeader}>
                                <Text style={styles.deslocamentoRota}>
                                    <Ionicons name="locate" size={16} color="#4CAF50" /> {item.origem} → {item.destino}
                                </Text>
                                <View style={[styles.statusBadge,
                                item.status === 'FINALIZADO' ? styles.statusFinalizado :
                                    item.status === 'CANCELADO' ? styles.statusCancelado :
                                        styles.statusEmAndamento]}>
                                    <Text style={styles.statusText}>
                                        {item.status === 'EM_ANDAMENTO' ? 'Em Andamento' :
                                            item.status === 'FINALIZADO' ? 'Finalizado' :
                                                'Cancelado'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.deslocamentoInfo}>
                                <Text><Text style={styles.infoLabel}>KM Inicial:</Text> {item.km_inicial} km</Text>
                                {item.km_final && (
                                    <Text><Text style={styles.infoLabel}>KM Final:</Text> {item.km_final} km</Text>
                                )}
                                {item.km_inicial && item.km_final && (
                                    <Text><Text style={styles.infoLabel}>Distância:</Text> {(item.km_final - item.km_inicial).toFixed(1)} km</Text>
                                )}
                            </View>

                            <View style={styles.deslocamentoFooter}>
                                <Text style={styles.deslocamentoData}>
                                    <Ionicons name="calendar-outline" size={14} color="#666" /> {new Date(item.hora_inicio).toLocaleString()}
                                </Text>
                                {item.tempo_total && (
                                    <Text style={styles.deslocamentoTempo}>
                                        <Ionicons name="time-outline" size={14} color="#666" /> {Math.floor(item.tempo_total / 3600)}h{Math.floor((item.tempo_total % 3600) / 60)}m
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="navigate-circle-outline" size={60} color="#ccc" />
                                <Text style={styles.emptyText}>Nenhum deslocamento encontrado</Text>
                            </View>
                        )
                    }
                />
            ) : (
                // Renderiza a lista de operações
                <FlatList
                    data={operacoes}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                        <View style={styles.operacaoItem}>
                            <View style={styles.operacaoHeader}>
                                <Text style={[
                                    styles.operacaoTipo,
                                    item.tipo_operacao === 'Desparafinação Térmica' && styles.tipoTermica,
                                    item.tipo_operacao === 'Teste de Estanqueidade' && styles.tipoEstanqueidade,
                                    item.tipo_operacao === 'Limpeza' && styles.tipoLimpeza,
                                    item.tipo_operacao === 'Deslocamento de PIG' && styles.tipoPig,
                                ]}>
                                    <Ionicons
                                        name={
                                            item.tipo_operacao === 'Desparafinação Térmica' ? 'flame' :
                                                item.tipo_operacao === 'Teste de Estanqueidade' ? 'water' :
                                                    item.tipo_operacao === 'Limpeza' ? 'sparkles' :
                                                        item.tipo_operacao === 'Deslocamento de PIG' ? 'git-merge' :
                                                            'build'
                                        }
                                        size={16}
                                        color={
                                            item.tipo_operacao === 'Desparafinação Térmica' ? '#FF9800' :
                                                item.tipo_operacao === 'Teste de Estanqueidade' ? '#2196F3' :
                                                    item.tipo_operacao === 'Limpeza' ? '#4CAF50' :
                                                        item.tipo_operacao === 'Deslocamento de PIG' ? '#9C27B0' :
                                                            '#607D8B'
                                        }
                                    /> {item.tipo_operacao || 'Operação'}
                                </Text>
                                <View style={[styles.statusBadge,
                                item.etapa_atual === 'FINALIZADO' ? styles.statusFinalizado :
                                    item.etapa_atual === 'MOBILIZACAO' ? styles.statusEmMobilizacao :
                                        item.etapa_atual === 'OPERACAO' ? styles.statusEmOperacao :
                                            item.etapa_atual === 'DESMOBILIZACAO' ? styles.statusEmDesmobilizacao :
                                                styles.statusAguardando]}>
                                    <Text style={styles.statusText}>
                                        {item.etapa_atual}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.operacaoInfo}>
                                {item.cidade && <Text><Text style={styles.infoLabel}>Cidade:</Text> {item.cidade}</Text>}
                                {item.poco && <Text><Text style={styles.infoLabel}>Poço:</Text> {item.poco}</Text>}
                                {item.volume && <Text><Text style={styles.infoLabel}>Volume:</Text> {item.volume} bbl</Text>}
                            </View>

                            {/* Novo botão "Ver Aguardos" */}
                            {item.id && (
                                <View style={styles.botoesContainer}>
                                    <TouchableOpacity
                                        style={styles.verAguardosButton}
                                        onPress={() => navigation.navigate('Aguardo')}
                                    >
                                        <Ionicons name="time-outline" size={14} color="#FFC107" />
                                        <Text style={styles.verAguardosText}>Ver Aguardos</Text>
                                    </TouchableOpacity>

                                    {/* Botão para ver refeições */}
                                    <TouchableOpacity
                                        style={styles.verRefeicoesButton}
                                        onPress={() => navigation.navigate('Refeicao')}
                                    >
                                        <Ionicons name="restaurant-outline" size={14} color="#F44336" />
                                        <Text style={styles.verRefeicoesText}>Ver Refeições</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.operacaoFooter}>
                                <Text style={styles.operacaoData}>
                                    <Ionicons name="calendar-outline" size={14} color="#666" /> {new Date(item.criado_em).toLocaleString()}
                                </Text>
                                {item.tempo_operacao && (
                                    <Text style={styles.operacaoTempo}>
                                        <Ionicons name="time-outline" size={14} color="#666" /> {Math.floor(item.tempo_operacao / 3600)}h{Math.floor((item.tempo_operacao % 3600) / 60)}m
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="build-outline" size={60} color="#ccc" />
                                <Text style={styles.emptyText}>Nenhuma operação encontrada</Text>
                            </View>
                        )
                    }
                />
            )}
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
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    error: {
        color: '#D32F2F',
        marginBottom: 10,
        textAlign: 'center',
        backgroundColor: '#FFCDD2',
        padding: 10,
        borderRadius: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    listHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 4,
        marginBottom: 10,
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
        textAlign: 'center',
    },
    item: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemName: {
        fontWeight: '500',
        fontSize: 16,
        flex: 1,
    },
    itemIdade: {
        fontSize: 16,
        flex: 1,
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#4CAF50',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    deslocamentoItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    deslocamentoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    deslocamentoRota: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    statusEmAndamento: {
        backgroundColor: '#E3F2FD',
    },
    statusFinalizado: {
        backgroundColor: '#E8F5E9',
    },
    statusCancelado: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    deslocamentoInfo: {
        marginBottom: 10,
    },
    infoLabel: {
        fontWeight: '500',
    },
    deslocamentoFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    deslocamentoData: {
        fontSize: 12,
        color: '#666',
    },
    deslocamentoTempo: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    operacaoItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    operacaoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    operacaoTipo: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    tipoTermica: {
        color: '#FF9800',
    },
    tipoEstanqueidade: {
        color: '#2196F3',
    },
    tipoLimpeza: {
        color: '#4CAF50',
    },
    tipoPig: {
        color: '#9C27B0',
    },
    statusEmMobilizacao: {
        backgroundColor: '#FFECB3',
    },
    statusEmOperacao: {
        backgroundColor: '#E3F2FD',
    },
    statusEmDesmobilizacao: {
        backgroundColor: '#FFCCBC',
    },
    statusAguardando: {
        backgroundColor: '#E0E0E0',
    },
    operacaoInfo: {
        marginBottom: 10,
    },
    operacaoFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    operacaoData: {
        fontSize: 12,
        color: '#666',
    },
    operacaoTempo: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    verAguardosButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 6,
        backgroundColor: '#FFF8E1',
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    verAguardosText: {
        fontSize: 12,
        color: '#FF8F00',
        marginLeft: 4,
    },
    botoesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    verRefeicoesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        backgroundColor: '#FFEBEE',
        borderRadius: 4,
    },
    verRefeicoesText: {
        fontSize: 12,
        color: '#D32F2F',

        marginLeft: 4,
    },
});