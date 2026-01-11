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
    HelpCircle, DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle,
    PieChart, BarChart3, Calculator, Landmark, ShieldCheck,
    AlertCircle, Sparkles, ChevronRight, List, Lightbulb,
    ThumbsDown, ThumbsUp, Rocket, FileText, Receipt,
    RefreshCcw, PiggyBank, History, TrendingUp, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Organize seus Cadastros",
        description: "Antes de tudo, tenha seus Fornecedores e Clientes Financeiros em dia. Isso facilita o preenchimento dos lançamentos.",
        icon: Landmark,
        color: "blue"
    },
    {
        id: 2,
        title: "Lance Contas a Pagar/Receber",
        description: "Registre suas obrigações e direitos. O sistema gera parcelas automaticamente para você economizar tempo.",
        icon: FileText,
        color: "emerald"
    },
    {
        id: 3,
        title: "Realize as Baixas",
        description: "Ao pagar ou receber, faça a 'Baixa'. Isso atualiza o saldo e as estatísticas de fluxo de caixa em tempo real.",
        icon: CheckCircle2,
        color: "violet"
    },
    {
        id: 4,
        title: "Use Centros de Custo",
        description: "Classifique seus gastos por departamento ou projeto. Assim você descobre exatamente para onde vai o seu lucro.",
        icon: PieChart,
        color: "amber"
    },
    {
        id: 5,
        title: "Monitore o Fluxo de Caixa",
        description: "Acompanhe as entradas e saídas previstas. Nunca seja pego de surpresa por falta de capital de giro!",
        icon: Wallet,
        color: "rose"
    },
    {
        id: 6,
        title: "Analise a DRE",
        description: "Veja o resultado líquido da sua operação. Impostos, custos e lucro final organizados mês a mês.",
        icon: BarChart3,
        color: "cyan"
    }
];

// Reusing CheckCircle2 icon if it's not imported. It's missing in my import list above, let me fix it.
import { CheckCircle2 } from "lucide-react";

const myths = [
    {
        myth: "Gestão financeira é só para grandes empresas.",
        reality: "Empresas pequenas que controlam o centavo hoje, sobrevivem para crescer amanhã.",
        icon: ThumbsDown
    },
    {
        myth: "O banco já me dá o extrato, não preciso lançar.",
        reality: "O extrato mostra o passado. O financeiro do SalesMasters mostra o futuro (previsibilidade).",
        icon: ThumbsDown
    },
    {
        myth: "Lançar parcelas dá muito trabalho.",
        reality: "O sistema gera dezenas de parcelas em 1 clique. O trabalho é manual, mas o ganho é automático.",
        icon: ThumbsDown
    }
];

const useCases = [
    {
        title: "Venda parcelada no boleto",
        action: "Lance no Contas a Receber, informe o número de parcelas e o intervalo. O sistema cria todos os vencimentos de uma vez!",
        icon: Receipt
    },
    {
        title: "Pagamento com juros ou desconto",
        action: "Na tela de baixa, você pode adicionar o valor dos juros ou do desconto. O sistema recalcula o valor final automaticamente.",
        icon: Calculator
    },
    {
        title: "Conta paga por outro banco",
        action: "Você pode ter várias contas bancárias. Na hora da baixa, escolha qual conta foi utilizada para manter o saldo correto.",
        icon: Landmark
    },
    {
        title: "Gasto recorrente (Aluguel, Luz)",
        action: "Use o Plano de Contas para categorizar. No final do mês, a DRE mostra quanto esses custos fixos estão pesando no lucro.",
        icon: RefreshCcw
    },
    {
        title: "Cliente atrasou o pagamento",
        action: "O sistema destaca em vermelho os 'Vencidos'. Use os filtros para cobrar quem está devendo de forma organizada.",
        icon: AlertCircle
    },
    {
        title: "Onde encontro os Relatórios?",
        action: "Relatórios Estratégicos (Fluxo de Caixa e DRE) estão no menu lateral 'Financeiro'. Relatórios Operacionais estão nas telas de Pagar/Receber, onde você pode filtrar e exportar para Excel.",
        icon: BarChart3
    },
    {
        title: "Baixa de Título (Pagar/Receber)",
        action: "1. Vá na tela de Pagar ou Receber. 2. Identifique a conta e clique no botão 'Baixar' (ou clique na linha). 3. No cronograma, clique em 'Baixar' na parcela desejada. 4. Informe a data, valor e confirme!",
        icon: CheckCircle2
    },
    {
        title: "Previsão de lucro do semestre",
        action: "O Fluxo de Caixa Provisório mostra as contas a vencer nos próximos meses, ajudando no planejamento de compras.",
        icon: PiggyBank
    }
];

