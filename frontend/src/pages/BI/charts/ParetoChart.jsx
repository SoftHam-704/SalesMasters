
import React from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Rectangle,
    Cell,
    ReferenceLine
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const ParetoChart = ({ data, metric }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs font-['Verdana']">
                <p>Nenhum dado para análise Pareto.</p>
            </div>
        );
    }

    const formatter = (value) => {
        if (metric === 'Quantidade' || metric === 'Quantidades') return formatNumber(value);
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
        return value;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg font-['Verdana'] z-50">
                    <p className="font-bold text-slate-700 text-xs mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-[10px]" style={{ color: entry.color }}>
                            {entry.name === 'Acumulado'
                                ? `Acumulado: ${formatNumber(entry.value)}%`
                                : `${entry.name}: ${metric === 'Valor' ? formatCurrency(entry.value) : formatNumber(entry.value)}`
                            }
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom Bar Shape with Top Radius
    const CustomBar = (props) => {
        const { fill, x, y, width, height } = props;
        return <Rectangle {...props} radius={[4, 4, 0, 0]} />;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 70, left: 10 }}
            >
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fontFamily: 'Verdana', fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={formatter}
                    tick={{ fontSize: 9, fontFamily: 'Verdana', fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    unit="%"
                    tick={{ fontSize: 9, fontFamily: 'Verdana', fill: '#F59E0B' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

                <Bar
                    yAxisId="left"
                    dataKey="value"
                    name={metric}
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                    shape={<CustomBar />}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.percent_acc <= 80 ? '#3B82F6' : '#94A3B8'}
                        />
                    ))}
                </Bar>
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="percent_acc"
                    name="Acumulado"
                    stroke="#64748B"
                    strokeWidth={1}
                    dot={{ r: 2, fill: '#64748B', strokeWidth: 0 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default ParetoChart;
