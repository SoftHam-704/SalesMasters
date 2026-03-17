import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import InputField from '../InputField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import '../FormLayout.css';

const ProductDialog = ({ open, onOpenChange, product, industria, tabela, onSave }) => {
    const [activeTab, setActiveTab] = useState('dados');
    const isMasterCatalog = !tabela;

    // Dados FIXOS (cad_prod)
    const [codigoFabricante, setCodigoFabricante] = useState('');
    const [codigoOriginal, setCodigoOriginal] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [conversao, setConversao] = useState('');
    const [descricao, setDescricao] = useState('');
    const [aplicacao, setAplicacao] = useState('');
    const [familiaProdutos, setFamiliaProdutos] = useState('');
    const [ncm, setNcm] = useState('');
    const [finame, setFiname] = useState('');
    const [grupoProdutos, setGrupoProdutos] = useState('');
    const [grupoDesconto, setGrupoDesconto] = useState('');
    const [tabelaNome, setTabelaNome] = useState('');

    // Categorias (Checkboxes)
    const [linhaLeve, setLinhaLeve] = useState(false);
    const [linhaPesada, setLinhaPesada] = useState(false);
    const [linhaAgricola, setLinhaAgricola] = useState(false);
    const [utilitarios, setUtilitarios] = useState(false);
    const [motocicletas, setMotocicletas] = useState(false);
    const [offRoad, setOffRoad] = useState(false);

    // Dados VARIÁVEIS (cad_tabelaspre)
    const [precoBruto, setPrecoBruto] = useState('');
    const [precoPromocao, setPrecoPromocao] = useState('');
    const [precoEspecial, setPrecoEspecial] = useState('');
    const [precoQtd, setPrecoQtd] = useState('');
    const [comissao, setComissao] = useState('');
    const [embalagem, setEmbalagem] = useState('');
    const [descontoAdicional, setDescontoAdicional] = useState('');
    const [descontoEspecial, setDescontoEspecial] = useState('');
    const [ipi, setIpi] = useState('');
    const [st, setSt] = useState('');
    const [lblCurva, setLblCurva] = useState('');
    const [pesoQuant, setPesoQuant] = useState('');
    const [vencPromocao, setVencPromocao] = useState('');

    useEffect(() => {
        if (product) {
            // Carregar dados do produto para edição
            setCodigoFabricante(product.pro_codprod || '');
            setCodigoOriginal(product.pro_codigooriginal || '');
            setCodigoBarras(product.pro_codbarras || '');
            setConversao(product.pro_conversao || '');
            setDescricao(product.pro_nome || '');
            setAplicacao(product.pro_aplicacao || '');
            setNcm(product.pro_ncm || '');
            setGrupoProdutos(product.pro_grupo?.toString() || '');
            
            // Categorias
            setLinhaLeve(!!product.pro_linhaleve);
            setLinhaPesada(!!product.pro_linhapesada);
            setLinhaAgricola(!!product.pro_linhaagricola);
            setUtilitarios(!!product.pro_linhautilitarios);
            setMotocicletas(!!product.pro_motocicletas);
            setOffRoad(!!product.pro_offroad);

            // Dados variáveis
            setPrecoBruto(product.itab_precobruto?.toString() || '');
            setPrecoPromocao(product.itab_precopromo?.toString() || '');
            setPrecoEspecial(product.itab_precoespecial?.toString() || '');
            setEmbalagem(product.pro_embalagem?.toString() || '');
            setIpi(product.itab_ipi?.toString() || '');
            setSt(product.itab_st?.toString() || '');
            setPrecoQtd(product.itab_prepeso?.toString() || '');
            setDescontoAdicional(product.itab_descontoadd?.toString() || '');
        } else {
            // Limpar para novo produto
            clearForm();
        }
        setReplicate(false);
        setTabelaNome(tabela || '');
    }, [product, tabela]);

    const clearForm = () => {
        setCodigoFabricante('');
        setCodigoOriginal('');
        setCodigoBarras('');
        setConversao('');
        setDescricao('');
        setAplicacao('');
        setFamiliaProdutos('');
        setNcm('');
        setFiname('');
        setGrupoProdutos('');
        setGrupoDesconto('');
        setLinhaLeve(false);
        setLinhaPesada(false);
        setLinhaAgricola(false);
        setUtilitarios(false);
        setMotocicletas(false);
        setOffRoad(false);
        setPrecoBruto('');
        setPrecoPromocao('');
        setPrecoEspecial('');
        setPrecoQtd('');
        setComissao('');
        setEmbalagem('');
        setDescontoAdicional('');
        setDescontoEspecial('');
        setIpi('');
        setSt('');
        setLblCurva('');
        setPesoQuant('');
        setVencPromocao('');
    };

    // Funções de formatação
    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const cleanValue = value.toString().replace(/[^\d,]/g, '');
        const numValue = parseFloat(cleanValue.replace(',', '.'));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const cleanValue = value.toString().replace(/[^\d,]/g, '');
        const numValue = parseFloat(cleanValue.replace(',', '.'));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseCurrency = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue);
        return isNaN(numValue) ? null : numValue;
    };

    const handleCurrencyChange = (setter) => (e) => {
        const value = e.target.value.replace(/[^\d,]/g, '');
        setter(value);
    };

    const handlePercentChange = (setter) => (e) => {
        const value = e.target.value.replace(/[^\d,]/g, '');
        setter(value);
    };

    const handleCurrencyBlur = (setter, value) => () => {
        if (value) {
            setter(formatCurrency(value));
        }
    };

    const handlePercentBlur = (setter, value) => () => {
        if (value) {
            setter(formatPercent(value));
        }
    };

    const [replicate, setReplicate] = useState(false);

    const handleSave = async () => {
        if (!codigoFabricante || !descricao) {
            toast.error('Código e Descrição são obrigatórios');
            return;
        }

        const dadosProduto = {
            // Dados fixos (cad_prod)
            codigo: codigoFabricante,
            codigoOriginal,
            codigoBarras,
            conversao,
            descricao,
            aplicacao,
            ncm,
            grupo: parseInt(grupoProdutos) || null,
            embalagem: parseInt(embalagem) || null,
            peso: parseFloat(pesoQuant) || null,
            
            // Categorias
            linhaleve: linhaLeve,
            linhapesada: linhaPesada,
            linhaagricola: linhaAgricola,
            linhautilitarios: utilitarios,
            motocicletas: motocicletas,
            offroad: offRoad,

            // Dados variáveis (cad_tabelaspre)
            industria,
            tabela: tabelaNome,
            precobruto: parseCurrency(precoBruto) || 0,
            precopromo: parseCurrency(precoPromocao),
            precoespecial: parseCurrency(precoEspecial),
            ipi: parseCurrency(ipi) || 0,
            st: parseCurrency(st) || 0,
            descontoadd: parseCurrency(descontoAdicional) || 0,
            descontoespecial: parseCurrency(descontoEspecial) || 0,
            grupodesconto: parseInt(grupoDesconto) || null,
            prepeso: parseCurrency(precoQtd) || 0,
            comissao: parseCurrency(comissao) || 0,
            venc_promocao: vencPromocao || null,

            // Flag de replicação
            replicate
        };

        onSave(dadosProduto);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] p-0 border border-stone-200 bg-white shadow-2xl overflow-hidden rounded-xl">
                <DialogHeader className="px-8 py-6 border-b border-stone-100 bg-stone-50/50">
                    <DialogTitle className="text-2xl font-display font-semibold tracking-tight text-stone-900">
                        {product ? 'Alterar Produto' : 'Novo Produto'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-8 pt-6">
                        <TabsList className="grid w-full grid-cols-2 bg-stone-100/80 p-1 rounded-lg">
                            <TabsTrigger value="dados" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm font-mono text-xs uppercase tracking-widest py-2.5">Dados principais</TabsTrigger>
                            <TabsTrigger value="listagem" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm font-mono text-xs uppercase tracking-widest py-2.5">Histórico / Listagem</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                        <TabsContent value="dados" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Seção: Identificação */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">Identificação do Produto</h3>
                                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                    <div className="col-span-3">
                                        <InputField
                                            label="Código do fabricante"
                                            value={codigoFabricante}
                                            onChange={(e) => setCodigoFabricante(e.target.value)}
                                            placeholder="Ex: ABC-123"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <InputField
                                            label="Cód. original"
                                            value={codigoOriginal}
                                            onChange={(e) => setCodigoOriginal(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <InputField
                                            label="Cód. barras"
                                            value={codigoBarras}
                                            onChange={(e) => setCodigoBarras(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <InputField
                                            label="Conversão"
                                            value={conversao}
                                            onChange={(e) => setConversao(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-12">
                                        <InputField
                                            label="Descrição Completa"
                                            value={descricao}
                                            onChange={(e) => setDescricao(e.target.value)}
                                            placeholder="Descrição comercial do produto"
                                            large
                                        />
                                    </div>
                                    <div className="col-span-12">
                                        <div className="input-field large">
                                            <label className="field-label">Aplicação / Referência</label>
                                            <textarea
                                                value={aplicacao || ''}
                                                onChange={(e) => setAplicacao(e.target.value)}
                                                placeholder="Ex: FH 400 / 440 / 480 / B12R, Corolla 2018-2024, Civic 2020+..."
                                                rows={3}
                                                style={{
                                                    width: '100%',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                    fontSize: '13px',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #d6d3d1',
                                                    background: '#fafaf9',
                                                    color: '#1c1917',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                                    minHeight: '72px',
                                                    maxHeight: '160px'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#a8a29e';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(168, 162, 158, 0.15)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#d6d3d1';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção: Classificação e Categorias */}
                            <div className="grid grid-cols-12 gap-x-8 gap-y-6 pt-2 border-t border-stone-100">
                                <div className="col-span-7 space-y-4">
                                    <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Categorias de Mercado</h3>
                                    <div className="grid grid-cols-3 gap-y-4 gap-x-2 bg-stone-50/80 p-6 rounded-xl border border-stone-200/60 shadow-inner">
                                        {[
                                            { label: 'Linha Leve', state: linhaLeve, setter: setLinhaLeve },
                                            { label: 'Linha Pesada', state: linhaPesada, setter: setLinhaPesada },
                                            { label: 'Agrícola', state: linhaAgricola, setter: setLinhaAgricola },
                                            { label: 'Utilitários', state: utilitarios, setter: setUtilitarios },
                                            { label: 'Motocicletas', state: motocicletas, setter: setMotocicletas },
                                            { label: 'Off-Road', state: offRoad, setter: setOffRoad },
                                        ].map((cat, idx) => (
                                            <label key={idx} className="flex items-center gap-3 cursor-pointer group select-none hover:bg-white/50 p-2 rounded-lg transition-colors">
                                                <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${cat.state ? 'bg-stone-850 border-stone-850 shadow-sm' : 'bg-white border-stone-300 group-hover:border-stone-500'}`}>
                                                    {cat.state && <Check className="h-3.5 w-3.5 text-white" />}
                                                </div>
                                                <span className={`text-[13px] font-medium transition-colors ${cat.state ? 'text-stone-900' : 'text-stone-500'}`}>{cat.label}</span>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={cat.state}
                                                    onChange={(e) => cat.setter(e.target.checked)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-5 space-y-4">
                                    <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Classificação Fiscal</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-stone-50/30 p-4 rounded-xl border border-stone-50">
                                        <InputField label="NCM" value={ncm} onChange={(e) => setNcm(e.target.value)} />
                                        <InputField label="Grupo" value={grupoProdutos} onChange={(e) => setGrupoProdutos(e.target.value)} type="number" />
                                        <div className="col-span-2">
                                            <InputField label="Tabela" value={tabelaNome} disabled className="bg-stone-100/50 opacity-70" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção: Preços e Impostos (Condicional) */}
                            {!isMasterCatalog && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="pt-6 border-t border-stone-200">
                                        <h3 className="text-sm font-display font-semibold text-stone-900 mb-6 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            Valores e Condições Comerciais
                                        </h3>
                                        <div className="grid grid-cols-4 gap-6">
                                            <InputField
                                                label="Preço Bruto"
                                                value={precoBruto}
                                                onChange={handleCurrencyChange(setPrecoBruto)}
                                                onBlur={handleCurrencyBlur(setPrecoBruto, precoBruto)}
                                                className="text-right text-emerald-800 font-display font-medium text-lg border-emerald-100 focus:border-emerald-500 bg-emerald-50/10"
                                            />
                                            <InputField label="Preço Promo" value={precoPromocao} onChange={handleCurrencyChange(setPrecoPromocao)} onBlur={handleCurrencyBlur(setPrecoPromocao, precoPromocao)} className="text-right" />
                                            <InputField label="Preço Especial" value={precoEspecial} onChange={handleCurrencyChange(setPrecoEspecial)} onBlur={handleCurrencyBlur(setPrecoEspecial, precoEspecial)} className="text-right" />
                                            <InputField label="Venc. Promoção" value={vencPromocao} onChange={(e) => setVencPromocao(e.target.value)} type="date" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-6 bg-stone-50/40 p-6 rounded-2xl border border-stone-100/50">
                                        <InputField label="IPI (%)" value={ipi} onChange={handlePercentChange(setIpi)} onBlur={handlePercentBlur(setIpi, ipi)} className="text-right" />
                                        <InputField label="ST (%)" value={st} onChange={handlePercentChange(setSt)} onBlur={handlePercentBlur(setSt, st)} className="text-right" />
                                        <InputField label="Adicional (%)" value={descontoAdicional} onChange={handlePercentChange(setDescontoAdicional)} onBlur={handlePercentBlur(setDescontoAdicional, descontoAdicional)} className="text-right" />
                                        <InputField label="Especial (%)" value={descontoEspecial} onChange={handlePercentChange(setDescontoEspecial)} onBlur={handlePercentBlur(setDescontoEspecial, descontoEspecial)} className="text-right" />
                                        <InputField label="Embalagem" value={embalagem} onChange={(e) => setEmbalagem(e.target.value.replace(/\D/g, ''))} />
                                        <InputField label="% Comissão" value={comissao} onChange={handlePercentChange(setComissao)} onBlur={handlePercentBlur(setComissao, comissao)} className="text-right" />
                                        <InputField label="Peso Unit." value={pesoQuant} onChange={handleCurrencyChange(setPesoQuant)} onBlur={handleCurrencyBlur(setPesoQuant, pesoQuant)} className="text-right" />
                                        <InputField label="Preço > Qtd" value={precoQtd} onChange={handleCurrencyChange(setPrecoQtd)} onBlur={handleCurrencyBlur(setPrecoQtd, precoQtd)} className="text-right" />
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="listagem" className="mt-0 h-full flex items-center justify-center p-12">
                            <div className="flex flex-col items-center gap-4 text-stone-400">
                                <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-400 rounded-full animate-spin-slow"></div>
                                <p className="font-mono text-[10px] uppercase tracking-widest">Calculando histórico de preços...</p>
                            </div>
                        </TabsContent>
                    </div>

                    <div className="px-8 py-6 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {!isMasterCatalog && (
                                <label className="flex items-center gap-3 cursor-pointer group select-none py-2 px-3 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-200">
                                    <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${replicate ? 'bg-stone-900 border-stone-900' : 'bg-white border-stone-300'}`}>
                                        {replicate && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="text-xs font-semibold text-stone-600">Replicar em todas as tabelas</span>
                                    <input type="checkbox" className="hidden" checked={replicate} onChange={(e) => setReplicate(e.target.checked)} />
                                </label>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => onOpenChange(false)}
                                className="px-6 py-2.5 rounded-full border border-stone-300 text-stone-600 hover:bg-white hover:text-stone-900 transition-all font-mono text-[10px] uppercase tracking-[0.15em]"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-8 py-2.5 rounded-full bg-stone-850 text-white hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 font-mono text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 group active:scale-95"
                            >
                                Confirmar e Salvar
                                <div className="w-4 h-4 rounded-full border border-white/30 border-t-white group-hover:block hidden animate-spin"></div>
                            </button>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default ProductDialog;
