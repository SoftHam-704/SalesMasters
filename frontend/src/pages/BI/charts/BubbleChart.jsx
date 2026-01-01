
import React from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

// Custom Node - uses metrica to determine value field
const createCustomNode = (maxValue, selectedId, metrica) => (props) => {
    const { cx, cy, payload } = props;

    if (!cx || !cy) return null;

    // Use correct field based on metrica
    const valueField = metrica === 'Quantidade' ? 'total_quantidade' : 'total_vendas';
    const currentValue = parseFloat(payload[valueField] || payload.total_vendas || 0);
    const ratio = maxValue > 0 ? currentValue / maxValue : 1;

    // Sizes: 50-145px (reduced to fit better)
    const minSize = 50;
    const maxSize = 145;
    const size = minSize + (maxSize - minSize) * Math.pow(ratio, 0.4);

    const isSelected = selectedId === payload.codigo;
    const ringColor = isSelected ? '#ef4444' : '#0891B2';
    const ringWidth = isSelected ? 3.5 : 2;

    // Image size - 88% of bubble
    const imgSize = size * 0.88;

    return (
        <g style={{ cursor: 'pointer' }}>
            <defs>
                <filter id={`glow-${payload.codigo}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={isSelected ? 6 : 3} result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {isSelected && (
                <circle
                    cx={cx}
                    cy={cy}
                    r={size / 2 + 12}
                    fill="rgba(239, 68, 68, 0.25)"
                    filter={`url(#glow-${payload.codigo})`}
                />
            )}

            <circle
                cx={cx}
                cy={cy}
                r={size / 2 + 4}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringWidth}
                filter={`url(#glow-${payload.codigo})`}
            />

            <circle
                cx={cx}
                cy={cy}
                r={size / 2 + 1}
                fill="rgba(10, 35, 35, 0.85)"
            />

            {payload.imagem_url && (
                <image
                    x={cx - imgSize / 2}
                    y={cy - imgSize / 2}
                    width={imgSize}
                    height={imgSize}
                    href={payload.imagem_url}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: 'none' }}
                />
            )}

            {!payload.imagem_url && (
                <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize={Math.max(10, size / 7)}
                    fontWeight="bold"
                    fill="#ffffff"
                    style={{ pointerEvents: 'none' }}
                >
                    {payload.nome?.substring(0, 6)}
                </text>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-2xl rounded-xl font-['Roboto'] z-50 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    {data.imagem_url && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center p-1">
                            <img src={data.imagem_url} className="w-full h-full object-contain" alt="" />
                        </div>
                    )}
                    <span className="font-bold text-sm text-slate-800">{data.nome}</span>
                </div>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Faturamento:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(data.total_vendas)}</span>
                    </div>
                    {data.total_quantidade && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">Quantidade:</span>
                            <h3 className="font-['Roboto'] text-cyan-400/90 text-[11px] font-bold uppercase tracking-[0.25em]">{formatNumber(data.total_quantidade)}</h3>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-slate-500">Market Share:</span>
                        <span className="font-bold text-emerald-600">{data.percentual}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Pedidos:</span>
                        <span className="font-bold text-slate-800">{data.total_pedidos}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const BubbleChart = ({ data, onIndustryClick, selectedIndustryId, metrica = 'Valor' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-cyan-400/70 text-sm">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-3 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
                    <span>Carregando...</span>
                </div>
            </div>
        );
    }

    // Use correct field based on metrica
    const valueField = metrica === 'Quantidade' ? 'total_quantidade' : 'total_vendas';

    // Sort by selected metrica field
    const sortedData = [...data].sort((a, b) =>
        parseFloat(b[valueField] || b.total_vendas || 0) - parseFloat(a[valueField] || a.total_vendas || 0)
    );
    const maxValue = Math.max(...sortedData.map(d => parseFloat(d[valueField] || d.total_vendas || 0)));

    // Calculate bubble sizes first (same logic as in createCustomNode)
    // Reduced max size to fit better within panel with margins
    const minSize = 50;
    const maxSize = 145;  // Reduced from 170 to fit 6 bubbles with margins
    const bubblesWithSizes = sortedData.map((item) => {
        const currentValue = parseFloat(item[valueField] || item.total_vendas || 0);
        const ratio = maxValue > 0 ? currentValue / maxValue : 1;
        const size = minSize + (maxSize - minSize) * Math.pow(ratio, 0.4);
        return { ...item, bubbleSize: size };
    });

    // Position bubbles adjacent (touching) without overlap
    // Start with left margin - reduced for better centering
    let currentX = 0.7; // Left margin (reduced from 1.0)

    const chartData = bubblesWithSizes.map((item, index) => {
        const xPos = currentX;

        // Move to next position: current center + current radius + next radius
        if (index < bubblesWithSizes.length - 1) {
            const nextItem = bubblesWithSizes[index + 1];
            const currentRadius = item.bubbleSize / 2;
            const nextRadius = nextItem.bubbleSize / 2;
            // Just touch - no overlap
            const spacing = (currentRadius + nextRadius) / 90; // Scale for chart coordinates
            currentX += spacing;
        }

        return {
            ...item,
            x: xPos,
            y: 50,  // Centered vertically
            z: parseFloat(item[valueField] || item.total_vendas || 0),
            ranking: index + 1
        };
    });

    // Z-index logic: selected bubble comes to front
    const orderedData = [...chartData].sort((a, b) => {
        if (a.codigo === selectedIndustryId) return 1;
        if (b.codigo === selectedIndustryId) return -1;
        return b.ranking - a.ranking;
    });

    return (
        <div
            style={{ width: '100%', height: '100%' }}
            className="bubble-chart-container"
        >
            <style>{`
                .bubble-chart-container svg,
                .bubble-chart-container svg *,
                .bubble-chart-container .recharts-wrapper,
                .bubble-chart-container .recharts-surface {
                    outline: none !important;
                    box-shadow: none !important;
                }
                .bubble-chart-container .recharts-wrapper:focus,
                .bubble-chart-container .recharts-wrapper:focus-visible {
                    outline: none !important;
                }
            `}</style>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                    <XAxis type="number" dataKey="x" hide={true} domain={[0, 8]} />
                    <YAxis type="number" dataKey="y" hide={true} domain={[0, 100]} />
                    <ZAxis type="number" dataKey="z" range={[100, 3000]} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Scatter
                        data={orderedData}
                        shape={createCustomNode(maxValue, selectedIndustryId, metrica)}
                        onClick={(node) => onIndustryClick && onIndustryClick(node.codigo)}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BubbleChart;
