import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

/**
 * BIGraphic Reference Components
 * 
 * Este arquivo contém implementações de referência baseadas no estilo Infragistics/BI Profissional
 * utilizando a biblioteca Recharts já presente no projeto SalesMasters.
 */

// --- 1. GRÁFICO DE COLUNAS VERTICAIS (Vertical Column Chart) ---
export const BigColumnChart = ({ data, title, xAxisKey, yAxisTitle }) => (
    <div className="w-full h-full flex flex-col p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
        {title && <div className="text-[12px] font-black text-stone-900 uppercase tracking-widest mb-4 text-center border-b border-stone-100 pb-2">{title}</div>}
        <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis
                        dataKey={xAxisKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#78716c' }}
                    />
                    <YAxis
                        label={{ value: yAxisTitle, angle: -90, position: 'insideLeft', fontSize: 10, offset: 0, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#78716c' }}
                    />
                    <Tooltip
                        cursor={{ fill: '#fafaf9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Bar dataKey="totalRevenue" name="Total Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="highestGrossing" name="Highest Grossing" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

// --- 2. GRÁFICO DE BARRAS HORIZONTAIS (Horizontal Bar Chart) ---
export const BigHorizontalBarChart = ({ data, title, yAxisKey, xAxisTitle }) => (
    <div className="w-full h-full flex flex-col p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
        {title && <div className="text-[12px] font-black text-stone-900 uppercase tracking-widest mb-4 text-center border-b border-stone-100 pb-2">{title}</div>}
        <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                    <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#78716c' }}
                        title={xAxisTitle}
                    />
                    <YAxis
                        type="category"
                        dataKey={yAxisKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#44403c' }}
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: '#fafaf9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Bar dataKey="totalRevenue" name="Total Revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                    <Bar dataKey="highestGrossing" name="Highest Grossing" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

// --- 3. GRÁFICO DE PIZZA CLÁSSICO (Classic Pie Chart) ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const BigPieChart = ({ data, title }) => (
    <div className="w-full h-full flex flex-col p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
        {title && <div className="text-[12px] font-black text-stone-900 uppercase tracking-widest mb-4 text-center border-b border-stone-100 pb-2">{title}</div>}
        <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
);
