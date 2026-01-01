import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LabelList
} from 'recharts';
import axios from 'axios';
import { useBIFilters } from '../../../contexts/BIFiltersContext';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const OverviewTab = () => {
    const { filters } = useBIFilters();
    const [data, setData] = useState({ comparison: [] });
    const [loading, setLoading] = useState(false);

    const fetchBIData = async () => {
        setLoading(true);
        try {
            const resComp = await axios.get(`http://localhost:8000/api/dashboard/comparison`, {
                params: { ano: filters.ano }
            });
            setData({
                comparison: resComp.data
            });
        } catch (error) {
            console.error('Error fetching BI data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBIData();
    }, [filters.ano, filters.mes]);

    return (
        <div className="bg-white rounded-[40px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 w-full h-[60vh] mb-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-[#009EDF] rounded-full"></div>
                    <h2 className="text-lg font-bold text-[#334155]">Relação Faturamento vs Metas Mensais</h2>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#009EDF] rounded-full"></div>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Faturamento</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                        <div className="w-2.5 h-2.5 border-2 border-[#F59E0B] bg-white rounded-full"></div>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Metas</span>
                    </div>
                </div>
            </div>
            <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.comparison} margin={{ top: 25, right: 20, left: 20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#009EDF" stopOpacity={1} />
                                <stop offset="100%" stopColor="#006690" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                            dy={5}
                        />
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: '#F1F5F9' }}
                            formatter={(value, name, props) => {
                                if (name === 'faturamento') return [formatCurrency(props.payload.faturamento_real, 2), 'Faturamento'];
                                if (name === 'meta') return [formatCurrency(props.payload.meta_real, 2), 'Meta'];
                                return [value, name];
                            }}
                        />
                        <Bar
                            dataKey="faturamento"
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={80}
                        >
                            <LabelList
                                dataKey="faturamento_real"
                                position="top"
                                content={(props) => {
                                    const { x, y, width, value } = props;
                                    if (!value) return null;
                                    const formatted = formatNumber(value);
                                    return (
                                        <text x={x + width / 2} y={y - 12} fill="#009EDF" textAnchor="middle" fontSize={11} fontWeight="800">
                                            {formatted}
                                        </text>
                                    );
                                }}
                            />
                        </Bar>
                        <Line
                            type="monotone"
                            dataKey="meta"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ fill: 'white', stroke: '#F59E0B', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OverviewTab;
