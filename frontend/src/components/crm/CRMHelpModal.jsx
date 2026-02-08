import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard, Target, Zap, Shield,
    CheckCircle2, AlertTriangle, List, Info, Database,
    MessageCircle, ArrowRight, MousePointer2, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
    {
        id: 'protocolo',
        label: 'Protocolo de Operação',
        icon: List,
        content: (
            <div className="space-y-6">
                {[
                    {
                        id: 1,
                        title: "Navegação por Módulos",
                        desc: "Utilize a barra lateral para alternar entre Overview (Métricas), Strategic Pipeline (Funil) e Data Logs (Histórico).",
                        icon: LayoutDashboard,
                        color: 'text-blue-600'
                    },
                    {
                        id: 2,
                        title: "Registro de Atividade",
                        desc: "O botão 'Nova Entrada' é contextual: em Data Logs registra interações; no Pipeline, registra oportunidades.",
                        icon: Zap,
                        color: 'text-amber-500'
                    },
                    {
                        id: 3,
                        title: "Sinalização de Alvos",
                        desc: "No Pipeline, defina o cliente e o valor estimado. Isso cria um card para monitoramento em tempo real.",
                        icon: Target,
                        color: 'text-emerald-500'
                    },
                    {
                        id: 4,
                        title: "Gestão do Funil",
                        desc: "Arraste os cards entre as colunas conforme a negociação avança para manter as projeções atualizadas.",
                        icon: GripVertical,
                        color: 'text-slate-500'
                    },
                    {
                        id: 5,
                        title: "Integração WhatsApp",
                        desc: "Use o ícone de mensagem no card para iniciar um contato instantâneo sem sair da plataforma.",
                        icon: MessageCircle,
                        color: 'text-green-600'
                    },
                    {
                        id: 6,
                        title: "Dashboard de Inteligência",
                        desc: "A aba Overview consolida métricas de performance, alertas de inatividade e gaps detectados por IA.",
                        icon: Shield,
                        color: 'text-blue-800'
                    }
                ].map((step, idx) => (
                    <div key={idx} className="flex gap-5 group">
                        <div className={cn("w-12 h-12 shrink-0 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center transition-all group-hover:shadow-md", step.color)}>
                            <step.icon size={22} />
                        </div>
                        <div className="flex-1 pb-6 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Etapa 0{step.id}</span>
                                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'casos',
        label: 'Cenários Táticos',
        icon: Target,
        content: (
            <div className="space-y-4">
                {[
                    { q: "Cliente inativo há muito tempo", a: "Verifique o alerta de inatividade no 'Overview' e inicie um follow-up imediato via Data Logs.", i: AlertTriangle },
                    { q: "Enviando proposta formal", a: "Arraste o card no Pipeline para 'Proposta' e anexe os detalhes do valor estratégico.", i: Target },
                    { q: "Venda finalizada com sucesso", a: "Mova o card para 'Fechado'. O sistema atualizará automaticamente seu dashboard de resultados.", i: CheckCircle2 }
                ].map((c, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all">
                        <h4 className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2">
                            <Info size={14} className="text-blue-600" /> SITUAÇÃO: {c.q}
                        </h4>
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Procedimento: {c.a}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'axiomas',
        label: 'Axiomas & Mitos',
        icon: Database,
        content: (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Mito: "Processo é perda de tempo"</span>
                        <p className="text-xs text-red-800 mt-2 font-medium">Fato: Dados estruturados são a base para o crescimento em escala. O que não é medido não é gerenciado.</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Axioma: "Otimização Contínua"</span>
                        <p className="text-xs text-blue-800 mt-2 font-medium">Fato: Alimentar o terminal SalesMasters garante que você nunca perca o timing de uma negociação crítica.</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl mt-4 shadow-xl">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Diretriz de Excelência</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        A SalesMasters não é apenas uma ferramenta de registro, é o seu copiloto de inteligência comercial.
                        A precisão dos dados reflete a precisão dos seus resultados.
                    </p>
                </div>
            </div>
        )
    }
];

export default function CRMHelpModal({ open, onClose }) {
    const [activeSection, setActiveSection] = useState('protocolo');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 shadow-2xl rounded-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Guia de Operações SalesMasters</DialogTitle>
                    <DialogDescription>Manual completo de utilização do CRM.</DialogDescription>
                </DialogHeader>

                {/* Premium Layout Header */}
                <div className="bg-slate-900 p-8 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 flex items-center justify-center text-white rounded-2xl shadow-lg shadow-blue-500/30">
                            <Shield size={28} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 block">MANUAL_OPERACIONAL_V3</span>
                            <h2 className="text-2xl font-black text-white tracking-tight italic">SalesMasters<span className="text-blue-500">.Guide</span></h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge className="bg-white/10 text-white border-white/20 uppercase px-3 py-1 rounded-full text-[10px] font-bold">
                            ACESSO PREMIUM
                        </Badge>
                        <p className="text-[10px] font-mono text-slate-500 mt-2">BUILD: 2026.04.TACTICAL</p>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-64 border-r border-slate-100 bg-slate-50/50 p-6 space-y-2 shrink-0">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-4 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl text-left",
                                    activeSection === s.id ? "bg-white text-blue-600 shadow-md border border-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                                )}
                            >
                                <s.icon size={16} />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-10">
                                {sections.find(s => s.id === activeSection)?.content}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0 px-8">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 uppercase text-[10px] font-bold tracking-widest px-6"
                    >
                        Fechar
                    </Button>
                    <Button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest px-12 h-12 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Entendido, prosseguir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
