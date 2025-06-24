import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getOperacoes } from '../api';

const OperacoesTable = () => {
    const [operacoes, setOperacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOperacoes()
            .then((response) => {
                setOperacoes(response.data.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Erro ao buscar operações:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Carregando...</div>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Poço</TableCell>
                    <TableCell>Cidade</TableCell>
                    <TableCell>Etapa</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {operacoes.map((op) => (
                    <TableRow key={op.id}>
                        <TableCell>{op.id}</TableCell>
                        <TableCell>{op.tipo_operacao}</TableCell>
                        <TableCell>{op.poco || '-'}</TableCell>
                        <TableCell>{op.cidade || '-'}</TableCell>
                        <TableCell>{op.etapa_atual}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default OperacoesTable;