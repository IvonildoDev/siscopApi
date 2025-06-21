import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Modal,
    Image
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function RefeicaoScreen({ navigation }) {
    // Estados para controlar a tela
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para dados da refeição
    const [operacaoAtiva, setOperacaoAtiva] = useState(null);
    const [refeicoes, setRefeicoes] = useState([]);
    const [refeicaoAtiva, setRefeicaoAtiva] = useState(null);

    // Estado para o timer
    const [tempoRefeicao, setTempoRefeicao] = useState(0);
    const timerRef = useRef(null);

    // Estados para relatório
    const [relatorioModalVisivel, setRelatorioModalVisivel] = useState(false);
    const [relatorioAtual, setRelatorioAtual] = useState(null);

    // Carregar dados iniciais
    useEffect(() => {
        buscarOperacaoAtiva();
        buscarRefeicoes();
    }, []);

    // Atualizar ao receber foco
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarOperacaoAtiva();
            buscarRefeicoes();
        });

        return unsubscribe;
    }, [navigation]);

    // Controlar timer da refeição ativa
    useEffect(() => {
        if (refeicaoAtiva && !refeicaoAtiva.fim_refeicao) {
            // Iniciar timer
            timerRef.current = setInterval(() => {
                setTempoRefeicao(prev => prev + 1);
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
    }, [refeicaoAtiva]);

    // Buscar operação ativa
    const buscarOperacaoAtiva = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/operacoes/ativa`);

            if (response.data) {
                setOperacaoAtiva(response.data);
            } else {
                setOperacaoAtiva(null);
            }

            setError(null);
        } catch (err) {
            console.log('Nenhuma operação ativa encontrada');
            setOperacaoAtiva(null);
        } finally {
            setLoading(false);
        }
    };

    // Buscar refeições
    const buscarRefeicoes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/refeicoes`);

            if (response.data) {
                setRefeicoes(response.data);

                // Verificar se existe uma refeição ativa
                const ativa = response.data.find(r => !r.fim_refeicao);
                if (ativa) {
                    setRefeicaoAtiva(ativa);

                    // Calcular tempo decorrido
                    const inicio = new Date(ativa.inicio_refeicao);
                    const agora = new Date();
                    const segundosDecorridos = Math.floor((agora - inicio) / 1000);
                    setTempoRefeicao(segundosDecorridos);
                } else {
                    setRefeicaoAtiva(null);
                    setTempoRefeicao(0);
                }
            } else {
                setRefeicoes([]);
            }

            setError(null);
        } catch (err) {
            console.error('Erro ao buscar refeições:', err);
            setError('Erro ao carregar refeições');
        } finally {
            setLoading(false);
        }
    };

    // Iniciar refeição
    const iniciarRefeicao = async () => {
        // Verificar apenas se já existe refeição ativa
        if (refeicaoAtiva) {
            Alert.alert('Erro', 'Já existe uma refeição em andamento.');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/refeicoes`, {
                operacao_id: operacaoAtiva?.id || null // Enviar ID da operação se existir, senão null
            });

            // Recarregar dados
            await buscarRefeicoes();

            // Mostrar mensagem de sucesso
            Alert.alert('Sucesso', 'Refeição iniciada com sucesso!');
        } catch (err) {
            console.error('Erro ao iniciar refeição:', err);
            Alert.alert('Erro', err.response?.data?.error || 'Não foi possível iniciar a refeição.');
        } finally {
            setLoading(false);
        }
    };

    // Finalizar refeição
    const finalizarRefeicao = async () => {
        if (!refeicaoAtiva) {
            Alert.alert('Erro', 'Não há refeição ativa para finalizar.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const dataFim = new Date().toISOString();

            const response = await axios.put(`${API_URL}/refeicoes/${refeicaoAtiva.id}/finalizar`, {
                fim_refeicao: dataFim,
                tempo_refeicao: tempoRefeicao
            });

            if (response.data) {
                setRelatorioAtual({
                    ...response.data,
                    inicioFormatado: formatarData(response.data.inicio_refeicao),
                    fimFormatado: formatarData(response.data.fim_refeicao),
                    tempoFormatado: formatarTempo(response.data.tempo_refeicao)
                });

                setRefeicaoAtiva(null);
                buscarRefeicoes();

                // Mostrar relatório
                setRelatorioModalVisivel(true);
            }
        } catch (err) {
            console.error('Erro ao finalizar refeição:', err);
            setError('Erro ao finalizar refeição');
            Alert.alert('Erro', 'Não foi possível finalizar a refeição.');
        } finally {
            setLoading(false);
        }
    };

    // Mostrar relatório de uma refeição existente
    const mostrarRelatorio = (refeicao) => {
        setRelatorioAtual({
            ...refeicao,
            inicioFormatado: formatarData(refeicao.inicio_refeicao),
            fimFormatado: formatarData(refeicao.fim_refeicao),
            tempoFormatado: formatarTempo(refeicao.tempo_refeicao)
        });
        setRelatorioModalVisivel(true);
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="restaurant" size={40} color="#F44336" />
                <Text style={styles.headerText}>Controle de Refeições</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => {
                        buscarOperacaoAtiva();
                        buscarRefeicoes();
                    }}
                >
                    <Ionicons name="refresh" size={24} color="#F44336" />
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
                        Inicie uma operação para poder registrar refeições
                    </Text>
                </View>
            )}

            {/* Refeição ativa com timer */}
            {refeicaoAtiva && (
                <View style={styles.refeicaoAtivaCard}>
                    <Text style={styles.refeicaoAtivoTitle}>
                        Horário de Refeição em andamento
                    </Text>

                    <View style={styles.iconContainer}>
                        <Image
                            source={require('../assets/meal.png')}
                            style={styles.refeicaoIcon}
                        />
                    </View>

                    <Text style={styles.refeicaoAtivaTimer}>
                        {formatarTempo(tempoRefeicao)}
                    </Text>

                    <Text style={styles.refeicaoAtivaInicio}>
                        Iniciado em: {formatarData(refeicaoAtiva.inicio_refeicao)}
                    </Text>

                    <TouchableOpacity
                        style={styles.finalizarButton}
                        onPress={finalizarRefeicao}
                        disabled={loading}
                    >
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.finalizarButtonText}>FINALIZAR REFEIÇÃO</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Botão para iniciar refeição - simplificado */}
            {!refeicaoAtiva && (
                <View style={{ marginVertical: 10, borderWidth: 0 }}>
                    <Text style={{ marginBottom: 5, textAlign: 'center', color: '#666' }}>
                        Clique abaixo para iniciar um horário de refeição
                    </Text>
                    <TouchableOpacity
                        style={[styles.iniciarButton, { elevation: 4 }]}
                        onPress={iniciarRefeicao}
                        disabled={loading}
                    >
                        <Ionicons name="restaurant" size={24} color="#fff" />
                        <Text style={styles.iniciarButtonText}>INICIAR REFEIÇÃO</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Lista de refeições anteriores */}
            <View style={styles.historicoContainer}>
                <Text style={styles.historicoTitle}>Registro de Refeições</Text>

                {refeicoes.length === 0 && !loading ? (
                    <View style={styles.semHistoricoContainer}>
                        <Ionicons name="restaurant-outline" size={40} color="#ddd" />
                        <Text style={styles.semHistoricoText}>Nenhuma refeição registrada</Text>
                    </View>
                ) : (
                    <FlatList
                        data={refeicoes.filter(r => r.fim_refeicao)}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.refeicaoItem}
                                onPress={() => mostrarRelatorio(item)}
                            >
                                <View style={styles.refeicaoItemHeader}>
                                    <Text style={styles.refeicaoItemData}>
                                        <Ionicons name="calendar-outline" size={16} color="#F44336" /> {formatarData(item.inicio_refeicao).split(',')[0]}
                                    </Text>

                                    <View style={styles.refeicaoItemTempoContainer}>
                                        <Ionicons name="time-outline" size={16} color="#F44336" />
                                        <Text style={styles.refeicaoItemTempo}>
                                            {formatarTempo(item.tempo_refeicao)}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.refeicaoItemHorario}>
                                    {formatarData(item.inicio_refeicao).split(',')[1].trim()} - {formatarData(item.fim_refeicao).split(',')[1].trim()}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Modal com Relatório de Refeição */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={relatorioModalVisivel}
                onRequestClose={() => setRelatorioModalVisivel(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={styles.relatorioHeader}>
                            <Ionicons name="document-text" size={30} color="#F44336" />
                            <Text style={styles.relatorioTitle}>Relatório de Refeição</Text>
                        </View>

                        {relatorioAtual && (
                            <View style={styles.relatorioContent}>
                                <View style={styles.relatorioItem}>
                                    <Text style={styles.relatorioLabel}>Operação:</Text>
                                    <Text style={styles.relatorioValue}>#{relatorioAtual.operacao_id}</Text>
                                </View>

                                <View style={styles.relatorioItem}>
                                    <Text style={styles.relatorioLabel}>Início:</Text>
                                    <Text style={styles.relatorioValue}>{relatorioAtual.inicioFormatado}</Text>
                                </View>

                                <View style={styles.relatorioItem}>
                                    <Text style={styles.relatorioLabel}>Término:</Text>
                                    <Text style={styles.relatorioValue}>{relatorioAtual.fimFormatado}</Text>
                                </View>

                                <View style={styles.relatorioItemDestaque}>
                                    <Text style={styles.relatorioLabelDestaque}>Tempo Total:</Text>
                                    <Text style={styles.relatorioValueDestaque}>{relatorioAtual.tempoFormatado}</Text>
                                </View>

                                <View style={styles.relatorioRodape}>
                                    <Text style={styles.relatorioNota}>
                                        Relatório gerado em {new Date().toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.fecharButton}
                            onPress={() => setRelatorioModalVisivel(false)}
                        >
                            <Text style={styles.fecharButtonText}>Fechar Relatório</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Indicador de carregamento */}
            {loading && (
                <ActivityIndicator
                    size="large"
                    color="#F44336"
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
    refeicaoAtivaCard: {
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    refeicaoAtivoTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#C62828',
        marginBottom: 10,
    },
    iconContainer: {
        marginVertical: 10,
    },
    refeicaoIcon: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    refeicaoAtivaTimer: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginVertical: 10,
        fontVariant: ['tabular-nums'],
    },
    refeicaoAtivaInicio: {
        fontSize: 12,
        color: '#666',
        marginBottom: 15,
    },
    iniciarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336', // Vermelho para Refeição
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 5, // Adicionado para dar espaço
    },
    iniciarButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    finalizarButton: {
        backgroundColor: '#4CAF50',
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
    refeicaoItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
    },
    refeicaoItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    refeicaoItemData: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    refeicaoItemTempoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    refeicaoItemTempo: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: '500',
        marginLeft: 4,
    },
    refeicaoItemHorario: {
        fontSize: 12,
        color: '#666',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 8,
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
    relatorioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    relatorioTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    relatorioContent: {
        marginBottom: 20,
    },
    relatorioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    relatorioLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    relatorioValue: {
        fontSize: 14,
        color: '#333',
    },
    relatorioItemDestaque: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 10,
    },
    relatorioLabelDestaque: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    relatorioValueDestaque: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    relatorioRodape: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    relatorioNota: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    fecharButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    fecharButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
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
    tiposContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    tipoButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginHorizontal: 5,
    },
    tipoButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    tipoText: {
        marginTop: 8,
        color: '#333',
        fontWeight: '500',
    },
    tipoTextActive: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    modalButtonCancel: {
        borderWidth: 1,
        borderColor: '#ddd',
    },
    modalButtonConfirm: {
        backgroundColor: '#2196F3', // Para Abastecimento
        // backgroundColor: '#F44336', // Para Refeição
    },
    modalCancelButtonText: {
        color: '#666',
    },
    modalConfirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});