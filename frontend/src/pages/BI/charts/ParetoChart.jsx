import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const CustomTooltip = ({ active, payload, label, metrica }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg font-['Roboto'] min-w-[150px] z-50">
                <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1 truncate max-w-[200px]">{data.name}</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">{metrica}:</span>
                        <span className="font-bold text-slate-800">
                            {metrica === 'Valor' ? formatCurrency(data.value) : formatNumber(data.value)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">% Acumulada:</span>
                        <span className="font-bold text-emerald-600">
                            {data.percent_acc}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const ParetoChart = ({ data, metrica = 'Valor' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center">
                <p>Aguardando dados...</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        scale="band"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    {/* Left Axis: Value */}
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickFormatter={(val) => new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(val)}
                        axisLine={false}
                        tickLine={false}
                    />
                    {/* Right Axis: Percentage */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={10}
                        unit="%"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip metrica={metrica} />} />

                    {/* Bars for Value */}
                    <Bar yAxisId="left" dataKey="value" barSize={30} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 5 ? '#3b82f6' : '#94a3b8'} fillOpacity={index < 5 ? 1 : 0.6} />
                        ))}
                    </Bar>

                    {/* Line for Cumulative Percentage */}
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="percent_acc"
                        stroke="#10b981"
                        strokeWidth={1}
                        dot={{ r: 1, fill: '#10b981' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ParetoChart;
