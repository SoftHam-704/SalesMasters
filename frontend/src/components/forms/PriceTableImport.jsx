import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import '../FormLayout.css';
import InputField from '../InputField';

const PriceTableImport = () => {
    const [formData, setFormData] = useState({
        industria: '',
        nomeTabela: '',
        tabelaExistente: '',
        grupoDesconto: '',
        dataTabela: new Date().toISOString().split('T')[0],
        dataVencimento: '',
    });

    const [textareas, setTextareas] = useState({
        codigo: '',
        complemento: '',
        nome: '',
        precobruto: '',
        precopromo: '',
        precoespecial: '',
        grupo: '',
        aplicacao: '',
        embalagem: '',
        ipi: '',
        st: '',
        codigooriginal: '',
        codbarras: '',
        descontoadd: '',
        ncm: '',
        curva: '',
        categoria: '',
        conversao: ''
    });

    const [lineCounts, setLineCounts] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [existingTables, setExistingTables] = useState([]);
    const [discountGroups, setDiscountGroups] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [useExistingTable, setUseExistingTable] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

    // Carregar indústrias
    useEffect(() => {
        fetch('http://localhost:3005/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setIndustries(data.data);
                }
            })
            .catch(err => console.error('Erro ao carregar indústrias:', err));
    }, []);

    // Carregar grupos de desconto
    useEffect(() => {
        fetch('http://localhost:3005/api/v2/discount-groups')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiscountGroups(data.data);
                }
            })
            .catch(err => console.error('Erro ao carregar grupos de desconto:', err));
    }, []);

    // Carregar tabelas existentes quando indústria for selecionada
    useEffect(() => {
        if (formData.industria) {
            fetch(`http://localhost:3005/api/price-tables/${formData.industria}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setExistingTables(data.data);
                    }
                })
                .catch(err => console.error('Erro ao carregar tabelas:', err));
        } else {
            setExistingTables([]);
        }
    }, [formData.industria]);

    // Contar linhas em cada textarea
    useEffect(() => {
        const counts = {};
        Object.keys(textareas).forEach(key => {
            const lines = textareas[key].split('\n').filter(line => line.trim() !== '');
            counts[key] = lines.length;
        });
        setLineCounts(counts);

        // Validar se todas as textareas com conteúdo têm o mesmo número de linhas
        const nonEmptyCounts = Object.values(counts).filter(count => count > 0);
        const allEqual = nonEmptyCounts.length > 0 &&
            nonEmptyCounts.every(count => count === nonEmptyCounts[0]);
        setIsValid(allEqual && nonEmptyCounts[0] > 0);
    }, [textareas]);

    const handleTextareaChange = (field, value) => {
        setTextareas(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImport = async () => {
        if (!formData.industria || !formData.nomeTabela) {
            alert('Por favor, preencha Indústria e Nome da Tabela!');
            return;
        }

        if (!isValid) {
            alert('Os campos não têm o mesmo número de linhas!');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            // 1. Montar array de produtos a partir dos textareas
            const linhasCodigo = textareas.codigo.split('\n').filter(l => l.trim() !== '');
            const totalProdutos = linhasCodigo.length;



            const produtos = linhasCodigo.map((_, index) => {
                const getLinha = (field) => {
                    const linhas = textareas[field]?.split('\n') || [];
                    return linhas[index]?.trim() || '';
                };

                return {
                    codigo: getLinha('codigo'),
                    complemento: getLinha('complemento'),
                    descricao: getLinha('nome'),
                    precobruto: parseFloat(getLinha('precobruto').replace(',', '.')) || 0,
                    precopromo: getLinha('precopromo') ? parseFloat(getLinha('precopromo').replace(',', '.')) : null,
                    precoespecial: getLinha('precoespecial') ? parseFloat(getLinha('precoespecial').replace(',', '.')) : null,
                    grupo: getLinha('grupo'),
                    aplicacao: getLinha('aplicacao'),
                    embalagem: getLinha('embalagem'),
                    ipi: parseFloat(getLinha('ipi').replace(',', '.')) || 0,
                    st: parseFloat(getLinha('st').replace(',', '.')) || 0,
                    codigooriginal: getLinha('codigooriginal'),
                    codbarras: getLinha('codbarras'),
                    descontoadd: parseFloat(getLinha('descontoadd').replace(',', '.')) || 0,
                    ncm: getLinha('ncm'),
                    curva: getLinha('curva'),
                    categoria: getLinha('categoria'),
                    conversao: getLinha('conversao')
                };
            });

            // 2. Dividir em lotes de 200 (otimizado para grandes volumes - 20k+ produtos)
            const TAMANHO_LOTE = 200;
            const lotes = [];
            for (let i = 0; i < produtos.length; i += TAMANHO_LOTE) {
                lotes.push(produtos.slice(i, i + TAMANHO_LOTE));
            }



            // Inicializar progresso
            setProgress({ current: 0, total: lotes.length, percentage: 0 });

            // 3. Enviar cada lote
            let totalInseridos = 0;
            let totalAtualizados = 0;
            let totalErros = 0;
            const detalhesErros = [];

            for (let i = 0; i < lotes.length; i++) {
                const lote = lotes[i];
                const numeroLote = i + 1;

                // Atualizar progresso
                const percentage = Math.round((numeroLote / lotes.length) * 100);
                setProgress({ current: numeroLote, total: lotes.length, percentage });

                // console.log(`🚀 Enviando lote ${numeroLote}/${lotes.length} (${lote.length} produtos)...`);

                const payload = {
                    industria: parseInt(formData.industria),
                    nomeTabela: formData.nomeTabela.toUpperCase(),
                    grupoDesconto: formData.grupoDesconto && formData.grupoDesconto !== 'none'
                        ? parseInt(formData.grupoDesconto)
                        : null,
                    dataTabela: formData.dataTabela,
                    dataVencimento: formData.dataVencimento || null,
                    produtos: lote
                };

                const response = await fetch('http://localhost:3005/api/price-tables/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    totalInseridos += data.resumo.produtosNovos || 0;
                    totalAtualizados += data.resumo.produtosAtualizados || 0;
                    totalErros += data.resumo.erros || 0;

                    if (data.resumo.detalhesErros && data.resumo.detalhesErros.length > 0) {
                        detalhesErros.push(...data.resumo.detalhesErros);
                    }

                    // console.log(`✅ Lote ${numeroLote} processado: ${data.resumo.produtosNovos} novos, ${data.resumo.produtosAtualizados} atualizados`);
                } else {
                    throw new Error(data.message || 'Erro ao processar lote');
                }
            }

            // 4. Mostrar resultado final
            setResult({
                success: true,
                message: 'Importação concluída com sucesso!',
                resumo: {
                    total: totalProdutos,
                    inseridos: totalInseridos,
                    atualizados: totalAtualizados,
                    erros: totalErros,
                    detalhesErros: detalhesErros
                }
            });

            // console.log('🎉 Importação concluída!', {
            //     total: totalProdutos,
            //     inseridos: totalInseridos,
            //     atualizados: totalAtualizados,
            //     erros: totalErros
            // });

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            setResult({
                success: false,
                message: `Erro na importação: ${error.message}`
            });
        } finally {
            setImporting(false);
        }
    };

    const getLineCountColor = (field) => {
        const count = lineCounts[field] || 0;
        if (count === 0) return 'text-gray-400';

        const nonZeroCounts = Object.values(lineCounts).filter(c => c > 0);
        const maxCount = Math.max(...nonZeroCounts);

        return count === maxCount ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
    };

    const TextareaField = ({ label, field, required = false }) => {
        // Campos que devem ter scrollbar horizontal
        const useScrollbar = field === 'nome' || field === 'aplicacao';

        return (
            <div className="col-2 flex flex-col h-full">
                <Label className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex-1 relative">
                    <Textarea
                        value={textareas[field]}
                        onChange={(e) => handleTextareaChange(field, e.target.value)}
                        className={`modern-textarea ${useScrollbar ? 'overflow-x-auto whitespace-nowrap' : ''} h-full min-h-[150px]`}
                        placeholder={`Cole os dados de ${label.toLowerCase()} aqui (uma por linha)`}
                    />
                    <div
                        className={`absolute bottom-2 right-2 text-xs ${getLineCountColor(field)} cursor-pointer hover:underline hover:text-red-600 transition-colors bg-white/80 px-1 rounded`}
                        onClick={() => handleTextareaChange(field, '')}
                        title="Clique para limpar este campo"
                    >
                        {lineCounts[field] || 0} linhas
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Importação de Tabela de Preços
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Cabeçalho - 2 linhas */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div className="form-grid">
                            {/* Linha 1: Indústria + Grupo de Desconto */}
                            <div className="col-4">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Indústria *</label>
                                <div className="h-12">
                                    <Select 
                                        value={formData.industria} 
                                        onValueChange={(val) => {
                                            setFormData({ ...formData, industria: val, tabelaExistente: '', nomeTabela: '' });
                                            setUseExistingTable(false);
                                        }}
                                    >
                                        <SelectTrigger className="h-[50px] rounded-xl border-gray-200">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {industries.map(ind => (
                                                <SelectItem key={ind.for_codigo} value={ind.for_codigo.toString()}>
                                                    {ind.for_nomered}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="col-8">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Grupo de Desconto (Opcional)</label>
                                <div className="h-12">
                                    <Select 
                                        value={formData.grupoDesconto} 
                                        onValueChange={(val) => setFormData({ ...formData, grupoDesconto: val })}
                                    >
                                        <SelectTrigger className="h-[50px] rounded-xl border-gray-200">
                                            <SelectValue placeholder="Nenhum" />
                                        </SelectTrigger>
                                        <SelectContent className="max-w-6xl">
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {discountGroups.map(grupo => (
                                                <SelectItem key={grupo.gde_id} value={grupo.gde_id.toString()}>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="font-bold text-blue-600 min-w-[60px]">{grupo.gid}</span>
                                                        <span className="text-gray-400">-</span>
                                                        <span className="font-medium min-w-[200px]">{grupo.gde_nome}</span>
                                                        <span className="text-gray-400">|</span>
                                                        <span className="text-sm font-mono text-gray-600 whitespace-nowrap">
                                                            {grupo.gde_desc1}% / {grupo.gde_desc2}% / {grupo.gde_desc3}% / {grupo.gde_desc4}% / {grupo.gde_desc5}% / {grupo.gde_desc6}% / {grupo.gde_desc7}% / {grupo.gde_desc8}% / {grupo.gde_desc9}%
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="form-grid">
                            {/* Linha 2: Nome da Tabela + Datas */}
                            <div className="col-6">
                                <InputField
                                    label="Nome da Tabela de Preços *"
                                    value={formData.nomeTabela}
                                    onChange={(e) => setFormData({ ...formData, nomeTabela: e.target.value.toUpperCase() })}
                                    placeholder="Ex: PADRAO, PROMOCIONAL, TABPRE 2025"
                                    className="uppercase font-semibold"
                                />
                            </div>
                            <div className="col-3">
                                <InputField
                                    label="Data Tabela"
                                    type="date"
                                    value={formData.dataTabela}
                                    onChange={(e) => setFormData({ ...formData, dataTabela: e.target.value })}
                                />
                            </div>
                            <div className="col-3">
                                <InputField
                                    label="Validade"
                                    type="date"
                                    value={formData.dataVencimento}
                                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seleção de Tabela - Melhorada */}
                    {/* Seleção de Tabela - Melhorada */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                        <div className="form-grid">
                            <div className="col-6">
                                <label className="text-xs font-semibold text-blue-900 ml-1">Nome da Tabela de Preços *</label>
                                {formData.industria && existingTables.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="h-12">
                                            <Select
                                                value={formData.nomeTabela}
                                                onValueChange={(val) => {
                                                    if (val === '__NEW__') {
                                                        setFormData({ ...formData, nomeTabela: '' });
                                                    } else {
                                                        setFormData({ ...formData, nomeTabela: val });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-[50px] rounded-xl border-gray-200 uppercase font-semibold">
                                                    <SelectValue placeholder="Selecione ou digite nova..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__NEW__" className="text-green-600 font-semibold">
                                                        ➕ CRIAR NOVA TABELA
                                                    </SelectItem>
                                                    {existingTables.map((table, idx) => (
                                                        <SelectItem key={idx} value={table.nome_tabela}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{table.nome_tabela}</span>
                                                                <span className="text-xs text-gray-500">({table.total_produtos} produtos)</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Input para nome customizado quando seleciona "CRIAR NOVA" */}
                                        {formData.nomeTabela === '' && (
                                            <InputField
                                                value={formData.nomeTabela}
                                                onChange={(e) => setFormData({ ...formData, nomeTabela: e.target.value.toUpperCase() })}
                                                placeholder="Digite o nome da NOVA tabela"
                                                className="uppercase font-semibold border-green-500"
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                ) : formData.industria ? (
                                    <div className="space-y-1">
                                        <InputField
                                            value={formData.nomeTabela}
                                            onChange={(e) => setFormData({ ...formData, nomeTabela: e.target.value.toUpperCase() })}
                                            placeholder="Ex: PADRAO, PROMOCIONAL, TABPRE 2025"
                                            className="uppercase font-semibold"
                                        />
                                        <p className="text-xs text-green-600 ml-1">
                                            ✨ Nenhuma tabela existente - será criada uma nova
                                        </p>
                                    </div>
                                ) : (
                                    <InputField
                                        disabled
                                        placeholder="Selecione uma indústria primeiro"
                                        className="uppercase font-semibold"
                                    />
                                )}
                            </div>

                            <div className="col-6 flex items-center">
                                {formData.nomeTabela && formData.nomeTabela !== '' && existingTables.some(t => t.nome_tabela === formData.nomeTabela) ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg w-full">
                                        <p className="text-sm font-semibold text-yellow-800">⚠️ Modo: ATUALIZAR TABELA EXISTENTE</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Produtos com códigos existentes serão atualizados. Novos códigos serão adicionados.
                                        </p>
                                    </div>
                                ) : formData.nomeTabela && formData.nomeTabela !== '' ? (
                                    <div className="p-3 bg-green-50 border border-green-300 rounded-lg w-full">
                                        <p className="text-sm font-semibold text-green-800">✨ Modo: CRIAR NOVA TABELA</p>
                                        <p className="text-xs text-green-700 mt-1">
                                            Uma nova tabela "{formData.nomeTabela}" será criada com os produtos importados.
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Alertas */}
                    {!isValid && Object.values(lineCounts).some(c => c > 0) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Atenção!</strong> Número de linhas inconsistente entre os campos.
                                Todos os campos preenchidos devem ter o mesmo número de linhas.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isValid && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>Pronto para importar!</strong> {lineCounts.codigo} produtos detectados.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Campos de dados - Linha 1 */}
                    <div className="form-grid">
                        <TextareaField label="Código" field="codigo" required />
                        <TextareaField label="Complemento" field="complemento" />
                        <TextareaField label="Nome do Produto" field="nome" required />
                        <TextareaField label="Preço Bruto" field="precobruto" required />
                        <TextareaField label="Preço Promoção" field="precopromo" />
                        <TextareaField label="Preço Especial" field="precoespecial" />
                    </div>

                    {/* Campos de dados - Linha 2 */}
                    <div className="form-grid">
                        <TextareaField label="Grupo de Produtos" field="grupo" />
                        <TextareaField label="Aplicação" field="aplicacao" />
                        <TextareaField label="Embalagem" field="embalagem" />
                        <TextareaField label="% IPI" field="ipi" />
                        <TextareaField label="% ST" field="st" />
                        <TextareaField label="Código Original" field="codigooriginal" />
                    </div>

                    {/* Campos de dados - Linha 3 */}
                    <div className="form-grid">
                        <TextareaField label="Código de Barras" field="codbarras" />
                        <TextareaField label="Desconto Adicional" field="descontoadd" />
                        <TextareaField label="NCM" field="ncm" />
                        <TextareaField label="Curva ABC" field="curva" />
                        <TextareaField label="Categoria" field="categoria" />
                        <TextareaField label="Conversão" field="conversao" />
                    </div>

                    {/* Instruções */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Como usar:</strong> Cole os dados de cada coluna do Excel nos campos correspondentes.
                            O sistema validará automaticamente se todas as colunas têm o mesmo número de linhas.
                        </AlertDescription>
                    </Alert>

                    {/* Barra de Progresso */}
                    {importing && progress.total > 0 && (
                        <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-blue-900">
                                    Processando lote {progress.current} de {progress.total}
                                </span>
                                <span className="text-blue-700 font-bold">{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300 ease-out flex items-center justify-center text-xs text-white font-semibold"
                                    style={{ width: `${progress.percentage}%` }}
                                >
                                    {progress.percentage > 10 && `${progress.percentage}%`}
                                </div>
                            </div>
                            <p className="text-xs text-blue-700 text-center">
                                Aguarde enquanto processamos seus produtos...
                            </p>
                        </div>
                    )}

                    {/* Resultado da Importação */}
                    {result && (
                        <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                                <strong>{result.message}</strong>
                                {result.resumo && (
                                    <div className="mt-2 space-y-1 text-sm">
                                        <p>📊 Total de produtos processados: <strong>{result.resumo.total}</strong></p>
                                        {result.resumo.inseridos > 0 && (
                                            <p>✅ Produtos novos inseridos: <strong className="text-green-700">{result.resumo.inseridos}</strong></p>
                                        )}
                                        {result.resumo.atualizados > 0 && (
                                            <p>🔄 Produtos atualizados: <strong className="text-blue-700">{result.resumo.atualizados}</strong></p>
                                        )}
                                        {result.resumo.erros > 0 && (
                                            <div>
                                                <p className="text-red-700">❌ Erros: <strong>{result.resumo.erros}</strong></p>
                                                {result.resumo.detalhesErros && result.resumo.detalhesErros.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="cursor-pointer text-xs text-red-600 hover:underline">
                                                            Ver detalhes dos erros
                                                        </summary>
                                                        <ul className="mt-1 ml-4 text-xs list-disc">
                                                            {result.resumo.detalhesErros.slice(0, 10).map((erro, idx) => (
                                                                <li key={idx}>
                                                                    Código: {erro.codigo} - {erro.erro}
                                                                </li>
                                                            ))}
                                                            {result.resumo.detalhesErros.length > 10 && (
                                                                <li className="text-gray-600">
                                                                    ... e mais {result.resumo.detalhesErros.length - 10} erros
                                                                </li>
                                                            )}
                                                        </ul>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-3 w-full text-red-700 border-red-300 hover:bg-red-50"
                                                            onClick={() => {
                                                                // Criar conteúdo do arquivo
                                                                const content = result.resumo.detalhesErros.map(erro =>
                                                                    `Código: ${erro.codigo}\nDescrição: ${erro.descricao || 'N/A'}\nErro: ${erro.erro}\n${'='.repeat(50)}`
                                                                ).join('\n\n');

                                                                // Criar blob e download
                                                                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                                                                a.download = `erros_importacao_${timestamp}.txt`;
                                                                document.body.appendChild(a);
                                                                a.click();
                                                                document.body.removeChild(a);
                                                                URL.revokeObjectURL(url);
                                                            }}
                                                        >
                                                            📥 Baixar Lista de Erros (.txt)
                                                        </Button>
                                                    </details>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Botão de importação */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setTextareas({
                                    codigo: '', complemento: '', nome: '', precobruto: '',
                                    precopromo: '', precoespecial: '', grupo: '', aplicacao: '',
                                    embalagem: '', ipi: '', st: '', codigooriginal: '',
                                    codbarras: '', descontoadd: '', ncm: '', curva: '',
                                    categoria: '', conversao: ''
                                });
                                setResult(null);
                            }}
                        >
                            Limpar
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!isValid || importing || !formData.industria || !formData.nomeTabela}
                            className="min-w-32"
                        >
                            {importing ? 'Importando...' : 'Importar Tabela'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PriceTableImport;
