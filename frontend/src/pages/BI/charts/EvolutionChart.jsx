import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import { formatNumber, formatCurrency } from '../../../utils/formatters';

// Custom dot that appears on all points or just active ones
const CustomDot = (props) => {
    const { cx, cy, stroke, payload, value } = props;

    // Logic to determine color based on trend
    const isPositive = payload.delta_percent >= 0;
    const color = isPositive ? '#10B981' : '#EF4444'; // Green or Red

    return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="white" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="2" />
        </svg>
    );
};

// Custom Label to show Value AND Percentage
const CustomLabel = (props) => {
    const { x, y, value, index, data, metric } = props;
    const item = data[index];

    if (!item) return null;

    const isPositive = item.delta_percent >= 0;
    const color = isPositive ? '#10B981' : '#EF4444';
    const symbol = isPositive ? '▲' : '▼';

    // Format value based on metric type
    let displayValue = "";
    if (metric === 'Quantidade' || metric === 'Quantidades') {
        // Quantity: Thousand separator, no decimals (e.g. 61.583)
        displayValue = formatNumber(value);
    } else {
        // Value: Currency with 2 decimals (e.g. R$ 3.003.022,50)
        displayValue = formatCurrency(value);
    }

    return (
        <g>
            {/* Main Value - Bold and Dark */}
            <text
                x={x}
                y={y - 20}
                fill="#334155"
                fontSize={10} // Slightly reduced to fit full numbers
                fontFamily="Verdana"
                fontWeight="bold"
                textAnchor="middle"
            >
                {displayValue}
            </text>

            {/* Percentage Change - Smaller and Colored */}
            {index > 0 && (
                <text
                    x={x}
                    y={y - 8}
                    fill={color}
                    fontSize={9}
                    fontFamily="Verdana"
                    fontWeight="bold"
                    textAnchor="middle"
                >
                    {symbol}{Math.abs(item.delta_percent)}%
                </text>
            )}
        </g>
    );
};

const EvolutionChart = ({ data, metric }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm font-['Verdana']">
                <p>Nenhum dado de evolução disponível para o período.</p>
            </div>
        );
    }

    // Determine formatter based on metric - AXIS
    const formatter = (value) => {
        if (metric === 'Quantidade' || metric === 'Quantidades') {
            return formatNumber(value);
        }
        // For axis ticks we can keep it compact or use full
        // Let's use compact for axis to save space, but full for labels as requested
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)} Mi`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)} k`;
        return value;
    };

    const tooltipFormatter = (value) => {
        if (metric === 'Quantidade' || metric === 'Quantidades') {
            return [formatNumber(value), 'Quantidade'];
        }
        return [formatCurrency(value), 'Faturamento'];
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 35,
                        right: 50,
                        left: 10,  // Reduced back to bring closer to edge
                        bottom: 10,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600, fontFamily: 'Verdana' }}
                        dy={10}
                        padding={{ left: 30, right: 30 }} // Pushes first/last points away from edges
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Verdana' }}
                        tickFormatter={formatter}
                        width={80} // Increased from 60 to 80 to prevent overlap
                        domain={['dataMin', 'auto']}
                    />
                    <Tooltip
                        cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            padding: '12px',
                            fontFamily: 'Verdana'
                        }}
                        formatter={tooltipFormatter}
                    />
                    <Line
                        type="stepAfter"
                        dataKey="valor"
                        stroke="#64748B"
                        strokeWidth={1} // Thin line 1px
                        dot={<CustomDot />}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    >
                        <LabelList
                            dataKey="valor"
                            content={(props) => <CustomLabel {...props} data={data} metric={metric} />}
                        />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EvolutionChart;
