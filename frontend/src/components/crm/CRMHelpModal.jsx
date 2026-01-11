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
    HelpCircle, MessageSquare, Columns, CheckCircle2, TrendingUp, Calendar,
    Phone, Send, Target, Zap, ArrowRight, Plus, Users, LayoutDashboard,
    Clock, AlertTriangle, Sparkles, ChevronRight, List, Lightbulb, X,
    ThumbsDown, ThumbsUp, Rocket, MousePointerClick, GripVertical, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Abra o CRM",
        description: "No menu lateral, clique em 'CRM'. Você verá 3 abas: Visão Geral, Funil e Histórico.",
        icon: LayoutDashboard,
        color: "blue"
    },
    {
        id: 2,
        title: "Registre uma Interação",
        description: "Clicou em 'Nova Interação'? Pronto! Selecione o cliente, tipo de contato (Ligação, WhatsApp, Visita), descreva brevemente e salve.",
        icon: Plus,
        color: "emerald"
    },
    {
        id: 3,
        title: "Crie Oportunidades",
        description: "No modo Funil, clique em 'Nova Oportunidade'. Isso cria um card que você pode arrastar entre as etapas até fechar a venda!",
        icon: Target,
        color: "violet"
    },
    {
        id: 4,
        title: "Arraste para Avançar",
        description: "Arraste os cards entre colunas: Prospecção → Qualificação → Proposta → Negociação → Fechado. Simples assim!",
        icon: GripVertical,
        color: "amber"
    },
    {
        id: 5,
        title: "Use os Botões de Ação Rápida",
        description: "Passe o mouse sobre um card no Funil. Verá dois botões: \u270F\uFE0F Lápis (Editar) e \uD83D\uDCAC WhatsApp. Use para editar dados ou iniciar contato instant\u00e2neo!",
        icon: MousePointerClick,
        color: "rose"
    },
    {
        id: 6,
        title: "Acompanhe no Dashboard",
        description: "A Visão Geral mostra suas estatísticas, ranking da equipe e quem está em ação. Use para acompanhar o progresso.",
        icon: TrendingUp,
        color: "cyan"
    }
];

const myths = [
    {
        myth: "CRM é burocracia, só atrasa meu trabalho.",
        reality: "Registrar uma ligação leva 15 segundos. Esquecer um follow-up custa a venda.",
        icon: ThumbsDown
    },
    {
        myth: "Guardo tudo na minha cabeça.",
        reality: "Com 50+ clientes ativos, você vai esquecer. O CRM lembra por você.",
        icon: ThumbsDown
    },
    {
        myth: "Ninguém usa isso direito.",
        reality: "Os top vendedores usam. A diferença está na constância, não na ferramenta.",
        icon: ThumbsDown
    }
];

const useCases = [
    {
        title: "Preciso editar uma oportunidade",
        action: "Passe o mouse sobre o card no Funil e clique no ✏️ Lápis azul. O formulário abre com os dados para edição.",
        icon: Pencil
    },
    {
        title: "Quero mandar WhatsApp rápido",
        action: "Passe o mouse no card e clique no 💬 WhatsApp verde. Abre o chat direto com o número cadastrado e já registra a interação!",
        icon: MessageSquare
    },
    {
        title: "Prospect sem telefone cadastrado",
        action: "Clique no Lápis para editar e preencha o campo 'Telefone de Contato'. Serve para prospects que ainda não são clientes.",
        icon: Phone
    },
    {
        title: "Mandou orçamento por WhatsApp",
        action: "Registre como 'WhatsApp' e crie uma Oportunidade no Funil. Arraste para 'Proposta Enviada'.",
        icon: Send
    },
    {
        title: "Visitou cliente e fechou venda",
        action: "Na Oportunidade, arraste para 'Negócio Fechado'. Registre a interação com resultado 'Venda'.",
        icon: CheckCircle2
    },
    {
        title: "Cliente sumiu, não responde",
        action: "Registre cada tentativa de contato. O histórico mostra seu esforço e ajuda a decidir quando desistir.",
        icon: AlertTriangle
    }
];

