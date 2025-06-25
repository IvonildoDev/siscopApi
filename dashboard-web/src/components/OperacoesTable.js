import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Grid
} from '@mui/material';
import {
    getOperacoes,
    getDeslocamentos,
    getAguardos,
    getRefeicoes,
    getAbastecimentos,
    getMobilizacoes,
    getDesmobilizacoes
} from '../api';
import dayjs from 'dayjs';
import {
    Visibility as ViewIcon,
    Engineering as EngineeringIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Water as WaterIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon,
    Comment as CommentIcon,
    Close as CloseIcon,
    DirectionsCar as MobilizacaoIcon,
    DirectionsCarFilled as DesmobilizacaoIcon
} from '@mui/icons-material';

const OperacoesTable = ({ operacoes: propOperacoes }) => {
    const [operacoes, setOperacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOperacao, setSelectedOperacao] = useState(null);
    const [operacaoDetalhes, setOperacaoDetalhes] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

    useEffect(() => {
        // Se recebeu operações como prop, usar elas
        if (propOperacoes && propOperacoes.length > 0) {
            setOperacoes(propOperacoes);
            setLoading(false);
            return;
        }

        // Senão, buscar do backend
        getOperacoes()
            .then((response) => {
                console.log('OperacoesTable - resposta completa:', response);
                let operacoesArray = [];

                if (Array.isArray(response.data)) {
                    operacoesArray = response.data;
                } else if (Array.isArray(response.data.data)) {
                    operacoesArray = response.data.data;
                } else if (Array.isArray(response.data.items)) {
                    operacoesArray = response.data.items;
                } else {
                    operacoesArray = [];
                }

                console.log('OperacoesTable - operações processadas:', operacoesArray);
                setOperacoes(operacoesArray);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Erro ao buscar operações:', error);
                setLoading(false);
            });
    }, [propOperacoes]);

    // Status color mapping
    const getEtapaColor = (etapa) => {
        const statusMap = {
            'EM_MOBILIZACAO': 'warning',
            'MOBILIZACAO': 'warning',
            'EM_OPERACAO': 'success',
            'OPERACAO': 'success',
            'EM_DESMOBILIZACAO': 'info',
            'DESMOBILIZACAO': 'info',
            'AGUARDANDO': 'default',
            'AGUARDANDO_OPERACAO': 'default',
            'AGUARDANDO_DESMOBILIZACAO': 'default',
            'FINALIZADO': 'default',
            'FINALIZADA': 'default'
        };
        return statusMap[etapa] || 'primary';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return dayjs(dateString).format('DD/MM/YYYY HH:mm');
        } catch {
            return dateString;
        }
    };

    const handleDetalhes = async (operacao) => {
        setSelectedOperacao(operacao);
        setDialogOpen(true);
        setLoadingDetalhes(true);

        try {
            console.log('=== DEBUG: Buscando detalhes da operação ===');
            console.log('Operação ID:', operacao.id);
            console.log('Operação completa:', operacao);

            // Buscar dados relacionados à operação
            const [deslocamentos, aguardos, refeicoes, abastecimentos, mobilizacoes, desmobilizacoes] = await Promise.all([
                getDeslocamentos(operacao.id),
                getAguardos(),
                getRefeicoes(),
                getAbastecimentos(),
                getMobilizacoes(operacao.id),
                getDesmobilizacoes(operacao.id)
            ]);

            console.log('=== Dados brutos recebidos ===');
            console.log('Mobilizações brutas:', mobilizacoes);
            console.log('Desmobilizações brutas:', desmobilizacoes);
            console.log('Deslocamentos brutos:', deslocamentos);
            console.log('Aguardos brutos:', aguardos);
            console.log('Refeições brutas:', refeicoes);
            console.log('Abastecimentos brutos:', abastecimentos);

            // Verificar estrutura dos dados
            const mobilizacoesData = mobilizacoes.data || mobilizacoes || [];
            const desmobilizacoesData = desmobilizacoes.data || desmobilizacoes || [];
            const deslocamentosData = deslocamentos.data || deslocamentos || [];
            const aguardosData = aguardos.data || aguardos || [];
            const refeicoesData = refeicoes.data || refeicoes || [];
            const abastecimentosData = abastecimentos.data || abastecimentos || [];

            console.log('=== Dados processados ===');
            console.log('Mobilizações processadas:', mobilizacoesData);
            console.log('Desmobilizações processadas:', desmobilizacoesData);

            // Função para extrair dados de diferentes estruturas
            const extractData = (responseData) => {
                if (Array.isArray(responseData)) {
                    return responseData;
                } else if (responseData && typeof responseData === 'object') {
                    if (Array.isArray(responseData.data)) {
                        return responseData.data;
                    } else if (Array.isArray(responseData.items)) {
                        return responseData.items;
                    } else if (Array.isArray(responseData.mobilizacoes)) {
                        return responseData.mobilizacoes;
                    } else if (Array.isArray(responseData.desmobilizacoes)) {
                        return responseData.desmobilizacoes;
                    } else if (Array.isArray(responseData.deslocamentos)) {
                        return responseData.deslocamentos;
                    } else if (Array.isArray(responseData.aguardos)) {
                        return responseData.aguardos;
                    } else if (Array.isArray(responseData.refeicoes)) {
                        return responseData.refeicoes;
                    } else if (Array.isArray(responseData.abastecimentos)) {
                        return responseData.abastecimentos;
                    }
                }
                return [];
            };

            // Extrair dados usando a função helper
            const mobilizacoesArray = extractData(mobilizacoesData);
            const desmobilizacoesArray = extractData(desmobilizacoesData);
            const deslocamentosArray = extractData(deslocamentosData);
            const aguardosArray = extractData(aguardosData);
            const refeicoesArray = extractData(refeicoesData);
            const abastecimentosArray = extractData(abastecimentosData);

            console.log('=== Dados extraídos ===');
            console.log('Mobilizações extraídas:', mobilizacoesArray);
            console.log('Desmobilizações extraídas:', desmobilizacoesArray);
            console.log('Deslocamentos extraídos:', deslocamentosArray);

            // Filtrar dados relacionados à operação específica
            const deslocamentosOperacao = Array.isArray(deslocamentosArray) ? deslocamentosArray.filter(d => d.operacao_id === operacao.id) : [];
            const aguardosOperacao = Array.isArray(aguardosArray) ? aguardosArray.filter(a => a.operacao_id === operacao.id) : [];
            const refeicoesOperacao = Array.isArray(refeicoesArray) ? refeicoesArray.filter(r => r.operacao_id === operacao.id) : [];
            const abastecimentosOperacao = Array.isArray(abastecimentosArray) ? abastecimentosArray.filter(ab => ab.operacao_id === operacao.id) : [];
            const mobilizacoesOperacao = Array.isArray(mobilizacoesArray) ? mobilizacoesArray.filter(m => m.equipe_id === operacao.equipe_id) : [];
            const desmobilizacoesOperacao = Array.isArray(desmobilizacoesArray) ? desmobilizacoesArray.filter(d => d.equipe_id === operacao.equipe_id) : [];

            console.log('=== Dados filtrados por operação ===');
            console.log('Mobilizações filtradas:', mobilizacoesOperacao);
            console.log('Desmobilizações filtradas:', desmobilizacoesOperacao);
            console.log('Deslocamentos filtrados:', deslocamentosOperacao);
            console.log('Aguardos filtrados:', aguardosOperacao);
            console.log('Refeições filtradas:', refeicoesOperacao);
            console.log('Abastecimentos filtrados:', abastecimentosOperacao);

            // Verificar se há dados sem operacao_id (pode ser que usem equipe_id)
            if (mobilizacoesOperacao.length === 0 && mobilizacoesArray.length > 0) {
                console.log('=== Verificando mobilizações por equipe ===');
                const mobilizacoesPorEquipe = mobilizacoesArray.filter(m => m.equipe_id === operacao.equipe_id);
                console.log('Mobilizações por equipe:', mobilizacoesPorEquipe);
            }

            if (desmobilizacoesOperacao.length === 0 && desmobilizacoesArray.length > 0) {
                console.log('=== Verificando desmobilizações por equipe ===');
                const desmobilizacoesPorEquipe = desmobilizacoesArray.filter(d => d.equipe_id === operacao.equipe_id);
                console.log('Desmobilizações por equipe:', desmobilizacoesPorEquipe);
            }

            setOperacaoDetalhes({
                operacao,
                deslocamentos: deslocamentosOperacao,
                aguardos: aguardosOperacao,
                refeicoes: refeicoesOperacao,
                abastecimentos: abastecimentosOperacao,
                mobilizacoes: mobilizacoesOperacao,
                desmobilizacoes: desmobilizacoesOperacao
            });
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            setOperacaoDetalhes({
                operacao,
                deslocamentos: [],
                aguardos: [],
                refeicoes: [],
                abastecimentos: [],
                mobilizacoes: [],
                desmobilizacoes: []
            });
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedOperacao(null);
        setOperacaoDetalhes(null);
    };

    if (loading) return (
        <Box p={3} textAlign="center">
            <Typography>Carregando operações...</Typography>
        </Box>
    );

    if (operacoes.length === 0) {
        return (
            <Box p={3} textAlign="center">
                <Typography color="textSecondary">
                    Nenhuma operação encontrada
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ overflow: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Poço</TableCell>
                            <TableCell>Cidade</TableCell>
                            <TableCell>Representante</TableCell>
                            <TableCell>Etapa</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Volume</TableCell>
                            <TableCell>Pressão</TableCell>
                            <TableCell>Temperatura</TableCell>
                            <TableCell>Data Criação</TableCell>
                            <TableCell>Início Operação</TableCell>
                            <TableCell>Fim Operação</TableCell>
                            <TableCell>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {operacoes.map((op) => (
                            <TableRow key={op.id}>
                                <TableCell>{op.id}</TableCell>
                                <TableCell>{op.tipo_operacao || '-'}</TableCell>
                                <TableCell>{op.poco || '-'}</TableCell>
                                <TableCell>{op.cidade || '-'}</TableCell>
                                <TableCell>{op.representante || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={op.etapa_atual || 'N/A'}
                                        color={getEtapaColor(op.etapa_atual)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={op.status || 'N/A'}
                                        color={op.status === 'ativo' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{op.volume || '-'}</TableCell>
                                <TableCell>{op.pressao || '-'}</TableCell>
                                <TableCell>{op.temperatura_quente ? `${op.temperatura_quente} °C` : '-'}</TableCell>
                                <TableCell>{formatDate(op.criado_em)}</TableCell>
                                <TableCell>{formatDate(op.inicio_operacao)}</TableCell>
                                <TableCell>{formatDate(op.fim_operacao)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ViewIcon />}
                                        onClick={() => handleDetalhes(op)}
                                        sx={{
                                            minWidth: 'auto',
                                            px: 1,
                                            py: 0.5
                                        }}
                                    >
                                        Detalhes
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>

            {/* Dialog de Detalhes */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center">
                        <EngineeringIcon sx={{ mr: 1 }} />
                        Detalhes da Operação #{selectedOperacao?.id}
                    </Box>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{ color: 'white', minWidth: 'auto' }}
                    >
                        <CloseIcon />
                    </Button>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {loadingDetalhes ? (
                        <Box textAlign="center" py={3}>
                            <Typography>Carregando detalhes...</Typography>
                        </Box>
                    ) : operacaoDetalhes ? (
                        <Grid container spacing={3}>
                            {/* Informações da Operação */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <EngineeringIcon sx={{ mr: 1 }} />
                                    Informações da Operação
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon><EngineeringIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Tipo de Operação"
                                            secondary={operacaoDetalhes.operacao.tipo_operacao || 'Não especificado'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><WaterIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Poço"
                                            secondary={operacaoDetalhes.operacao.poco || 'Não especificado'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Cidade"
                                            secondary={operacaoDetalhes.operacao.cidade || 'Não especificado'}
                                        />
                                    </ListItem>
                                    {operacaoDetalhes.operacao.representante && (
                                        <ListItem>
                                            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                            <ListItemText
                                                primary="Representante"
                                                secondary={operacaoDetalhes.operacao.representante}
                                            />
                                        </ListItem>
                                    )}
                                    {operacaoDetalhes.operacao.volume && (
                                        <ListItem>
                                            <ListItemIcon><WaterIcon color="primary" /></ListItemIcon>
                                            <ListItemText
                                                primary="Volume"
                                                secondary={`${operacaoDetalhes.operacao.volume} m³`}
                                            />
                                        </ListItem>
                                    )}
                                    {operacaoDetalhes.operacao.pressao && (
                                        <ListItem>
                                            <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                                            <ListItemText
                                                primary="Pressão"
                                                secondary={`${operacaoDetalhes.operacao.pressao} bar`}
                                            />
                                        </ListItem>
                                    )}
                                    {operacaoDetalhes.operacao.temperatura_quente && (
                                        <ListItem>
                                            <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                                            <ListItemText
                                                primary="Temperatura"
                                                secondary={`${operacaoDetalhes.operacao.temperatura_quente} °C`}
                                            />
                                        </ListItem>
                                    )}
                                    {operacaoDetalhes.operacao.atividades && (
                                        <ListItem>
                                            <ListItemIcon><CommentIcon color="primary" /></ListItemIcon>
                                            <ListItemText
                                                primary="Atividades"
                                                secondary={operacaoDetalhes.operacao.atividades}
                                            />
                                        </ListItem>
                                    )}
                                    <ListItem>
                                        <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Etapa Atual"
                                            secondary={
                                                <Chip
                                                    label={operacaoDetalhes.operacao.etapa_atual}
                                                    color={getEtapaColor(operacaoDetalhes.operacao.etapa_atual)}
                                                    size="small"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            }
                                            secondaryTypographyProps={{ component: 'span' }}
                                        />
                                    </ListItem>
                                </List>
                            </Grid>

                            {/* Deslocamentos */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Deslocamentos ({operacaoDetalhes.deslocamentos.length})
                                </Typography>
                                {operacaoDetalhes.deslocamentos.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.deslocamentos.map((deslocamento, index) => (
                                            <ListItem key={deslocamento.id}>
                                                <ListItemIcon>
                                                    <TimelineIcon color="primary" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={`${deslocamento.origem} → ${deslocamento.destino}`}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" component="span">
                                                                {formatDate(deslocamento.hora_inicio)} - {formatDate(deslocamento.hora_fim)}
                                                            </Typography>
                                                            {(deslocamento.km_inicial || deslocamento.km_final) && (
                                                                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                                                    <strong>KM:</strong> {deslocamento.km_inicial || 'N/A'} → {deslocamento.km_final || 'N/A'}
                                                                    {deslocamento.km_inicial && deslocamento.km_final && (
                                                                        <span style={{ marginLeft: '8px', color: 'primary.main' }}>
                                                                            ({Math.abs(deslocamento.km_final - deslocamento.km_inicial).toFixed(1)} km)
                                                                        </span>
                                                                    )}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhum deslocamento registrado</Typography>
                                )}
                            </Grid>

                            {/* Aguardos */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Aguardos ({operacaoDetalhes.aguardos.length})
                                </Typography>
                                {operacaoDetalhes.aguardos.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.aguardos.map((aguardo, index) => (
                                            <ListItem key={aguardo.id}>
                                                <ListItemText
                                                    primary={aguardo.motivo}
                                                    secondary={`${formatDate(aguardo.inicio_aguardo)} - ${formatDate(aguardo.fim_aguardo)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhum aguardo registrado</Typography>
                                )}
                            </Grid>

                            {/* Refeições */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Refeições ({operacaoDetalhes.refeicoes.length})
                                </Typography>
                                {operacaoDetalhes.refeicoes.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.refeicoes.map((refeicao, index) => (
                                            <ListItem key={refeicao.id}>
                                                <ListItemText
                                                    primary="Refeição"
                                                    secondary={`${formatDate(refeicao.inicio_refeicao)} - ${formatDate(refeicao.fim_refeicao)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma refeição registrada</Typography>
                                )}
                            </Grid>

                            {/* Abastecimentos */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Abastecimentos ({operacaoDetalhes.abastecimentos.length})
                                </Typography>
                                {operacaoDetalhes.abastecimentos.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.abastecimentos.map((abastecimento, index) => (
                                            <ListItem key={abastecimento.id}>
                                                <ListItemText
                                                    primary={abastecimento.tipo_abastecimento}
                                                    secondary={`${formatDate(abastecimento.inicio_abastecimento)} - ${formatDate(abastecimento.fim_abastecimento)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhum abastecimento registrado</Typography>
                                )}
                            </Grid>

                            {/* Mobilizações */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Mobilizações ({operacaoDetalhes.mobilizacoes.length})
                                </Typography>
                                {operacaoDetalhes.mobilizacoes.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.mobilizacoes.map((mobilizacao, index) => (
                                            <ListItem key={mobilizacao.id}>
                                                <ListItemIcon>
                                                    <MobilizacaoIcon color="primary" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        mobilizacao.origem && mobilizacao.destino
                                                            ? `${mobilizacao.origem} → ${mobilizacao.destino}`
                                                            : "Mobilização"
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" component="span">
                                                                {formatDate(mobilizacao.hora_inicio_mobilizacao)} - {formatDate(mobilizacao.hora_fim_mobilizacao)}
                                                            </Typography>
                                                            {(mobilizacao.km_inicial || mobilizacao.km_final) && (
                                                                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                                                    <strong>KM:</strong> {mobilizacao.km_inicial || 'N/A'} → {mobilizacao.km_final || 'N/A'}
                                                                    {mobilizacao.km_inicial && mobilizacao.km_final && (
                                                                        <span style={{ marginLeft: '8px', color: 'primary.main' }}>
                                                                            ({Math.abs(mobilizacao.km_final - mobilizacao.km_inicial).toFixed(1)} km)
                                                                        </span>
                                                                    )}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma mobilização registrada</Typography>
                                )}
                            </Grid>

                            {/* Desmobilizações */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    Desmobilizações ({operacaoDetalhes.desmobilizacoes.length})
                                </Typography>
                                {operacaoDetalhes.desmobilizacoes.length > 0 ? (
                                    <List dense>
                                        {operacaoDetalhes.desmobilizacoes.map((desmobilizacao, index) => (
                                            <ListItem key={desmobilizacao.id}>
                                                <ListItemIcon>
                                                    <DesmobilizacaoIcon color="primary" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        desmobilizacao.origem && desmobilizacao.destino
                                                            ? `${desmobilizacao.origem} → ${desmobilizacao.destino}`
                                                            : "Desmobilização"
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" component="span">
                                                                {formatDate(desmobilizacao.hora_inicio_desmobilizacao)} - {formatDate(desmobilizacao.hora_fim_desmobilizacao)}
                                                            </Typography>
                                                            {(desmobilizacao.km_inicial || desmobilizacao.km_final) && (
                                                                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                                                    <strong>KM:</strong> {desmobilizacao.km_inicial || 'N/A'} → {desmobilizacao.km_final || 'N/A'}
                                                                    {desmobilizacao.km_inicial && desmobilizacao.km_final && (
                                                                        <span style={{ marginLeft: '8px', color: 'primary.main' }}>
                                                                            ({Math.abs(desmobilizacao.km_final - desmobilizacao.km_inicial).toFixed(1)} km)
                                                                        </span>
                                                                    )}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma desmobilização registrada</Typography>
                                )}
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography>Erro ao carregar detalhes</Typography>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} variant="contained">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OperacoesTable;