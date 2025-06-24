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
    Switch
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
    const iniciarMobilizacao = async () => {
        setLoading(true);
        try {
            const data = {
                inicio_mobilizacao: new Date().toISOString(),
                status: 'MOBILIZACAO',
                // outros campos se necessário
            };
            await axios.post(`${API_URL}/mobilizacoes`, data); // endpoint só de mobilização
            // Atualize o estado local se necessário
            Alert.alert('Mobilização iniciada!');
        } catch (err) {
            setError('Erro ao iniciar mobilização');
        } finally {
            setLoading(false);
        }
    };

    // Finalizar mobilização
    const finalizarMobilizacao = async () => {
        setLoading(true);
        try {
            const data = {
                fim_mobilizacao: new Date().toISOString(),
                tempo_mobilizacao: tempoMobilizacao,
                observacoes: observacoesMobilizacao,
                checklist: itensChecklistMob,
                status: 'MOBILIZACAO_CONCLUIDA'
            };
            await axios.put(`${API_URL}/mobilizacoes/${mobilizacaoId}`, data); // endpoint só de mobilização
            Alert.alert('Mobilização finalizada!');
        } catch (err) {
            setError('Erro ao finalizar mobilização');
        } finally {
            setLoading(false);
        }
    };

    // Iniciar desmobilização
    const iniciarDesmobilizacao = async () => {
        if (!kmInicial) {
            setError('Informe a quilometragem inicial');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (!operacaoAtiva || !operacaoAtiva.id) {
                setError('Operação não encontrada');
                return;
            }

            const dataOperacao = {
                etapa_atual: 'DESMOBILIZACAO',
                inicio_desmobilizacao: new Date().toISOString(),
                km_inicial_desmobilizacao: parseFloat(kmInicial)
            };

            await axios.put(`${API_URL}/operacoes/${operacaoAtiva.id}`, dataOperacao);

            // Atualizar estado
            setEtapaAtual('DESMOBILIZACAO');
            setInicioDesmobilizacao(new Date());
            setTempoDesmobilizacao(0);

            Alert.alert('Desmobilização Iniciada', 'A equipe está realizando a desmobilização do equipamento.');
        } catch (err) {
            tratarErro(err, 'Erro ao iniciar desmobilização');
        } finally {
            setLoading(false);
        }
    };

    // Finalizar desmobilização
    const finalizarDesmobilizacao = async () => {
        if (!kmFinal) {
            setError('Informe a quilometragem final');
            return;
        }

        if (!checklistDesConcluido) {
            Alert.alert(
                'Checklist Incompleto',
                'É necessário completar o checklist antes de finalizar a desmobilização.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const dataOperacao = {
                etapa_atual: 'FINALIZADO',
                fim_desmobilizacao: new Date().toISOString(),
                tempo_desmobilizacao: tempoDesmobilizacao,
                observacoes_desmobilizacao: observacoesDesmobilizacao,
                km_final_desmobilizacao: parseFloat(kmFinal)
            };

            await axios.put(`${API_URL}/operacoes/${operacaoAtiva.id}`, dataOperacao);

            // Atualizar estado
            setEtapaAtual('FINALIZADO');
            setFimDesmobilizacao(new Date());

            Alert.alert(
                'Desmobilização Finalizada',
                `Desmobilização concluída em ${formatarTempo(tempoDesmobilizacao)}.`,
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );
        } catch (err) {
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
                onPress={() => setTipoEtapa('mobilizacao')}
                disabled={loading}
            >
                <Ionicons
                    name="construct"
                    size={24}
                    color={tipoEtapa === 'mobilizacao' ? '#FF9800' : '#757575'}
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
                onPress={() => setTipoEtapa('desmobilizacao')}
                disabled={loading}
            >
                <Ionicons
                    name="exit-outline"
                    size={24}
                    color={tipoEtapa === 'desmobilizacao' ? '#9C27B0' : '#757575'}
                />
                <Text style={[
                    styles.seletorTabText,
                    tipoEtapa === 'desmobilizacao' ? styles.seletorTabTextAtivo : {}
                ]}>Desmobilização</Text>
            </TouchableOpacity>
        </View>
    );

    // Renderizar conteúdo de mobilização
    const renderizarConteudoMobilizacao = () => {
        // Se não estamos na etapa correta para mobilização
        if (!['AGUARDANDO', 'MOBILIZACAO', 'AGUARDANDO_OPERACAO'].includes(etapaAtual)) {
            return (
                <View style={styles.alertaContainer}>
                    <Ionicons name="alert-circle" size={24} color="#F57C00" />
                    <Text style={styles.alertaTexto}>
                        A fase de mobilização já foi concluída para esta operação.
                    </Text>
                </View>
            );
        }

        // Timer de mobilização
        const renderTimer = () => {
            if (inicioMobilizacao) {
                return (
                    <View style={styles.timerCard}>
                        <Text style={styles.timerTitle}>Tempo de Mobilização</Text>
                        <Text style={styles.timerValue}>{formatarTempo(tempoMobilizacao)}</Text>
                        <Text style={styles.timerStatus}>
                            {etapaAtual === 'MOBILIZACAO'
                                ? 'Mobilização em andamento'
                                : 'Mobilização concluída'}
                        </Text>
                        {etapaAtual === 'MOBILIZACAO' && inicioMobilizacao && !fimMobilizacao && (
                            <Text style={styles.timerInicio}>
                                Iniciado em: {inicioMobilizacao.toLocaleString()}
                            </Text>
                        )}
                    </View>
                );
            }
            return null;
        };

        // Etapa aguardando - botão iniciar mobilização
        if (etapaAtual === 'AGUARDANDO') {
            return (
                <>
                    {renderTimer()}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Iniciar Mobilização</Text>
                        <Text style={styles.instrucoes}>
                            Clique no botão abaixo para iniciar o processo de mobilização da equipe e equipamentos.
                            A mobilização consiste no preparo e transporte dos recursos até o local da operação.
                        </Text>
                        <TouchableOpacity
                            style={styles.btnMobilizacao}
                            onPress={iniciarMobilizacao}
                            disabled={loading}
                        >
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Text style={styles.btnText}>INICIAR MOBILIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                </>
            );
        }

        // Etapa mobilização - checklist e finalização
        if (etapaAtual === 'MOBILIZACAO') {
            return (
                <>
                    {/* Botão para reiniciar mobilização, se desejar */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                        <TouchableOpacity
                            style={[styles.btnMobilizacao, { marginRight: 10 }]}
                            onPress={iniciarMobilizacao}
                            disabled={loading}
                        >
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Text style={styles.btnText}>INICIAR MOBILIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Checklist de Mobilização</Text>

                        <View style={styles.checklistContainer}>
                            {itensChecklistMob.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.checklistItem}
                                    onPress={() => alternarItemChecklistMob(index)}
                                >
                                    <Ionicons
                                        name={item.concluido ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={item.concluido ? "#FF9800" : "#757575"}
                                    />
                                    <Text style={[
                                        styles.checklistText,
                                        item.concluido && styles.checklistTextConcluido
                                    ]}>
                                        {item.texto}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.observacoesContainer}>
                            <Text style={styles.label}>Observações</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                    placeholder="Observações sobre a mobilização"
                                    value={observacoesMobilizacao}
                                    onChangeText={setObservacoesMobilizacao}
                                    multiline={true}
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.btnMobilizacao, checklistMobConcluido ? {} : { backgroundColor: '#bdbdbd' }]}
                            onPress={finalizarMobilizacao}
                            disabled={loading || !checklistMobConcluido}
                        >
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            <Text style={styles.btnText}>FINALIZAR MOBILIZAÇÃO</Text>
                        </TouchableOpacity>

                        {!checklistMobConcluido && (
                            <Text style={styles.avisoChecklist}>
                                Complete todos os itens do checklist para finalizar.
                            </Text>
                        )}
                    </View>
                </>
            );
        }

        // Etapa mobilização concluída - resumo
        if (etapaAtual === 'AGUARDANDO_OPERACAO') {
            return (
                <>
                    {renderTimer()}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Mobilização Concluída</Text>

                        <View style={styles.resumoContainer}>
                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Início:</Text>
                                <Text style={styles.resumoValor}>
                                    {inicioMobilizacao ? inicioMobilizacao.toLocaleString() : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Fim:</Text>
                                <Text style={styles.resumoValor}>
                                    {fimMobilizacao ? fimMobilizacao.toLocaleString() : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Tempo Total:</Text>
                                <Text style={[styles.resumoValor, styles.tempoTotalMob]}>
                                    {formatarTempo(tempoMobilizacao)}
                                </Text>
                            </View>

                            {observacoesMobilizacao ? (
                                <View style={styles.resumoItem}>
                                    <Text style={styles.resumoLabel}>Observações:</Text>
                                    <Text style={styles.resumoValor}>
                                        {observacoesMobilizacao}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        <TouchableOpacity
                            style={[styles.btnOperacao]}
                            onPress={() => navigation.navigate('Operacoes')}
                        >
                            <Ionicons name="arrow-forward" size={24} color="#fff" />
                            <Text style={styles.btnText}>IR PARA OPERAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                </>
            );
        }
    };

    // Renderizar conteúdo de desmobilização
    const renderizarConteudoDesmobilizacao = () => {
        // Se estamos em etapas anteriores à desmobilização
        if (['AGUARDANDO', 'MOBILIZACAO', 'AGUARDANDO_OPERACAO', 'OPERACAO'].includes(etapaAtual)) {
            return (
                <View style={styles.alertaContainer}>
                    <Ionicons name="alert-circle" size={24} color="#9C27B0" />
                    <Text style={styles.alertaTexto}>
                        A fase de desmobilização só estará disponível após a conclusão da operação.
                    </Text>
                </View>
            );
        }

        // Timer de desmobilização
        const renderTimer = () => {
            if (inicioDesmobilizacao) {
                return (
                    <View style={styles.timerCardDes}>
                        <Text style={styles.timerTitleDes}>Tempo de Desmobilização</Text>
                        <Text style={styles.timerValueDes}>{formatarTempo(tempoDesmobilizacao)}</Text>
                        <Text style={styles.timerStatusDes}>
                            {etapaAtual === 'DESMOBILIZACAO'
                                ? 'Desmobilização em andamento'
                                : 'Desmobilização concluída'}
                        </Text>
                        {etapaAtual === 'DESMOBILIZACAO' && inicioDesmobilizacao && !fimDesmobilizacao && (
                            <Text style={styles.timerInicio}>
                                Iniciado em: {inicioDesmobilizacao.toLocaleString()}
                            </Text>
                        )}
                    </View>
                );
            }
            return null;
        };

        // Etapa aguardando desmobilização
        if (etapaAtual === 'AGUARDANDO_DESMOBILIZACAO') {
            return (
                <>
                    {renderTimer()}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Iniciar Desmobilização</Text>
                        <Text style={styles.instrucoes}>
                            Informe a quilometragem inicial e clique no botão abaixo para iniciar o processo de desmobilização.
                            A desmobilização consiste na retirada dos recursos do local da operação.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Quilometragem Inicial (Km)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="speedometer-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    value={kmInicial}
                                    onChangeText={setKmInicial}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.btnDesmobilizacao, !kmInicial ? { backgroundColor: '#bdbdbd' } : {}]}
                            onPress={iniciarDesmobilizacao}
                            disabled={loading || !kmInicial}
                        >
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Text style={styles.btnText}>INICIAR DESMOBILIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                </>
            );
        }

        // Etapa desmobilização - checklist e finalização
        if (etapaAtual === 'DESMOBILIZACAO') {
            return (
                <>
                    {renderTimer()}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Checklist de Desmobilização</Text>

                        <View style={styles.checklistContainer}>
                            {itensChecklistDes.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.checklistItem}
                                    onPress={() => alternarItemChecklistDes(index)}
                                >
                                    <Ionicons
                                        name={item.concluido ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={item.concluido ? "#9C27B0" : "#757575"}
                                    />
                                    <Text style={[
                                        styles.checklistText,
                                        item.concluido && styles.checklistTextConcluido
                                    ]}>
                                        {item.texto}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Quilometragem Final (Km)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="speedometer-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    value={kmFinal}
                                    onChangeText={setKmFinal}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Observações</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, { height: 100, textAlignVertical: 'top', paddingHorizontal: 12 }]}
                                    placeholder="Observações sobre a desmobilização"
                                    value={observacoesDesmobilizacao}
                                    onChangeText={setObservacoesDesmobilizacao}
                                    multiline={true}
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.btnDesmobilizacao,
                                (checklistDesConcluido && kmFinal) ? {} : { backgroundColor: '#bdbdbd' }
                            ]}
                            onPress={finalizarDesmobilizacao}
                            disabled={loading || !checklistDesConcluido || !kmFinal}
                        >
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            <Text style={styles.btnText}>FINALIZAR DESMOBILIZAÇÃO</Text>
                        </TouchableOpacity>

                        {!checklistDesConcluido && (
                            <Text style={styles.avisoChecklist}>
                                Complete todos os itens do checklist para finalizar.
                            </Text>
                        )}
                    </View>
                </>
            );
        }

        // Etapa finalizado - resumo
        if (etapaAtual === 'FINALIZADO') {
            return (
                <>
                    {renderTimer()}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Desmobilização Concluída</Text>

                        <View style={styles.resumoContainer}>
                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Início:</Text>
                                <Text style={styles.resumoValor}>
                                    {inicioDesmobilizacao ? inicioDesmobilizacao.toLocaleString() : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Fim:</Text>
                                <Text style={styles.resumoValor}>
                                    {fimDesmobilizacao ? fimDesmobilizacao.toLocaleString() : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Tempo Total:</Text>
                                <Text style={[styles.resumoValor, styles.tempoTotalDes]}>
                                    {formatarTempo(tempoDesmobilizacao)}
                                </Text>
                            </View>

                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Quilometragem:</Text>
                                <Text style={styles.resumoValor}>
                                    {kmInicial} km → {kmFinal} km ({(parseFloat(kmFinal) - parseFloat(kmInicial)).toFixed(1)} km)
                                </Text>
                            </View>

                            {observacoesDesmobilizacao ? (
                                <View style={styles.resumoItem}>
                                    <Text style={styles.resumoLabel}>Observações:</Text>
                                    <Text style={styles.resumoValor}>
                                        {observacoesDesmobilizacao}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        <TouchableOpacity
                            style={[styles.btnOperacao]}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Ionicons name="home" size={24} color="#fff" />
                            <Text style={styles.btnText}>IR PARA HOME</Text>
                        </TouchableOpacity>
                    </View>
                </>
            );
        }
    };

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
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={verificarOperacaoAtiva}
                    >
                        <Ionicons
                            name="refresh"
                            size={24}
                            color={tipoEtapa === 'mobilizacao' ? '#FF9800' : '#9C27B0'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Selector de etapa */}
                {renderizarSeletorEtapa()}

                {/* Verificação de operação ativa */}
                {!operacaoAtiva && !loading ? (
                    <View style={styles.alertaContainer}>
                        <Ionicons name="alert-circle" size={24} color="#F57C00" />
                        <Text style={styles.alertaTexto}>
                            É necessário criar uma operação antes de iniciar a mobilização ou desmobilização.
                        </Text>
                        <TouchableOpacity
                            style={styles.botaoNavegar}
                            onPress={() => navigation.navigate('Operacoes')}
                        >
                            <Text style={styles.botaoNavegarTexto}>Ir para Operações</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Detalhes da operação */}
                        {operacaoAtiva && (
                            <View style={styles.operacaoCard}>
                                <Text style={styles.operacaoTitulo}>
                                    Operação #{operacaoAtiva.id}
                                </Text>
                                <Text style={styles.operacaoInfo}>
                                    Tipo: {operacaoAtiva.tipo_operacao || 'Não definido'}
                                </Text>
                                <Text style={styles.operacaoInfo}>
                                    Local: {operacaoAtiva.cidade || 'Não definido'} - Poço: {operacaoAtiva.poco || 'Não definido'}
                                </Text>
                                <Text style={styles.operacaoInfo}>
                                    Etapa: {etapaAtual}
                                </Text>
                            </View>
                        )}

                        {/* Mensagem de erro */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={24} color="#D32F2F" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Conteúdo da etapa selecionada */}
                        {tipoEtapa === 'mobilizacao'
                            ? renderizarConteudoMobilizacao()
                            : renderizarConteudoDesmobilizacao()}
                    </>
                )}

                {/* Indicador de carregamento */}
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color={tipoEtapa === 'mobilizacao' ? '#FF9800' : '#9C27B0'}
                        style={styles.loader}
                    />
                )}
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
        borderRadius: 8,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 3,
    },
    btnDesmobilizacao: {
        backgroundColor: '#9C27B0',
        borderRadius: 8,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 3,
    },
    btnOperacao: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 3,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
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
});