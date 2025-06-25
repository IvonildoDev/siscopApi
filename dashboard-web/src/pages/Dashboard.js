import React, { useState, useEffect } from 'react';
import '../charts/chartConfig';
import {
    Container,
    Grid,
    Typography,
    Paper,
    Box,
    Divider,
    CircularProgress,
    Button,
    Card,
    CardContent,
    Avatar,
    Chip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Group as GroupIcon,
    Engineering as EngineeringIcon,
    TableChart as TableChartIcon,
    Timeline as TimelineIcon,
    BugReport as DebugIcon,
    Speed as SpeedIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import EquipeAtivaCard from '../components/EquipeAtivaCard';
import OperacaoAtivaCard from '../components/OperacaoAtivaCard';
import OperacoesTable from '../components/OperacoesTable';
import DeslocamentosChart from '../components/DeslocamentosChart';
import RelatorioEquipe from '../components/RelatorioEquipe';
import dayjs from 'dayjs';
import { getOperacoes, debugAllData, testMobilizacoesDesmobilizacoes } from '../api';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [operacoes, setOperacoes] = useState([]);
    const [debugData, setDebugData] = useState(null);
    const period = 30;

    const handleDebug = async () => {
        try {
            const data = await debugAllData();
            setDebugData(data);
            console.log('Dados de debug:', data);
        } catch (error) {
            console.error('Erro no debug:', error);
        }
    };

    const handleTestMobilizacoes = async () => {
        try {
            await testMobilizacoesDesmobilizacoes();
        } catch (error) {
            console.error('Erro no teste de mobilizações:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchOperacoes = async () => {
            setLoading(true);
            try {
                const res = await getOperacoes(1, 100);
                console.log('Resposta da API de operações:', res.data);

                let operacoesArray = [];
                if (Array.isArray(res.data)) {
                    operacoesArray = res.data;
                } else if (Array.isArray(res.data.data)) {
                    operacoesArray = res.data.data;
                } else if (Array.isArray(res.data.items)) {
                    operacoesArray = res.data.items;
                } else if (Array.isArray(res.data.operacoes)) {
                    operacoesArray = res.data.operacoes;
                } else {
                    operacoesArray = [];
                }

                const dataLimite = dayjs().subtract(period, 'day');
                const filtradas = operacoesArray.filter(op => {
                    const dataOperacao = op.criado_em || op.data_cadastro || op.data_inicio || op.inicio_operacao;
                    if (!dataOperacao) return true;
                    return dayjs(dataOperacao).isAfter(dataLimite);
                });

                console.log('Operações filtradas:', filtradas);
                setOperacoes(filtradas);
            } catch (error) {
                console.error('Erro ao buscar operações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOperacoes();
    }, [period]);

    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white'
                }}
            >
                <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
                <Typography variant="h5" fontWeight="bold">
                    Carregando Painel de Controle...
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                    Preparando dados em tempo real
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            pb: 0
        }}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                {/* Header Principal */}
                <Box mb={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white',
                            borderRadius: 3
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        mr: 3
                                    }}
                                >
                                    <DashboardIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h3" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
                                        Painel de Controle SICOP
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                                        Monitoramento em tempo real de operações Ucaq
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<DebugIcon />}
                                onClick={handleDebug}
                                size="large"
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                Debug Dados
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<DebugIcon />}
                                onClick={handleTestMobilizacoes}
                                size="large"
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    ml: 2,
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                Testar Mobilizações
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* Debug Panel */}
                {debugData && (
                    <Box mb={4}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" color="warning.dark" mb={2} display="flex" alignItems="center">
                                <DebugIcon sx={{ mr: 1 }} />
                                Debug - Dados Recebidos
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    fontSize: '0.8rem',
                                    overflow: 'auto',
                                    bgcolor: '#f5f5f5',
                                    p: 2,
                                    borderRadius: 1,
                                    maxHeight: '300px'
                                }}
                            >
                                {JSON.stringify(debugData, null, 2)}
                            </Box>
                        </Paper>
                    </Box>
                )}

                {/* Cards de Estatísticas */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {operacoes.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Operações
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 50, height: 50 }}>
                                        <EngineeringIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                            color: 'white'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {operacoes.filter(op => op.status === 'ativo').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Ativas
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 50, height: 50 }}>
                                        <SpeedIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {operacoes.filter(op => op.etapa_atual === 'FINALIZADA').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Finalizadas
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 50, height: 50 }}>
                                        <TrendingUpIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                            color: 'white'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {period}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Dias
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 50, height: 50 }}>
                                        <ScheduleIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={4}>
                    {/* Cartões principais */}
                    <Grid item xs={12} lg={6}>
                        <Paper elevation={3} sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}>
                            <Box sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white'
                            }}>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                                        <GroupIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        Equipe Ativa
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 0 }}>
                                <EquipeAtivaCard />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <Paper elevation={3} sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}>
                            <Box sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white'
                            }}>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                                        <EngineeringIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        Operação Ativa
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 0 }}>
                                <OperacaoAtivaCard />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Tabela de operações */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}>
                            <Box sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white'
                            }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center">
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                                            <TableChartIcon />
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">
                                            Histórico de Operações
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${operacoes.length} registros`}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ p: 0 }}>
                                <OperacoesTable operacoes={operacoes} />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Gráfico de deslocamentos */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}>
                            <Box sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white'
                            }}>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                                        <TimelineIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        Análise de Deslocamentos
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <DeslocamentosChart />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Relatório de Equipe */}
                    <Grid item xs={12}>
                        <RelatorioEquipe />
                    </Grid>
                </Grid>
            </Container>

            {/* Footer Personalizado */}
            <Box
                component="footer"
                sx={{
                    mt: 8,
                    py: 4,
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    color: 'white'
                }}
            >
                <Container maxWidth="xl">
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Box display="flex" alignItems="center" mb={2}>
                            <Avatar
                                sx={{
                                    width: 50,
                                    height: 50,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    mr: 2
                                }}
                            >
                                <DashboardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold">
                                Painel de Controle SICOP
                            </Typography>
                        </Box>

                        <Typography variant="body1" sx={{ mb: 2, opacity: 0.9, textAlign: 'center' }}>
                            Sistema de Controle de Operações - Versão 1.0
                        </Typography>

                        <Divider sx={{ width: '200px', mb: 2, borderColor: 'rgba(255,255,255,0.3)' }} />

                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                            Desenvolvido por
                        </Typography>

                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    mr: 2,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                IL
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">
                                Ivonildo Lima
                            </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center' }}>
                            © {new Date().getFullYear()} Todos os direitos reservados
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Dashboard;