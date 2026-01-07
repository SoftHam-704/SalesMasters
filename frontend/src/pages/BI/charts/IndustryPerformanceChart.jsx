import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { formatCurrency, formatNumber, formatCompactCurrency } from '../../../utils/formatters';

const CustomTooltip = ({ active, payload, label, metrica }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg font-['Roboto'] min-w-[150px] z-50">
                <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1 truncate max-w-[200px]">{data.nome}</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">{metrica}:</span>
                        <span className="font-bold text-slate-800">
                            {metrica === 'Valor' ? formatCurrency(data.total_vendas) : formatNumber(data.total_quantidade)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">Share:</span>
                        <span className="font-bold text-indigo-600">
                            {data.percentual}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">Ranking:</span>
                        <span className="font-bold text-slate-600">
                            #{data.ranking}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const IndustryPerformanceChart = ({ data, metrica = 'Valor' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center min-h-[200px]">
                <p>Aguardando dados...</p>
            </div>
        );
    }

    // Sort data by the selected metric in descending order (highest to lowest)
    const sortedData = [...data].sort((a, b) => {
        const valueA = metrica === 'Valor' ? (a.total_vendas || 0) : (a.total_quantidade || 0);
        const valueB = metrica === 'Valor' ? (b.total_vendas || 0) : (b.total_quantidade || 0);
        return valueB - valueA; // Descending order
    });

    // Dynamic height calculation: shorter bars, less padding
    const itemHeight = 28;
    const chartHeight = Math.max(sortedData.length * itemHeight, 100);

    // Custom label to show "R$ 9.5M"
    const renderCustomLabel = (props) => {
        const { x, y, width, value, index } = props;
        const item = sortedData[index];
        const displayValue = metrica === 'Valor'
            ? formatCompactCurrency(item.total_vendas)
            : formatNumber(item.total_quantidade);

        const percentual = item.percentual ? ` ${item.percentual}%` : '';

        return (
            <text
                x={x + width + 5}
                y={y + 15}
                fill="#334155"
                fontSize={11}
                fontWeight={600}
                dominantBaseline="middle"
            >
                {displayValue}{percentual}
            </text>
        );
    };

    return (
        <div className="w-full max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2">
            <div style={{ width: '100%', height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{ top: 0, right: 60, bottom: 0, left: 10 }} // Increased right margin for labels
                    >
                        <defs>
                            <linearGradient id="industryBarGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        {/* No grid lines as per print */}

                        <XAxis type="number" hide={true} />

                        <YAxis
                            dataKey="nome"
                            type="category"
                            width={110}
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                        />

                        <Tooltip
                            content={<CustomTooltip metrica={metrica} />}
                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                        />

                        <Bar
                            dataKey={metrica === 'Valor' ? 'total_vendas' : 'total_quantidade'}
                            barSize={14} // Thinner bars
                            radius={[0, 4, 4, 0]}
                            fill="url(#industryBarGradient)"
                        >
                            <LabelList
                                content={renderCustomLabel}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default IndustryPerformanceChart;
