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
    Target, TrendingUp, Calendar, Zap, Sparkles,
    ChevronRight, List, Lightbulb, Rocket, BarChart3,
    ArrowUpRight, Users, CheckCircle2, AlertTriangle,
    History, Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Identificação do Alvo",
        description: "Selecione o Cliente e a Indústria. Foque onde o cliente já compra, mas tem potencial para crescer.",
        icon: Users,
        color: "blue"
    },
    {
        id: 2,
        title: "Extração do Histórico",
        description: "Escolha o Período Base (ex: últimos 60 dias). O sistema calcula o 'ritmo' atual de compras.",
        icon: History,
        color: "amber"
    },
    {
        id: 3,
        title: "Simulação de Crescimento",
        description: "Defina a meta (ex: +20%). Clique em 'Simular' para ver o 'Número Mágico' diário.",
        icon: Calculator,
        color: "emerald"
    },
    {
        id: 4,
        title: "Registro Estratégico",
        description: "Anote as condições acordadas (bonificações, brindes) e salve a campanha.",
        icon: CheckCircle2,
        color: "violet"
    },
    {
        id: 5,
        title: "Acompanhamento Diário",
        description: "Monitore se os pedidos diários estão atingindo a 'Meta Diária'. Cobre o cliente se o ritmo cair.",
        icon: BarChart3,
        color: "cyan"
    }
];

const myths = [
    {
        myth: "Meta de campanha é só um chute.",
        reality: "No SalesMasters, ela é baseada em dados reais e média diária histórica.",
        icon: Sparkles
    },
    {
        myth: "É difícil de acompanhar.",
        reality: "Não é. Olhe para a 'Meta Diária'. Se o pedido do dia foi menor, a meta está em risco.",
        icon: Sparkles
    }
];

export default function CampaignHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Conceito', icon: Lightbulb },
        { id: 'steps', label: 'Passo a Passo', icon: List },
        { id: 'myths', label: 'Estratégia', icon: Zap },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Target className="w-7 h-7 text-yellow-300" />
                                Guia de Campanhas - Performance Data-Driven
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 mt-1">
                                Transforme metas gigantes em objetivos diários alcançáveis.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider">
                            Alta Eficiência
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="bg-slate-100 px-6 py-2 border-b flex gap-1 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-emerald-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-hidden bg-slate-50">
                    <ScrollArea className="h-full">
                        <div className="p-6">

                            {activeTab === 'intro' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <TrendingUp className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <Zap className="w-6 h-6 text-yellow-300" />
                                            O Poder da Meta Diária
                                        </h3>
                                        <p className="text-emerald-50 leading-relaxed text-sm">
                                            Campanhas não servem apenas para "vender mais", mas para <strong>mudar o patamar</strong> de compra de um cliente.
                                            Ao quebrar uma meta mensal em valores diários, você ganha o poder de corrigir a rota em tempo real.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-4 border border-emerald-100 text-center">
                                            <div className="w-10 h-10 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                                                <History className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-xs">Base Histórica</h4>
                                            <p className="text-[10px] text-slate-500 mt-1">Dados reais, sem achismo.</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-blue-100 text-center">
                                            <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                                                <Calculator className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-xs">Número Mágico</h4>
                                            <p className="text-[10px] text-slate-500 mt-1">O alvo diário para o sucesso.</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-purple-100 text-center">
                                            <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3 text-purple-600">
                                                <BarChart3 className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-xs">Tracking Real</h4>
                                            <p className="text-[10px] text-slate-500 mt-1">Correção de rota constante.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'steps' && (
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <div key={step.id} className="relative flex gap-4 group">
                                            {index < steps.length - 1 && (
                                                <div className="absolute left-6 top-14 bottom-[-20px] w-0.5 bg-slate-200 group-hover:bg-emerald-200 transition-colors" />
                                            )}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all bg-white",
                                                step.color === 'blue' && "border-blue-200 text-blue-600",
                                                step.color === 'amber' && "border-amber-200 text-amber-600",
                                                step.color === 'emerald' && "border-emerald-200 text-emerald-600",
                                                step.color === 'violet' && "border-violet-200 text-violet-600",
                                                step.color === 'cyan' && "border-cyan-200 text-cyan-600"
                                            )}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-emerald-200 transition-all">
                                                <h4 className="font-bold text-slate-800 text-sm mb-1">{step.title}</h4>
                                                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'myths' && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                        <p className="text-sm text-amber-800">
                                            Lembre-se: Uma meta sem acompanhamento diário é apenas um desejo. Use o dashboard de campanhas para cobrar o cliente antes do mês acabar!
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myths.map((item, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100">MITO</Badge>
                                                    <p className="text-xs italic text-slate-500">"{item.myth}"</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">FATO</Badge>
                                                    <p className="text-xs font-bold text-slate-700">{item.reality}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 border-t bg-white flex items-center justify-between shrink-0">
                    <p className="text-[10px] text-slate-400">SalesMasters Intelligence System</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="h-8 text-xs">Fechar</Button>
                        <Button onClick={onClose} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Entendi!</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
