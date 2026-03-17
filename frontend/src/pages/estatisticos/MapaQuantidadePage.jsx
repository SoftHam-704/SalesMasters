import { useState, useEffect, useCallback, useMemo, memo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Factory, User, Users, Calendar, ArrowRight, ChevronRight } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

// Componente de célula otimizado com memo
const DataCell = memo(({ value, isSelected, onClick }) => {
    return (
        <TableCell
            className={`py-2 px-3 text-center transition-all duration-200 cursor-pointer border-r border-stone-200 last:border-r-0 ${isSelected
                ? 'bg-stone-900 text-white font-bold ring-2 ring-inset ring-stone-900 z-10'
                : value
                    ? 'text-stone-950 font-bold hover:bg-stone-100/50'
                    : 'text-stone-300 hover:bg-stone-50/50'
                }`}
            onClick={onClick}
        >
            <span className="text-[14px] font-mono tabular-nums tracking-tight">
                {value || '-'}
            </span>
        </TableCell>
    );
});

DataCell.displayName = 'DataCell';

export default function MapaQuantidadePage() {
    // --- State ---
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setMonth(0); d.setDate(1);
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("ALL")
    const [useGrupo, setUseGrupo] = useState(false)

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [columns, setColumns] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedCell, setSelectedCell] = useState(null)

    // --- Load Aux Data (Only once) ---
    useEffect(() => {
        const loadAux = async () => {
            try {
                const [resInd, resCli] = await Promise.all([
                    axios.get('/suppliers'),
                    axios.get('/aux/clientes')
                ]);
                setIndustrias(resInd.data?.data || []);
                setClientes(resCli.data?.data || []);
            } catch (error) {
                console.error("Erro ao carregar filtros:", error)
            }
        }
        loadAux()
    }, [])

    // Memoized Select Items to prevent "remounting" flickering
    const industriaOptions = useMemo(() => industrias.map(ind => (
        <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)} className="focus:bg-stone-50 cursor-pointer">
            <div className="flex items-start gap-3 py-1.5">
                <div className="mt-0.5 bg-stone-100 p-1.5 rounded-md text-stone-600">
                    <Factory className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="font-sans font-semibold text-stone-800 text-sm leading-tight tracking-tight">{ind.for_nomered}</span>
                    <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-widest uppercase">ID: {ind.for_codigo}</span>
                </div>
            </div>
        </SelectItem>
    )), [industrias]);

    const clienteOptions = useMemo(() => clientes.map(c => (
        <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
            <div className="flex items-start gap-3 py-1.5 focus:bg-stone-50">
                <div className="mt-0.5 bg-stone-100 p-1.5 rounded-md text-stone-600">
                    <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="font-sans font-semibold text-stone-800 text-sm leading-tight tracking-tight">{c.cli_nomred || c.cli_nome}</span>
                    <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-widest uppercase">ID: {c.cli_codigo}</span>
                </div>
            </div>
        </SelectItem>
    )), [clientes]);

    const loadData = async () => {
        if (!selectedIndustria) {
            toast.warning("Selecione um fabricante primeiro");
            return;
        }
        setLoading(true)
        setData([]) // Clear previous data to show loading state
        try {
            const params = {
                start: startDate,
                end: endDate,
                industria: selectedIndustria,
                cliente: selectedCliente,
                grupo: useGrupo
            }
            const res = await axios.get('/reports/mapa-quantidade', { params })
            setData(res.data.data || [])
            setColumns(res.data.columns || [])
            toast.success("Dados processados")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    // --- Keyboard Navigation ---
    const handleKeyDown = useCallback((e) => {
        if (!selectedCell || data.length === 0) return;

        const { rowIdx, colIdx } = selectedCell;
        const maxRow = data.length - 1;
        const maxCol = columns.length - 1;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setSelectedCell({ rowIdx: Math.max(0, rowIdx - 1), colIdx });
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedCell({ rowIdx: Math.min(maxRow, rowIdx + 1), colIdx });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setSelectedCell({ rowIdx, colIdx: Math.max(-1, colIdx - 1) });
                break;
            case 'ArrowRight':
                e.preventDefault();
                setSelectedCell({ rowIdx, colIdx: Math.min(maxCol, colIdx + 1) });
                break;
        }
    }, [selectedCell, data.length, columns.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // --- Helpers ---
    const formatNumber = useMemo(() => {
        const formatter = new Intl.NumberFormat('pt-BR');
        return (val) => formatter.format(val || 0);
    }, []);

    const handleCellClick = useCallback((rowIdx, colIdx) => {
        setSelectedCell({ rowIdx, colIdx });
    }, []);

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }
        const headers = ['Produto', ...columns.map(c => c.label)]
        const rows = data.map(row => [row.produto, ...columns.map(c => row[c.key] || 0)])
        const sheetData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        ws['!cols'] = [{ wch: 25 }, ...columns.map(() => ({ wch: 15 }))]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mapa Quantidade")
        XLSX.writeFile(wb, `Mapa_Quantidade_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado!")
    }

    return (
        <div className="h-full flex flex-col bg-[#F3F4F1] overflow-hidden font-sans selection:bg-stone-800 selection:text-white">
            {/* NOISE OVERLAY */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>

            {/* Header / Brand */}
            <header className="relative z-50 bg-white border-b border-stone-300 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <ClosePageButton />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-display font-bold tracking-tighter text-stone-900 leading-none">
                            Mapa de Quantidade
                        </h1>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mt-1">
                            Reports <span className="text-stone-300">/</span> Business Intelligence <span className="text-stone-300">/</span> Matrix v2
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="btn-beam-green px-1 py-1 rounded-full group active:scale-95 transition-transform"
                    >
                        <span
                            className="btn-beam-content-green px-6 py-2 bg-emerald-100 group-hover:bg-emerald-200 rounded-full text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-colors text-emerald-800 font-bold"
                        >
                            <Download className="w-4 h-4" /> Export .xlsx
                        </span>
                    </button>
                </div>
            </header>

            {/* Filters Section */}
            <section className="px-6 py-8 border-b border-stone-300 bg-white/60 relative z-40">
                <div className="grid grid-cols-12 gap-6 items-end max-w-[1600px] mx-auto">
                    {/* Periodo */}
                    <div className="col-span-12 lg:col-span-3 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Período
                        </Label>
                        <div className="flex items-center gap-0 bg-white rounded-md border border-stone-300 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent px-3 py-2.5 text-sm outline-none w-full font-medium text-stone-700"
                            />
                            <div className="px-1 text-stone-300">—</div>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent px-3 py-2.5 text-sm outline-none w-full font-medium text-stone-700"
                            />
                        </div>
                    </div>

                    {/* Indústria */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <Factory className="w-3.5 h-3.5" /> Fabricante <span className="text-red-500 text-lg leading-none">*</span>
                        </Label>
                        <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                            <SelectTrigger className="bg-white border-stone-300 text-stone-900 shadow-sm focus:ring-stone-900/10 h-11 transition-all">
                                <SelectValue placeholder="Selecione o Fabricante" />
                            </SelectTrigger>
                            <SelectContent className="border-stone-200 shadow-2xl max-h-[400px]">
                                {industriaOptions}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Ponto de Venda
                        </Label>
                        <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                            <SelectTrigger className="bg-white border-stone-300 text-stone-900 shadow-sm h-11 transition-all">
                                <SelectValue placeholder="Todos os PDVs" />
                            </SelectTrigger>
                            <SelectContent className="border-stone-200 shadow-2xl max-h-[400px]">
                                <SelectItem value="ALL" className="font-semibold text-stone-500 py-3">CONSIDERAR TODOS</SelectItem>
                                {clienteOptions}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Checkbox Grupo & Processar - Orbital Beam Effect */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 flex items-center justify-between gap-4 h-11">
                        <div
                            onClick={() => setUseGrupo(!useGrupo)}
                            className="flex items-center gap-3 cursor-pointer group bg-stone-100/50 hover:bg-stone-100 p-2 text-stone-700 rounded-full border border-stone-200 transition-all px-4 flex-1 h-full"
                        >
                            <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${useGrupo ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${useGrupo ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <Label className="text-[11px] font-bold cursor-pointer select-none tracking-tight">
                                Grupo de Lojas
                            </Label>
                        </div>

                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="btn-beam px-[1.5px] py-[1.5px] rounded-full group active:scale-95 transition-transform"
                        >
                            <span
                                className="btn-beam-content px-8 py-3 bg-stone-900 group-hover:bg-stone-800 rounded-full text-sm font-mono uppercase tracking-[0.2em] flex items-center gap-2 transition-colors font-semibold"
                                style={{ color: 'white' }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white' }}></div>
                                        Processing
                                    </>
                                ) : (
                                    'PROCESSAR'
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Table Area */}
            <main className="flex-1 overflow-hidden p-6 relative">
                {/* GRID BACKGROUND PATTERN */}
                <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none"></div>

                <div className="h-full bg-white rounded-xl shadow-2xl shadow-stone-400/20 border border-stone-200 relative flex flex-col overflow-hidden transition-all duration-700">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700 animate-pulse"></div>
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <span className="text-[12px] font-mono uppercase tracking-[0.4em] text-emerald-600 block animate-pulse">Computing Data</span>
                                    <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">Generating Quantities Matrix</span>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full text-stone-300 py-20">
                                <iconify-icon icon="solar:chart-square-bold-duotone" class="text-8xl text-stone-100 mb-6"></iconify-icon>
                                <div className="text-center max-w-sm">
                                    <p className="font-display text-2xl font-bold tracking-tight text-stone-900 mb-2">Relatório Pronto para Processar</p>
                                    <p className="text-sm font-sans text-stone-500 leading-relaxed">Selecione o fabricante e clique em **Processar** para carregar o mapa de quantidades.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                <Table className="border-collapse">
                                    <TableHeader className="sticky top-0 z-30 shadow-md">
                                        <TableRow className="bg-stone-900 hover:bg-stone-900 border-none">
                                            <TableHead className="w-[300px] min-w-[200px] text-stone-400 font-mono text-[11px] uppercase tracking-widest py-4 px-6 sticky left-0 bg-stone-900 z-40 border-r border-stone-800">
                                                Identificação do Produto
                                            </TableHead>
                                            {columns.map((col, idx) => (
                                                <TableHead
                                                    key={idx}
                                                    className={`text-white font-sans font-bold text-[12px] py-4 px-4 text-center min-w-[150px] border-r border-stone-800 last:border-r-0 tracking-tight ${selectedCell?.colIdx === idx ? 'bg-emerald-600' : ''
                                                        }`}
                                                >
                                                    {col.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, rowIdx) => (
                                            <TableRow key={rowIdx} className="hover:bg-emerald-50/30 border-b border-stone-100 transition-colors group">
                                                <TableCell
                                                    className={`py-3 px-6 text-sm font-bold tracking-tight sticky left-0 z-20 transition-all border-r border-stone-200 shadow-sm ${selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === -1
                                                        ? 'bg-stone-900 text-white'
                                                        : 'bg-white text-stone-600 group-hover:bg-stone-50'
                                                        }`}
                                                    onClick={() => handleCellClick(rowIdx, -1)}
                                                >
                                                    {row.produto}
                                                </TableCell>
                                                {columns.map((col, colIdx) => (
                                                    <DataCell
                                                        key={colIdx}
                                                        value={row[col.key] ? formatNumber(row[col.key]) : null}
                                                        isSelected={selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === colIdx}
                                                        onClick={() => handleCellClick(rowIdx, colIdx)}
                                                    />
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info / Cell Details - Enhanced CRM Style */}
                {selectedCell && !loading && data.length > 0 && (
                    <div className="absolute bottom-12 left-12 right-12 flex justify-center pointer-events-none">
                        <div className="bg-white text-stone-900 px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-8 pointer-events-auto border border-stone-200 animate-in zoom-in-95 fade-in duration-300 backdrop-blur-md">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold tracking-wider mb-0.5">Ref Produto</span>
                                <span className="text-base font-bold tracking-tight text-stone-950">{data[selectedCell.rowIdx].produto}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold tracking-wider mb-0.5">Unidade / Cliente</span>
                                <span className="text-base font-bold tracking-tight text-stone-950">
                                    {selectedCell.colIdx === -1 ? 'Visão Geral' : columns[selectedCell.colIdx].label}
                                </span>
                            </div>
                            <div className="h-10 w-[1px] bg-stone-200 mx-2"></div>
                            <div className="flex flex-col items-center min-w-[80px]">
                                <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold tracking-wider mb-0.5">Total Qtd</span>
                                <span className="text-2xl font-display font-black leading-none text-emerald-600">
                                    {selectedCell.colIdx === -1
                                        ? columns.reduce((acc, col) => acc + (data[selectedCell.rowIdx][col.key] || 0), 0)
                                        : (data[selectedCell.rowIdx][columns[selectedCell.colIdx].key] || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 7px;
                    height: 7px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d6d3d1;
                    border-radius: 10px;
                    border: 1px solid #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a8a29e;
                }
                .bg-grid {
                    background-size: 40px 40px;
                    background-image:
                        linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
                }
                .font-display {
                    font-family: 'Space Grotesk', sans-serif;
                }

                /* BEAM BUTTON ANIMATION */
                @keyframes borderRotate {
                    100% {
                        background-position: 0% 50%;
                    }
                }

                .btn-beam {
                    position: relative;
                    z-index: 10;
                    overflow: hidden;
                }

                .btn-beam::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    z-index: -1;
                    background: conic-gradient(from 90deg at 50% 50%, #E2E8F0 0%, #000000 50%, #E2E8F0 100%);
                    animation: spin 4s linear infinite;
                    border-radius: inherit;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .btn-beam:hover::before {
                    opacity: 1;
                }

                .btn-beam-content {
                    background-color: #1c1917;
                    color: white;
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-beam-green {
                    position: relative;
                    z-index: 10;
                    overflow: hidden;
                }
                .btn-beam-green::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    z-index: -1;
                    background: conic-gradient(from 90deg at 50% 50%, #dcfce7 0%, #15803d 50%, #dcfce7 100%);
                    animation: spin 4s linear infinite;
                    border-radius: inherit;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .btn-beam-green:hover::before {
                    opacity: 1;
                }
                .btn-beam-content-green {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(22, 101, 52, 0.1);
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
