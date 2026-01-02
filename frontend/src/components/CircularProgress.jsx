import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const CircularProgress = ({ percentage, color, size = 180 }) => {
    const chartData = [
        { name: 'Preenchido', value: percentage },
        { name: 'Vazio', value: 100 - percentage }
    ];

    const emptyColor = '#ecf0f1';
    const radius = size / 2;
    const innerRadius = radius * 0.67; // 60/90 ratio
    const outerRadius = radius * 0.89; // 80/90 ratio

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <PieChart width={size} height={size}>
                <Pie
                    data={chartData}
                    cx={radius}
                    cy={radius}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                >
                    <Cell fill={color} />
                    <Cell fill={emptyColor} />
                </Pie>
            </PieChart>

            {/* Percentual no centro */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: `${size * 0.18}px`,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontFamily: 'Roboto, sans-serif'
            }}>
                {percentage.toFixed(1)}%
            </div>
        </div>
    );
};

export default CircularProgress;
