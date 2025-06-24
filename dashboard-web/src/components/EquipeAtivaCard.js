import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
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

    if (loading) return <Typography>Carregando...</Typography>;
    if (!equipe) return <Typography>Nenhuma equipe ativa encontrada</Typography>;

    return (
        <Card>
            <CardContent>
                <Typography variant="h5">Equipe Ativa</Typography>
                <Typography>Operador: {equipe.operador}</Typography>
                <Typography>Auxiliar: {equipe.auxiliar}</Typography>
                <Typography>Unidade: {equipe.unidade}</Typography>
                <Typography>Placa: {equipe.placa}</Typography>
            </CardContent>
        </Card>
    );
};

export default EquipeAtivaCard;