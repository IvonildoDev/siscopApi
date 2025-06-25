import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Chip,
    Skeleton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    Group as GroupIcon,
    Person as PersonIcon,
    LocalShipping as VehicleIcon,
    Badge as BadgeIcon,
    CheckCircle as StatusIcon
} from '@mui/icons-material';
import { getEquipeAtiva } from '../api';

const EquipeAtivaCard = () => {
    const [equipe, setEquipe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEquipeAtiva()
            .then((response) => {
                setEquipe(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Erro ao buscar equipe ativa:', error);
                setLoading(false);
            });
    }, []);

    const renderContent = () => {
        if (loading) {
            return Array(4).fill().map((_, i) => (
                <Skeleton key={i} height={30} width="90%" sx={{ my: 1 }} />
            ));
        }

        if (!equipe) {
            return (
                <Box textAlign="center" py={3}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'grey.300' }}>
                        <GroupIcon />
                    </Avatar>
                    <Typography color="textSecondary">
                        Nenhuma equipe ativa encontrada
                    </Typography>
                </Box>
            );
        }

        return (
            <List disablePadding>
                <ListItem>
                    <ListItemIcon>
                        <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Operador"
                        secondary={equipe.operador || 'Não especificado'}
                    />
                </ListItem>
                <Divider variant="inset" component="li" />

                <ListItem>
                    <ListItemIcon>
                        <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Auxiliar"
                        secondary={equipe.auxiliar || 'Não especificado'}
                    />
                </ListItem>
                <Divider variant="inset" component="li" />

                <ListItem>
                    <ListItemIcon>
                        <GroupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Unidade"
                        secondary={equipe.unidade || 'Não especificado'}
                    />
                </ListItem>
                <Divider variant="inset" component="li" />

                <ListItem>
                    <ListItemIcon>
                        <VehicleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Placa"
                        secondary={equipe.placa || 'Não especificado'}
                    />
                </ListItem>

                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Chip
                        icon={<StatusIcon />}
                        label="Equipe Ativa"
                        color="success"
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>
            </List>
        );
    };

    return (
        <Box sx={{ height: '100%' }}>
            {renderContent()}
        </Box>
    );
};

export default EquipeAtivaCard;