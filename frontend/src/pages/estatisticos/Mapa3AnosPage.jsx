import { useState, useEffect, useCallback, useMemo, memo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User, Calendar, TrendingUp } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

// Componente de célula otimizado (Compacto)
const DataCell = memo(({ value, isSelected, onClick }) => {
    return (
        <TableCell
            className={`py-1 px-2 text-xs text-right font-mono font-semibold cursor-pointer border-r border-slate-200 ${isSelected
                ? 'bg-blue-200 text-blue-900 border-2 border-blue-600 z-10'
                : value
                    ? 'text-blue-700 hover:bg-blue-50'
                    : 'text-slate-300 hover:bg-slate-50'
                }`}
            onClick={onClick}
        >
            {value || '-'}
        </TableCell>
    );
});

DataCell.displayName = 'DataCell';

export default function Mapa3AnosPage() {
    const currentYear = new Date().getFullYear();
    const [anoBase, setAnoBase] = useState(currentYear.toString())
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("ALL")
    const [modo, setModo] = useState("valor")
    const [categoria, setCategoria] = useState("mes")

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [totais, setTotais] = useState({})
    const [anos, setAnos] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedCell, setSelectedCell] = useState(null)

    // Load Dropdowns
    useEffect(() => {
        const loadAux = async () => {
            try {
                // Carregar Indústrias
                const indRes = await axios.get('/suppliers')
                console.log("🔹 [Mapa3Anos] Indústrias carregadas:", indRes.data)
                setIndustrias(indRes.data.data || [])

                // Carregar Clientes
                const cliRes = await axios.get('/aux/clientes')
                console.log("🔹 [Mapa3Anos] Clientes carregados:", cliRes.data)
                setClientes(cliRes.data.data || [])
            } catch (error) {
                console.error('Erro ao carregar filtros:', error)
                toast.error("Erro ao carregar opções de filtro")
            }
        }
        loadAux()
    }, [])

    // Load Data
    useEffect(() => {
        if (!selectedIndustria) {
            setData([])
            return
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await axios.get('/reports/mapa-3-anos', {
                    params: { anoBase, industria: selectedIndustria, cliente: selectedCliente, modo, categoria }
                })
                if (res.data.success) {
                    setData(res.data.data || [])
                    setTotais(res.data.totais || {})
                    setAnos(res.data.anos || [])
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error)
                toast.error("Erro ao carregar relatório")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [anoBase, selectedIndustria, selectedCliente, modo, categoria])

    // Keyboard Navigation
    const handleKeyDown = useCallback((e) => {
        if (!selectedCell || data.length === 0) return;
        const { rowIdx, colIdx } = selectedCell;
        const maxRow = data.length - 1;
        const maxCol = 2; // 3 anos (indices 0, 1, 2)

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
    }, [selectedCell, data.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Helpers
    const formatNumber = useMemo(() => {
        const formatter = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: modo === 'valor' ? 2 : 0,
            maximumFractionDigits: modo === 'valor' ? 2 : 0
        });
        return (val) => formatter.format(val || 0);
    }, [modo]);

    const handleCellClick = useCallback((rowIdx, colIdx) => {
        setSelectedCell({ rowIdx, colIdx });
    }, []);

    // Export Excel
    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        const labelCol = categoria === 'mes' ? 'MÊS' : 'CÓDIGO';
        const headers = [labelCol, ...anos.map(a => a.toString())]
        const rows = data.map(row => [row.chave, ...anos.map(ano => row[`ano_${ano}`] || 0)])
        rows.push(['TOTAL', ...anos.map(ano => totais[`ano_${ano}`] || 0)])

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mapa 3 Anos")
        XLSX.writeFile(wb, `Mapa_3_Anos_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado com sucesso!")
    }

    const anosDisponiveis = Array.from({ length: 5 }, (_, i) => currentYear - i)

    // Standard Select Item Render (from PivotReportPage)
    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400">
                {icon}
            </div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{subtitle}</span>
            </div>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header / Filters - STANDARD STYLE */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-20">
                <div className="flex flex-col gap-4">
                    {/* Top Row: Title + Main Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Calendar className="text-blue-600 w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-800">Mapa 3 Anos</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">| Relatórios Estatísticos</span>
                                <ClosePageButton />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                                <Download className="w-4 h-4" /> Exportar Excel
                            </Button>
                        </div>
                    </div>

                    {/* Filters Row - MODERN CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">

                        {/* Ano Base */}
                        <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ano Base</Label>
                            <Select value={anoBase} onValueChange={setAnoBase}>
                                <SelectTrigger className="h-10 bg-white shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {anosDisponiveis.map(ano => (
                                        <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Indústria */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 relative z-30">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indústria <span className="text-red-500">*</span></Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className={`h-10 bg-white shadow-sm ${!selectedIndustria ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cód: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cliente */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 relative z-20">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</Label>
                            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                                <SelectTrigger className="h-10 bg-white shadow-sm">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={c.cli_codigo.toString()}>
                                            {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred, `Cód: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Modo (Segmented Control - STANDARD) */}
                        <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros</Label>
                            <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                <button
                                    onClick={() => setModo('valor')}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all flex-1 ${modo === 'valor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    VALOR
                                </button>
                                <button
                                    onClick={() => setModo('quantidade')}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all flex-1 ${modo === 'quantidade' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    QTD
                                </button>
                            </div>
                        </div>

                        {/* Categoria (Segmented Control - STANDARD) */}
                        <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</Label>
                            <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                <button
                                    onClick={() => setCategoria('mes')}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all flex-1 ${categoria === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    MÊS
                                </button>
                                <button
                                    onClick={() => setCategoria('codigo')}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all flex-1 ${categoria === 'codigo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    CÓDIGO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area (Compact) */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg relative overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-3">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-slate-500 animate-pulse">Carregando dados...</span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-slate-400">
                                <span className="text-4xl">📊</span>
                                <span className="text-sm">Selecione uma indústria para ver os dados</span>
                            </div>
                        ) : (
                            <div className="overflow-auto h-full w-full">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10">
                                        <TableRow className="bg-slate-700 hover:bg-slate-700">
                                            <TableHead className="text-white font-bold text-xs py-1 px-2 sticky left-0 bg-slate-700 z-20 border-r border-slate-600">
                                                {categoria === 'mes' ? 'MÊS' : 'CÓDIGO'}
                                            </TableHead>
                                            {anos.map((ano, idx) => (
                                                <TableHead
                                                    key={idx}
                                                    className={`text-white font-bold text-xs py-1 px-2 text-right min-w-[100px] border-r border-slate-600 ${selectedCell?.colIdx === idx ? 'bg-blue-600' : ''
                                                        }`}
                                                >
                                                    {ano}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, rowIdx) => (
                                            <TableRow key={rowIdx} className="hover:bg-blue-50/50 border-b border-slate-200 h-7">
                                                <TableCell
                                                    className={`py-1 px-2 text-xs font-bold text-slate-700 sticky left-0 z-10 cursor-pointer border-r border-slate-200 ${selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === -1
                                                        ? 'bg-blue-100 border-2 border-blue-500'
                                                        : 'bg-slate-50 hover:bg-slate-100'
                                                        }`}
                                                    onClick={() => handleCellClick(rowIdx, -1)}
                                                >
                                                    {row.chave}
                                                </TableCell>
                                                {anos.map((ano, colIdx) => (
                                                    <DataCell
                                                        key={colIdx}
                                                        value={formatNumber(row[`ano_${ano}`])}
                                                        isSelected={selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === colIdx}
                                                        onClick={() => handleCellClick(rowIdx, colIdx)}
                                                    />
                                                ))}
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-blue-100 border-t-2 border-blue-600 font-bold h-8">
                                            <TableCell className="py-1 px-2 text-xs font-bold text-slate-800 sticky left-0 bg-blue-100 z-10 border-r border-blue-300">
                                                TOTAL
                                            </TableCell>
                                            {anos.map((ano, idx) => (
                                                <TableCell key={idx} className="py-1 px-2 text-xs text-right font-bold text-blue-900 font-mono border-r border-blue-300">
                                                    {formatNumber(totais[`ano_${ano}`])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
