import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    const isPositive = payload.delta_percent >= 0;
    const color = isPositive ? '#10b981' : '#ef4444'; // emerald-500 : red-500

    return (
        <circle cx={cx} cy={cy} r={5} stroke={color} strokeWidth={2.5} fill="#fff" />
    );
};

const CustomLabel = (props) => {
    const { x, y, value, payload, index } = props;

    // Check for missing props - value can be 0 (valid), so check for undefined/null specifically
    if (!payload || value === undefined || value === null || x === undefined || y === undefined) {
        return null;
    }

    // delta_percent might be 0 (valid), only skip if truly missing
    const deltaPercent = payload.delta_percent;
    if (deltaPercent === undefined || deltaPercent === null) {
        return null;
    }

    const isPositive = deltaPercent >= 0;
    const color = isPositive ? '#10b981' : '#ef4444';

    // Format value
    const formattedValue = new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 0 }).format(value);

    return (
        <g>
            {/* Value Label (Above) */}
            <text x={x} y={y - 15} textAnchor="middle" fill="#1e293b" fontSize={12} fontWeight="700" fontFamily="Roboto">
                {formattedValue}
            </text>

            {/* Percentage Label (Below) */}
            <text x={x} y={y + 22} textAnchor="middle" fill={color} fontSize={10} fontWeight="700" fontFamily="Roboto">
                {isPositive ? '▲' : '▼'} {Math.abs(deltaPercent).toFixed(1)}%
            </text>
        </g>
    );
};


const CustomTooltip = ({ active, payload, label, metrica }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.delta_percent >= 0;

        return (
            <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg font-['Roboto'] min-w-[150px] z-50">
                <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">Valor Atual:</span>
                        <span className="font-bold text-slate-800 text-sm">
                            {metrica === 'Valor'
                                ? formatCurrency(data.valor)
                                : formatNumber(data.valor)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-500">Mês Anterior:</span>
                        <span className="font-medium text-slate-600">
                            {metrica === 'Valor'
                                ? formatCurrency(data.valor_anterior)
                                : formatNumber(data.valor_anterior)}
                        </span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex justify-between items-center mt-1">
                        <span className="text-slate-500">Variação:</span>
                        <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-1`}>
                            {isPositive ? <span className="text-[10px]">▲</span> : <span className="text-[10px]">▼</span>}
                            {data.delta_percent}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const EvolutionChart = ({ data, metrica = 'Valor' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-4">
                <p>Selecione um filtro ou aguarde o carregamento dos dados...</p>
            </div>
        );
    }

    // Determine Y domain/padding
    // We'll use 'auto' with padding for YAxis to let Recharts handle basic scaling,
    // but the margins are critical for the labels.

    // Delta Label Component
    const DeltaLabel = (props) => {
        const { x, y, value } = props;
        if (value === undefined || value === null || x === undefined || y === undefined) return null;

        const isPositive = value >= 0;
        const color = isPositive ? '#10b981' : '#ef4444';

        return (
            <text x={x} y={y + 24} textAnchor="middle" fill={color} fontSize={10} fontWeight="700" fontFamily="Roboto">
                {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
            </text>
        );
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    // Increase margins to allow CustomLabels to render outside the strictly plotted area
                    margin={{ top: 40, right: 30, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        dy={10}
                        padding={{ left: 30, right: 30 }}
                    />
                    <YAxis
                        hide={false}
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(val) => new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(val)}
                        width={35}
                    />
                    <Tooltip content={<CustomTooltip metrica={metrica} />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                    <Line
                        type="stepAfter"
                        dataKey="valor"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        dot={<CustomDot />}
                        activeDot={{ r: 6, stroke: '#334155', strokeWidth: 2, fill: '#fff' }}
                        animationDuration={1500}
                        isAnimationActive={true}
                    >
                        {/* Value Label (Top) */}
                        <LabelList
                            dataKey="valor"
                            position="top"
                            offset={10}
                            formatter={(value) => new Intl.NumberFormat('pt-BR', { notation: "compact", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}
                            style={{ fill: '#1e293b', fontSize: 12, fontWeight: 700, fontFamily: 'Roboto' }}
                        />
                        {/* Delta Percent Label (Bottom) */}
                        <LabelList
                            dataKey="delta_percent"
                            content={<DeltaLabel />}
                        />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EvolutionChart;
