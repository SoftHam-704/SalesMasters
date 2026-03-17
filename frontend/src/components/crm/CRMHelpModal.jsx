import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Info, MousePointer2, Plus, MessageCircle, ArrowRightLeft, ShieldCheck } from 'lucide-react';

const HelpSection = ({ icon: Icon, title, description, variant = 'default' }) => (
    <div className={cn(
        "flex gap-4 p-4 rounded-2xl border transition-all group mb-3",
        variant === 'premium' 
            ? "bg-slate-900 border-slate-800 shadow-lg shadow-slate-900/20" 
            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-100"
    )}>
        <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
            variant === 'premium'
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white border-slate-200 text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-200"
        )}>
            <Icon size={20} />
        </div>
        <div>
            <h4 className={cn(
                "text-sm font-bold mb-1",
                variant === 'premium' ? "text-white" : "text-slate-800"
            )}>{title}</h4>
            <p className={cn(
                "text-xs leading-relaxed font-medium",
                variant === 'premium' ? "text-slate-400" : "text-slate-500"
            )}>
                {description}
            </p>
        </div>
    </div>
);

export default function CrmHelpModal({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
                <div className="p-8 pb-0">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <Info className="text-emerald-600" size={24} />
                            </div>
                            Manual do Pipeline
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            A bússola para o sucesso comercial e controle total das suas vendas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar pb-8">
                        {/* Conceito e Benefícios */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 pl-1">O Conceito</h3>
                            <HelpSection 
                                variant="premium"
                                icon={ShieldCheck} 
                                title="O que é o Pipeline?" 
                                description="É o mapa visual da jornada do seu cliente. Imagine um funil onde cada coluna representa um passo para fechar o negócio, desde o primeiro contato até o aperto de mão final."
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-1">Previsibilidade</h4>
                                    <p className="text-[11px] text-emerald-600 font-bold leading-tight">Saiba quanto você vai vender nos próximos meses.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <h4 className="text-[10px] font-black text-blue-700 uppercase mb-1">Foco Total</h4>
                                    <p className="text-[11px] text-blue-600 font-bold leading-tight">Priorize os negócios que estão mais perto do fechamento.</p>
                                </div>
                            </div>
                        </div>

                        {/* Operação */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Funcionalidades</h3>
                            <HelpSection 
                                icon={Plus} 
                                title="Novas Oportunidades" 
                                description="Clique em '+ Nova Oportunidade' para inserir um negócio no funil. Tente manter o título claro e o valor estimado sempre atualizado."
                            />
                            <HelpSection 
                                icon={ArrowRightLeft} 
                                title="Movimentação Inteligente" 
                                description="Arraste os cards para a direita conforme a venda evolui. Se precisar recuar um passo, você pode arrastar para colunas anteriores livremente."
                            />
                            <HelpSection 
                                icon={MessageCircle} 
                                title="Aceleração via WhatsApp" 
                                description="Não perca tempo trocando de tela. Use o botão verde no card para falar direto com o cliente e acelerar o fechamento."
                            />
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Maximize seus resultados com o SalesMasters
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
