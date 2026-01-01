import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, MessageSquare, Columns, CheckCircle2, TrendingUp, Calendar } from "lucide-react";

export default function CRMHelpModal({ open, onClose }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <HelpCircle className="w-6 h-6" />
                        Guia Prático do CRM
                    </DialogTitle>
                    <DialogDescription className="text-blue-100">
                        Aprenda a gerenciar seu relacionamento com clientes e aumentar suas vendas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-slate-50">
                    <ScrollArea className="h-full p-6">
                        <div className="space-y-6">
                            {/* Intro Card */}
                            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Por que usar o CRM?
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    O CRM (Customer Relationship Management) é o coração da sua estratégia comercial.
                                    Registrar cada conversa ou visita não é "burocracia", é inteligência.
                                    Saber o histórico do cliente ajuda a vender mais e melhor.
                                </p>
                            </div>

                            <Accordion type="single" collapsible className="w-full space-y-2">

                                {/* Item 1: Interações */}
                                <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-lg px-4">
                                    <AccordionTrigger className="hover:no-underline hover:text-blue-600 py-4">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">1. Registrando Interações</span>
                                                <p className="text-xs text-slate-500 font-normal mt-0.5">Liguei, visitei ou mandei zap? Registre!</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 p-2 pt-0">
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Clique no botão <strong>Nova Interação</strong> sempre que falar com um cliente.</li>
                                            <li>Selecione o <strong>Cliente</strong> (basta digitar parte do nome).</li>
                                            <li>Defina o <strong>Tipo</strong> (Telefone, WhatsApp, Visita).</li>
                                            <li>Marque as <strong>Indústrias</strong> relacionadas ao assunto.</li>
                                            <li>No campo <strong>Resultado</strong>, indique o que aconteceu (Venda, Agendar Retorno, etc.).</li>
                                            <li>O histórico fica salvo para sempre, visível na aba "Histórico".</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Item 2: Kanban */}
                                <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-lg px-4">
                                    <AccordionTrigger className="hover:no-underline hover:text-emerald-600 py-4">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <Columns className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">2. O Funil de Vendas (Kanban)</span>
                                                <p className="text-xs text-slate-500 font-normal mt-0.5">Visualize seus negócios em andamento.</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 p-2 pt-0">
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Use a aba <strong>Funil (Kanban)</strong> para ver oportunidades abertas.</li>
                                            <li>Cada coluna é uma etapa: <em>Prospecção, Qualificação, Proposta...</em></li>
                                            <li><strong>Arraste e solte</strong> os cartões (cards) para avançar um negócio de etapa.</li>
                                            <li>Cartões com <strong className="text-emerald-600">Alta Probabilidade</strong> ganham destaque.</li>
                                            <li>Clique no card para ver detalhes rápidos ou editar.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Item 3: Rotina */}
                                <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-lg px-4">
                                    <AccordionTrigger className="hover:no-underline hover:text-amber-600 py-4">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">3. Rotina de Sucesso</span>
                                                <p className="text-xs text-slate-500 font-normal mt-0.5">Sugestão de fluxo diário.</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 p-2 pt-0">
                                        <div className="bg-amber-50 p-3 rounded-md text-sm border border-amber-100">
                                            <p className="font-semibold text-amber-800 mb-1">Comece o dia assim:</p>
                                            <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                                                <li>Abra o <strong>Funil</strong> e veja o que está em "Proposta" ou "Fechamento".</li>
                                                <li>Faça follow-up (ligue/mande msg) para esses clientes quentes.</li>
                                                <li>Registre cada tentativa no botão <strong>Nova Interação</strong>.</li>
                                                <li>Se fechar venda, arraste o card para "Negócio Fechado"!</li>
                                            </ol>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>

                            <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <p>
                                    <strong>Dica de Ouro:</strong> CRM é constância. 5 minutos por dia registrando suas ações economizam horas de dor de cabeça no fim do mês!
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
                <div className="p-4 border-t bg-white flex justify-end">
                    <Button onClick={onClose} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Entendi, vamos lá!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
