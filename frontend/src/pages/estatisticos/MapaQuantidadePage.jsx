import { useState, useEffect, useCallback, useMemo, memo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

// Componente de célula otimizado com memo
const DataCell = memo(({ value, isSelected, onClick }) => {
    return (
        <TableCell
            className={`py-1 px-2 text-xs text-center font-mono font-semibold cursor-pointer ${isSelected
                ? 'bg-blue-200 text-blue-900 border-2 border-blue-600'
                : value
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-slate-300 hover:bg-slate-50'
                }`}
            onClick={onClick}
        >
            {value || '-'}
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

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [columns, setColumns] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedCell, setSelectedCell] = useState(null) // { rowIdx, colIdx }

    // --- Load Dropdowns ---
    useEffect(() => {
        const loadAux = async () => {
            try {
                const resInd = await axios.get('/suppliers')
                setIndustrias(resInd.data?.data || [])

                const resCli = await axios.get('/aux/clientes')
                setClientes(resCli.data?.data || [])
            } catch (error) {
                console.error("Erro ao carregar filtros:", error)
            }
        }
        loadAux()
    }, [])

    // --- Load Data ---
    useEffect(() => {
        if (!selectedIndustria) {
            setData([])
            setColumns([])
            return
        }
        loadData()
    }, [startDate, endDate, selectedIndustria, selectedCliente])

    const loadData = async () => {
        setLoading(true)
        try {
            const params = {
                start: startDate,
                end: endDate,
                industria: selectedIndustria,
                cliente: selectedCliente
            }
            const res = await axios.get('/reports/mapa-quantidade', { params })
            setData(res.data.data || [])
            setColumns(res.data.columns || [])
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

    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400">
                {icon}
            </div>
            <div className="flex flex-col text-left">
                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm leading-tight">{title}</span>
                {subtitle && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{subtitle}</span>}
            </div>
        </div>
    )

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        const headers = ['Produto', ...columns.map(c => c.label)]
        const rows = data.map(row => [
            row.produto,
            ...columns.map(c => row[c.key] || 0)
        ])

        const sheetData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        ws['!cols'] = [{ wch: 20 }, ...columns.map(() => ({ wch: 12 }))]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mapa Quantidade")
        XLSX.writeFile(wb, `Mapa_Quantidade_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado com sucesso!")
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header / Filters */}
            <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <ClosePageButton />
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mapa de Quantidade</h1>
                        <p className="text-xs text-slate-500">Produtos × Clientes</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Download className="w-4 h-4" /> Exportar Excel
                    </Button>
                </div>

                <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Periodo */}
                    <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</Label>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-md border border-slate-200 shadow-sm">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium" />
                            <span className="text-slate-300">→</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium" />
                        </div>
                    </div>

                    {/* Indústria */}
                    <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 relative z-30">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indústria <span className="text-red-500">*</span></Label>
                        <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                            <SelectTrigger className={`h-10 bg-white shadow-sm ${!selectedIndustria ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {industrias.map(ind => (
                                    <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                        {renderSelectItem(<Factory className="w-4 h-4" />, ind.for_nomered, `Cód: ${ind.for_codigo}`)}
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
                                    <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                        {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred || c.cli_nome, `Cód: ${c.cli_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0 flex-1 overflow-auto">
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
                                            <TableHead className="text-white font-bold text-xs py-1 px-2 sticky left-0 bg-slate-700 z-20">Produto</TableHead>
                                            {columns.map((col, idx) => (
                                                <TableHead
                                                    key={idx}
                                                    className={`text-white font-bold text-xs py-1 px-2 text-center min-w-[100px] ${selectedCell?.colIdx === idx ? 'bg-blue-600' : ''
                                                        }`}
                                                >
                                                    {col.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, rowIdx) => (
                                            <TableRow key={rowIdx} className="hover:bg-blue-50/50 border-b border-slate-100">
                                                <TableCell
                                                    className={`py-1.5 px-3 text-xs font-medium text-slate-700 sticky left-0 z-10 cursor-pointer ${selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === -1
                                                        ? 'bg-blue-100 border-2 border-blue-500'
                                                        : 'bg-white hover:bg-slate-100'
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
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
