import React, { useState, useEffect } from 'react';
import {
    Printer,
    Download,
    Mail,
    X,
    Filter,
    Users,
    Building2,
    MapPin,
    UserCheck,
    Calendar,
    Search,
    ChevronDown,
    Check
} from 'lucide-react';
import { BlobProvider } from '@react-pdf/renderer';
import CustomerSelectablePdf from './CustomerSelectablePdf';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTabs } from '@/contexts/TabContext';
import { getApiUrl } from '@/utils/apiConfig';
import { toast } from 'sonner';

const filterModes = [
    { id: 'region', label: 'Por região', icon: MapPin },
    { id: 'city', label: 'Por cidade', icon: Building2 },
    { id: 'seller', label: 'Por vendedor', icon: Users },
    { id: 'period', label: 'Compraram no período', icon: Calendar },
    { id: 'state', label: 'Por estado', icon: MapPin },
    { id: 'all', label: 'Todos', icon: UserCheck },
    { id: 'area', label: 'Por área de atuação', icon: Filter },
    { id: 'industry', label: 'Por indústria', icon: Building2 },
];

const customerStatus = [
    { value: 'active', label: 'Clientes Ativos' },
    { value: 'inactive', label: 'Clientes Inativos' },
    { value: 'all', label: 'Todos os Clientes' },
];

