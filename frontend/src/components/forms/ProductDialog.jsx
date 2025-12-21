import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
                        <TabsContent value="dados" className="mt-0 space-y-4">
                            {/* Código do fabricante */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs">Código do fabricante</Label>
                                    <Input
                                        value={codigoFabricante}
                                        onChange={(e) => setCodigoFabricante(e.target.value)}
                                        className="h-8 text-sm"
                                        placeholder="Código"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Cód. original</Label>
                                    <Input
                                        value={codigoOriginal}
                                        onChange={(e) => setCodigoOriginal(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Cód. barras</Label>
                                    <Input
                                        value={codigoBarras}
                                        onChange={(e) => setCodigoBarras(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Conversão</Label>
                                    <Input
                                        value={conversao}
                                        onChange={(e) => setConversao(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Descrição e Aplicação */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">Descrição</Label>
                                    <Input
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        className="h-8 text-sm"
                                        placeholder="Descrição do produto"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Aplicação</Label>
                                    <Input
                                        value={aplicacao}
                                        onChange={(e) => setAplicacao(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Família, NCM, FINAME */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">Família de produtos</Label>
                                    <Input
                                        value={familiaProdutos}
                                        onChange={(e) => setFamiliaProdutos(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">NCM</Label>
                                    <Input
                                        value={ncm}
                                        onChange={(e) => setNcm(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">FINAME</Label>
                                    <Input
                                        value={finame}
                                        onChange={(e) => setFiname(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Categoria */}
                            <div>
                                <Label className="text-xs">Categoria</Label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="categoria"
                                            value="leve"
                                            checked={categoria === 'leve'}
                                            onChange={(e) => setCategoria(e.target.value)}
                                        />
                                        Linha leve
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="categoria"
                                            value="pesada"
                                            checked={categoria === 'pesada'}
                                            onChange={(e) => setCategoria(e.target.value)}
                                        />
                                        Linha pesada
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="categoria"
                                            value="agricola"
                                            checked={categoria === 'agricola'}
                                            onChange={(e) => setCategoria(e.target.value)}
                                        />
                                        Linha agrícola
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="categoria"
                                            value="utilitarios"
                                            checked={categoria === 'utilitarios'}
                                            onChange={(e) => setCategoria(e.target.value)}
                                        />
                                        Utilitários
                                    </label>
                                </div>
                            </div>

                            {/* Grupo de produtos, Grupo desconto, Tabela */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">Grupo de produtos</Label>
                                    <Input
                                        value={grupoProdutos}
                                        onChange={(e) => setGrupoProdutos(e.target.value)}
                                        className="h-8 text-sm"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Grupo desconto</Label>
                                    <Input
                                        value={grupoDesconto}
                                        onChange={(e) => setGrupoDesconto(e.target.value)}
                                        className="h-8 text-sm"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Tabela</Label>
                                    <Input
                                        value={tabelaNome}
                                        onChange={(e) => setTabelaNome(e.target.value)}
                                        className="h-8 text-sm"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold text-sm mb-4">Preços</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <Label className="text-xs">Preço bruto</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                                            <Input
                                                value={precoBruto}
                                                onChange={handleCurrencyChange(setPrecoBruto)}
                                                onBlur={handleCurrencyBlur(setPrecoBruto, precoBruto)}
                                                className="h-8 text-sm pl-10"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Preço promoção</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                                            <Input
                                                value={precoPromocao}
                                                onChange={handleCurrencyChange(setPrecoPromocao)}
                                                onBlur={handleCurrencyBlur(setPrecoPromocao, precoPromocao)}
                                                className="h-8 text-sm pl-10"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Preço especial</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                                            <Input
                                                value={precoEspecial}
                                                onChange={handleCurrencyChange(setPrecoEspecial)}
                                                onBlur={handleCurrencyBlur(setPrecoEspecial, precoEspecial)}
                                                className="h-8 text-sm pl-10"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Preço {'>'}= qtd</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                                            <Input
                                                value={precoQtd}
                                                onChange={handleCurrencyChange(setPrecoQtd)}
                                                onBlur={handleCurrencyBlur(setPrecoQtd, precoQtd)}
                                                className="h-8 text-sm pl-10"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-sm mb-4">Detalhamento / Descontos / Impostos</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <Label className="text-xs">% Comissão</Label>
                                        <Input
                                            value={comissao}
                                            onChange={(e) => setComissao(e.target.value)}
                                            className="h-8 text-sm"
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Embalagem</Label>
                                        <Input
                                            value={embalagem}
                                            onChange={(e) => setEmbalagem(e.target.value)}
                                            className="h-8 text-sm"
                                            type="number"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Adicional</Label>
                                        <Input
                                            value={descontoAdicional}
                                            onChange={(e) => setDescontoAdicional(e.target.value)}
                                            className="h-8 text-sm"
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Especial</Label>
                                        <Input
                                            value={descontoEspecial}
                                            onChange={(e) => setDescontoEspecial(e.target.value)}
                                            className="h-8 text-sm"
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    <div>
                                        <Label className="text-xs">IPI</Label>
                                        <div className="relative">
                                            <Input
                                                value={ipi}
                                                onChange={handlePercentChange(setIpi)}
                                                onBlur={handlePercentBlur(setIpi, ipi)}
                                                className="h-8 text-sm pr-8"
                                                placeholder="0,00"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">ST</Label>
                                        <div className="relative">
                                            <Input
                                                value={st}
                                                onChange={handlePercentChange(setSt)}
                                                onBlur={handlePercentBlur(setSt, st)}
                                                className="h-8 text-sm pr-8"
                                                placeholder="0,00"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Peso/Quant</Label>
                                        <Input
                                            value={pesoQuant}
                                            onChange={(e) => setPesoQuant(e.target.value)}
                                            className="h-8 text-sm"
                                            type="number"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Venc. promoção</Label>
                                        <Input
                                            value={vencPromocao}
                                            onChange={(e) => setVencPromocao(e.target.value)}
                                            className="h-8 text-sm"
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
