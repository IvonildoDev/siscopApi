import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getOperacoes, getEquipeAtiva, getDeslocamentos } from '../api';

const DeslocamentosChart = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        getDeslocamentos()
            .then((response) => {
                const deslocamentos = response.data;
                const labels = deslocamentos.map((d) => d.id);
                const data = deslocamentos.map((d) => d.km_final - d.km_inicial);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Quilômetros Percorridos',
                            data,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        },
                    ],
                });
            })
            .catch((error) => console.error('Erro ao buscar deslocamentos:', error));
    }, []);

    if (!chartData) return <div>Carregando...</div>;

    return <Bar data={chartData} />;
};

export default DeslocamentosChart;