const CustomerSelectablePage = () => {
    const { closeTab } = useTabs();
    const [mode, setMode] = useState('all');
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [companyData, setCompanyData] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Aux data
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [industries, setIndustries] = useState([]);

    // Filter values
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedSeller, setSelectedSeller] = useState('all');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedState, setSelectedState] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchAuxData();
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const res = await fetch(getApiUrl('/api/master/company-config'));
            const json = await res.json();
            if (json.success) setCompanyData(json.data);
        } catch (e) { console.error(e); }
    };

    const fetchAuxData = async () => {
        try {
            const [regRes, sellRes, areaRes, indRes] = await Promise.all([
                fetch(getApiUrl('/api/aux/regioes')).then(r => r.json()),
                fetch(getApiUrl('/api/aux/vendedores')).then(r => r.json()),
                fetch(getApiUrl('/api/aux/areas')).then(r => r.json()),
                fetch(getApiUrl('/api/aux/industrias')).then(r => r.json()),
            ]);

            if (regRes.success) setRegions(regRes.data);
            if (sellRes.success) setSellers(sellRes.data);
            if (areaRes.success) setAreas(areaRes.data);
            if (indRes.success) setIndustries(indRes.data);
        } catch (error) {
            console.error('Error fetching aux data:', error);
        }
    };

    const handleFetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                mode,
                status,
                region: selectedRegion,
                city: selectedCity,
                seller: selectedSeller,
                area: selectedArea,
                industry: selectedIndustry,
                state: selectedState,
                start: dateRange.start,
                end: dateRange.end
            });

            const response = await fetch(getApiUrl(`/api/reports/repcrm/selectable-customers?${params}`));
            const result = await response.json();

            if (result.success) {
                setCustomers(result.data);
                setSelectedIds(new Set(result.data.map(c => c.cli_codigo)));
            } else {
                toast.error(result.message || 'Erro ao buscar clientes');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erro na conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(new Set(customers.map(c => c.cli_codigo)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelectOne = (id, checked) => {
        const next = new Set(selectedIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const filteredCustomers = customers.filter(c =>
        c.cli_nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cli_codigo?.toString().includes(searchQuery) ||
        c.cli_nomred?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Users size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Relação de Clientes (Selecionável)</h1>
                        <p className="text-xs text-slate-500 font-medium">Gere listagens personalizadas de clientes</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => closeTab ? closeTab('/relatorios/clientes-selecionavel') : null} className="rounded-full hover:bg-red-50 hover:text-red-500">
                    <X size={20} />
                </Button>
            </header>

            <div className="flex flex-1 overflow-hidden p-6 gap-6">
                {/* Lateral Filters - Sidebar */}
                <aside className="w-72 flex flex-col gap-4 overflow-y-auto pr-2">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 px-4">
                            <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                                <Filter size={14} /> Filtros Principais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 pb-2 space-y-1">
                            {filterModes.map((fM) => (
                                <button
                                    key={fM.id}
                                    onClick={() => setMode(fM.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${mode === fM.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <fM.icon size={16} strokeWidth={mode === fM.id ? 2.5 : 2} />
                                    {fM.label}
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Dynamic Option Sub-Filter */}
                    {mode !== 'all' && (
                        <Card className="border-blue-200 bg-blue-50/30 overflow-hidden shadow-sm">
                            <CardHeader className="py-3 px-4 bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-[10px] font-black uppercase text-blue-600">
                                    Opções do Filtro
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {mode === 'region' && (
                                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                        <SelectTrigger className="bg-white border-blue-200">
                                            <SelectValue placeholder="Selecione a Região" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Regiões</SelectItem>
                                            {regions.map(r => <SelectItem key={r.reg_codigo} value={r.reg_codigo.toString()}>{r.reg_descricao}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}

                                {mode === 'city' && (
                                    <Input
                                        placeholder="Pesquisar cidade..."
                                        className="bg-white border-blue-200 h-10"
                                        onChange={(e) => {/* Implement city autocomplete or keep it simple */ }}
                                    />
                                )}

                                {mode === 'seller' && (
                                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                                        <SelectTrigger className="bg-white border-blue-200">
                                            <SelectValue placeholder="Selecione o Vendedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Vendedores</SelectItem>
                                            {sellers.map(v => <SelectItem key={v.ven_codigo} value={v.ven_codigo.toString()}>{v.ven_nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}

                                {mode === 'area' && (
                                    <Select value={selectedArea} onValueChange={setSelectedArea}>
                                        <SelectTrigger className="bg-white border-blue-200">
                                            <SelectValue placeholder="Área de Atuação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Áreas</SelectItem>
                                            {areas.map(a => <SelectItem key={a.atu_id} value={a.atu_id.toString()}>{a.atu_descricao}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}

                                {mode === 'industry' && (
                                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                        <SelectTrigger className="bg-white border-blue-200">
                                            <SelectValue placeholder="Selecione a Indústria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Indústrias</SelectItem>
                                            {industries.map(i => <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>{i.for_nomered}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}

                                {mode === 'period' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                                            <Input type="date" className="bg-white border-blue-200" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                                            <Input type="date" className="bg-white border-blue-200" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                                        </div>
                                    </div>
                                )}

                                <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 gap-2 h-11" onClick={handleFetchCustomers} disabled={loading}>
                                    <Search size={16} />
                                    {loading ? 'Buscando...' : 'Atualizar Lista'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {mode === 'all' && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 gap-2 h-11" onClick={handleFetchCustomers} disabled={loading}>
                            <Search size={16} />
                            {loading ? 'Buscando...' : 'Carregar Clientes'}
                        </Button>
                    )}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Toolbar for the list */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 max-w-2xl">
                            <div className="w-72">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="bg-white font-bold h-10">
                                        <SelectValue placeholder="Status do Cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customerStatus.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input
                                    placeholder="Pesquisar na lista (Nome, Código...)"
                                    className="pl-10 h-10 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-sm font-bold text-slate-500 whitespace-nowrap">
                            {selectedIds.size} de {filteredCustomers.length} selecionados
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white border-b border-slate-200 z-[5]">
                                <tr className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4 w-16 text-center">
                                        <Checkbox
                                            checked={selectedIds.size === customers.length && customers.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Imprimir?</th>
                                    <th className="px-4 py-4">Código</th>
                                    <th className="px-4 py-4">Cliente / Nome Fantasia</th>
                                    <th className="px-4 py-4">Cidade</th>
                                    <th className="px-4 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
                                            <p className="text-slate-400 font-bold">Buscando dados no servidor...</p>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic">
                                            Nenhum cliente encontrado com os filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.cli_codigo} className="hover:bg-blue-50/40 transition-colors group">
                                            <td className="px-6 py-3 text-center">
                                                <Checkbox
                                                    checked={selectedIds.has(customer.cli_codigo)}
                                                    onCheckedChange={(checked) => toggleSelectOne(customer.cli_codigo, checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {selectedIds.has(customer.cli_codigo) ? (
                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase ring-1 ring-emerald-200">
                                                            <Check size={10} /> Sim
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase ring-1 ring-slate-200">
                                                            Não
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{customer.cli_codigo}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-800 line-clamp-1">{customer.cli_nome}</span>
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase">{customer.cli_nomred || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[13px] text-slate-600 font-bold">{customer.cli_cidade}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-black text-slate-600 uppercase border border-slate-200">
                                                    {customer.cli_uf}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <footer className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="font-bold gap-2 text-slate-600 border-slate-200" onClick={() => closeTab ? closeTab('/relatorios/clientes-selecionavel') : null}>
                                <X size={16} /> Sair
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="font-bold gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Mail size={16} /> Enviar E-mail
                            </Button>

                            <BlobProvider document={
                                <CustomerSelectablePdf
                                    data={customers.filter(c => selectedIds.has(c.cli_codigo))}
                                    companyData={companyData}
                                    filterInfo={mode.toUpperCase()}
                                />
                            }>
                                {({ url, loading: pdfLoading }) => (
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-100 gap-2 h-11 px-8 rounded-xl"
                                        disabled={pdfLoading || selectedIds.size === 0}
                                        onClick={() => {
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        {pdfLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                        ) : (
                                            <Printer size={20} />
                                        )}
                                        VISUALIZAR RELATÓRIO
                                    </Button>
                                )}
                            </BlobProvider>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default CustomerSelectablePage;
