import React from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const IndustryParetoCard = ({ data, loading }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatCompact = (value) => {
        if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `R$ ${(value / 1000).toFixed(0)}k`;
        }
        return formatCurrency(value);
    };

    // Calculate Pareto data (cumulative percentage)
    const calculateParetoData = (rawData) => {
        if (!rawData || rawData.length === 0) return [];

        // Calculate total revenue
        const totalFaturamento = rawData.reduce((sum, item) => sum + parseFloat(item.total_faturamento || 0), 0);

        // Calculate cumulative percentage
        let acumulado = 0;
        return rawData.map((item, index) => {
            acumulado += parseFloat(item.total_faturamento || 0);
            const percentualAcumulado = (acumulado / totalFaturamento) * 100;

            return {
                industria_nome: item.industria_nome,
                total_faturamento: parseFloat(item.total_faturamento || 0),
                percentual_acumulado: percentualAcumulado,
                // Shorten name for better display
                nome_curto: item.industria_nome.length > 12
                    ? item.industria_nome.substring(0, 10) + '...'
                    : item.industria_nome
            };
        });
    };

    const paretoData = calculateParetoData(data);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="activity-card"
        >
            <div className="card-header">
                <h3 className="card-title">
                    <TrendingUp className="title-icon" />
                    Análise Pareto 80/20
                </h3>
            </div>
            <div className="chart-container" style={{ height: '360px', padding: '10px 0' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                    </div>
                ) : paretoData && paretoData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={paretoData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                        >
                            <XAxis
                                dataKey="nome_curto"
                                stroke="var(--text-secondary)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompact}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value.toFixed(0)}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--bg-card)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                }}
                                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                                formatter={(value, name) => {
                                    if (name === 'Faturamento') {
                                        return [formatCurrency(value), name];
                                    }
                                    return [`${value.toFixed(1)}%`, name];
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '11px' }}
                                iconType="line"
                            />
                            <ReferenceLine
                                y={80}
                                yAxisId="right"
                                stroke="hsl(0, 70%, 50%)"
                                strokeDasharray="3 3"
                                strokeWidth={2}
                                label={{
                                    value: '80%',
                                    position: 'right',
                                    fill: 'hsl(0, 70%, 50%)',
                                    fontSize: 11,
                                    fontWeight: 600
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="total_faturamento"
                                fill="hsl(200, 70%, 45%)"
                                radius={[8, 8, 0, 0]}
                                name="Faturamento"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="percentual_acumulado"
                                stroke="hsl(25, 95%, 53%)"
                                strokeWidth={3}
                                dot={{ fill: 'hsl(25, 95%, 53%)', r: 4 }}
                                name="% Acumulado"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhum dado disponível</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
