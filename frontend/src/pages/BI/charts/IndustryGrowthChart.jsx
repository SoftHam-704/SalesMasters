import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const CustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    const growth = parseFloat(value); // This might be passing the whole payload object if mapped wrong
    // Actually LabelList passes the value of dataKey

    // We need the full payload to check if it's positive or negative safely if value is string?
    // But dataKey="dif_perc" comes as number.

    const isPositive = growth >= 0;
    const color = isPositive ? '#10B981' : '#EF4444';
    const arrow = isPositive ? '▲' : '▼';
    const text = `${arrow} ${Math.abs(growth).toFixed(1)}%`;

    return (
        <text
            x={x + width + 5}
            y={y + height / 2 + 4}
            fill={color}
            fontSize={10}
            fontFamily="Verdana"
            fontWeight="bold"
            textAnchor="start"
        >
            {text}
        </text>
    );
};

const CustomTooltip = ({ active, payload, label, metric }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.dif_perc >= 0;
        const color = isPositive ? '#10B981' : '#EF4444';

        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                <p className="font-['Verdana'] text-xs font-bold text-gray-700 mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-['Verdana']">
                        Atual: <span className="font-bold text-slate-700">
                            {metric === 'Valor' ? formatCurrency(data.atual) : formatNumber(data.atual)}
                        </span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-['Verdana']">
                        Anterior: <span className="font-bold text-slate-500">
                            {metric === 'Valor' ? formatCurrency(data.anterior) : formatNumber(data.anterior)}
                        </span>
                    </p>
                    <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-100">
                        <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <p className="text-[10px] font-bold font-['Verdana']" style={{ color }}>
                            {isPositive ? 'Crescimento' : 'Retração'}: {data.dif_perc.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const IndustryGrowthChart = ({ data, metric }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 font-['Verdana']">
                Aguardando dados de performance...
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }} // Right margin for labels
            >
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="nome"
                    type="category"
                    width={120}
                    tick={{ fontSize: 9, fontFamily: 'Verdana', fill: '#64748B', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                    dataKey="atual"
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                >
                    {/* Optional: Shade bar based on growth? No, keeping it blue for Volume consistency. */}
                    <LabelList dataKey="dif_perc" content={<CustomLabel />} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default IndustryGrowthChart;
