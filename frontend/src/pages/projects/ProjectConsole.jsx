import React, { useState } from 'react';
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
    LayoutDashboard
} from 'lucide-react';
import './ProjectConsole.css';

const ProjectConsole = () => {
    const [activeStep, setActiveStep] = useState(2); // Inicia no Briefing para demonstração
    const [projectData, setProjectData] = useState({
        cliente: '',
        titulo: 'CONSTRUTORA ALIANÇA - GALPÃO ALPHA 01',
        area: '1200',
        peldireito: '12',
        cidade: 'Caxias do Sul',
        uf: 'RS',
        fase: 'levantamento',
        status: 'prospeccao',
        carga_piso: '5',
        acabamento: 'pintura_epoxi'
    });

    const pipelineSteps = [
        { id: 1, label: 'Prospecção', icon: LayoutDashboard },
        { id: 2, label: 'Visita Técnica', icon: MapPin },
        { id: 3, label: 'Briefing Técnico', icon: ClipboardList },
        { id: 4, label: 'Estudo de Solo', icon: HardHat },
        { id: 5, label: 'Proposta Final', icon: FileText },
        { id: 6, label: 'Obra Iniciada', icon: Construction }
    ];

    const handleFieldChange = (field, value) => {
        setProjectData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="project-console-container"
        >
            {/* Header Section */}
            <header className="project-header">
                <div className="project-title-group">
                    <span className="project-subtitle">Divisão de Projetos Especiais</span>
                    <h1>BERTOLLINI <span style={{ fontWeight: 400 }}>ENG</span></h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="technical-badge">ID: PRJ-2026-089</span>
                        <span className="technical-badge" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#d1fae5' }}>
                            PRIORIDADE ALTA
                        </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <motion.button whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-slate-600">
                        <History className="h-6 w-6" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-slate-600">
                        <Share2 className="h-6 w-6" />
                    </motion.button>
                    <button className="premium-btn-vibrant">
                        <Save className="h-5 w-5" />
                        SALVAR PROJETO
                    </button>
                </div>
            </header>

            {/* Pipeline Navigation */}
            <div className="status-pipeline">
                {pipelineSteps.map((step) => (
                    <div
                        key={step.id}
                        className={`pipeline-step ${activeStep === step.id ? 'active' : ''}`}
                        onClick={() => setActiveStep(step.id)}
                    >
                        <div className="step-icon">
                            <step.icon size={20} />
                        </div>
                        <span className="step-label">{step.label}</span>
                        {activeStep === step.id && (
                            <motion.div layoutId="pipeline-active" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full mx-8" />
                        )}
                    </div>
                ))}
            </div>

            {/* Workbench Grid */}
            <div className="workbench-grid">

                {/* Left Side: Intelligence & Briefing */}
                <div className="flex flex-col gap-6">
                    <section className="premium-card">
                        <div className="card-header">
                            <div className="card-icon-box">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h2>Briefing Técnico do Galpão</h2>
                                <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Definição de parâmetros estruturais</p>
                            </div>
                        </div>

                        <div className="briefing-group">
                            <div className="input-field-premium">
                                <label>Título do Projeto</label>
                                <input
                                    value={projectData.titulo}
                                    onChange={(e) => handleFieldChange('titulo', e.target.value)}
                                    placeholder="Ex: Galpão Industrial XPTO"
                                />
                            </div>
                            <div className="input-field-premium">
                                <label>Cliente Responsável</label>
                                <div className="relative">
                                    <input placeholder="Buscar ou cadastrar cliente..." />
                                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-8">
                            <div className="input-field-premium">
                                <label><Maximize2 className="inline h-3 w-3 mr-1" />Área Total (M²)</label>
                                <input type="number" value={projectData.area} />
                            </div>
                            <div className="input-field-premium">
                                <label><Layers className="inline h-3 w-3 mr-1" />Pé-direito (M)</label>
                                <input type="number" value={projectData.peldireito} />
                            </div>
                            <div className="input-field-premium">
                                <label><Weight className="inline h-3 w-3 mr-1" />Carga Piso (T/M²)</label>
                                <input type="number" value={projectData.carga_piso} />
                            </div>
                        </div>

                        <div className="briefing-group mt-8">
                            <div className="input-field-premium">
                                <label>Tipo de Acabamento</label>
                                <select value={projectData.acabamento}>
                                    <option value="concreto_polido">Concreto Polido</option>
                                    <option value="pintura_epoxi">Pintura Epóxi</option>
                                    <option value="asfaltico">Asfáltico</option>
                                </select>
                            </div>
                            <div className="input-field-premium">
                                <label>Localização da Obra</label>
                                <div className="flex gap-2">
                                    <input className="flex-1" placeholder="Cidade" value={projectData.cidade} />
                                    <input className="w-16 text-center" placeholder="UF" value={projectData.uf} />
                                </div>
                            </div>
                        </div>

                        <div className="input-field-premium mt-8">
                            <label>Observações Técnicas / Restrições</label>
                            <textarea rows="4" placeholder="Detalhes específicos sobre solo, energia ou logística..." defaultValue="Pé-direito livre para empilhadeiras retráteis de 9m. Solo exige estaqueamento profundo."></textarea>
                        </div>
                    </section>
                </div>

                {/* Right Side: Resumo & Ações */}
                <div className="flex flex-col gap-6">
                    <section className="premium-card">
                        <div className="card-header">
                            <div className="card-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <Zap className="h-6 w-6" />
                            </div>
                            <h2>Radar de Viabilidade</h2>
                        </div>

                        <div className="stats-summary">
                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="label">Estimativa de Investimento</span>
                                    <span className="value">R$ 2.450.000</span>
                                </div>
                                <div className="technical-badge">ROI: 18 Meses</div>
                            </div>

                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="label">Tempo Médio Execução</span>
                                    <span className="value">120 <span style={{ fontSize: '1rem' }}>DIAS</span></span>
                                </div>
                                <Calendar className="h-6 w-6 text-slate-300" />
                            </div>

                            <div className="stat-item" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                                <div className="stat-info">
                                    <span className="label" style={{ color: '#166534' }}>Probabilidade de Fechamento</span>
                                    <span className="value" style={{ color: '#15803d' }}>85%</span>
                                </div>
                                <TrendingUp className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Próximos Passos Sugeridos</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 cursor-pointer transition-all">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                    <span className="text-[11px] font-bold text-slate-700">Agendar Visita com Engenheiro Estrutural</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 cursor-pointer transition-all">
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                                    <span className="text-[11px] font-bold text-slate-700">Liberar Estudo Preliminar para Cliente</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="premium-card bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-none">
                        <h3 className="text-xl font-black mb-2">Bertollini <span className="text-blue-400">AI</span></h3>
                        <p className="text-blue-200 text-xs font-medium leading-relaxed mb-6">
                            Baseado no histórico de projetos similares em {projectData.cidade}, recomendo reforçar o isolamento térmico da cobertura devido à amplitude térmica da região.
                        </p>
                        <button className="w-full py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            Gerar Análise Completa
                        </button>
                    </section>
                </div>

            </div>
        </motion.div>
    );
};

// Componente placeholder caso falte o original (para evitar erro de build se o usuário não tiver lucide-react atualizado)
const TrendingUp = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
);

export default ProjectConsole;
