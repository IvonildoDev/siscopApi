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
    Platform,
    KeyboardAvoidingView,
    Switch,
    Modal
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// URL da API
const API_URL = 'http://192.168.1.106:3000';

export default function MobilizacaoDesmobilizacaoScreen({ navigation }) {
    // Estados gerais
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operacaoAtiva, setOperacaoAtiva] = useState(null);
    const [etapaAtual, setEtapaAtual] = useState('AGUARDANDO');
    const [tipoEtapa, setTipoEtapa] = useState('mobilizacao'); // mobilizacao ou desmobilizacao

    // Estados para mobilização
    const [tempoMobilizacao, setTempoMobilizacao] = useState(0);
    const [inicioMobilizacao, setInicioMobilizacao] = useState(null);
    const [fimMobilizacao, setFimMobilizacao] = useState(null);
    const [observacoesMobilizacao, setObservacoesMobilizacao] = useState('');

    // Estados para desmobilização
    const [tempoDesmobilizacao, setTempoDesmobilizacao] = useState(0);
    const [inicioDesmobilizacao, setInicioDesmobilizacao] = useState(null);
    const [fimDesmobilizacao, setFimDesmobilizacao] = useState(null);
    const [observacoesDesmobilizacao, setObservacoesDesmobilizacao] = useState('');
    const [kmInicial, setKmInicial] = useState('');
    const [kmFinal, setKmFinal] = useState('');

    // Checklists
    const [checklistMobConcluido, setChecklistMobConcluido] = useState(false);
    const [checklistDesConcluido, setChecklistDesConcluido] = useState(false);

    // Referência para o timer
    const timerRef = useRef(null);

    // Estados para modal e controle de tempo
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTipo, setModalTipo] = useState('mobilizacao'); // ou 'desmobilizacao'
    const [atividadeIniciada, setAtividadeIniciada] = useState(false);
    const [inicioAtividade, setInicioAtividade] = useState(null);
    const [fimAtividade, setFimAtividade] = useState(null);
    const [duracaoAtividade, setDuracaoAtividade] = useState(null);

    // Formatador de tempo
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

    // Verificar operação ativa ao entrar na tela
    useEffect(() => {
        verificarOperacaoAtiva();

        const unsubscribe = navigation.addListener('focus', () => {
            verificarOperacaoAtiva();
        });

        return unsubscribe;
    }, [navigation]);

    // Controle do timer para mobilização e desmobilização
    useEffect(() => {
        const isRunningMob = etapaAtual === 'MOBILIZACAO' && inicioMobilizacao && !fimMobilizacao;
        const isRunningDes = etapaAtual === 'DESMOBILIZACAO' && inicioDesmobilizacao && !fimDesmobilizacao;

        if (isRunningMob || isRunningDes) {
            timerRef.current = setInterval(() => {
                if (isRunningMob) {
                    setTempoMobilizacao(prev => prev + 1);
                } else if (isRunningDes) {
                    setTempoDesmobilizacao(prev => prev + 1);
                }
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [etapaAtual, inicioMobilizacao, fimMobilizacao, inicioDesmobilizacao, fimDesmobilizacao]);

    // Verificar operação ativa
    const verificarOperacaoAtiva = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/operacoes/ativa`);

            if (response.data) {
                const operacao = response.data;
                setOperacaoAtiva(operacao);

                // Definir a etapa atual
                setEtapaAtual(operacao.etapa_atual);

                // Determinar tipo de etapa com base no estado da operação
                if (['AGUARDANDO', 'MOBILIZACAO', 'AGUARDANDO_OPERACAO'].includes(operacao.etapa_atual)) {
                    setTipoEtapa('mobilizacao');
                } else if (['AGUARDANDO_DESMOBILIZACAO', 'DESMOBILIZACAO', 'FINALIZADO'].includes(operacao.etapa_atual)) {
                    setTipoEtapa('desmobilizacao');
                }

                // Configurar dados de mobilização
                if (operacao.inicio_mobilizacao) {
                    setInicioMobilizacao(new Date(operacao.inicio_mobilizacao));
                    if (operacao.fim_mobilizacao) {
                        setFimMobilizacao(new Date(operacao.fim_mobilizacao));
                        setTempoMobilizacao(operacao.tempo_mobilizacao || 0);
                    } else if (operacao.etapa_atual === 'MOBILIZACAO') {
                        // Calcular tempo decorrido
                        const agora = new Date();
                        const segundosDecorridos = Math.floor((agora - new Date(operacao.inicio_mobilizacao)) / 1000);
                        setTempoMobilizacao(segundosDecorridos);
                    }
                    setObservacoesMobilizacao(operacao.observacoes_mobilizacao || '');
                }

                // Configurar dados de desmobilização
                if (operacao.inicio_desmobilizacao) {
                    setInicioDesmobilizacao(new Date(operacao.inicio_desmobilizacao));
                    if (operacao.fim_desmobilizacao) {
                        setFimDesmobilizacao(new Date(operacao.fim_desmobilizacao));
                        setTempoDesmobilizacao(operacao.tempo_desmobilizacao || 0);
                    } else if (operacao.etapa_atual === 'DESMOBILIZACAO') {
                        // Calcular tempo decorrido
                        const agora = new Date();
                        const segundosDecorridos = Math.floor((agora - new Date(operacao.inicio_desmobilizacao)) / 1000);
                        setTempoDesmobilizacao(segundosDecorridos);
                    }
                    setObservacoesDesmobilizacao(operacao.observacoes_desmobilizacao || '');
                    setKmInicial(operacao.km_inicial_desmobilizacao ? operacao.km_inicial_desmobilizacao.toString() : '');
                    setKmFinal(operacao.km_final_desmobilizacao ? operacao.km_final_desmobilizacao.toString() : '');
                }
            } else {
                // Não tem operação ativa
                setOperacaoAtiva(null);
                setEtapaAtual('AGUARDANDO');
            }
        } catch (err) {
            // Se não encontrou operação ativa, não é um erro
            if (err.response && err.response.status === 404) {
                console.log('Nenhuma operação ativa encontrada');
                setOperacaoAtiva(null);
                setEtapaAtual('AGUARDANDO');
            } else {
                console.error('Erro ao verificar operação ativa:', err);
                setError('Erro ao verificar operação ativa');
            }
        } finally {
            setLoading(false);
        }
    };

    // Iniciar mobilização
    const [mobilizacaoId, setMobilizacaoId] = useState(null);

    const iniciarMobilizacao = async () => {
        setLoading(true);
        try {
            // Buscar equipe ativa primeiro
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                setError('Equipe não encontrada');
                setLoading(false);
                return;
            }

            console.log('equipeAtiva:', equipeAtiva);

            // Definir hora de início ANTES de calcular tempo
            const horaInicio = new Date();
            setInicioMobilizacao(horaInicio);

            // Salvar mobilização inicial (só com hora_inicio)
            const dataInicial = {
                equipe_id: equipeAtiva.id,
                hora_inicio_mobilizacao: horaInicio.toISOString(),
                hora_fim_mobilizacao: null,
                tempo_mobilizacao: null,
                observacoes: observacoesMobilizacao || ''
            };

            console.log('Enviando dados iniciais da mobilização:', dataInicial);

            // 1. Salva a mobilização inicial
            const response = await axios.post(`${API_URL}/mobilizacoes`, dataInicial);
            setMobilizacaoId(response.data.id);
            console.log('Resposta do backend (mobilização):', JSON.stringify(response.data, null, 2));

            // 2. Se existe operação ativa, atualiza ela também
            if (operacaoAtiva && operacaoAtiva.id) {
                await axios.put(`${API_URL}/operacoes/${operacaoAtiva.id}`, {
                    etapa_atual: 'MOBILIZACAO',
                    inicio_mobilizacao: horaInicio.toISOString()
                });
            }

            setEtapaAtual('MOBILIZACAO');
            setTempoMobilizacao(0);

            Alert.alert('Mobilização iniciada!');
        } catch (err) {
            console.log('Erro ao iniciar mobilização:', err);
            setError('Erro ao iniciar mobilização: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Finalizar mobilização
    const finalizarMobilizacao = async () => {
        setLoading(true);
        try {
            // Buscar equipe ativa primeiro
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                setError('Equipe não encontrada');
                setLoading(false);
                return;
            }

            // Calcular tempo decorrido
            const agora = new Date();
            const tempoDecorrido = Math.floor((agora - inicioMobilizacao) / 1000); // segundos

            console.log('=== DEBUG FINALIZAR MOBILIZAÇÃO ===');
            console.log('inicioMobilizacao:', inicioMobilizacao);
            console.log('agora:', agora);
            console.log('Diferença em milissegundos:', agora - inicioMobilizacao);
            console.log('tempoDecorrido calculado:', tempoDecorrido);
            console.log('tempoDecorrido em segundos:', tempoDecorrido);
            console.log('tempoDecorrido em minutos:', Math.floor(tempoDecorrido / 60));
            console.log('====================================');

            // Atualizar a mobilização com hora_fim e tempo
            const data = {
                equipe_id: equipeAtiva.id,
                hora_inicio_mobilizacao: inicioMobilizacao ? inicioMobilizacao.toISOString() : new Date().toISOString(),
                hora_fim_mobilizacao: agora.toISOString(),
                tempo_mobilizacao: tempoDecorrido,
                observacoes: observacoesMobilizacao || ''
            };

            console.log('Enviando dados da mobilização para o backend:', JSON.stringify(data, null, 2));
            console.log('Tempo decorrido em segundos:', tempoDecorrido);
            console.log('Tipo do tempoDecorrido:', typeof tempoDecorrido);

            // Como não temos rota PUT, vamos criar um novo registro ou atualizar via SQL direto
            // Por enquanto, vamos criar um novo registro com os dados completos
            const response = await axios.post(`${API_URL}/mobilizacoes`, data);
            console.log('Resposta do backend (mobilização):', JSON.stringify(response.data, null, 2));

            setFimMobilizacao(agora);
            setTempoMobilizacao(tempoDecorrido);

            Alert.alert('Mobilização finalizada!', `Tempo total: ${formatarTempo(tempoDecorrido)}`);
        } catch (err) {
            console.log('Erro ao finalizar mobilização:', err);
            setError('Erro ao finalizar mobilização: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Iniciar desmobilização
    const iniciarDesmobilizacao = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar equipe ativa primeiro
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                setError('Equipe não encontrada');
                setLoading(false);
                return;
            }

            // Definir hora de início ANTES de salvar
            const horaInicio = new Date();
            setInicioDesmobilizacao(horaInicio);

            // Se existe operação ativa, atualiza ela
            if (operacaoAtiva && operacaoAtiva.id) {
                const dataOperacao = {
                    etapa_atual: 'DESMOBILIZACAO',
                    inicio_desmobilizacao: horaInicio.toISOString(),
                    km_inicial_desmobilizacao: kmInicial ? parseFloat(kmInicial) : null
                };
                await axios.put(`${API_URL}/operacoes/${operacaoAtiva.id}`, dataOperacao);
            }

            setEtapaAtual('DESMOBILIZACAO');
            setTempoDesmobilizacao(0);

            // Salva desmobilização inicial (só com hora_inicio)
            const dataInicial = {
                equipe_id: equipeAtiva.id,
                hora_inicio_desmobilizacao: horaInicio.toISOString(),
                hora_fim_desmobilizacao: null,
                tempo_desmobilizacao: null,
                observacoes: observacoesDesmobilizacao || ''
            };

            console.log('Enviando dados iniciais da desmobilização:', dataInicial);
            await axios.post(`${API_URL}/desmobilizacoes`, dataInicial);

            Alert.alert('Desmobilização Iniciada', 'A equipe está realizando a desmobilização do equipamento.');
        } catch (err) {
            console.log('Erro ao iniciar desmobilização:', err);
            tratarErro(err, 'Erro ao iniciar desmobilização');
        } finally {
            setLoading(false);
        }
    };

    // Finalizar desmobilização
    const finalizarDesmobilizacao = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar equipe ativa primeiro
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                setError('Equipe não encontrada');
                setLoading(false);
                return;
            }

            // Calcular tempo decorrido
            const agora = new Date();
            const tempoDecorrido = Math.floor((agora - inicioDesmobilizacao) / 1000); // segundos

            console.log('=== DEBUG FINALIZAR DESMOBILIZAÇÃO ===');
            console.log('inicioDesmobilizacao:', inicioDesmobilizacao);
            console.log('agora:', agora);
            console.log('Diferença em milissegundos:', agora - inicioDesmobilizacao);
            console.log('tempoDecorrido calculado:', tempoDecorrido);
            console.log('tempoDecorrido em segundos:', tempoDecorrido);
            console.log('tempoDecorrido em minutos:', Math.floor(tempoDecorrido / 60));
            console.log('=======================================');

            // Se existe operação ativa, atualiza ela
            if (operacaoAtiva && operacaoAtiva.id) {
                const dataOperacao = {
                    etapa_atual: 'FINALIZADO',
                    fim_desmobilizacao: agora.toISOString(),
                    tempo_desmobilizacao: tempoDecorrido,
                    observacoes_desmobilizacao: observacoesDesmobilizacao,
                    km_final_desmobilizacao: kmFinal ? parseFloat(kmFinal) : null
                };
                await axios.put(`${API_URL}/operacoes/${operacaoAtiva.id}`, dataOperacao);
            }

            // Atualizar a desmobilização com hora_fim e tempo
            const data = {
                equipe_id: equipeAtiva.id,
                hora_inicio_desmobilizacao: inicioDesmobilizacao ? inicioDesmobilizacao.toISOString() : new Date().toISOString(),
                hora_fim_desmobilizacao: agora.toISOString(),
                tempo_desmobilizacao: tempoDecorrido, // Este é o tempo em segundos, não timestamp
                observacoes: observacoesDesmobilizacao || ''
            };

            console.log('Enviando dados da desmobilização para o backend:', JSON.stringify(data, null, 2));
            console.log('Tempo decorrido em segundos:', tempoDecorrido);
            console.log('Tipo do tempoDecorrido:', typeof tempoDecorrido);

            // Como não temos rota PUT, vamos criar um novo registro com os dados completos
            const response = await axios.post(`${API_URL}/desmobilizacoes`, data);
            console.log('Resposta do backend (desmobilização):', JSON.stringify(response.data, null, 2));

            // Atualizar estado
            setEtapaAtual('FINALIZADO');
            setFimDesmobilizacao(agora);
            setTempoDesmobilizacao(tempoDecorrido);

            Alert.alert(
                'Desmobilização Finalizada',
                `Desmobilização concluída em ${formatarTempo(tempoDecorrido)}.`,
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );
        } catch (err) {
            console.log('Erro ao finalizar desmobilização:', err);
            tratarErro(err, 'Erro ao finalizar desmobilização');
        } finally {
            setLoading(false);
        }
    };

    // Função para tratamento de erros
    const tratarErro = (err, mensagemPadrao) => {
        console.error(`${mensagemPadrao}:`, err);

        let mensagem = `${mensagemPadrao}: `;

        if (err.response) {
            const errorDetails = err.response.data?.error || err.message;
            mensagem += `${errorDetails} (${err.response.status})`;
        } else if (err.request) {
            mensagem += 'Sem resposta do servidor';
        } else {
            mensagem += err.message;
        }

        setError(mensagem);
    };

    // Alternar item do checklist de mobilização
    const alternarItemChecklistMob = (index) => {
        const novosItens = [...itensChecklistMob];
        novosItens[index].concluido = !novosItens[index].concluido;
        setItensChecklistMob(novosItens);

        // Atualizar status do checklist
        setChecklistMobConcluido(novosItens.every(item => item.concluido));
    };

    // Alternar item do checklist de desmobilização
    const alternarItemChecklistDes = (index) => {
        const novosItens = [...itensChecklistDes];
        novosItens[index].concluido = !novosItens[index].concluido;
        setItensChecklistDes(novosItens);

        // Atualizar status do checklist
        setChecklistDesConcluido(novosItens.every(item => item.concluido));
    };

    // Itens do checklist de mobilização
    const [itensChecklistMob, setItensChecklistMob] = useState([
        { id: 1, texto: 'Veículo em condições de uso', concluido: false },
        { id: 2, texto: 'Equipamentos e ferramentas conferidos', concluido: false },
        { id: 3, texto: 'EPIs verificados', concluido: false },
        { id: 4, texto: 'Materiais de consumo separados', concluido: false },
        { id: 5, texto: 'Documentação completa', concluido: false },
    ]);

    // Itens do checklist de desmobilização
    const [itensChecklistDes, setItensChecklistDes] = useState([
        { id: 1, texto: 'Equipamentos recolhidos', concluido: false },
        { id: 2, texto: 'Ferramentas conferidas e guardadas', concluido: false },
        { id: 3, texto: 'Resíduos adequadamente descartados', concluido: false },
        { id: 4, texto: 'Veículo em condições de partida', concluido: false },
        { id: 5, texto: 'Local limpo e organizado', concluido: false },
    ]);

    // Renderizar seletor de etapa
    const renderizarSeletorEtapa = () => (
        <View style={styles.seletorContainer}>
            <TouchableOpacity
                style={[
                    styles.seletorTab,
                    tipoEtapa === 'mobilizacao' ? styles.seletorTabAtiva : {}
                ]}
                onPress={() => abrirModal('mobilizacao')}
            >
                <Ionicons
                    name="construct"
                    size={24}
                    color="#FF9800"
                />
                <Text style={[
                    styles.seletorTabText,
                    tipoEtapa === 'mobilizacao' ? styles.seletorTabTextAtivo : {}
                ]}>Mobilização</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.seletorTab,
                    tipoEtapa === 'desmobilizacao' ? styles.seletorTabAtiva : {}
                ]}
                onPress={() => abrirModal('desmobilizacao')}
            >
                <Ionicons
                    name="exit-outline"
                    size={24}
                    color="#9C27B0"
                />
                <Text style={[
                    styles.seletorTabText,
                    tipoEtapa === 'desmobilizacao' ? styles.seletorTabTextAtivo : {}
                ]}>Desmobilização</Text>
            </TouchableOpacity>
        </View>
    );

    // Função para abrir modal
    const abrirModal = (tipo) => {
        setModalTipo(tipo);
        setModalVisible(true);
        setAtividadeIniciada(false);
        setInicioAtividade(null);
        setFimAtividade(null);
        setDuracaoAtividade(null);
    };

    // Iniciar atividade
    const iniciarAtividade = () => {
        const agora = new Date();
        setInicioAtividade(agora);
        setAtividadeIniciada(true);
        setFimAtividade(null);
        setDuracaoAtividade(null);
    };

    // Finalizar atividade
    const finalizarAtividade = async () => {
        if (!atividadeIniciada || !inicioAtividade) {
            Alert.alert('Atenção', 'Inicie a atividade primeiro.');
            return;
        }
        const agora = new Date();
        setFimAtividade(agora);
        const duracao = Math.round((agora - inicioAtividade) / 60000); // minutos
        const duracaoSegundos = Math.floor((agora - inicioAtividade) / 1000); // segundos
        setDuracaoAtividade(duracao);
        setAtividadeIniciada(false);

        // Salvar no backend baseado no tipo de atividade
        try {
            if (modalTipo === 'mobilizacao') {
                // Salvar mobilização com tempo calculado do modal
                await salvarMobilizacaoCompleta(inicioAtividade, agora, duracaoSegundos);
            } else if (modalTipo === 'desmobilizacao') {
                // Salvar desmobilização com tempo calculado do modal
                await salvarDesmobilizacaoCompleta(inicioAtividade, agora, duracaoSegundos);
            }
            Alert.alert('Atividade finalizada e salva', `Duração: ${duracao} minutos`);
        } catch (error) {
            console.error('Erro ao salvar atividade:', error);
            Alert.alert('Erro', 'Atividade finalizada mas não foi possível salvar no servidor.');
        }
    };

    // Função para salvar mobilização completa
    const salvarMobilizacaoCompleta = async (inicio, fim, tempoSegundos) => {
        try {
            // Buscar equipe ativa
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                throw new Error('Equipe não encontrada');
            }

            console.log('=== SALVANDO MOBILIZAÇÃO COMPLETA ===');
            console.log('inicio:', inicio);
            console.log('fim:', fim);
            console.log('tempoSegundos:', tempoSegundos);

            const data = {
                equipe_id: equipeAtiva.id,
                hora_inicio_mobilizacao: inicio.toISOString(),
                hora_fim_mobilizacao: fim.toISOString(),
                tempo_mobilizacao: tempoSegundos,
                observacoes: observacoesMobilizacao || ''
            };

            console.log('Dados enviados para mobilização:', JSON.stringify(data, null, 2));

            const response = await axios.post(`${API_URL}/mobilizacoes`, data);
            console.log('Resposta do backend (mobilização):', JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error) {
            console.error('Erro ao salvar mobilização completa:', error);
            throw error;
        }
    };

    // Função para salvar desmobilização completa
    const salvarDesmobilizacaoCompleta = async (inicio, fim, tempoSegundos) => {
        try {
            // Buscar equipe ativa
            const equipeResponse = await axios.get(`${API_URL}/equipes/ativa`);
            const equipeAtiva = equipeResponse.data;

            if (!equipeAtiva || !equipeAtiva.id) {
                throw new Error('Equipe não encontrada');
            }

            console.log('=== SALVANDO DESMOBILIZAÇÃO COMPLETA ===');
            console.log('inicio:', inicio);
            console.log('fim:', fim);
            console.log('tempoSegundos:', tempoSegundos);

            const data = {
                equipe_id: equipeAtiva.id,
                hora_inicio_desmobilizacao: inicio.toISOString(),
                hora_fim_desmobilizacao: fim.toISOString(),
                tempo_desmobilizacao: tempoSegundos,
                observacoes: observacoesDesmobilizacao || ''
            };

            console.log('Dados enviados para desmobilização:', JSON.stringify(data, null, 2));

            const response = await axios.post(`${API_URL}/desmobilizacoes`, data);
            console.log('Resposta do backend (desmobilização):', JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error) {
            console.error('Erro ao salvar desmobilização completa:', error);
            throw error;
        }
    };

    // Resumo para exibir no final
    const renderResumoAtividade = () => (
        <View style={styles.resumoContainer}>
            <Text style={styles.sectionTitle}>Resumo da Atividade</Text>
            <Text>Tipo: {modalTipo === 'mobilizacao' ? 'Mobilização' : 'Desmobilização'}</Text>
            <Text>Início: {inicioAtividade ? inicioAtividade.toLocaleString() : 'N/A'}</Text>
            <Text>Fim: {fimAtividade ? fimAtividade.toLocaleString() : 'N/A'}</Text>
            <Text>Duração: {duracaoAtividade !== null ? `${duracaoAtividade} minutos` : 'N/A'}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Ionicons
                        name={tipoEtapa === 'mobilizacao' ? 'construct' : 'exit-outline'}
                        size={36}
                        color={tipoEtapa === 'mobilizacao' ? '#FF9800' : '#9C27B0'}
                    />
                    <Text style={styles.headerText}>
                        {tipoEtapa === 'mobilizacao' ? 'Mobilização' : 'Desmobilização'}
                    </Text>
                </View>

                {/* Selector de etapa */}
                {renderizarSeletorEtapa()}

                {/* Modal de atividade */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.sectionTitle}>
                                {modalTipo === 'mobilizacao' ? 'Mobilização' : 'Desmobilização'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.btnMobilizacao, atividadeIniciada && { backgroundColor: '#bdbdbd' }]}
                                onPress={iniciarAtividade}
                                disabled={atividadeIniciada}
                            >
                                <Text style={styles.btnText}>Iniciar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnDesmobilizacao, (!atividadeIniciada || fimAtividade) && { backgroundColor: '#bdbdbd' }]}
                                onPress={finalizarAtividade}
                                disabled={!atividadeIniciada || fimAtividade}
                            >
                                <Text style={styles.btnText}>Finalizar</Text>
                            </TouchableOpacity>
                            {duracaoAtividade !== null && (
                                <View style={{ marginTop: 20 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Duração registrada: {duracaoAtividade} minutos</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[styles.btnOperacao, { marginTop: 20 }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Resumo da atividade */}
                {duracaoAtividade !== null && renderResumoAtividade()}
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
    seletorContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
    },
    seletorTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 15,
    },
    seletorTabAtiva: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 2,
    },
    seletorTabText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
        color: '#757575',
    },
    seletorTabTextAtivo: {
        fontWeight: 'bold',
    },
    alertaContainer: {
        backgroundColor: '#FFF3E0',
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    alertaTexto: {
        color: '#E65100',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    botaoNavegar: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    botaoNavegarTexto: {
        color: '#fff',
        fontWeight: 'bold',
    },
    operacaoCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    operacaoTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    operacaoInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    // Timer mobilização
    timerCard: {
        backgroundColor: '#FFF3E0',
        padding: 20,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    timerTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E65100',
        marginBottom: 10,
    },
    timerValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF9800',
        marginVertical: 5,
        fontVariant: ['tabular-nums'],
    },
    timerStatus: {
        fontSize: 14,
        color: '#F57C00',
        marginBottom: 5,
    },
    // Timer desmobilização
    timerCardDes: {
        backgroundColor: '#F3E5F5',
        padding: 20,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1BEE7',
    },
    timerTitleDes: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6A1B9A',
        marginBottom: 10,
    },
    timerValueDes: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#9C27B0',
        marginVertical: 5,
        fontVariant: ['tabular-nums'],
    },
    timerStatusDes: {
        fontSize: 14,
        color: '#7B1FA2',
        marginBottom: 5,
    },
    timerInicio: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFCDD2',
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
    },
    errorText: {
        color: '#D32F2F',
        marginLeft: 10,
        flex: 1,
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
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    instrucoes: {
        color: '#666',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    btnMobilizacao: {
        backgroundColor: '#FF9800',
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        paddingHorizontal: 24,
        minWidth: 180,
    },
    btnDesmobilizacao: {
        backgroundColor: '#9C27B0',
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        paddingHorizontal: 24,
        minWidth: 180,
    },
    btnOperacao: {
        backgroundColor: '#2196F3',
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        elevation: 4,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        paddingHorizontal: 24,
        minWidth: 180,
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        letterSpacing: 1,
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
        paddingHorizontal: 12,
    },
    checklistContainer: {
        marginBottom: 20,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checklistText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    checklistTextConcluido: {
        textDecorationLine: 'line-through',
        color: '#757575',
    },
    observacoesContainer: {
        marginBottom: 20,
    },
    avisoChecklist: {
        color: '#F57C00',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    resumoContainer: {
        marginBottom: 20,
    },
    resumoItem: {
        marginBottom: 12,
    },
    resumoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    resumoValor: {
        fontSize: 16,
        color: '#333',
    },
    tempoTotalMob: {
        fontWeight: 'bold',
        color: '#FF9800',
        fontSize: 18,
    },
    tempoTotalDes: {
        fontWeight: 'bold',
        color: '#9C27B0',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
});