export default function FinancialHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Benefícios', icon: Lightbulb },
        { id: 'steps', label: 'O Ciclo Financeiro', icon: List },
        { id: 'cases', label: 'Casos Reais', icon: History },
        { id: 'myths', label: 'Mitos x Verdades', icon: Sparkles },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-emerald-100">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <ShieldCheck className="w-7 h-7 text-emerald-200" />
                                Gestão Financeira - Controle Total
                            </DialogTitle>
                            <DialogDescription className="text-emerald-50 mt-1">
                                Gerencie fluxos, garanta lucros e tenha previsibilidade real do seu negócio.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider">
                            Alta Performance
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
                                            <TrendingUp className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <DollarSign className="w-6 h-6" />
                                            O Coração da sua Empresa.
                                        </h3>
                                        <p className="text-emerald-50 leading-relaxed font-medium">
                                            Vender é importante, mas saber para onde o dinheiro está indo é VITAL.
                                            Uma boa gestão financeira não apenas corta custos, ela cria OPORTUNIDADES.
                                            <strong className="block mt-2 text-white">Lucro é o prêmio pela boa gestão.</strong>
                                        </p>
                                    </div>

                                    {/* Quick Benefits */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-4 border border-emerald-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Mais Lucro</h4>
                                            <p className="text-xs text-slate-500 mt-1">identifique gargalos de custos</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <History className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Organização</h4>
                                            <p className="text-xs text-slate-500 mt-1">histórico completo de 360°</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-violet-100 text-center shadow-sm">
                                            <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                                                <ShieldCheck className="w-6 h-6 text-violet-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">Segurança</h4>
                                            <p className="text-xs text-slate-500 mt-1">previsibilidade de caixa real</p>
                                        </div>
                                    </div>

                                    {/* Call to Action */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                            <Lightbulb className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-800">Padrão de Ouro</h4>
                                            <p className="text-sm text-amber-700">
                                                Tire 10 minutos no início do dia para baixar os recebimentos e 10 minutos no final para pagar as contas.
                                                Manter o sistema em dia é mais fácil do que correr atrás do prejuízo depois.
                                            </p>
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
                                            O Ciclo de Sucesso Financeiro
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Entenda como os dados fluem dentro das rotinas financeiras.
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
                                                step.color === 'violet' && "border-violet-300 text-violet-600",
                                                step.color === 'amber' && "border-amber-300 text-amber-600",
                                                step.color === 'rose' && "border-rose-300 text-rose-600",
                                                step.color === 'cyan' && "border-cyan-300 text-cyan-600"
                                            )}>
                                                <step.icon className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-emerald-200 group-hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 text-emerald-600">
                                                        MÓDULO {step.id}
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
                                            <Wallet className="w-5 h-5 text-emerald-500" />
                                            Dúvidas Frequentes & Soluções
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Situações práticas do financeiro resolvidas de forma rápida.
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
                                            Quebrando barreiras para uma gestão mais eficiente.
                                        </p>
                                    </div>

                                    {myths.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                                        >
                                            {/* Myth */}
                                            <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div>
                                                    <Badge className="bg-red-100 text-red-600 border-0 text-[10px] mb-1">MITO</Badge>
                                                    <p className="text-sm text-red-700 font-medium whitespace-pre-wrap">"{item.myth}"</p>
                                                </div>
                                            </div>
                                            {/* Reality */}
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

                                    {/* Final Message */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white text-center mt-6 shadow-lg border border-white/20">
                                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                                        <h4 className="font-bold text-lg leading-tight">O Financeiro sustenta o crescimento.</h4>
                                        <p className="text-emerald-50 text-sm mt-1">
                                            Com dados reais, suas decisões deixam de ser "achismos" e passam a ser estratégia pura.
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
                        💡 Controle é a chave para o lucro!
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="text-slate-600 hover:bg-slate-50"
                        >
                            Talvez depois
                        </Button>
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md transition-all"
                        >
                            <Rocket className="w-4 h-4 mr-2" />
                            Entendi, vamos lucrar!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
