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
    HelpCircle,
    TrendingUp,
    Store,
    BarChart3,
    Upload,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    ChevronRight,
    List,
    History,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
    Rocket,
    LineChart,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Receba os Dados",
        description: "Solicite aos seus clientes (distribuidores/revendas) os relatórios de venda para o consumidor final.",
        icon: FileSpreadsheet,
        color: "blue"
    },
    {
        id: 2,
        title: "Importe ou Lance",
        description: "Use a importação via Excel para grandes volumes ou o lançamento manual para ajustes pontuais.",
        icon: Upload,
        color: "emerald"
    },
    {
        id: 3,
        title: "Monitore Pendências",
        description: "O sistema avisa quais clientes ainda não enviaram os dados do mês atual. Cobre quem está atrasado!",
        icon: AlertCircle,
        color: "rose"
    },
    {
        id: 4,
        title: "Analise a Tendência",
        description: "Veja se o produto está girando na ponta. Venda para o distribuidor (Sell-In) sem giro (Sell-Out) gera estoque parado.",
        icon: TrendingUp,
        color: "amber"
    }
];

const myths = [
    {
        myth: "Só preciso saber o que vendi para o distribuidor (Sell-In).",
        reality: "Se o distribuidor não vender para o consumidor (Sell-Out), ele não comprará de você novamente. O Sell-Out garante a recompra.",
        icon: ThumbsDown
    },
    {
        myth: "Conseguir esses dados é impossível.",
        reality: "Muitos sistemas de ERP já exportam isso. Ofereça incentivos ou descontos para quem compartilhar a informação.",
        icon: ThumbsDown
    }
];

const useCases = [
    {
        title: "Importação via Excel",
        action: "Baixe o Template padrão, preencha com os dados do cliente e importe. O sistema valida clientes e indústrias automaticamente.",
        icon: FileSpreadsheet
    },
    {
        title: "Cliente com estoque alto",
        action: "Se o Sell-In foi alto e o Sell-Out está baixo, pare de empurrar produto e ajude o cliente a vender (ações de marketing, descontos).",
        icon: Store
    },
    {
        title: "Monitoramento de ruptura",
        action: "Se o Sell-Out é constante e de repente zera, pode ter faltado produto na prateleira. Aja rápido!",
        icon: AlertCircle
    }
];

export default function SellOutHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Conceito', icon: Lightbulb },
        { id: 'steps', label: 'Como Funciona', icon: List },
        { id: 'cases', label: 'Uso Prático', icon: History },
        { id: 'myths', label: 'Estratégia', icon: Sparkles },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-emerald-100">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Store className="w-7 h-7 text-emerald-200" />
                                Gestão de Sell-Out
                            </DialogTitle>
                            <DialogDescription className="text-emerald-50 mt-1">
                                Domine a venda na ponta e garanta a saúde da sua cadeia de distribuição.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider">
                            Sell-Out View
                        </Badge>
                    </div>
                </DialogHeader>

                {/* Tab Navigation */}
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

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-slate-50">
                    <ScrollArea className="h-full">
                        <div className="p-6">

                            {/* TAB: Introduction */}
                            {activeTab === 'intro' && (
                                <div className="space-y-6">
                                    {/* Hero Card */}
                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-white/10">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <LineChart className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <Store className="w-6 h-6" />
                                            A Verdade está na Ponta.
                                        </h3>
                                        <p className="text-emerald-50 leading-relaxed font-medium">
                                            Vender para o distribuidor (Sell-In) é apenas metade do trabalho.
                                            O sucesso real acontece quando o consumidor final compra o produto (Sell-Out).
                                            <strong className="block mt-2 text-white">Sem Sell-Out, o estoque trava e a recompra para.</strong>
                                        </p>
                                    </div>

                                    {/* Quick Benefits */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-4 border border-emerald-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                                <RefreshCw className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Giro de Estoque</h4>
                                            <p className="text-xs text-slate-500 mt-1">evite produtos parados na gôndola</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <BarChart3 className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Previsibilidade</h4>
                                            <p className="text-xs text-slate-500 mt-1">planeje a produção com dados reais</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-violet-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                                                <Store className="w-6 h-6 text-violet-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Fidelização</h4>
                                            <p className="text-xs text-slate-500 mt-1">ajude seu cliente a vender mais</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Step-by-Step */}
                            {activeTab === 'steps' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Rocket className="w-5 h-5 text-emerald-500" />
                                            Fluxo de Gestão de Sell-Out
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            O ciclo contínuo para manter a cadeia de suprimentos saudável.
                                        </p>
                                    </div>

                                    {steps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className="relative flex gap-4 group"
                                        >
                                            {/* Connecting Line */}
                                            {index < steps.length - 1 && (
                                                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 group-hover:bg-emerald-200 transition-colors" />
                                            )}

                                            {/* Step Number */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all shadow-sm bg-white",
                                                step.color === 'blue' && "border-blue-300 text-blue-600",
                                                step.color === 'emerald' && "border-emerald-300 text-emerald-600",
                                                step.color === 'amber' && "border-amber-300 text-amber-600",
                                                step.color === 'rose' && "border-rose-300 text-rose-600"
                                            )}>
                                                <step.icon className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-emerald-200 group-hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 text-emerald-600">
                                                        PASSO {step.id}
                                                    </Badge>
                                                    <h4 className="font-bold text-slate-800">{step.title}</h4>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: Use Cases */}
                            {activeTab === 'cases' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Store className="w-5 h-5 text-emerald-500" />
                                            Cenários do Dia a Dia
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Como agir em diferentes situações usando os dados de Sell-Out.
                                        </p>
                                    </div>

                                    {useCases.map((useCase, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
                                        >
                                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3 group-hover:bg-emerald-50 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <useCase.icon className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <h4 className="font-bold text-slate-800">{useCase.title}</h4>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex items-start gap-2">
                                                    <ChevronRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    <p className="text-sm text-slate-600">{useCase.action}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: Myths */}
                            {activeTab === 'myths' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-violet-100 mb-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-violet-500" />
                                            Mitos vs Realidade
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Entenda por que medir a ponta é essencial.
                                        </p>
                                    </div>

                                    {myths.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                                        >
                                            <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div>
                                                    <Badge className="bg-red-100 text-red-600 border-0 text-[10px] mb-1">MITO</Badge>
                                                    <p className="text-sm text-red-700 font-medium whitespace-pre-wrap">"{item.myth}"</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-emerald-50 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <Badge className="bg-emerald-100 text-emerald-600 border-0 text-[10px] mb-1">REALIDADE</Badge>
                                                    <p className="text-sm text-emerald-700 font-medium whitespace-pre-wrap">{item.reality}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white text-center mt-6 shadow-lg border border-white/20">
                                        <Store className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                                        <h4 className="font-bold text-lg leading-tight">Quem tem a informação, tem o poder.</h4>
                                        <p className="text-emerald-50 text-sm mt-1">
                                            Monitore o Sell-Out e antecipe suas vendas futuras.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex items-center justify-between shrink-0">
                    <p className="text-xs text-slate-400">
                        💡 Transforme dados da ponta em inteligência!
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Entendi, monitorar ponta!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
