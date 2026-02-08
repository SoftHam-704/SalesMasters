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
    Map, Route, User, Calendar, Sparkles,
    ChevronRight, List, Lightbulb, Rocket, MapPin,
    ArrowUpRight, Users, CheckCircle2, AlertTriangle,
    Navigation, MousePointerClick, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Defina o Dono da Rota",
        description: "Dê um nome ao itinerário e associe a um Vendedor. Isso organiza quem será responsável pelas visitas.",
        icon: User,
        color: "blue"
    },
    {
        id: 2,
        title: "Adicione os Destinos",
        description: "Escolha entre 'Cidade Inteira' ou 'Setor/Bairro'. O sistema permite focar em micro-regiões ou cidades completas.",
        icon: MapPin,
        color: "amber"
    },
    {
        id: 3,
        title: "Logística e Frequência",
        description: "Defina se a rota é Semanal, Quinzenal ou Mensal. Isso ajuda o vendedor a planejar o retorno.",
        icon: Calendar,
        color: "emerald"
    },
    {
        id: 4,
        title: "A Ordem Estratégica",
        description: "Arraste os itens (Drag & Drop) para definir a sequência lógica das visitas, economizando tempo e combustível.",
        icon: GripVertical,
        color: "violet"
    },
    {
        id: 5,
        title: "Sincronização Mobile",
        description: "Ao salvar, o itinerário aparece automaticamente no app do vendedor para que ele execute e registre as visitas.",
        icon: Rocket,
        color: "cyan"
    }
];

export default function ItineraryHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Conceito', icon: Lightbulb },
        { id: 'steps', label: 'Passo a Passo', icon: List },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Navigation className="w-7 h-7 text-cyan-300" />
                                Guia de Itinerários - Inteligência Geográfica
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 mt-1">
                                Planeje rotas inteligentes e aumente a produtividade de campo.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider">
                            Produtividade
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
                                    ? "bg-white text-blue-600 shadow-sm"
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
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <Map className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <MousePointerClick className="w-6 h-6 text-cyan-300" />
                                            Otimização de Tempo
                                        </h3>
                                        <p className="text-blue-50 leading-relaxed text-sm">
                                            Um vendedor que segue um roteiro organizado visita em média <strong>30% mais clientes</strong> do que um que viaja sem meta geográfica.
                                            O Itinerário é a fundação da disciplina de vendas.
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-yellow-500" />
                                            Dica Pro
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Use a ferramenta de <strong>Setores</strong> para dividir grandes cidades em regiões. Isso permite que o vendedor cubra bairros específicos em dias diferentes, garantindo 100% de cobertura.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'steps' && (
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <div key={step.id} className="relative flex gap-4 group">
                                            {index < steps.length - 1 && (
                                                <div className="absolute left-6 top-14 bottom-[-20px] w-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors" />
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
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-blue-200 transition-all">
                                                <h4 className="font-bold text-slate-800 text-sm mb-1">{step.title}</h4>
                                                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 border-t bg-white flex items-center justify-between shrink-0">
                    <p className="text-[10px] text-slate-400">SalesMasters Intelligence System</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="h-8 text-xs">Fechar</Button>
                        <Button onClick={onClose} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">Criar Minha Rota!</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
