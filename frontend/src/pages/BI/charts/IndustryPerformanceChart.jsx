import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

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
            <div className="flex items-center justify-center h-32 text-slate-400 text-xs text-center">
                <p>Aguardando dados...</p>
            </div>
        );
    }

    // Dynamic height calculation: 40px per item + 50px buffer
    const chartHeight = Math.max(data.length * 40 + 50, 200);

    return (
        <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 20, right: 50, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                        type="number"
                        hide={true}
                    />
                    <YAxis
                        dataKey="nome"
                        type="category"
                        width={100}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                    />
                    <Tooltip content={<CustomTooltip metrica={metrica} />} cursor={{ fill: '#f8fafc' }} />

                    <Bar
                        dataKey={metrica === 'Valor' ? 'total_vendas' : 'total_quantidade'}
                        barSize={20}
                        radius={[0, 4, 4, 0]}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 3 ? '#6366f1' : '#94a3b8'} fillOpacity={index < 3 ? 1 : 0.7} />
                        ))}
                        <LabelList
                            dataKey="percentual"
                            position="right"
                            formatter={(val) => `${val}%`}
                            style={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IndustryPerformanceChart;
