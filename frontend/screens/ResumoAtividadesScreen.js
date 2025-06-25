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
    Platform,
    Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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
        { id: 'abastecimentos', nome: 'Abastecimentos', ativo: false },
        { id: 'mobilizacoes', nome: 'Mobilizações', ativo: false },
        { id: 'desmobilizacoes', nome: 'Desmobilizações', ativo: false }
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

            const [
                operacoesRes,
                deslocamentosRes,
                aguardosRes,
                refeicoesRes,
                abastecimentosRes,
                mobilizacoesRes,
                desmobilizacoesRes
            ] = await Promise.all([
                axios.get(`${API_URL}/operacoes`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/deslocamentos`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/aguardos`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/refeicoes`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/abastecimentos`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/mobilizacoes`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
                axios.get(`${API_URL}/desmobilizacoes`).catch(err => (err.response && err.response.status === 404 ? { data: [] } : Promise.reject(err))),
            ]);

            // Formatar e combinar as atividades
            const todasAtividades = [
                // Verifique se operacoesRes.data contém uma propriedade 'data' (paginação)
                ...(operacoesRes.data && operacoesRes.data.data ? operacoesRes.data.data : operacoesRes.data || []).map(op => ({
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
                // Aplique a mesma lógica para os outros endpoints
                ...(deslocamentosRes.data && deslocamentosRes.data.data ? deslocamentosRes.data.data : deslocamentosRes.data || []).map(des => ({
                    ...des,
                    tipo: 'deslocamento',
                    data: new Date(des.hora_inicio),
                    dataString: new Date(des.hora_inicio).toLocaleDateString(),
                    titulo: `Deslocamento: ${des.origem} → ${des.destino}`,
                    descricao: `Distância: ${des.km_final ? (des.km_final - des.km_inicial).toFixed(1) : 'N/A'} km | KM inicial: ${des.km_inicial || 'N/A'} | KM final: ${des.km_final || 'N/A'}`,
                    status: des.status,
                    icone: 'navigate',
                    cor: '#2196F3',
                    tempo: des.tempo_total
                })),
                ...(aguardosRes.data && aguardosRes.data.data ? aguardosRes.data.data : aguardosRes.data || []).map(ag => ({
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
                ...(refeicoesRes.data && refeicoesRes.data.data ? refeicoesRes.data.data : refeicoesRes.data || []).map(ref => ({
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
                ...(abastecimentosRes.data && abastecimentosRes.data.data ? abastecimentosRes.data.data : abastecimentosRes.data || []).map(ab => ({
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
                })),
                ...(mobilizacoesRes.data || []).map(mob => {
                    console.log('Mobilização encontrada:', mob);
                    console.log('Tempo do banco (tempo_mobilizacao):', mob.tempo_mobilizacao);
                    console.log('Hora início:', mob.hora_inicio_mobilizacao);
                    console.log('Hora fim:', mob.hora_fim_mobilizacao);

                    // Verificar se o tempo_mobilizacao é um timestamp Unix (muito grande) ou segundos de duração
                    let tempoCalculado = 0;
                    if (mob.tempo_mobilizacao) {
                        // Se o tempo for maior que 1000000, provavelmente é um timestamp Unix
                        if (mob.tempo_mobilizacao > 1000000) {
                            console.log('Tempo parece ser timestamp Unix, calculando diferença...');
                            if (mob.hora_inicio_mobilizacao && mob.hora_fim_mobilizacao) {
                                tempoCalculado = Math.floor((new Date(mob.hora_fim_mobilizacao) - new Date(mob.hora_inicio_mobilizacao)) / 1000);
                            }
                        } else {
                            // É segundos de duração normal
                            tempoCalculado = mob.tempo_mobilizacao;
                        }
                    } else if (mob.hora_inicio_mobilizacao && mob.hora_fim_mobilizacao) {
                        // Calcular se não tiver tempo no banco
                        tempoCalculado = Math.floor((new Date(mob.hora_fim_mobilizacao) - new Date(mob.hora_inicio_mobilizacao)) / 1000);
                        console.log('Tempo calculado:', tempoCalculado);
                    }

                    // Converter para hora local
                    const dataInicio = mob.hora_inicio_mobilizacao ? new Date(mob.hora_inicio_mobilizacao) : new Date(mob.criado_em);
                    const dataFim = mob.hora_fim_mobilizacao ? new Date(mob.hora_fim_mobilizacao) : null;

                    return {
                        ...mob,
                        tipo: 'mobilizacao',
                        data: dataInicio,
                        dataString: dataInicio.toLocaleDateString(),
                        titulo: `Mobilização`,
                        descricao: mob.observacoes || 'Equipamento montado',
                        status: mob.hora_fim_mobilizacao ? 'FINALIZADO' : 'EM_ANDAMENTO',
                        icone: 'construct',
                        cor: '#1976D2',
                        tempo: tempoCalculado,
                        hora_inicio_local: dataInicio.toLocaleTimeString(),
                        hora_fim_local: dataFim ? dataFim.toLocaleTimeString() : null
                    };
                }),
                ...(desmobilizacoesRes.data || []).map(desm => {
                    console.log('Desmobilização encontrada:', desm);
                    console.log('Tempo do banco (tempo_desmobilizacao):', desm.tempo_desmobilizacao);
                    console.log('Hora início:', desm.hora_inicio_desmobilizacao);
                    console.log('Hora fim:', desm.hora_fim_desmobilizacao);

                    // Verificar se o tempo_desmobilizacao é um timestamp Unix (muito grande) ou segundos de duração
                    let tempoCalculado = 0;
                    if (desm.tempo_desmobilizacao) {
                        // Se o tempo for maior que 1000000, provavelmente é um timestamp Unix
                        if (desm.tempo_desmobilizacao > 1000000) {
                            console.log('Tempo parece ser timestamp Unix, calculando diferença...');
                            if (desm.hora_inicio_desmobilizacao && desm.hora_fim_desmobilizacao) {
                                tempoCalculado = Math.floor((new Date(desm.hora_fim_desmobilizacao) - new Date(desm.hora_inicio_desmobilizacao)) / 1000);
                            }
                        } else {
                            // É segundos de duração normal
                            tempoCalculado = desm.tempo_desmobilizacao;
                        }
                    } else if (desm.hora_inicio_desmobilizacao && desm.hora_fim_desmobilizacao) {
                        // Calcular se não tiver tempo no banco
                        tempoCalculado = Math.floor((new Date(desm.hora_fim_desmobilizacao) - new Date(desm.hora_inicio_desmobilizacao)) / 1000);
                        console.log('Tempo calculado:', tempoCalculado);
                    }

                    // Converter para hora local
                    const dataInicio = desm.hora_inicio_desmobilizacao ? new Date(desm.hora_inicio_desmobilizacao) : new Date(desm.criado_em);
                    const dataFim = desm.hora_fim_desmobilizacao ? new Date(desm.hora_fim_desmobilizacao) : null;

                    return {
                        ...desm,
                        tipo: 'desmobilizacao',
                        data: dataInicio,
                        dataString: dataInicio.toLocaleDateString(),
                        titulo: `Desmobilização`,
                        descricao: desm.observacoes || 'Equipamento desmontado',
                        status: desm.hora_fim_desmobilizacao ? 'FINALIZADO' : 'EM_ANDAMENTO',
                        icone: 'exit',
                        cor: '#E65100',
                        tempo: tempoCalculado,
                        hora_inicio_local: dataInicio.toLocaleTimeString(),
                        hora_fim_local: dataFim ? dataFim.toLocaleTimeString() : null
                    };
                })
            ];

            // Ordenar por data mais recente
            todasAtividades.sort((a, b) => b.data - a.data);
            console.log('Total de atividades carregadas:', todasAtividades.length);
            console.log('Tipos de atividades:', todasAtividades.map(a => a.tipo));

            // Contar quantos registros de cada tipo
            const contagem = {};
            todasAtividades.forEach(atividade => {
                contagem[atividade.tipo] = (contagem[atividade.tipo] || 0) + 1;
            });
            console.log('Contagem por tipo:', contagem);

            setAtividades(todasAtividades);
        } catch (err) {
            // Só exibe erro se não for 404
            if (!(err.response && err.response.status === 404)) {
                console.error('Erro ao buscar atividades:', err);
                setError('Não foi possível carregar as atividades');
            }
            setAtividades([]); // Limpa atividades se erro
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
            if (tipoAtivo.id === 'mobilizacoes' && atividade.tipo !== 'mobilizacao') return false;
            if (tipoAtivo.id === 'desmobilizacoes' && atividade.tipo !== 'desmobilizacao') return false;
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

                {/* Mostra o tempo apenas se não for operação */}
                {item.tipo !== 'operacao' && item.tempo > 0 && (
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

    // Função para gerar e compartilhar o PDF de resumo
    const gerarRelatorioPDF = async () => {
        try {
            setLoading(true);

            // Buscar dados adicionais da equipe para o relatório
            let equipeData = equipeAtiva || {};

            // Filtramos as atividades de acordo com os filtros aplicados
            const atividadesParaRelatorio = atividadesFiltradas;

            // Agrupar por tipo
            const operacoes = atividadesParaRelatorio.filter(a => a.tipo === 'operacao');
            const deslocamentos = atividadesParaRelatorio.filter(a => a.tipo === 'deslocamento');
            const aguardos = atividadesParaRelatorio.filter(a => a.tipo === 'aguardo');
            const refeicoes = atividadesParaRelatorio.filter(a => a.tipo === 'refeicao');
            const abastecimentos = atividadesParaRelatorio.filter(a => a.tipo === 'abastecimento');
            const mobilizacoes = atividadesParaRelatorio.filter(a => a.tipo === 'mobilizacao');
            const desmobilizacoes = atividadesParaRelatorio.filter(a => a.tipo === 'desmobilizacao');

            // Calcular totais
            const totalOperacoes = operacoes.length;
            const totalDeslocamentos = deslocamentos.length;
            const totalAguardos = aguardos.length;
            const totalRefeicoes = refeicoes.length;
            const totalAbastecimentos = abastecimentos.length;

            // Somar tempos totais
            const somarTempo = (items) => {
                return items.reduce((total, item) => total + (item.tempo || 0), 0);
            };

            const tempoTotalOperacoes = somarTempo(operacoes);
            const tempoTotalDeslocamentos = somarTempo(deslocamentos);
            const tempoTotalAguardos = somarTempo(aguardos);
            const tempoTotalRefeicoes = somarTempo(refeicoes);
            const tempoTotalAbastecimentos = somarTempo(abastecimentos);
            const tempoTotalGeral = tempoTotalOperacoes + tempoTotalDeslocamentos +
                tempoTotalAguardos + tempoTotalRefeicoes + tempoTotalAbastecimentos;

            // Gerar HTML para o PDF
            const titulo = filtroAtivo
                ? `Relatório de Atividades - ${dataFiltro.toLocaleDateString()}`
                : 'Relatório Geral de Atividades';

            // Função para gerar tabela de atividades com hora início/fim
            const gerarTabelaAtividades = (atividades, tipoNome) => {
                if (atividades.length === 0) return `<p>Nenhum(a) ${tipoNome} registrado(a).</p>`;

                // Define os campos de início e fim conforme o tipo
                const getInicioFim = (a) => {
                    switch (a.tipo) {
                        case 'operacao':
                            return { inicio: a.criado_em, fim: a.finalizado_em };
                        case 'deslocamento':
                            return { inicio: a.hora_inicio, fim: a.hora_fim };
                        case 'aguardo':
                            return { inicio: a.inicio_aguardo, fim: a.fim_aguardo };
                        case 'refeicao':
                            return { inicio: a.inicio_refeicao, fim: a.fim_refeicao };
                        case 'abastecimento':
                            return { inicio: a.inicio_abastecimento, fim: a.fim_abastecimento };
                        case 'mobilizacao':
                            return {
                                inicio: a.hora_inicio_local || new Date(a.hora_inicio_mobilizacao).toLocaleTimeString(),
                                fim: a.hora_fim_local || (a.hora_fim_mobilizacao ? new Date(a.hora_fim_mobilizacao).toLocaleTimeString() : null)
                            };
                        case 'desmobilizacao':
                            return {
                                inicio: a.hora_inicio_local || new Date(a.hora_inicio_desmobilizacao).toLocaleTimeString(),
                                fim: a.hora_fim_local || (a.hora_fim_desmobilizacao ? new Date(a.hora_fim_desmobilizacao).toLocaleTimeString() : null)
                            };
                        default:
                            return { inicio: a.data, fim: null };
                    }
                };

                return `
                <div class="tabela-container">
                    <table class="tabela-atividades">
                        <thead>
                            <tr>
                                <th>Início</th>
                                <th>Fim</th>
                                <th>Descrição</th>
                                <th>Status</th>
                                <th>Tempo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${atividades.map(a => {
                    const { inicio, fim } = getInicioFim(a);
                    return `
                                    <tr>
                                        <td>${inicio ? (typeof inicio === 'string' ? inicio : new Date(inicio).toLocaleString()) : '-'}</td>
                                        <td>${fim ? (typeof fim === 'string' ? fim : new Date(fim).toLocaleString()) : '-'}</td>
                                        <td>
                                            <strong>${a.titulo}</strong>
                                            <div class="descricao">${a.descricao}</div>
                                        </td>
                                        <td>${a.status === 'EM_ANDAMENTO' ? 'Em andamento' :
                            a.status === 'FINALIZADO' ? 'Finalizado' : a.status}</td>
                                        <td>${a.tempo ? formatarTempo(a.tempo) : '-'}</td>
                                    </tr>
                                `;
                }).join('')}
                        </tbody>
                    </table>
                </div>`;
            };

            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>UCAQ - ${titulo}</title>
                  <style>
                    body {
                      font-family: Helvetica, Arial, sans-serif;
                      padding: 20px;
                      color: #333;
                    }
                    .header {
                      text-align: center;
                      margin-bottom: 30px;
                      border-bottom: 2px solid #4CAF50;
                      padding-bottom: 10px;
                    }
                    .header h1 {
                      color: #4CAF50;
                      margin: 0 0 10px 0;
                    }
                    .equipe-info {
                      background-color: #f9f9f9;
                      border-radius: 5px;
                      padding: 15px;
                      margin-bottom: 20px;
                    }
                    .equipe-titulo {
                      font-weight: bold;
                      font-size: 18px;
                      margin-bottom: 10px;
                      color: #333;
                    }
                    .equipe-detalhe {
                      margin-bottom: 5px;
                    }
                    .equipe-label {
                      font-weight: bold;
                      color: #555;
                    }
                    .secao {
                      margin: 25px 0;
                    }
                    h2 {
                      color: #2E7D32;
                      border-bottom: 1px solid #ddd;
                      padding-bottom: 5px;
                    }
                    .resumo-cards {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 15px;
                      margin-bottom: 20px;
                    }
                    .resumo-card {
                      background-color: #f5f5f5;
                      border-radius: 5px;
                      padding: 15px;
                      width: calc(33% - 10px);
                      box-sizing: border-box;
                      text-align: center;
                    }
                    .resumo-valor {
                      font-size: 24px;
                      font-weight: bold;
                      color: #4CAF50;
                      margin: 5px 0;
                    }
                    .resumo-titulo {
                      font-size: 14px;
                      color: #666;
                    }
                    .resumo-tempo {
                      font-size: 12px;
                      color: #888;
                      margin-top: 5px;
                    }
                    .tabela-container {
                      overflow-x: auto;
                      margin-top: 10px;
                    }
                    .tabela-atividades {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 20px;
                    }
                    .tabela-atividades th, .tabela-atividades td {
                      padding: 10px;
                      text-align: left;
                      border-bottom: 1px solid #ddd;
                    }
                    .tabela-atividades th {
                      background-color: #f5f5f5;
                      font-weight: bold;
                    }
                    .descricao {
                      font-size: 12px;
                      color: #666;
                      margin-top: 3px;
                    }
                    .footer {
                      margin-top: 40px;
                      text-align: center;
                      font-size: 12px;
                      color: #999;
                      padding-top: 10px;
                      border-top: 1px solid #eee;
                    }
                    .total-geral {
                      background-color: #E8F5E9;
                      padding: 15px;
                      text-align: center;
                      border-radius: 5px;
                      margin: 20px 0;
                    }
                    .tempo-total {
                      font-size: 22px;
                      font-weight: bold;
                      color: #2E7D32;
                    }
                    @media print {
                      .no-print {
                        display: none;
                      }
                    }
                    
                    .info-extra {
                      margin-top: 8px;
                      padding: 5px;
                      background-color: #f9f9f9;
                      border-radius: 4px;
                      font-size: 12px;
                    }
                    
                    .info-item {
                      display: inline-block;
                      margin-right: 15px;
                    }
                    
                    .info-label {
                      font-weight: bold;
                      color: #555;
                    }
                    
                    .info-value {
                      color: #333;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>UCAQ - ${titulo}</h1>
                    <div>${filtroAtivo
                    ? `Data: ${dataFiltro.toLocaleDateString()}`
                    : `Período: Todas as atividades registradas`}
                    </div>
                  </div>
                  
                  ${equipeData.id ? `
                  <div class="equipe-info">
                    <div class="equipe-titulo">Informações da Equipe</div>
                    <div class="equipe-detalhe"><span class="equipe-label">Operador:</span> ${equipeData.operador || 'N/A'}</div>
                    <div class="equipe-detalhe"><span class="equipe-label">Auxiliar:</span> ${equipeData.auxiliar || 'N/A'}</div>
                    <div class="equipe-detalhe"><span class="equipe-label">Unidade:</span> ${equipeData.unidade || 'N/A'}</div>
                    <div class="equipe-detalhe"><span class="equipe-label">Placa do Veículo:</span> ${equipeData.placa || 'N/A'}</div>
                  </div>
                  ` : `
                  <div class="equipe-info">
                    <div class="equipe-titulo">Equipe</div>
                    <div>Nenhuma equipe ativa no momento.</div>
                  </div>
                  `}
                  
                  <div class="secao">
                    <h2>Resumo das Atividades</h2>
                    <div class="resumo-cards">
                      <div class="resumo-card">
                        <div class="resumo-titulo">Operações</div>
                        <div class="resumo-valor">${totalOperacoes}</div>
                        <div class="resumo-tempo">Tempo total: ${formatarTempo(tempoTotalOperacoes)}</div>
                      </div>
                      <div class="resumo-card">
                        <div class="resumo-titulo">Deslocamentos</div>
                        <div class="resumo-valor">${totalDeslocamentos}</div>
                        <div class="resumo-tempo">Tempo total: ${formatarTempo(tempoTotalDeslocamentos)}</div>
                      </div>
                      <div class="resumo-card">
                        <div class="resumo-titulo">Aguardos</div>
                        <div class="resumo-valor">${totalAguardos}</div>
                        <div class="resumo-tempo">Tempo total: ${formatarTempo(tempoTotalAguardos)}</div>
                      </div>
                      <div class="resumo-card">
                        <div class="resumo-titulo">Refeições</div>
                        <div class="resumo-valor">${totalRefeicoes}</div>
                        <div class="resumo-tempo">Tempo total: ${formatarTempo(tempoTotalRefeicoes)}</div>
                      </div>
                      <div class="resumo-card">
                        <div class="resumo-titulo">Abastecimentos</div>
                        <div class="resumo-valor">${totalAbastecimentos}</div>
                        <div class="resumo-tempo">Tempo total: ${formatarTempo(tempoTotalAbastecimentos)}</div>
                      </div>
                      <div class="resumo-card">
                        <div class="resumo-titulo">Total de Atividades</div>
                        <div class="resumo-valor">${atividadesParaRelatorio.length}</div>
                      </div>
                    </div>
                    
                    <div class="total-geral">
                      <div>Tempo Total de Todas as Atividades</div>
                      <div class="tempo-total">${formatarTempo(tempoTotalGeral)}</div>
                    </div>
                  </div>
                  
                  <div class="secao">
                    <h2>Operações</h2>
                    ${gerarTabelaAtividades(operacoes, 'operação')}
                  </div>
                  
                  <div class="secao">
                    <h2>Deslocamentos</h2>
                    ${gerarTabelaAtividades(deslocamentos, 'deslocamento')}
                  </div>
                  
                  <div class="secao">
                    <h2>Aguardos</h2>
                    ${gerarTabelaAtividades(aguardos, 'aguardo')}
                  </div>
                  
                  <div class="secao">
                    <h2>Refeições</h2>
                    ${gerarTabelaAtividades(refeicoes, 'refeição')}
                  </div>
                  
                  <div class="secao">
                    <h2>Abastecimentos</h2>
                    ${gerarTabelaAtividades(abastecimentos, 'abastecimento')}
                  </div>
                  
                  <div class="secao">
                    <h2>Mobilizações</h2>
                    ${gerarTabelaAtividades(mobilizacoes, 'mobilização')}
                  </div>
                  <div class="secao">
                    <h2>Desmobilizações</h2>
                    ${gerarTabelaAtividades(desmobilizacoes, 'desmobilização')}
                  </div>
                  
                  <div class="footer">
                    <p>Relatório gerado em ${new Date().toLocaleString()}</p>
                    <p>Este é um documento gerado automaticamente pelo aplicativo SICOP.</p>
                  </div>
                </body>
              </html>
            `;

            // Gerar o PDF usando expo-print
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });

            // Formatar data no formato DD-MM-YYYY para o nome do arquivo
            const dataAtual = new Date();
            const dia = String(dataAtual.getDate()).padStart(2, '0');
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const ano = dataAtual.getFullYear();
            const dataFormatada = `${dia}-${mes}-${ano}`;

            // Nome do arquivo no formato solicitado: UCAQ_DD-MM-YYYY.pdf
            const nomeArquivo = `UCAQ_${dataFormatada}.pdf`;

            // Criar um arquivo temporário com o nome personalizado
            const novoCaminho = `${FileSystem.cacheDirectory}${nomeArquivo}`;

            // Copiar o arquivo gerado para o novo caminho com nome personalizado
            await FileSystem.copyAsync({
                from: uri,
                to: novoCaminho
            });

            // Verificar se o compartilhamento está disponível
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                // Compartilhar o PDF com o nome personalizado
                await Sharing.shareAsync(novoCaminho, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartilhar Relatório UCAQ',
                    UTI: 'com.adobe.pdf'
                });
            } else {
                // Mostrar mensagem caso o compartilhamento não esteja disponível
                Alert.alert(
                    'Erro',
                    'Compartilhamento não está disponível neste dispositivo'
                );
            }

            // Limpar arquivos temporários após compartilhar
            try {
                await FileSystem.deleteAsync(uri);
            } catch (err) {
                console.log('Erro ao limpar arquivo temporário original');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            Alert.alert(
                'Erro',
                'Não foi possível gerar o relatório em PDF. Por favor, tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

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

            {/* Botão flutuante de exportar PDF */}
            <TouchableOpacity
                style={styles.botaoFlutuante}
                onPress={gerarRelatorioPDF}
            >
                <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
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
    botaoFlutuante: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 999,
    },
});