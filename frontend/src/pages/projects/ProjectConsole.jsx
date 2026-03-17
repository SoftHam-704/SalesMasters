import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Construction,
    Building2,
    ClipboardList,
    HardHat,
    FileText,
    CheckCircle2,
    ArrowRight,
    Layers,
    Zap,
    MapPin,
    Maximize2,
    Weight,
    Calendar,
    Save,
    Share2,
    Plus,
    History,
    Users,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    Search,
    Loader2,
    HelpCircle,
    X,
    TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import DbComboBox from '@/components/DbComboBox';
import { auxDataService } from '@/services/orders/auxDataService';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import TutorialTrigger from '@/components/TutorialTrigger';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import './ProjectConsole.css';

const ProjectConsole = () => {
    const [activeStep, setActiveStep] = useState(3);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Get industry from session (Multi-tenant context)
    const selectedIndustryStr = sessionStorage.getItem('selectedIndustry');
    const selectedIndustry = selectedIndustryStr ? JSON.parse(selectedIndustryStr) : null;
    const industryName = selectedIndustry?.for_nomered || 'SOLUÇÕES';

    // Get current user for seller context
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [projectData, setProjectData] = useState({
        id: null,
        cliente: null,
        clienteLabel: '',
        titulo: '',
        area: '',
        peldireito: '',
        cidade: '',
        uf: '',
        fase: 'levantamento',
        status: 'prospeccao',
        carga_piso: '',
        acabamento: 'concreto_polido',
        obs: ''
    });

    const pipelineSteps = [
        { id: 1, label: 'Prospecção', desc: 'Identificação de Lead', icon: LayoutDashboard },
        { id: 2, label: 'Visita Técnica', desc: 'Análise de Terreno', icon: MapPin },
        { id: 3, label: 'Briefing Técnico', desc: 'Definição de Parâmetros', icon: ClipboardList },
        { id: 4, label: 'Estudo de Solo', desc: 'Sondagem Geotécnica', icon: HardHat },
        { id: 5, label: 'Proposta Final', desc: 'Orçamentação Global', icon: FileText },
        { id: 6, label: 'Obra Iniciada', desc: 'Mobilização de Equipe', icon: Construction }
    ];

    const fetchClients = async (search) => {
        try {
            const res = await auxDataService.getClients('A', search);
            return (res.data || []).map(c => ({
                label: `${c.cli_nomred || c.cli_nome} - ${c.cli_cgc}`,
                value: c.cli_codigo,
                ...c
            }));
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            return [];
        }
    };

    const handleNewProject = () => {
        if (projectData.id && !window.confirm('Iniciar um novo lançamento? Dados não salvos serão perdidos.')) return;

        setProjectData({
            id: null,
            cliente: null,
            clienteLabel: '',
            titulo: '',
            area: '',
            peldireito: '',
            cidade: '',
            uf: '',
            fase: 'levantamento',
            status: 'prospeccao',
            carga_piso: '',
            acabamento: 'concreto_polido',
            obs: ''
        });
        setActiveStep(1);
        toast.info('Formulário limpo para novo projeto.');
    };

    const handleFieldChange = (field, value) => {
        setProjectData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProject = async () => {
        if (!projectData.cliente) {
            toast.error('Selecione um cliente antes de salvar.');
            return;
        }
        if (!projectData.titulo) {
            toast.error('Informe um título para o projeto.');
            return;
        }
        if (!selectedIndustry) {
            toast.error('Indústria não identificada.');
            return;
        }

        setIsSaving(true);
        try {
            // Mapping project to "Pedido" format
            // In projects, we often use one main item to describe the project
            const payload = {
                ped_data: new Date().toISOString().split('T')[0],
                ped_situacao: 'C', // 'C' for Cotação/Projeto
                ped_cliente: projectData.cliente,
                ped_vendedor: user?.codvendedor || 1,
                ped_industria: selectedIndustry.for_codigo,
                ped_obs: `PROJETO: ${projectData.titulo}\nAREA: ${projectData.area}m2 | PE: ${projectData.peldireito}m\nSOLO: ${projectData.obs}`,
                itens: [
                    {
                        ite_produto: 'PROJETO', // Placeholder product
                        ite_nomeprod: projectData.titulo,
                        ite_quant: 1,
                        ite_valor: 0,
                        ite_totliquido: 0,
                        ite_industria: selectedIndustry.for_codigo,
                        // Custom technical fields (will be stored in ite_obs or similar depending on DB)
                        ite_dimensoes: `${projectData.area}x${projectData.peldireito}`,
                        ite_acabamento: projectData.acabamento
                    }
                ]
            };

            const url = getApiUrl(NODE_API_URL, '/api/orders');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                toast.success('Projeto lançado com sucesso!');
                setProjectData(prev => ({ ...prev, id: result.orderId }));
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('Erro ao salvar projeto:', err);
            toast.error('Falha ao salvar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-slate-50/50 overflow-hidden"
        >
            {/* --- PREMIUM HEADER --- */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-5">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200/50">
                        <HardHat className="h-7 w-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70">Console de Engenharia</span>
                            <div className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">Enterprise Edition</div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-3">
                            {industryName} <span className="text-blue-600">ENGINEERING</span>
                            <span className="h-6 w-[1px] bg-slate-200 block" />
                            <span className="text-lg font-mono text-slate-400">
                                {projectData.id ? `ID: PRJ-${projectData.id}` : 'NOVO LANÇAMENTO'}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-3">
                    <TutorialTrigger />
                    <div className="h-8 w-[1px] bg-slate-100 mx-1" />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={handleNewProject}
                        className="bg-white px-4 h-12 rounded-2xl shadow-sm border border-blue-100 text-blue-600 font-bold text-xs flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> NOVO
                    </motion.button>
                    <button
                        disabled={isSaving}
                        onClick={handleSaveProject}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 h-12 rounded-2xl shadow-lg shadow-emerald-200/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? 'SALVANDO...' : 'SALVAR PROJETO'}
                    </button>
                </div>
            </div>

            {/* --- VISUAL PROJECT STEPPER --- */}
            <div className="bg-white border-b border-slate-200 px-8 py-0 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center justify-center min-w-max gap-4 py-4">
                    {pipelineSteps.map((step, idx, arr) => (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => setActiveStep(step.id)}
                                className={cn(
                                    "relative px-6 py-3 rounded-2xl flex items-center gap-4 transition-all group shrink-0",
                                    activeStep === step.id ? "bg-blue-50/50 shadow-sm" : "hover:bg-slate-50/50"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                    activeStep === step.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                                )}>
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <div className="text-left hidden lg:block">
                                    <span className={cn(
                                        "text-[10px] font-black tracking-widest block uppercase",
                                        activeStep === step.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                    )}>
                                        {step.label}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">{step.desc}</span>
                                </div>
                                {activeStep === step.id && (
                                    <motion.div
                                        layoutId="pipeline-active"
                                        className="absolute bottom-0 left-6 right-6 h-0.5 bg-blue-600 rounded-full"
                                    />
                                )}
                            </button>
                            {idx < arr.length - 1 && (
                                <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Briefing Form */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Structural Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Briefing Estrutural</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identificação e Parâmetros Base</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700 font-bold px-3 py-1">Projeto No. {projectData.id || 'NOVO'}</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Título do Projeto</label>
                                    <div className="relative group">
                                        <Construction className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={projectData.titulo}
                                            onChange={(e) => handleFieldChange('titulo', e.target.value)}
                                            placeholder="Ex: Galpão Industrial XPTO"
                                            className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl focus:ring-blue-500 transition-all text-sm font-bold pl-12"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Cliente Responsável</label>
                                    <div className="relative group">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors z-10" />
                                        <DbComboBox
                                            fetchItems={fetchClients}
                                            value={projectData.cliente}
                                            initialLabel={projectData.clienteLabel}
                                            onChange={(val, item) => {
                                                setProjectData(prev => ({
                                                    ...prev,
                                                    cliente: val,
                                                    clienteLabel: item?.label || '',
                                                    cidade: item?.cli_cidade || prev.cidade,
                                                    uf: item?.cli_uf || prev.uf
                                                }));
                                            }}
                                            placeholder="Buscar cliente..."
                                            className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl pl-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Maximize2 size={12} className="text-blue-500" /> Área Total (m²)
                                    </label>
                                    <Input
                                        type="number"
                                        value={projectData.area}
                                        onChange={(e) => handleFieldChange('area', e.target.value)}
                                        className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-center font-bold text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Layers size={12} className="text-blue-500" /> Pé Direito (m)
                                    </label>
                                    <Input
                                        type="number"
                                        value={projectData.peldireito}
                                        onChange={(e) => handleFieldChange('peldireito', e.target.value)}
                                        className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-center font-bold text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Weight size={12} className="text-blue-500" /> Carga/Piso (T/m²)
                                    </label>
                                    <Input
                                        value={projectData.carga_piso}
                                        onChange={(e) => handleFieldChange('carga_piso', e.target.value)}
                                        className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-center font-bold text-lg"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. Localization & Finishing Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Localização e Logística</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onde a mágica acontece</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Cidade da Obra</label>
                                    <Input
                                        placeholder="Digite a cidade..."
                                        value={projectData.cidade}
                                        onChange={(e) => handleFieldChange('cidade', e.target.value)}
                                        className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl font-bold pl-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">UF</label>
                                    <Input
                                        placeholder="UF"
                                        value={projectData.uf}
                                        onChange={(e) => handleFieldChange('uf', e.target.value)}
                                        className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-center font-black uppercase"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Acabamento</label>
                                    <select
                                        value={projectData.acabamento}
                                        onChange={(e) => handleFieldChange('acabamento', e.target.value)}
                                        className="w-full h-14 px-4 border border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                    >
                                        <option value="concreto_polido">Concreto Polido</option>
                                        <option value="pintura_epoxi">Pintura Epóxi</option>
                                        <option value="asfaltico">Asfáltico</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Observações Técnicas / Restrições</label>
                                <textarea
                                    value={projectData.obs}
                                    onChange={(e) => handleFieldChange('obs', e.target.value)}
                                    className="w-full h-32 rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all shadow-inner"
                                    placeholder="Detalhes específicos sobre solo, energia ou logística de acesso..."
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT: Health/Intelligence */}
                    <div className="space-y-6">
                        {/* Radar de Viabilidade */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap size={120} className="text-blue-600" />
                            </div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                        <Zap size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-800 tracking-tight">Radar de Viabilidade</h3>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimativa de Investimento</span>
                                        <Badge className="bg-amber-50 text-amber-600 text-[9px] font-black border-amber-100">ESTIMADO</Badge>
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">R$ {(projectData.area * 1850).toLocaleString('pt-BR')}</span>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Médio Execução</span>
                                        <Calendar size={14} className="text-slate-300" />
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{Math.ceil(projectData.area / 10)} <span className="text-sm">DIAS</span></span>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Índice de Complexidade</span>
                                        <TrendingUp size={14} className="text-emerald-500" />
                                    </div>
                                    <span className="text-lg font-black text-emerald-700 tracking-tight uppercase">{projectData.peldireito > 10 ? 'ALTO' : 'NORMAL'}</span>
                                </div>
                            </div>

                            <div className="mt-10 border-t border-slate-100 pt-6">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] block mb-4">Próximos Passos Sugeridos</span>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors group">
                                        <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white"><Plus size={12} /></div>
                                        Agendar Visita com Engenheiro Estrutural
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-blue-600 cursor-pointer transition-colors group opacity-50">
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 flex items-center justify-center"><Plus size={12} /></div>
                                        Liberar Estudo Preliminar para Cliente
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* AI Insight Section */}
                        <motion.div
                            className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-950/20"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{industryName}</span>
                                <Badge className="bg-blue-500 text-white text-[9px] font-black">AI ANALYTICS</Badge>
                            </div>
                            <p className="text-blue-100 text-xs font-medium leading-relaxed mb-8">
                                {projectData.cidade
                                    ? `Com base no histórico em ${projectData.cidade}, recomendo reforçar o isolamento térmico da cobertura devido à amplitude térmica da região.`
                                    : "Complete a localização do projeto para que eu possa gerar insights climáticos e estruturais específicos."}
                            </p>
                            <button className="w-full py-4 bg-blue-500 hover:bg-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                Gerar Análise de Viabilidade
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectConsole;
