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
    Factory, Search, Percent, BarChart3, Image, Sparkles,
    List, Lightbulb, Rocket, ShieldCheck, Target,
    Truck, BookOpen, Layers,
    Handshake, PhoneCall
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Integração via CNPJ",
        description: "Inicie o cadastro pelo CNPJ. Nossa consulta automática preenche os dados oficiais da Receita Federal instantaneamente.",
        icon: Search,
        color: "blue"
    },
    {
        id: 2,
        title: "Identidade Visual (Logo)",
        description: "Carregue o logotipo da indústria. Ele aparecerá nos pedidos enviados aos clientes, conferindo profissionalismo à sua representação.",
        icon: Image,
        color: "amber"
    },
    {
        id: 3,
        title: "Política de Descontos",
        description: "Configure até 9 níveis de descontos padrão (D1 a D9). Estes valores serão sugeridos automaticamente em cada novo pedido para este fornecedor.",
        icon: Percent,
        color: "emerald"
    },
    {
        id: 4,
        title: "Planejamento de Metas",
        description: "Defina metas de faturamento mês a mês. O sistema monitora o realizado versus o planejado em tempo real nos dashboards.",
        icon: BarChart3,
        color: "violet"
    },
    {
        id: 5,
        title: "Política Comercial (Texto)",
        description: "Registre regras de frete, pedido mínimo e prazos. Esta 'bíblia' da indústria fica disponível para consulta rápida da equipe de vendas.",
        icon: BookOpen,
        color: "cyan"
    }
];

export default function SupplierHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Conceito', icon: Lightbulb },
        { id: 'steps', label: 'Funcionalidades', icon: List },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Factory className="w-7 h-7 text-blue-300" />
                                Gestão de Fornecedores - Suprimentos e Parcerias
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 mt-1">
                                Gerencie suas representadas com inteligência comercial e controle de metas.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider font-bold">
                            Hub de Indústrias
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="bg-slate-100 px-6 py-2 border-b flex gap-1 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all font-bold",
                                activeTab === tab.id
                                    ? "bg-white text-blue-700 shadow-sm"
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
                                    <div className="bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border-b-4 border-blue-400">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <Layers className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <Handshake className="w-6 h-6 text-cyan-300" />
                                            O Coração da Representação
                                        </h3>
                                        <p className="text-blue-50 leading-relaxed text-sm">
                                            Suas indústrias são a origem do seu negócio. Um cadastro detalhado garante que as <strong>políticas comerciais sejam respeitadas</strong> e as
                                            <strong>metas de faturamento sejam alcançadas</strong> através de dados acionáveis.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-emerald-500" />
                                                Logística Integrada
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Defina prazos e transportadoras preferenciais por indústria. Isso agiliza o fechamento do pedido e reduz erros de entrega.
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm border-l-4 border-amber-400">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                                <PhoneCall className="w-4 h-4 text-amber-500" />
                                                Contatos Chave
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Mantenha o telefone e e-mail dos gerentes nacionais e regionais sempre à mão para negociações especiais e suporte.
                                            </p>
                                        </div>
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
                                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all bg-white shadow-sm",
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SalesMasters Partner Ecosystem</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="h-8 text-xs font-bold border-slate-200">Entendi</Button>
                        <Button onClick={onClose} className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 shadow-blue-200 shadow-lg border-b-2 border-blue-900">
                            Iniciar Cadastro!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
