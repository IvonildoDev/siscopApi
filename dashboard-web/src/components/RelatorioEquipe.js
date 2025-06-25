import React, { useState, useEffect } from 'react';
import { Box, Button, MenuItem, Select, Typography, Paper } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { getOperacoes, getEquipeAtiva, getDeslocamentos, getRefeicoes, getAguardos, getAbastecimentos, getMobilizacoes, getDesmobilizacoes } from '../api';

const periodOptions = [
    { label: 'Últimos 7 dias', value: 7 },
    { label: 'Últimos 15 dias', value: 15 },
    { label: 'Últimos 30 dias', value: 30 },
];

const RelatorioEquipe = () => {
    const [period, setPeriod] = useState(7);
    const [operacoes, setOperacoes] = useState([]);
    const [equipe, setEquipe] = useState(null);

    useEffect(() => {
        // Busca dados da equipe ativa
        getEquipeAtiva().then(res => setEquipe(res.data));
        // Busca operações do período
        getOperacoes(1, 100).then(res => {
            let operacoesArray = [];
            if (Array.isArray(res.data.data)) {
                operacoesArray = res.data.data;
            } else if (Array.isArray(res.data)) {
                operacoesArray = res.data;
            } else if (Array.isArray(res.data.items)) {
                operacoesArray = res.data.items;
            } else if (Array.isArray(res.data.operacoes)) {
                operacoesArray = res.data.operacoes;
            } else {
                operacoesArray = [];
            }
            console.log('Operações recebidas:', operacoesArray); // <-- Adicione esta linha
            const dataLimite = dayjs().subtract(period, 'day');
            const filtradas = operacoesArray.filter(op =>
                dayjs(op.inicio_operacao).isAfter(dataLimite)
            );
            setOperacoes(filtradas);
        });
    }, [period]);

    const exportPDF = async () => {
        // Busca dados atualizados
        const equipeRes = await getEquipeAtiva();
        const equipeAtual = equipeRes.data;

        const operacoesRes = await getOperacoes(1, 1000);
        let operacoesArray = [];
        if (Array.isArray(operacoesRes.data.data)) {
            operacoesArray = operacoesRes.data.data;
        } else if (Array.isArray(operacoesRes.data)) {
            operacoesArray = operacoesRes.data;
        } else if (Array.isArray(operacoesRes.data.items)) {
            operacoesArray = operacoesRes.data.items;
        } else if (Array.isArray(operacoesRes.data.operacoes)) {
            operacoesArray = operacoesRes.data.operacoes;
        }

        // Busca deslocamentos de todas as operações
        let deslocamentosArray = [];
        for (const op of operacoesArray) {
            const deslocRes = await getDeslocamentos(op.id);
            if (Array.isArray(deslocRes.data)) {
                deslocamentosArray = deslocamentosArray.concat(deslocRes.data.map(d => ({
                    ...d,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }

        // Busca refeições de todas as operações
        let refeicoesArray = [];
        for (const op of operacoesArray) {
            const refeicaoRes = await getRefeicoes(op.id); // Supondo que aceita operacao_id
            if (Array.isArray(refeicaoRes.data)) {
                refeicoesArray = refeicoesArray.concat(refeicaoRes.data.map(r => ({
                    ...r,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }

        // Busca aguardos de todas as operações
        let aguardosArray = [];
        for (const op of operacoesArray) {
            const aguardoRes = await getAguardos(op.id); // Supondo que aceita operacao_id
            if (Array.isArray(aguardoRes.data)) {
                aguardosArray = aguardosArray.concat(aguardoRes.data.map(a => ({
                    ...a,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }

        // Busca abastecimentos de todas as operações
        let abastecimentosArray = [];
        for (const op of operacoesArray) {
            const abastecimentoRes = await getAbastecimentos(op.id); // Supondo que aceita operacao_id
            if (Array.isArray(abastecimentoRes.data)) {
                abastecimentosArray = abastecimentosArray.concat(abastecimentoRes.data.map(a => ({
                    ...a,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }

        // Busca mobilizações de todas as operações
        let mobilizacoesArray = [];
        for (const op of operacoesArray) {
            const mobilizacaoRes = await getMobilizacoes(); // Buscar todas as mobilizações
            console.log(`Mobilizações para operação ${op.id}:`, mobilizacaoRes);

            // Função para extrair dados de diferentes estruturas
            const extractMobilizacoesData = (responseData) => {
                if (Array.isArray(responseData)) {
                    return responseData;
                } else if (responseData && typeof responseData === 'object') {
                    if (Array.isArray(responseData.data)) {
                        return responseData.data;
                    } else if (Array.isArray(responseData.items)) {
                        return responseData.items;
                    } else if (Array.isArray(responseData.mobilizacoes)) {
                        return responseData.mobilizacoes;
                    }
                }
                return [];
            };

            const mobilizacoesData = extractMobilizacoesData(mobilizacaoRes.data || mobilizacaoRes);
            // Filtrar por equipe_id em vez de operacao_id
            const mobilizacoesDaEquipe = mobilizacoesData.filter(m => m.equipe_id === op.equipe_id);
            if (Array.isArray(mobilizacoesDaEquipe)) {
                mobilizacoesArray = mobilizacoesArray.concat(mobilizacoesDaEquipe.map(m => ({
                    ...m,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }
        console.log('Total de mobilizações encontradas:', mobilizacoesArray.length);

        // Busca desmobilizações de todas as operações
        let desmobilizacoesArray = [];
        for (const op of operacoesArray) {
            const desmobilizacaoRes = await getDesmobilizacoes(); // Buscar todas as desmobilizações
            console.log(`Desmobilizações para operação ${op.id}:`, desmobilizacaoRes);

            // Função para extrair dados de diferentes estruturas
            const extractDesmobilizacoesData = (responseData) => {
                if (Array.isArray(responseData)) {
                    return responseData;
                } else if (responseData && typeof responseData === 'object') {
                    if (Array.isArray(responseData.data)) {
                        return responseData.data;
                    } else if (Array.isArray(responseData.items)) {
                        return responseData.items;
                    } else if (Array.isArray(responseData.desmobilizacoes)) {
                        return responseData.desmobilizacoes;
                    }
                }
                return [];
            };

            const desmobilizacoesData = extractDesmobilizacoesData(desmobilizacaoRes.data || desmobilizacaoRes);
            // Filtrar por equipe_id em vez de operacao_id
            const desmobilizacoesDaEquipe = desmobilizacoesData.filter(d => d.equipe_id === op.equipe_id);
            if (Array.isArray(desmobilizacoesDaEquipe)) {
                desmobilizacoesArray = desmobilizacoesArray.concat(desmobilizacoesDaEquipe.map(d => ({
                    ...d,
                    operacaoId: op.id,
                    tipo_operacao: op.tipo_operacao,
                    poco: op.poco,
                    cidade: op.cidade,
                    etapa_atual: op.etapa_atual,
                })));
            }
        }
        console.log('Total de desmobilizações encontradas:', desmobilizacoesArray.length);

        // Gera o PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        // Cabeçalho estilizado
        doc.setFillColor(25, 118, 210); // azul MUI
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Relatório Completo - UCAQ', 105, 13, { align: 'center' });

        // Dados da equipe e data
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Data: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 10, 28);

        // Bloco de informações da equipe
        let equipeInfo = '';
        if (equipeAtual) {
            equipeInfo = [
                `Operador: ${equipeAtual.operador || '-'}`,
                `Auxiliar: ${equipeAtual.auxiliar || '-'}`,
                `Unidade: ${equipeAtual.unidade || '-'}`,
                `Placa: ${equipeAtual.placa || '-'}`
            ].join('   |   ');
            doc.setFontSize(10);
            doc.setTextColor(33, 33, 33);
            doc.text(equipeInfo, 10, 36);
        }

        // Linha divisória
        doc.setDrawColor(200, 200, 200);
        doc.line(10, 40, 200, 40);

        // Tabela de Operações
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Operações', 10, 48);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: 52,
            head: [[
                'ID', 'Equipe ID', 'Tipo', 'Etapa', 'Poço', 'Cidade', 'Observações', 'Tempo', 'Início', 'Fim', 'Status', 'Criado em', 'Atualizado em'
            ]],
            body: operacoesArray.map(op => [
                op.id,
                op.equipe_id,
                op.tipo_operacao,
                op.etapa_atual,
                op.poco,
                op.cidade,
                op.observacoes,
                op.tempo_operacao,
                op.inicio_operacao ? dayjs(op.inicio_operacao).format('DD/MM/YYYY HH:mm') : '',
                op.fim_operacao ? dayjs(op.fim_operacao).format('DD/MM/YYYY HH:mm') : '',
                op.status,
                op.criado_em ? dayjs(op.criado_em).format('DD/MM/YYYY HH:mm') : '',
                op.atualizado_em ? dayjs(op.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                6: { cellWidth: 30 }, // Observações
                7: { cellWidth: 12 }, // Tempo
                8: { cellWidth: 18 }, // Início
                9: { cellWidth: 18 }, // Fim
                10: { cellWidth: 14 }, // Status
                11: { cellWidth: 18 }, // Criado em
                12: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                // Adiciona título em cada página da tabela
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Operações (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Deslocamentos
        let deslocY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Deslocamentos', 10, deslocY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: deslocY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Origem', 'Destino', 'KM Inicial', 'KM Final', 'Hora Início', 'Hora Fim', 'Tempo Total', 'Observações', 'Status', 'Criado em', 'Atualizado em'
            ]],
            body: deslocamentosArray.map(d => [
                d.id,
                d.equipe_id,
                d.operacao_id,
                d.origem,
                d.destino,
                d.km_inicial,
                d.km_final,
                d.hora_inicio ? dayjs(d.hora_inicio).format('DD/MM/YYYY HH:mm') : '',
                d.hora_fim ? dayjs(d.hora_fim).format('DD/MM/YYYY HH:mm') : '',
                d.tempo_total,
                d.observacoes,
                d.status,
                d.criado_em ? dayjs(d.criado_em).format('DD/MM/YYYY HH:mm') : '',
                d.atualizado_em ? dayjs(d.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                10: { cellWidth: 30 }, // Observações
                11: { cellWidth: 14 }, // Status
                12: { cellWidth: 18 }, // Criado em
                13: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Deslocamentos (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Refeições
        let refeicaoY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Refeições', 10, refeicaoY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: refeicaoY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Início', 'Fim', 'Tempo', 'Observações', 'Criado em', 'Atualizado em'
            ]],
            body: refeicoesArray.map(r => [
                r.id,
                r.equipe_id,
                r.operacao_id,
                r.inicio_refeicao ? dayjs(r.inicio_refeicao).format('DD/MM/YYYY HH:mm') : '',
                r.fim_refeicao ? dayjs(r.fim_refeicao).format('DD/MM/YYYY HH:mm') : '',
                r.tempo_refeicao,
                r.observacoes,
                r.criado_em ? dayjs(r.criado_em).format('DD/MM/YYYY HH:mm') : '',
                r.atualizado_em ? dayjs(r.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                6: { cellWidth: 30 }, // Observações
                7: { cellWidth: 18 }, // Criado em
                8: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Refeições (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Aguardos
        let aguardoY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Aguardos', 10, aguardoY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: aguardoY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Motivo', 'Início', 'Fim', 'Tempo', 'Observações', 'Criado em', 'Atualizado em'
            ]],
            body: aguardosArray.map(a => [
                a.id,
                a.equipe_id,
                a.operacao_id,
                a.motivo,
                a.inicio_aguardo ? dayjs(a.inicio_aguardo).format('DD/MM/YYYY HH:mm') : '',
                a.fim_aguardo ? dayjs(a.fim_aguardo).format('DD/MM/YYYY HH:mm') : '',
                a.tempo_aguardo,
                a.observacoes,
                a.criado_em ? dayjs(a.criado_em).format('DD/MM/YYYY HH:mm') : '',
                a.atualizado_em ? dayjs(a.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                7: { cellWidth: 30 }, // Observações
                8: { cellWidth: 18 }, // Criado em
                9: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Aguardos (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Abastecimentos
        let abastecimentoY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Abastecimentos', 10, abastecimentoY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: abastecimentoY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Tipo', 'Início', 'Fim', 'Tempo', 'Observações', 'Criado em', 'Atualizado em'
            ]],
            body: abastecimentosArray.map(a => [
                a.id,
                a.equipe_id,
                a.operacao_id,
                a.tipo_abastecimento,
                a.inicio_abastecimento ? dayjs(a.inicio_abastecimento).format('DD/MM/YYYY HH:mm') : '',
                a.fim_abastecimento ? dayjs(a.fim_abastecimento).format('DD/MM/YYYY HH:mm') : '',
                a.tempo_abastecimento,
                a.observacoes,
                a.criado_em ? dayjs(a.criado_em).format('DD/MM/YYYY HH:mm') : '',
                a.atualizado_em ? dayjs(a.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                7: { cellWidth: 30 }, // Observações
                8: { cellWidth: 18 }, // Criado em
                9: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Abastecimentos (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Mobilizações
        let mobilizacaoY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Mobilizações', 10, mobilizacaoY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: mobilizacaoY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Origem', 'Destino', 'KM Inicial', 'KM Final', 'Hora Início', 'Hora Fim', 'Tempo Total', 'Observações', 'Status', 'Criado em', 'Atualizado em'
            ]],
            body: mobilizacoesArray.map(m => [
                m.id,
                m.equipe_id,
                m.operacao_id,
                m.origem,
                m.destino,
                m.km_inicial,
                m.km_final,
                m.hora_inicio_mobilizacao ? dayjs(m.hora_inicio_mobilizacao).format('DD/MM/YYYY HH:mm') : '',
                m.hora_fim_mobilizacao ? dayjs(m.hora_fim_mobilizacao).format('DD/MM/YYYY HH:mm') : '',
                m.tempo_mobilizacao,
                m.observacoes,
                m.status,
                m.criado_em ? dayjs(m.criado_em).format('DD/MM/YYYY HH:mm') : '',
                m.atualizado_em ? dayjs(m.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                10: { cellWidth: 30 }, // Observações
                11: { cellWidth: 14 }, // Status
                12: { cellWidth: 18 }, // Criado em
                13: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Mobilizações (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Tabela de Desmobilizações
        let desmobilizacaoY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
        doc.setFontSize(13);
        doc.setTextColor(25, 118, 210);
        doc.text('Desmobilizações', 10, desmobilizacaoY);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: desmobilizacaoY + 4,
            head: [[
                'ID', 'Equipe ID', 'Operação ID', 'Origem', 'Destino', 'KM Inicial', 'KM Final', 'Hora Início', 'Hora Fim', 'Tempo Total', 'Observações', 'Status', 'Criado em', 'Atualizado em'
            ]],
            body: desmobilizacoesArray.map(d => [
                d.id,
                d.equipe_id,
                d.operacao_id,
                d.origem,
                d.destino,
                d.km_inicial,
                d.km_final,
                d.hora_inicio_desmobilizacao ? dayjs(d.hora_inicio_desmobilizacao).format('DD/MM/YYYY HH:mm') : '',
                d.hora_fim_desmobilizacao ? dayjs(d.hora_fim_desmobilizacao).format('DD/MM/YYYY HH:mm') : '',
                d.tempo_desmobilizacao,
                d.observacoes,
                d.status,
                d.criado_em ? dayjs(d.criado_em).format('DD/MM/YYYY HH:mm') : '',
                d.atualizado_em ? dayjs(d.atualizado_em).format('DD/MM/YYYY HH:mm') : ''
            ]),
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 },
            margin: { left: 5, right: 5 },
            columnStyles: {
                10: { cellWidth: 30 }, // Observações
                11: { cellWidth: 14 }, // Status
                12: { cellWidth: 18 }, // Criado em
                13: { cellWidth: 18 }, // Atualizado em
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(13);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Desmobilizações (continuação)', 10, 20);
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Rodapé
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado por SICOP - ${dayjs().format('DD/MM/YYYY HH:mm')}`, 105, 290, { align: 'center' });

        doc.save(`relatorio-completo-ucaq-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
    };

    return (
        <Paper sx={{ p: 3, mt: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">Relatório de Operações</Typography>
                <Select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    size="small"
                >
                    {periodOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </Select>
                <Button variant="contained" color="primary" onClick={exportPDF}>
                    Exportar PDF
                </Button>
            </Box>
            <Typography variant="subtitle2" gutterBottom>
                Cabeçalho: UCAQ | Data: {dayjs().format('DD/MM/YYYY')} | Equipe: {equipe ? `${equipe.operador} / ${equipe.auxiliar}` : '...'}
            </Typography>
            {/* Lista simples das operações */}
            <Box mt={2}>
                {operacoes.length === 0 ? (
                    <Typography color="textSecondary">Nenhuma operação encontrada no período selecionado.</Typography>
                ) : (
                    <ul>
                        {operacoes.map(op => (
                            <li key={op.id}>
                                <b>{op.tipo_operacao}</b> - {op.poco} - {op.cidade} - {op.etapa_atual} - {dayjs(op.inicio_operacao).format('DD/MM/YYYY')}
                            </li>
                        ))}
                    </ul>
                )}
            </Box>
        </Paper>
    );
};

export default RelatorioEquipe;