export default function CRMHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Por que usar?', icon: Lightbulb },
        { id: 'steps', label: 'Passo a Passo', icon: List },
        { id: 'cases', label: 'Casos Reais', icon: Users },
        { id: 'myths', label: 'Mitos x Verdades', icon: Zap },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Sparkles className="w-7 h-7 text-yellow-300" />
                                Guia do CRM - Domine em 5 Minutos
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 mt-1">
                                Aprenda a transformar conversas em vendas. Simples, rápido e poderoso.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider">
                            Essencial
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
                                    ? "bg-white text-blue-600 shadow-sm"
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
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <Rocket className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <Target className="w-6 h-6" />
                                            CRM não é sobre "registrar". É sobre VENDER MAIS.
                                        </h3>
                                        <p className="text-blue-100 leading-relaxed">
                                            O segredo dos melhores vendedores? Eles lembram de tudo.
                                            Não porque têm memória de elefante, mas porque deixam o CRM lembrar por eles.
                                            <strong className="block mt-2 text-white">Cada registro é uma venda protegida.</strong>
                                        </p>
                                    </div>

                                    {/* Quick Benefits */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-4 border border-emerald-100 text-center">
                                            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                                <Clock className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">15 segundos</h4>
                                            <p className="text-xs text-slate-500 mt-1">para registrar uma ligação</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-blue-100 text-center">
                                            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <Users className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">100% do histórico</h4>
                                            <p className="text-xs text-slate-500 mt-1">acessível de qualquer lugar</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-violet-100 text-center">
                                            <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                                                <TrendingUp className="w-6 h-6 text-violet-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Visão completa</h4>
                                            <p className="text-xs text-slate-500 mt-1">do seu funil de vendas</p>
                                        </div>
                                    </div>

                                    {/* Call to Action */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                            <Lightbulb className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-800">Dica de Ouro</h4>
                                            <p className="text-sm text-amber-700">
                                                Comece pequeno: registre apenas as ligações de hoje. Amanhã, adicione os WhatsApps.
                                                Em uma semana, você não vai querer parar!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Step-by-Step */}
                            {activeTab === 'steps' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-blue-100 mb-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Rocket className="w-5 h-5 text-blue-500" />
                                            Como começar em 5 passos simples
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Siga este fluxo e você já estará usando o CRM profissionalmente.
                                        </p>
                                    </div>

                                    {steps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className="relative flex gap-4 group"
                                        >
                                            {/* Connecting Line */}
                                            {index < steps.length - 1 && (
                                                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors" />
                                            )}

                                            {/* Step Number */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all",
                                                step.color === 'blue' && "bg-blue-100 border-blue-300 text-blue-600",
                                                step.color === 'emerald' && "bg-emerald-100 border-emerald-300 text-emerald-600",
                                                step.color === 'violet' && "bg-violet-100 border-violet-300 text-violet-600",
                                                step.color === 'amber' && "bg-amber-100 border-amber-300 text-amber-600",
                                                step.color === 'cyan' && "bg-cyan-100 border-cyan-300 text-cyan-600"
                                            )}>
                                                <step.icon className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] font-bold">
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
                                    <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-emerald-500" />
                                            Situações do Dia-a-Dia
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Veja como usar o CRM em cenários reais de um representante comercial.
                                        </p>
                                    </div>

                                    {useCases.map((useCase, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                                        >
                                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <useCase.icon className="w-5 h-5 text-blue-600" />
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
                                    <div className="bg-white rounded-xl p-4 border border-violet-100 mb-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-violet-500" />
                                            Mitos vs Realidade
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Desmascarando as desculpas mais comuns para não usar CRM.
                                        </p>
                                    </div>

                                    {myths.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                                        >
                                            {/* Myth */}
                                            <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div>
                                                    <Badge className="bg-red-100 text-red-600 border-0 text-[10px] mb-1">MITO</Badge>
                                                    <p className="text-sm text-red-700 font-medium">"{item.myth}"</p>
                                                </div>
                                            </div>
                                            {/* Reality */}
                                            <div className="p-4 bg-emerald-50 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <Badge className="bg-emerald-100 text-emerald-600 border-0 text-[10px] mb-1">REALIDADE</Badge>
                                                    <p className="text-sm text-emerald-700 font-medium">{item.reality}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Final Message */}
                                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-5 text-white text-center mt-6">
                                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                                        <h4 className="font-bold text-lg">O CRM é seu assistente de vendas 24h</h4>
                                        <p className="text-violet-100 text-sm mt-1">
                                            Ele guarda o que você esquece. Mostra o que você não vê. E ajuda você a vender mais.
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
                        💡 Dúvidas? Pergunte ao suporte!
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="text-slate-600"
                        >
                            Fechar
                        </Button>
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Rocket className="w-4 h-4 mr-2" />
                            Começar a Usar!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
