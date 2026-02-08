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
    Users, Search, MapPin, Phone, Mail, Sparkles,
    ChevronRight, List, Lightbulb, Rocket, ShieldCheck,
    ArrowUpRight, Target, CheckCircle2, AlertTriangle,
    Navigation, MousePointerClick, TrendingUp, Handshake
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        title: "Consulta CNPJ Automática",
        description: "Economize tempo! Digite o CNPJ e clique na lupa. Buscamos Razão Social, Endereço e E-mail diretamente na Receita Federal.",
        icon: Search,
        color: "blue"
    },
    {
        id: 2,
        title: "Classificação por Setor",
        description: "Vincule o cliente a um Setor ou Rota. Isso é crucial para que ele apareça corretamente nos itinerários dos vendedores.",
        icon: Navigation,
        color: "amber"
    },
    {
        id: 3,
        title: "Dados Comerciais e Indústrias",
        description: "Na aba 'Indústrias', defina descontos específicos (D1 a D9) e prazos de pagamento para cada fornecedor.",
        icon: TrendingUp,
        color: "emerald"
    },
    {
        id: 4,
        title: "Contatos e Relacionamento",
        description: "Cadastre múltiplos contatos (Comprador, Financeiro, NFe). Mantenha o histórico de quem decide dentro da empresa.",
        icon: Users,
        color: "violet"
    },
    {
        id: 5,
        title: "Inteligência Geográfica",
        description: "Preencha a Latitude e Longitude (ou use o mapa) para que o vendedor encontre o cliente facilmente via GPS no aplicativo.",
        icon: MapPin,
        color: "cyan"
    }
];

export default function ClientHelpModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', label: 'Conceito', icon: Lightbulb },
        { id: 'steps', label: 'Funcionalidades', icon: List },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Handshake className="w-7 h-7 text-emerald-200" />
                                Gestão de Clientes - CRM Estratégico
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 mt-1">
                                Organize sua base, automatize cadastros e aumente a conversão.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs uppercase tracking-wider font-bold">
                            Central de Sucesso
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
                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                                        <div className="absolute top-0 right-0 opacity-10">
                                            <Users className="w-48 h-48 -mt-10 -mr-10" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <ShieldCheck className="w-6 h-6 text-emerald-200" />
                                            Base de Dados Confiável
                                        </h3>
                                        <p className="text-emerald-50 leading-relaxed text-sm">
                                            Um cadastro de cliente bem estruturado é o <strong>cérebro da sua operação</strong>.
                                            Com dados precisos de setores, indústrias e geolocalização, você permite que sua equipe de vendas foque no que importa: <strong>vender</strong>.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-orange-500" />
                                                Atuação Principal
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Classifique se o cliente é uma Mercearia, Supermercado ou Farmácia. Filtre sua base por tipo de negócio para campanhas de marketing precisas.
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                                Dica de Produtividade
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Use o <strong>Nome Reduzido</strong> para identificar rapidamente o cliente no grid e nos relatórios, facilitando a comunicação diária.
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
                                                <div className="absolute left-6 top-14 bottom-[-20px] w-0.5 bg-slate-200 group-hover:bg-emerald-200 transition-colors" />
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
                                            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm group-hover:border-emerald-200 transition-all">
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SalesMasters CRM Intelligence</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="h-8 text-xs font-bold border-slate-200">Entendi</Button>
                        <Button onClick={onClose} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-emerald-200 shadow-lg">
                            Começar Cadastro!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
