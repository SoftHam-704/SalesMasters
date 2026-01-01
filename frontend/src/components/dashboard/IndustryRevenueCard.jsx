import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const IndustryRevenueCard = ({ data, loading }) => {
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

    // Single color for all bars (blue - BCR color)
    const barColor = 'hsl(200, 70%, 45%)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="activity-card"
        >
            <div className="card-header">
                <h3 className="card-title">
                    <TrendingUp className="title-icon" />
                    Faturamento por Indústria
                </h3>
            </div>
            <div className="chart-container" style={{ height: '320px', padding: '10px 0' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                    </div>
                ) : data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
                        >
                            <XAxis
                                type="number"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                hide
                            />
                            <YAxis
                                type="category"
                                dataKey="industria_nome"
                                stroke="var(--text-secondary)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={120}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--bg-card)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                }}
                                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                                formatter={(value) => [formatCurrency(value), 'Faturamento']}
                            />
                            <Bar
                                dataKey="total_faturamento"
                                radius={[0, 8, 8, 0]}
                                fill={barColor}
                            >
                                <LabelList
                                    dataKey="total_faturamento"
                                    position="right"
                                    formatter={formatCompact}
                                    style={{ fill: 'var(--text-primary)', fontSize: '11px', fontWeight: 600 }}
                                />
                            </Bar>
                        </BarChart>
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
