import React from 'react';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const CustomBarShape = (props) => {
    const { fill, x, y, width, height } = props;
    const radius = 4; // Radius of the dot

    // Line part (The "stick")
    const stickWidth = 2;
    const stickX = x + width / 2 - stickWidth / 2;
    const stickHeight = height;

    // Circle part (The "lollipop")
    const cx = x + width / 2;
    const cy = y;

    return (
        <g>
            {/* Stick */}
            <rect
                x={stickX}
                y={cy}
                width={stickWidth}
                height={stickHeight}
                fill={fill}
                opacity={0.6}
            />
            {/* Lollipop Head */}
            <circle cx={cx} cy={cy} r={radius} fill={fill} />
        </g>
    );
};

const LollipopChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Map month numbers to letters (J, F, M...)
    const monthLabels = ["", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis
                        dataKey="mes"
                        tickFormatter={(val) => monthLabels[val]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                        hide
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val) => [val, 'Clientes']}
                        labelFormatter={(label) => `Mês ${label}`}
                    />
                    <Bar
                        dataKey="clientes"
                        barSize={20}
                        shape={<CustomBarShape />}
                    >
                        {data.map((entry, index) => {
                            // Generate different green shades for each month
                            const greenShades = [
                                '#86efac', // Light green
                                '#4ade80',
                                '#22c55e',
                                '#16a34a',
                                '#15803d',
                                '#166534',
                                '#14532d', // Dark green
                                '#15803d',
                                '#16a34a',
                                '#22c55e',
                                '#4ade80',
                                '#86efac'
                            ];
                            return <Cell key={`cell-${index}`} fill={greenShades[index % greenShades.length]} />;
                        })}
                    </Bar>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LollipopChart;
