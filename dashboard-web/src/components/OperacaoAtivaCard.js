import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    Chip, 
    Skeleton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { 
    Engineering as EngineeringIcon,
    LocationOn as LocationIcon,
    Timeline as TimelineIcon,
    Comment as CommentIcon,
    Water as WaterIcon
} from '@mui/icons-material';
import { getOperacaoAtiva, getOperacoes, getEquipeAtiva, getDeslocamentos } from '../api';
import DashboardCard from './DashboardCard';

const OperacaoAtivaCard = () => {
    const [operacao, setOperacao] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOperacaoAtiva()
            .then((response) => {
                setOperacao(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Erro ao buscar operação ativa:', error);
                setLoading(false);
            });
    }, []);

    // Status color mapping
    const getEtapaColor = (etapa) => {
        const statusMap = {
            'EM_MOBILIZACAO': 'warning',
            'EM_OPERACAO': 'success',
            'EM_DESMOBILIZACAO': 'info',
            'FINALIZADA': 'default'
        };
        return statusMap[etapa] || 'primary';
    };

    const renderContent = () => {
        if (loading) {
            return Array(4).fill().map((_, i) => (
                <Skeleton key={i} height={30} width="90%" sx={{ my: 1 }} />
            ));
        }

        if (!operacao) {
            return (
                <Box textAlign="center" py={3}>
                    <Typography color="textSecondary">
                        Nenhuma operação ativa encontrada
                    </Typography>
                </Box>
            );
        }

        return (
            <List disablePadding>
                <ListItem>
                    <ListItemIcon>
                        <EngineeringIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Tipo de Operação" 
                        secondary={operacao.tipo_operacao || 'Não especificado'} 
                    />
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                    <ListItemIcon>
                        <WaterIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Poço" 
                        secondary={operacao.poco || 'Não especificado'} 
                    />
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                    <ListItemIcon>
                        <LocationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Localização" 
                        secondary={operacao.cidade || 'Não especificado'} 
                    />
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                    <ListItemIcon>
                        <TimelineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Etapa Atual"
                        secondary={
                            <Chip 
                                label={operacao.etapa_atual} 
                                color={getEtapaColor(operacao.etapa_atual)}
                                size="small"
                                sx={{ mt: 0.5 }}
                            />
                        }
                        secondaryTypographyProps={{ component: 'span' }}
                    />
                </ListItem>
                
                {operacao.observacoes && (
                    <>
                        <Divider variant="inset" component="li" />
                        <ListItem>
                            <ListItemIcon>
                                <CommentIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Observações" 
                                secondary={operacao.observacoes} 
                                secondaryTypographyProps={{ 
                                    style: { 
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word' 
                                    } 
                                }}
                            />
                        </ListItem>
                    </>
                )}
            </List>
        );
    };

    return (
        <DashboardCard 
            title="Operação Ativa" 
            icon={<EngineeringIcon />}
        >
            {renderContent()}
        </DashboardCard>
    );
};

export default OperacaoAtivaCard;