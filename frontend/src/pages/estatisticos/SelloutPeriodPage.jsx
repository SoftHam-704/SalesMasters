import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Search, Download, Calendar, Filter, Building2, User } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function SelloutPeriodPage() {
    // 1. STATE
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [industries, setIndustries] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState('all');

    // Clients for combobox (Simplified implementation - normally you'd search/lazy load clients)
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('all');

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 2. DATA FETCHING
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch Industries
                const indRes = await fetch('/api/suppliers');
                if (indRes.ok) {
                    const indData = await indRes.json();

                    // Tratamento defensivo pra lidar com o retorno que pode ser { data: [] } ou direto []
                    const rawInd = Array.isArray(indData) ? indData : (indData.data || []);

                    // Filtragem pra exibir apenas Ativos
                    const ativos = rawInd.filter(item => item.for_tipo2 === 'A' || item.situacao === 'A' || item.situacao === 'Ativo');
                    setIndustries(ativos);
                }

                // Fetch Clients
                const cliRes = await fetch('/api/clients?limit=5000&active=true');
                if (cliRes.ok) {
                    const cliData = await cliRes.json();
                    const rawCli = Array.isArray(cliData) ? cliData : (cliData.data || []);
                    setClients(rawCli);
                }
            } catch (err) {
                console.error("Filter load error:", err);
            }
        };
        fetchFilters();
    }, []);

    const fetchSelloutData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                ...(selectedIndustry !== 'all' && { industriaId: selectedIndustry }),
                ...(selectedClient !== 'all' && { clienteId: selectedClient })
            });

            // Note: Our new endpoint is in client_intelligence_endpoints.js which is mapped under /api/intelligence
            const response = await fetch(`/api/intelligence/sellout-periodo?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                setData(result.data || []);
            } else {
                setError(result.message || 'Erro ao carregar dados');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Data will now be loaded purely via the explicit "Processar" button

    // 3. DATA PIVOTING LOGIC
    const pivotedData = useMemo(() => {
        if (!data || data.length === 0) return { columns: [], rows: [], grandTotalVlr: 0, grandTotalQtd: 0 };

        const clientMap = new Map();
        const monthSet = new Set();
        let grandTotalVlr = 0;
        let grandTotalQtd = 0;

        data.forEach(item => {
            const clientId = item.cliente_id;
            const clientName = item.cliente_nome;
            // Padronizar mes para MM/YYYY
            const monthKey = `${String(item.mes).padStart(2, '0')}/${item.ano}`;
            monthSet.add(monthKey);

            if (!clientMap.has(clientId)) {
                clientMap.set(clientId, {
                    id: clientId,
                    nome: clientName,
                    months: {},
                    totalVlr: 0,
                    totalQtd: 0
                });
            }

            const clientNode = clientMap.get(clientId);

            if (!clientNode.months[monthKey]) {
                clientNode.months[monthKey] = { valor: 0, quantidade: 0 };
            }

            const vlr = parseFloat(item.valor) || 0;
            const qtd = parseInt(item.quantidade) || 0;

            clientNode.months[monthKey].valor += vlr;
            clientNode.months[monthKey].quantidade += qtd;
            clientNode.totalVlr += vlr;
            clientNode.totalQtd += qtd;

            grandTotalVlr += vlr;
            grandTotalQtd += qtd;
        });

        // Soft sort columns: sort by year/month string (YYYY-MM to compare)
        const sortedColumns = Array.from(monthSet).sort((a, b) => {
            const [m1, y1] = a.split('/');
            const [m2, y2] = b.split('/');
            return new Date(`${y1}-${m1}-01`) - new Date(`${y2}-${m2}-01`);
        });

        // Sort rows alphabetically by client name
        const sortedRows = Array.from(clientMap.values()).sort((a, b) =>
            (a.nome || '').localeCompare(b.nome || '')
        );

        return { columns: sortedColumns, rows: sortedRows, grandTotalVlr, grandTotalQtd };
    }, [data]);

    // 4. EXCEL EXPORT
    const exportToExcel = () => {
        if (!pivotedData.rows.length) return;

        // Header Row (Colunas de Meses)
        const headerRow = ['Cliente'];
        pivotedData.columns.forEach(col => {
            headerRow.push(`${col} - Valor`, `${col} - Qtd`);
        });
        headerRow.push('Total Valor', 'Total Qtd');

        const excelData = [headerRow];

        // Content Rows
        pivotedData.rows.forEach(row => {
            const buildRow = [row.nome];
            pivotedData.columns.forEach(col => {
                const cell = row.months[col];
                buildRow.push(cell ? cell.valor : 0);
                buildRow.push(cell ? cell.quantidade : 0);
            });
            buildRow.push(row.totalVlr, row.totalQtd);
            excelData.push(buildRow);
        });

        // Totals Row
        const totalsRow = ['TOTAL GERAL'];
        pivotedData.columns.forEach(col => {
            let colVlr = 0;
            let colQtd = 0;
            pivotedData.rows.forEach(r => {
                if (r.months[col]) {
                    colVlr += r.months[col].valor;
                    colQtd += r.months[col].quantidade;
                }
            });
            totalsRow.push(colVlr, colQtd);
        });
        totalsRow.push(pivotedData.grandTotalVlr, pivotedData.grandTotalQtd);
        excelData.push(totalsRow);

        const ws = xlsx.utils.aoa_to_sheet(excelData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Sellout_Periodo");
        xlsx.writeFile(wb, `Sellout_Periodo_${startDate}_a_${endDate}.xlsx`);
    };

    // Formatter
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="h-full flex flex-col bg-[#fdfdfd] p-4 lg:p-6 overflow-hidden">

            {/* 1. FILTER BAR */}
            <div className="bg-white border text-sm font-sans border-stone-200 rounded-xl p-4 mb-4 shadow-sm flex flex-wrap items-end gap-4 shrink-0">
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Data Inicial</label>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="date"
                            className="bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-stone-700 w-full focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Data Final</label>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="date"
                            className="bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-stone-700 w-full focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Indústria</label>
                    <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <select
                            className="bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-stone-700 w-full focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors appearance-none"
                            value={selectedIndustry}
                            onChange={e => setSelectedIndustry(e.target.value)}
                        >
                            <option value="all">Todas as Indústrias</option>
                            {industries.map(ind => (
                                <option key={ind.for_codigo} value={ind.for_codigo}>{ind.for_nomered}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Cliente (Código)</label>
                    <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <select
                            className="bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-stone-700 w-full focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors appearance-none"
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                        >
                            <option value="all">Todos os Clientes</option>
                            {clients.map(cli => {
                                const cliId = cli.cli_codigo || cli.id;
                                const cliNome = cli.cli_nomred || cli.nomeFantasia || cli.razaoSocial || cli.cli_nome || '';
                                return (
                                    <option key={cliId} value={cliId}>{cliId} - {cliNome}</option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={fetchSelloutData}
                        disabled={loading}
                        className="h-[38px] px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                    >
                        {loading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Search size={14} className="!text-white" />}
                        <span className="!text-white">Processar</span>
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={!pivotedData.rows.length || loading}
                        className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Download size={14} className="!text-white" />
                        <span className="!text-white">Exportar Excel</span>
                    </button>
                </div>
            </div>

            {/* 2. GRAND TOTAL & STATUS */}
            <div className="bg-stone-50 border border-stone-200 text-stone-800 rounded-xl p-4 mb-4 flex divide-x divide-stone-200 shrink-0 shadow-sm">
                <div className="px-6 flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase text-stone-500 mb-1">Totalizador Global</span>
                    <span className="text-sm font-bold tracking-tight text-stone-900">SELLIN/SELLOUT</span>
                </div>
                <div className="px-6 flex flex-col justify-center">
                    <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider mb-1">Valor Total (Período)</span>
                    <span className="text-xl font-display font-medium text-stone-900">{formatCurrency(pivotedData.grandTotalVlr)}</span>
                </div>
                <div className="px-6 flex flex-col justify-center">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mb-1">Qtd Peças (Período)</span>
                    <span className="text-xl font-display font-medium text-stone-900">{pivotedData.grandTotalQtd.toLocaleString('pt-BR')}</span>
                </div>
            </div>

            {/* 3. TABLE/MATRIX CONTAINER */}
            <div className="flex-1 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col shadow-sm">

                {/* Table Header Wrapper (To implement fixed header simply) */}
                <div className="overflow-x-auto bg-stone-50 border-b border-stone-200 scrollbar-hide">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                            {/* Super Header: Months */}
                            <tr>
                                <th className="bg-stone-100 p-3 sticky left-0 z-20 min-w-[300px] border-r border-b border-stone-200 border-t-0 border-l-0">
                                    <div className="uppercase tracking-wider font-bold text-stone-600 text-xs">Cliente</div>
                                </th>
                                {pivotedData.columns.map(col => (
                                    <th key={col} colSpan="2" className="bg-stone-50 p-2 text-center border-r border-stone-200 border-b border-t-0 last:border-r-0">
                                        <div className="font-bold text-stone-900 tracking-wider bg-white rounded shadow-sm border border-stone-200/60 p-1 text-xs">
                                            {col}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            {/* Sub Header: Valor / Qtd */}
                            <tr>
                                <th className="bg-stone-50 p-2 text-stone-500 text-xs uppercase tracking-widest font-bold sticky left-0 z-20 border-r border-b border-stone-200 border-l-0">
                                    Desempenho da Indústria no Período
                                </th>
                                {pivotedData.columns.map((col, i) => (
                                    <React.Fragment key={`${col}-${i}`}>
                                        <th className="bg-white p-2 text-center text-[11px] uppercase font-extrabold text-stone-700 tracking-widest w-28 border-r border-b border-stone-100">Valor</th>
                                        <th className="bg-white p-2 text-center text-[11px] uppercase font-extrabold text-stone-700 tracking-widest w-20 border-r border-b border-stone-200">Qtd</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Table Body Wrapper */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-stone-400 flex-col gap-4">
                            <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-800 animate-spin"></div>
                            <span className="text-xs uppercase tracking-widest font-mono animate-pulse">Carregando Matriz...</span>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center text-red-500 px-6 text-center text-sm font-medium">
                            {error}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-500 text-sm">
                            Nenhum registro encontrado para o período ou filtros.
                        </div>
                    ) : (
                        <table className="w-full text-left font-sans text-xs border-collapse">
                            <tbody>
                                {pivotedData.rows.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-stone-50/80 group">
                                        <td className="p-3 sticky left-0 z-10 bg-white group-hover:bg-stone-50/80 border-b border-r border-stone-200 truncate max-w-[300px] min-w-[300px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                                <span className="font-bold text-stone-900 uppercase tracking-tight" title={row.nome}>{row.nome}</span>
                                            </div>
                                        </td>
                                        {pivotedData.columns.map(col => {
                                            const cell = row.months[col];
                                            return (
                                                <React.Fragment key={`${row.id}-${col}`}>
                                                    <td className="p-2 text-right border-b border-r border-stone-200 text-stone-900 font-semibold min-w-[112px]">
                                                        {cell && cell.valor > 0 ? formatCurrency(cell.valor) : <span className="text-stone-300 font-normal">-</span>}
                                                    </td>
                                                    <td className="p-2 text-center border-b border-r border-stone-200 text-stone-600 font-medium min-w-[80px]">
                                                        {cell && cell.quantidade > 0 ? cell.quantidade.toLocaleString('pt-BR') : <span className="text-stone-300 font-normal">-</span>}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
