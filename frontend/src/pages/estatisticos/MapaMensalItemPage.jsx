import { useState, useEffect, useCallback, useMemo, memo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Factory, User, Calendar, BarChart3, ChevronRight, PackageSearch } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

// Componente de célula otimizado com memo
const DataCell = memo(({ value, isSelected, onClick, className = "" }) => {
    return (
        <TableCell
            className={`py-2 px-3 text-right transition-all duration-200 cursor-pointer border-r border-stone-200 last:border-r-0 ${isSelected
                ? 'bg-emerald-600 text-white font-bold ring-2 ring-inset ring-emerald-600 z-10'
                : value !== '0' && value !== 0
                    ? 'text-stone-950 font-bold hover:bg-stone-100/50'
                    : 'text-stone-300 hover:bg-stone-50/50'
                } ${className}`}
            onClick={onClick}
        >
            <span className="text-[13px] font-mono tabular-nums tracking-tight">
                {value ?? '0'}
            </span>
        </TableCell>
    );
});

DataCell.displayName = 'DataCell';

export default function MapaMensalItemPage() {
    // --- State ---
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(String(currentYear));
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("ALL")
    const [useGrupo, setUseGrupo] = useState(false)

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
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
                toast.error("Erro ao carregar filtros auxiliares")
            }
        }
        loadAux()
    }, [])

    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

    const loadData = async () => {
        if (!selectedIndustria) {
            toast.warning("Selecione um fabricante primeiro");
            return;
        }
        setLoading(true)
        setData([]) 
        try {
            const params = {
                ano: selectedYear,
                industria: selectedIndustria,
                cliente: selectedCliente,
                grupo: useGrupo
            }
            const res = await axios.get('/reports/mapa-item-mensal', { params })
            setData(res.data.data || [])
            if (res.data.data.length === 0) {
                toast.info("Nenhum dado encontrado para o filtro selecionado")
            } else {
                toast.success(`${res.data.data.length} itens processados`)
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar mapa mensal")
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Não há dados para exportar")
            return
        }

        const headers = ["CÓDIGO", "DESCRIÇÃO", "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ", "TOTAL"]
        const exportData = data.map(item => [
            item.codigo,
            item.descricao,
            item.mes_01,
            item.mes_02,
            item.mes_03,
            item.mes_04,
            item.mes_05,
            item.mes_06,
            item.mes_07,
            item.mes_08,
            item.mes_09,
            item.mes_10,
            item.mes_11,
            item.mes_12,
            item.total_ano
        ])

        const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mapa Mensal")
        XLSX.writeFile(wb, `Mapa_Mensal_Itens_${selectedYear}.xlsx`)
        toast.success("Exportação concluída")
    }

    const mesesLabels = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]

    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1.5 focus:bg-stone-50">
            <div className="mt-0.5 bg-stone-100 p-1.5 rounded-md text-stone-600">
                {icon}
            </div>
            <div className="flex flex-col text-left">
                <span className="font-sans font-semibold text-stone-800 text-sm leading-tight tracking-tight">{title}</span>
                <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-widest uppercase">{subtitle}</span>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F9F8F6] flex flex-col relative overflow-hidden">
            {/* Header Decorator */}
            <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-stone-200/40 to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 rotate-1 transform hover:rotate-3 transition-transform duration-300">
                        <BarChart3 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter text-stone-900 uppercase">
                                Mapa Mensal de Itens
                            </h1>
                            <ClosePageButton />
                        </div>
                        <p className="text-stone-500 font-medium text-xs uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            Análise Quantitativa SKU por Mês <ChevronRight className="w-3 h-3" /> {selectedYear}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-emerald-100 hover:bg-emerald-200 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all text-emerald-800 shadow-sm border border-emerald-200 active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export .xlsx
                    </button>
                </div>
            </header>

            {/* Filters */}
            <section className="px-6 py-8 border-b border-stone-300 bg-white/60 relative z-40 backdrop-blur-sm">
                <div className="grid grid-cols-12 gap-6 items-end max-w-[1600px] mx-auto">
                    {/* Ano */}
                    <div className="col-span-12 md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Ano Base
                        </Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="bg-white border-stone-300 text-stone-900 shadow-sm h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-stone-200">
                                {years.map(y => (
                                    <SelectItem key={y} value={y} className="font-mono">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Indústria */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <Factory className="w-3.5 h-3.5" /> Fabricante <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                            <SelectTrigger className="bg-white border-stone-300 text-stone-900 shadow-sm h-11">
                                <SelectValue placeholder="Selecione o Fabricante" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[400px]">
                                {industrias.map(ind => (
                                    <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                        {renderSelectItem(<Factory className="w-4 h-4" />, ind.for_nomered, `ID: ${ind.for_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Ponto de Venda
                        </Label>
                        <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                            <SelectTrigger className="bg-white border-stone-300 text-stone-900 shadow-sm h-11">
                                <SelectValue placeholder="Todos os PDVs" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[400px]">
                                <SelectItem value="ALL" className="font-semibold text-stone-500 py-3">CONSIDERAR TODOS</SelectItem>
                                {clientes.map(c => (
                                    <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                        {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred || c.cli_nome, `ID: ${c.cli_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Controls */}
                    <div className="col-span-12 md:col-span-2 lg:col-span-4 flex items-center gap-4 h-11">
                        <div
                            onClick={() => setUseGrupo(!useGrupo)}
                            className="flex items-center gap-3 cursor-pointer group bg-stone-100/50 hover:bg-stone-100 p-2 text-stone-700 rounded-full border border-stone-200 transition-all px-4 flex-1 h-full max-w-[200px]"
                        >
                            <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${useGrupo ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${useGrupo ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <Label className="text-[11px] font-bold cursor-pointer select-none tracking-tight">
                                Grupo de Lojas
                            </Label>
                        </div>

                        <Button
                            onClick={loadData}
                            disabled={loading}
                            className={`h-11 px-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : "Processar"}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Table Area */}
            <main className="flex-1 p-6 relative z-10 overflow-hidden flex flex-col">
                <Card className="flex-1 border-stone-300 shadow-2xl overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-t-white flex flex-col">
                    <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                        {loading && (
                            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-stone-100 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-t-stone-900 rounded-full animate-spin absolute top-0 left-0"></div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-stone-900 font-bold tracking-widest uppercase text-[10px]">Gerando Relatório</span>
                                    <span className="text-stone-400 text-xs italic">Isolando dados por SKU e Mês...</span>
                                </div>
                            </div>
                        )}

                        {!loading && data.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-stone-300 select-none">
                                <PackageSearch className="w-20 h-20 opacity-10" />
                                <div className="flex flex-col items-center text-center px-6">
                                    <p className="text-sm font-semibold text-stone-400">Nenhum dado para exibir no momento.</p>
                                    <p className="text-[10px] uppercase tracking-widest mt-2">Escolha uma indústria e clique em processar</p>
                                </div>
                            </div>
                        )}

                        {!loading && data.length > 0 && (
                            <div className="flex-1 overflow-auto bg-white/50 scrollbar-thin scrollbar-thumb-stone-200">
                                <Table className="relative min-w-[1400px]">
                                    <TableHeader className="bg-stone-900 sticky top-0 z-50">
                                        <TableRow className="border-none hover:bg-stone-900 h-12">
                                            <TableHead className="w-[120px] text-white font-mono text-[10px] uppercase tracking-[0.2em] px-4 sticky left-0 z-50 bg-stone-900 border-r border-white/10">Cód</TableHead>
                                            <TableHead className="w-[300px] text-white font-mono text-[10px] uppercase tracking-[0.2em] px-4 sticky left-[120px] z-50 bg-stone-900 border-r border-white/10">Descrição Item</TableHead>
                                            
                                            {mesesLabels.map(mes => (
                                                <TableHead key={mes} className="text-white font-mono text-[10px] uppercase tracking-[0.2em] px-2 text-center border-r border-white/10 min-w-[80px]">
                                                    {mes}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-white font-mono text-[10px] uppercase tracking-[0.2em] px-4 text-right bg-emerald-900/50 min-w-[100px]">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, rowIdx) => (
                                            <TableRow key={row.codigo} className="h-10 hover:bg-stone-50 group border-b border-stone-100 last:border-0 transition-colors">
                                                <TableCell className="px-4 py-2 text-[11px] font-mono font-bold text-stone-500 sticky left-0 z-30 bg-white group-hover:bg-stone-50 border-r border-stone-200">
                                                    {row.codigo}
                                                </TableCell>
                                                <TableCell className="px-4 py-2 text-[11px] font-bold text-stone-900 uppercase truncate sticky left-[120px] z-30 bg-white group-hover:bg-stone-50 border-r border-stone-200" title={row.descricao}>
                                                    {row.descricao}
                                                </TableCell>
                                                
                                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                                                    const key = `mes_${String(m).padStart(2, '0')}`;
                                                    const val = row[key];
                                                    return (
                                                        <DataCell 
                                                            key={key} 
                                                            value={val} 
                                                            isSelected={selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === m}
                                                            onClick={() => setSelectedCell({ rowIdx, colIdx: m })}
                                                        />
                                                    )
                                                })}

                                                <TableCell className="px-4 py-2 text-[13px] font-mono font-black text-right text-emerald-700 bg-emerald-50/30 group-hover:bg-emerald-50 transition-colors">
                                                    {row.total_ano}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    
                    {/* Summary Footer */}
                    {data.length > 0 && (
                        <div className="bg-stone-100/80 px-6 py-4 flex items-center justify-between border-t border-stone-200 relative z-20">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                                <PackageSearch className="w-4 h-4" /> SKU's Ativos: {data.length}
                            </span>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Consolidado Anual</span>
                                    <span className="text-xl font-black text-stone-900 tabular-nums">
                                        {data.reduce((acc, row) => acc + (parseInt(row.total_ano) || 0), 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    )
}
