import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function ResumoAtividadesScreen({ navigation }) {
    // Estados gerais
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [equipeAtiva, setEquipeAtiva] = useState(null);

    // Estados para filtro de data
    const [dataFiltro, setDataFiltro] = useState(new Date());
    const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
    const [filtroAtivo, setFiltroAtivo] = useState(false);

    // Estados para atividades
    const [atividades, setAtividades] = useState([]);
    const [tiposFiltro, setTiposFiltro] = useState([
        { id: 'todos', nome: 'Todos', ativo: true },
        { id: 'operacoes', nome: 'Operações', ativo: false },
        { id: 'deslocamentos', nome: 'Deslocamentos', ativo: false },
        { id: 'aguardos', nome: 'Aguardos', ativo: false },
        { id: 'refeicoes', nome: 'Refeições', ativo: false },
        { id: 'abastecimentos', nome: 'Abastecimentos', ativo: false }
    ]);

    // Carregar dados iniciais
    useEffect(() => {
        buscarEquipeAtiva();
        buscarTodasAtividades();
    }, []);

    // Atualizar quando a tela receber foco
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarEquipeAtiva();
            buscarTodasAtividades();
        });

        return unsubscribe;
    }, [navigation]);

    // Buscar equipe ativa
    const buscarEquipeAtiva = async () => {
        try {
            const response = await axios.get(`${API_URL}/equipes/ativa`);
            if (response.data) {
                setEquipeAtiva(response.data);
            } else {
                setEquipeAtiva(null);
            }
        } catch (err) {
            console.error('Erro ao buscar equipe ativa:', err);
            setEquipeAtiva(null);
        }
    };

    // Buscar todas as atividades
    const buscarTodasAtividades = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar todas as atividades concatenadas
            const [operacoesRes, deslocamentosRes, aguardosRes, refeicoesRes, abastecimentosRes] = await Promise.all([
                axios.get(`${API_URL}/operacoes`),
                axios.get(`${API_URL}/deslocamentos`),
                axios.get(`${API_URL}/aguardos`),
                axios.get(`${API_URL}/refeicoes`),
                axios.get(`${API_URL}/abastecimentos`)
            ]);

            // Formatar e combinar as atividades
            const todasAtividades = [
                ...operacoesRes.data.map(op => ({
                    ...op,
                    tipo: 'operacao',
                    data: new Date(op.criado_em),
                    dataString: new Date(op.criado_em).toLocaleDateString(),
                    titulo: `Operação: ${op.tipo_operacao || 'Sem tipo'}`,
                    descricao: `Poço: ${op.poco || 'N/A'} | Cidade: ${op.cidade || 'N/A'}`,
                    status: op.etapa_atual,
                    icone: 'build',
                    cor: '#4CAF50',
                    tempo: op.tempo_operacao
                })),
                ...deslocamentosRes.data.map(des => ({
                    ...des,
                    tipo: 'deslocamento',
                    data: new Date(des.hora_inicio),
                    dataString: new Date(des.hora_inicio).toLocaleDateString(),
                    titulo: `Deslocamento: ${des.origem} → ${des.destino}`,
                    descricao: `Distância: ${des.km_final ? (des.km_final - des.km_inicial).toFixed(1) : 'N/A'} km`,
                    status: des.status,
                    icone: 'navigate',
                    cor: '#2196F3',
                    tempo: des.tempo_total
                })),
                ...aguardosRes.data.map(ag => ({
                    ...ag,
                    tipo: 'aguardo',
                    data: new Date(ag.inicio_aguardo),
                    dataString: new Date(ag.inicio_aguardo).toLocaleDateString(),
                    titulo: `Aguardo: ${ag.motivo || 'Sem motivo'}`,
                    descricao: ag.fim_aguardo ? 'Aguardo finalizado' : 'Aguardo em andamento',
                    status: ag.fim_aguardo ? 'FINALIZADO' : 'EM_ANDAMENTO',
                    icone: 'time',
                    cor: '#FFC107',
                    tempo: ag.tempo_aguardo
                })),
                ...refeicoesRes.data.map(ref => ({
                    ...ref,
                    tipo: 'refeicao',
                    data: new Date(ref.inicio_refeicao),
                    dataString: new Date(ref.inicio_refeicao).toLocaleDateString(),
                    titulo: `Refeição`,
                    descricao: ref.fim_refeicao ? 'Refeição finalizada' : 'Refeição em andamento',
                    status: ref.fim_refeicao ? 'FINALIZADO' : 'EM_ANDAMENTO',
                    icone: 'restaurant',
                    cor: '#F44336',
                    tempo: ref.tempo_refeicao
                })),
                ...abastecimentosRes.data.map(ab => ({
                    ...ab,
                    tipo: 'abastecimento',
                    data: new Date(ab.inicio_abastecimento),
                    dataString: new Date(ab.inicio_abastecimento).toLocaleDateString(),
                    titulo: `Abastecimento: ${ab.tipo_abastecimento === 'AGUA' ? 'Água' : 'Combustível'}`,
                    descricao: ab.fim_abastecimento ? 'Abastecimento finalizado' : 'Abastecimento em andamento',
                    status: ab.fim_abastecimento ? 'FINALIZADO' : 'EM_ANDAMENTO',
                    icone: ab.tipo_abastecimento === 'AGUA' ? 'water' : 'flame',
                    cor: ab.tipo_abastecimento === 'AGUA' ? '#2196F3' : '#FF9800',
                    tempo: ab.tempo_abastecimento
                }))
            ];

            // Ordenar por data mais recente
            todasAtividades.sort((a, b) => b.data - a.data);
            setAtividades(todasAtividades);
        } catch (err) {
            console.error('Erro ao buscar atividades:', err);
            setError('Não foi possível carregar as atividades');
        } finally {
            setLoading(false);
        }
    };

    // Função para alterar o filtro de data
    const alterarData = (evento, dataSelecionada) => {
        setMostrarDatePicker(Platform.OS === 'ios');
        if (dataSelecionada) {
            setDataFiltro(dataSelecionada);
            setFiltroAtivo(true);
        }
    };

    // Função para limpar o filtro de data
    const limparFiltroData = () => {
        setFiltroAtivo(false);
    };

    // Alternar tipo de filtro
    const alternarTipoFiltro = (id) => {
        setTiposFiltro(tiposFiltro.map(tipo => ({
            ...tipo,
            ativo: tipo.id === id
        })));
    };

    // Filtrar atividades
    const atividadesFiltradas = atividades.filter(atividade => {
        // Filtro por data
        if (filtroAtivo) {
            const dataAtividade = new Date(atividade.data);
            const dataFiltroAtual = new Date(dataFiltro);

            if (dataAtividade.getDate() !== dataFiltroAtual.getDate() ||
                dataAtividade.getMonth() !== dataFiltroAtual.getMonth() ||
                dataAtividade.getFullYear() !== dataFiltroAtual.getFullYear()) {
                return false;
            }
        }

        // Filtro por tipo
        const tipoAtivo = tiposFiltro.find(t => t.ativo);
        if (tipoAtivo.id !== 'todos') {
            if (tipoAtivo.id === 'operacoes' && atividade.tipo !== 'operacao') return false;
            if (tipoAtivo.id === 'deslocamentos' && atividade.tipo !== 'deslocamento') return false;
            if (tipoAtivo.id === 'aguardos' && atividade.tipo !== 'aguardo') return false;
            if (tipoAtivo.id === 'refeicoes' && atividade.tipo !== 'refeicao') return false;
            if (tipoAtivo.id === 'abastecimentos' && atividade.tipo !== 'abastecimento') return false;
        }

        return true;
    });

    // Formatar tempo em HH:MM:SS
    const formatarTempo = (segundos) => {
        if (!segundos) return '00:00:00';
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;

        return [
            horas.toString().padStart(2, '0'),
            minutos.toString().padStart(2, '0'),
            segs.toString().padStart(2, '0')
        ].join(':');
    };

    // Renderizar item da lista
    const renderizarItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemAtividade}
            onPress={() => navegarParaDetalhe(item)}
        >
            <View style={styles.itemHeader}>
                <View style={styles.itemIconContainer}>
                    <Ionicons
                        name={item.icone}
                        size={24}
                        color={item.cor}
                        style={styles.itemIcon}
                    />
                </View>
                <View style={styles.itemTitulos}>
                    <Text style={styles.itemTitulo}>{item.titulo}</Text>
                    <Text style={styles.itemDescricao}>{item.descricao}</Text>
                </View>
                <View style={[
                    styles.itemStatus,
                    item.status === 'FINALIZADO' ? styles.statusFinalizado :
                        item.status === 'EM_ANDAMENTO' ? styles.statusEmAndamento :
                            styles.statusPadrao
                ]}>
                    <Text style={styles.itemStatusTexto}>
                        {item.status === 'FINALIZADO' ? 'Finalizado' :
                            item.status === 'EM_ANDAMENTO' ? 'Em andamento' :
                                item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.itemFooter}>
                <Text style={styles.itemData}>
                    <Ionicons name="calendar" size={14} color="#666" /> {new Date(item.data).toLocaleString()}
                </Text>
                {item.tempo > 0 && (
                    <Text style={styles.itemTempo}>
                        <Ionicons name="time-outline" size={14} color="#666" /> {formatarTempo(item.tempo)}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // Função para navegar para tela de detalhes
    const navegarParaDetalhe = (item) => {
        switch (item.tipo) {
            case 'operacao':
                navigation.navigate('Operacoes', { operacaoId: item.id });
                break;
            case 'deslocamento':
                navigation.navigate('Deslocamento', { deslocamentoId: item.id });
                break;
            case 'aguardo':
                navigation.navigate('Aguardo');
                break;
            case 'refeicao':
                navigation.navigate('Refeicao');
                break;
            case 'abastecimento':
                navigation.navigate('Abastecimento');
                break;
            default:
                break;
        }
    };

    // Renderizar os filtros de tipo
    const renderizarFiltrosTipo = () => (
        <View style={styles.filtrosTipoContainer}>
            <FlatList
                data={tiposFiltro}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filtroTipoItem,
                            item.ativo && styles.filtroTipoItemAtivo
                        ]}
                        onPress={() => alternarTipoFiltro(item.id)}
                    >
                        <Text style={[
                            styles.filtroTipoTexto,
                            item.ativo && styles.filtroTipoTextoAtivo
                        ]}>
                            {item.nome}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    // Tela de carregamento
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando atividades...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Cabeçalho com informações da equipe */}
            {equipeAtiva ? (
                <View style={styles.equipeCard}>
                    <Text style={styles.equipeTitle}>Equipe Ativa</Text>
                    <View style={styles.equipeInfo}>
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={18} color="#4CAF50" />
                            <Text style={styles.infoLabel}>Operador:</Text>
                            <Text style={styles.infoValue}>{equipeAtiva.operador}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={18} color="#4CAF50" />
                            <Text style={styles.infoLabel}>Auxiliar:</Text>
                            <Text style={styles.infoValue}>{equipeAtiva.auxiliar}</Text>
                        </View>
                        <View style={styles.infoRowCompacto}>
                            <View style={styles.infoCompactoItem}>
                                <Ionicons name="business-outline" size={16} color="#4CAF50" />
                                <Text style={styles.infoCompactoTexto}>{equipeAtiva.unidade}</Text>
                            </View>
                            <View style={styles.infoCompactoItem}>
                                <Ionicons name="car-outline" size={16} color="#4CAF50" />
                                <Text style={styles.infoCompactoTexto}>{equipeAtiva.placa}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.semEquipeCard}>
                    <Ionicons name="warning-outline" size={24} color="#FFC107" />
                    <Text style={styles.semEquipeTexto}>Nenhuma equipe ativa</Text>
                </View>
            )}

            {/* Filtro de data */}
            <View style={styles.filtroContainer}>
                <Text style={styles.filtroTitulo}>Filtrar por data:</Text>
                <View style={styles.filtroControles}>
                    <TouchableOpacity
                        style={styles.filtroDataButton}
                        onPress={() => setMostrarDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color="#4CAF50" />
                        <Text style={styles.filtroDataTexto}>
                            {filtroAtivo ? dataFiltro.toLocaleDateString() : 'Selecionar data'}
                        </Text>
                    </TouchableOpacity>

                    {filtroAtivo && (
                        <TouchableOpacity
                            style={styles.limparFiltroButton}
                            onPress={limparFiltroData}
                        >
                            <Ionicons name="close-circle" size={20} color="#F44336" />
                        </TouchableOpacity>
                    )}
                </View>

                {mostrarDatePicker && (
                    <DateTimePicker
                        value={dataFiltro}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={alterarData}
                    />
                )}
            </View>

            {/* Filtros de tipo */}
            {renderizarFiltrosTipo()}

            {/* Mensagem de erro */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#D32F2F" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Lista de atividades */}
            {atividadesFiltradas.length > 0 ? (
                <FlatList
                    data={atividadesFiltradas}
                    keyExtractor={(item) => `${item.tipo}-${item.id}`}
                    renderItem={renderizarItem}
                    contentContainerStyle={styles.listaContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {filtroAtivo
                            ? `Nenhuma atividade encontrada para ${dataFiltro.toLocaleDateString()}`
                            : 'Nenhuma atividade encontrada'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
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
    equipeCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    equipeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    equipeInfo: {
        marginTop: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontWeight: '500',
        marginLeft: 8,
        marginRight: 5,
        color: '#555',
    },
    infoValue: {
        flex: 1,
        color: '#333',
    },
    infoRowCompacto: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    infoCompactoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    infoCompactoTexto: {
        fontSize: 12,
        marginLeft: 5,
        color: '#555',
    },
    semEquipeCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 10,
        padding: 15,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    semEquipeTexto: {
        marginLeft: 8,
        fontSize: 16,
        color: '#F57F17',
    },
    filtroContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filtroTitulo: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
    },
    filtroControles: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filtroDataButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flex: 1,
    },
    filtroDataTexto: {
        marginLeft: 8,
        fontSize: 14,
        color: '#2E7D32',
    },
    limparFiltroButton: {
        padding: 8,
        marginLeft: 8,
    },
    filtrosTipoContainer: {
        marginBottom: 16,
    },
    filtroTipoItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    filtroTipoItemAtivo: {
        backgroundColor: '#4CAF50',
    },
    filtroTipoTexto: {
        fontSize: 14,
        color: '#666',
    },
    filtroTipoTextoAtivo: {
        color: '#fff',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFCDD2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        marginLeft: 8,
        color: '#D32F2F',
        flex: 1,
    },
    listaContainer: {
        paddingBottom: 20,
    },
    itemAtividade: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    itemIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemTitulos: {
        flex: 1,
    },
    itemTitulo: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    itemDescricao: {
        fontSize: 14,
        color: '#666',
    },
    itemStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginLeft: 8,
    },
    statusEmAndamento: {
        backgroundColor: '#E3F2FD',
    },
    statusFinalizado: {
        backgroundColor: '#E8F5E9',
    },
    statusPadrao: {
        backgroundColor: '#EEEEEE',
    },
    itemStatusTexto: {
        fontSize: 12,
        fontWeight: '500',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
        marginTop: 5,
    },
    itemData: {
        fontSize: 12,
        color: '#777',
    },
    itemTempo: {
        fontSize: 12,
        color: '#777',
        fontWeight: '500',
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
});