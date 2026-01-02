import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FunnelAreaChart = ({ data }) => {
    // Expects data format: [{ day: 1, total: 100 }, ...] or monthly data
    if (!data || data.length === 0) return null;

    // Green shades from light to dark and back
    const greenShades = [
        '#86efac', '#4ade80', '#22c55e', '#16a34a',
        '#15803d', '#166534', '#14532d', '#166534',
        '#15803d', '#16a34a', '#22c55e', '#4ade80'
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" hide />
                <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '11px'
                    }}
                    formatter={(val) => [val.toLocaleString('pt-BR'), 'Total']}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={greenShades[index % greenShades.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default FunnelAreaChart;
