import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from '../InputField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import '../FormLayout.css';

const ProductDialog = ({ open, onOpenChange, product, industria, tabela, onSave }) => {
    const [activeTab, setActiveTab] = useState('dados');

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
    const [categoria, setCategoria] = useState('');
    const [grupoProdutos, setGrupoProdutos] = useState('');
    const [grupoDesconto, setGrupoDesconto] = useState('');
    const [tabelaNome, setTabelaNome] = useState('');

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
            setDescricao(product.pro_nome || '');
            setAplicacao(product.pro_aplicacao || '');
            setNcm(product.pro_ncm || '');
            setGrupoProdutos(product.pro_grupo?.toString() || '');

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
        setCategoria('');
        setGrupoProdutos('');
        setGrupoDesconto('');
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
        if (!value) return '';
        const numValue = parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPercent = (value) => {
        if (!value) return '';
        const numValue = parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseCurrency = (value) => {
        if (!value) return null;
        return parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || null;
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

            // Dados variáveis (cad_tabelaspre)
            industria,
            tabela: tabelaNome,
            precobruto: parseCurrency(precoBruto) || 0,
            precopromo: parseCurrency(precoPromocao),
            precoespecial: parseCurrency(precoEspecial),
            ipi: parseCurrency(ipi) || 0,
            st: parseCurrency(st) || 0,
            descontoadd: parseCurrency(descontoAdicional) || 0,
            grupodesconto: parseInt(grupoDesconto) || null,
            prepeso: parseCurrency(precoQtd) || 0,
        };

        onSave(dadosProduto);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl font-bold">
                        {product ? 'Alterar Produto' : 'Novo Produto'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="dados">Dados</TabsTrigger>
                            <TabsTrigger value="listagem">Listagem</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="px-6 py-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                        <TabsContent value="dados" className="mt-0 space-y-4 p-4">
                            <div className="form-grid">
                                {/* Código do fabricante */}
                                <div className="col-3">
                                    <InputField
                                        label="Código do fabricante"
                                        value={codigoFabricante}
                                        onChange={(e) => setCodigoFabricante(e.target.value)}
                                        placeholder="Código"
                                    />
                                </div>
                                <div className="col-3">
                                    <InputField
                                        label="Cód. original"
                                        value={codigoOriginal}
                                        onChange={(e) => setCodigoOriginal(e.target.value)}
                                    />
                                </div>
                                <div className="col-3">
                                    <InputField
                                        label="Cód. barras"
                                        value={codigoBarras}
                                        onChange={(e) => setCodigoBarras(e.target.value)}
                                    />
                                </div>
                                <div className="col-3">
                                    <InputField
                                        label="Conversão"
                                        value={conversao}
                                        onChange={(e) => setConversao(e.target.value)}
                                    />
                                </div>

                                {/* Descrição e Aplicação */}
                                <div className="col-6">
                                    <InputField
                                        label="Descrição"
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        placeholder="Descrição do produto"
                                        large
                                    />
                                </div>
                                <div className="col-6">
                                    <InputField
                                        label="Aplicação"
                                        value={aplicacao}
                                        onChange={(e) => setAplicacao(e.target.value)}
                                    />
                                </div>

                                {/* Família, NCM, FINAME */}
                                <div className="col-4">
                                    <InputField
                                        label="Família de produtos"
                                        value={familiaProdutos}
                                        onChange={(e) => setFamiliaProdutos(e.target.value)}
                                    />
                                </div>
                                <div className="col-4">
                                    <InputField
                                        label="NCM"
                                        value={ncm}
                                        onChange={(e) => setNcm(e.target.value)}
                                    />
                                </div>
                                <div className="col-4">
                                    <InputField
                                        label="FINAME"
                                        value={finame}
                                        onChange={(e) => setFiname(e.target.value)}
                                    />
                                </div>

                                {/* Categoria */}
                                <div className="col-12 border rounded-xl p-3 bg-gray-50 flex flex-col justify-center">
                                    <label className="text-xs font-semibold text-gray-500 mb-2">Categoria</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="categoria"
                                                value="leve"
                                                checked={categoria === 'leve'}
                                                onChange={(e) => setCategoria(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Linha leve
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="categoria"
                                                value="pesada"
                                                checked={categoria === 'pesada'}
                                                onChange={(e) => setCategoria(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Linha pesada
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="categoria"
                                                value="agricola"
                                                checked={categoria === 'agricola'}
                                                onChange={(e) => setCategoria(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Linha agrícola
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="categoria"
                                                value="utilitarios"
                                                checked={categoria === 'utilitarios'}
                                                onChange={(e) => setCategoria(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Utilitários
                                        </label>
                                    </div>
                                </div>

                                {/* Grupo de produtos, Grupo desconto, Tabela */}
                                <div className="col-4">
                                    <InputField
                                        label="Grupo de produtos"
                                        value={grupoProdutos}
                                        onChange={(e) => setGrupoProdutos(e.target.value)}
                                        type="number"
                                    />
                                </div>
                                <div className="col-4">
                                    <InputField
                                        label="Grupo desconto"
                                        value={grupoDesconto}
                                        onChange={(e) => setGrupoDesconto(e.target.value)}
                                        type="number"
                                    />
                                </div>
                                <div className="col-4">
                                    <InputField
                                        label="Tabela"
                                        value={tabelaNome}
                                        onChange={(e) => setTabelaNome(e.target.value)}
                                        disabled
                                        className="bg-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold text-sm mb-4">Preços</h3>
                                <div className="form-grid">
                                    <div className="col-3">
                                        <InputField
                                            label="Preço bruto"
                                            value={precoBruto}
                                            onChange={handleCurrencyChange(setPrecoBruto)}
                                            onBlur={handleCurrencyBlur(setPrecoBruto, precoBruto)}
                                            placeholder="0,00"
                                            className="text-right text-emerald-700 font-bold"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Preço promoção"
                                            value={precoPromocao}
                                            onChange={handleCurrencyChange(setPrecoPromocao)}
                                            onBlur={handleCurrencyBlur(setPrecoPromocao, precoPromocao)}
                                            placeholder="0,00"
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Preço especial"
                                            value={precoEspecial}
                                            onChange={handleCurrencyChange(setPrecoEspecial)}
                                            onBlur={handleCurrencyBlur(setPrecoEspecial, precoEspecial)}
                                            placeholder="0,00"
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Preço > qtd"
                                            value={precoQtd}
                                            onChange={handleCurrencyChange(setPrecoQtd)}
                                            onBlur={handleCurrencyBlur(setPrecoQtd, precoQtd)}
                                            placeholder="0,00"
                                            className="text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-sm mb-4">Detalhamento / Descontos / Impostos</h3>
                                <div className="form-grid">
                                    <div className="col-3">
                                        <InputField
                                            label="% Comissão"
                                            value={comissao}
                                            onChange={(e) => setComissao(e.target.value)}
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Embalagem"
                                            value={embalagem}
                                            onChange={(e) => setEmbalagem(e.target.value)}
                                            type="number"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Adicional"
                                            value={descontoAdicional}
                                            onChange={(e) => setDescontoAdicional(e.target.value)}
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Especial"
                                            value={descontoEspecial}
                                            onChange={(e) => setDescontoEspecial(e.target.value)}
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-3">
                                        <InputField
                                            label="IPI %"
                                            value={ipi}
                                            onChange={handlePercentChange(setIpi)}
                                            onBlur={handlePercentBlur(setIpi, ipi)}
                                            placeholder="0,00"
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="ST %"
                                            value={st}
                                            onChange={handlePercentChange(setSt)}
                                            onBlur={handlePercentBlur(setSt, st)}
                                            placeholder="0,00"
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Peso/Quant"
                                            value={pesoQuant}
                                            onChange={(e) => setPesoQuant(e.target.value)}
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-3">
                                        <InputField
                                            label="Venc. promoção"
                                            value={vencPromocao}
                                            onChange={(e) => setVencPromocao(e.target.value)}
                                            type="date"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="listagem" className="mt-0">
                            <div className="text-center py-12 text-gray-500">
                                <p>Aba de listagem - Em desenvolvimento</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="px-6 py-4 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductDialog;
