import React, { useState, useEffect } from 'react';
import '../charts/chartConfig';
import {
    Container,
    Grid,
    Typography,
    Paper,
    Box,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Group as GroupIcon,
    Engineering as EngineeringIcon,
    TableChart as TableChartIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import EquipeAtivaCard from '../components/EquipeAtivaCard';
import OperacaoAtivaCard from '../components/OperacaoAtivaCard';
import OperacoesTable from '../components/OperacoesTable';
import DeslocamentosChart from '../components/DeslocamentosChart';
import RelatorioEquipe from '../components/RelatorioEquipe';
import dayjs from 'dayjs';
import { getOperacoes } from '../api'; // caminho correto para src/api.js

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [operacoes, setOperacoes] = useState([]);
    const period = 30; // exemplo: últimos 30 dias

    // Simulação de carregamento - remova isso e use seu próprio estado de carregamento
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Função para buscar operações
        const fetchOperacoes = async () => {
            setLoading(true);
            try {
                const res = await getOperacoes(1, 100);
                console.log('Resposta da API de operações:', res.data); // Veja a estrutura no console

                // Ajuste conforme a estrutura real da resposta:
                let operacoesArray = [];
                if (Array.isArray(res.data)) {
                    operacoesArray = res.data;
                } else if (Array.isArray(res.data.items)) {
                    operacoesArray = res.data.items;
                } else if (Array.isArray(res.data.operacoes)) {
                    operacoesArray = res.data.operacoes;
                } else {
                    // Se não encontrar array, mantenha vazio
                    operacoesArray = [];
                }

                const dataLimite = dayjs().subtract(period, 'day');
                const filtradas = operacoesArray.filter(op =>
                    dayjs(op.data).isAfter(dataLimite)
                );
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box mb={4} mt={3}>
                <Paper elevation={2} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <DashboardIcon fontSize="large" color="primary" />
                        <Typography variant="h4" component="h1" ml={2} fontWeight="bold">
                            Dashboard de Operações
                        </Typography>
                    </Box>
                    <Typography variant="subtitle1" color="textSecondary">
                        Monitoramento em tempo real de equipes, operações e deslocamentos
                    </Typography>
                </Paper>
            </Box>

            <Grid container spacing={4}>
                {/* Cartões principais em destaque */}
                <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <GroupIcon color="primary" />
                        <Typography variant="h6" ml={1}>Equipe Ativa</Typography>
                    </Box>
                    <Paper elevation={3} sx={{ height: '100%', p: 0 }}>
                        <EquipeAtivaCard />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <EngineeringIcon color="primary" />
                        <Typography variant="h6" ml={1}>Operação Ativa</Typography>
                    </Box>
                    <Paper elevation={3} sx={{ height: '100%', p: 0 }}>
                        <OperacaoAtivaCard />
                    </Paper>
                </Grid>

                {/* Tabela de operações */}
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <TableChartIcon color="primary" />
                        <Typography variant="h6" ml={1}>Histórico de Operações</Typography>
                    </Box>
                    <Paper elevation={3}>
                        <OperacoesTable operacoes={operacoes} />
                    </Paper>
                </Grid>

                {/* Gráfico de deslocamentos */}
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <TimelineIcon color="primary" />
                        <Typography variant="h6" ml={1}>Análise de Deslocamentos</Typography>
                    </Box>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <DeslocamentosChart />
                    </Paper>
                </Grid>

                {/* Relatório de Equipe */}
                <Grid item xs={12}>
                    <RelatorioEquipe />
                </Grid>
            </Grid>

            {/* Rodapé com informações da versão */}
            <Box mt={5} mb={3} textAlign="center">
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="textSecondary">
                    Dashboard SICOP v1.0 © {new Date().getFullYear()}
                </Typography>
            </Box>
        </Container>
    );
};

export default Dashboard;