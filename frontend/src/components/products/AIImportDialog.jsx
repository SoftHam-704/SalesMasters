import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Upload, FileSpreadsheet, Wand2, Sparkles, CheckCircle,
    AlertCircle, Loader2, CloudUpload, ArrowRight, Eye, Layers,
    PlusCircle, RefreshCw, Settings2, ChevronRight, Table2
} from "lucide-react";
import { toast } from "sonner";
import { PYTHON_API_URL, NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const AIImportDialog = ({ open, onOpenChange, onImportComplete }) => {
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const [sheets, setSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [mapping, setMapping] = useState({});

    const [importMode, setImportMode] = useState('new');
    const [newTableName, setNewTableName] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [industries, setIndustries] = useState([]);
    const [existingTables, setExistingTables] = useState([]);
    const [selectedExistingTable, setSelectedExistingTable] = useState('');
    const intervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Campos ordenados por linhas conforme layout desejado
    const SYSTEM_FIELDS = [
        // Linha 1
        { key: 'codigo', label: 'Código', required: true },
        { key: 'descricao', label: 'Descrição', required: true },
        { key: 'referencia_original', label: 'Nº Original', required: false },
        // Linha 2
        { key: 'preco', label: 'Preço Normal', required: true },
        { key: 'preco_promocao', label: 'Preço Promoção', required: false },
        { key: 'preco_especial', label: 'Preço Especial', required: false },
        // Linha 3
        { key: 'ipi', label: 'IPI %', required: false },
        { key: 'st', label: 'ST %', required: false },
        { key: 'conversao', label: 'Conversão', required: false },
        // Linha 4
        { key: 'aplicacao', label: 'Aplicação', required: false },
    ];

    useEffect(() => {
        if (open) fetchIndustries();
    }, [open]);

    const fetchIndustries = async () => {
        try {
            const url = getApiUrl(NODE_API_URL, '/api/suppliers');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) setIndustries(data.data);
        } catch (error) {
            console.error('Erro ao carregar indústrias:', error);
        }
    };

    useEffect(() => {
        if (selectedIndustry && importMode === 'update') {
            fetchTables(selectedIndustry);
        }
    }, [selectedIndustry, importMode]);

    const fetchTables = async (industryId) => {
        try {
            const url = getApiUrl(NODE_API_URL, `/api/products/tables/${industryId}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) setExistingTables(data.data);
        } catch (error) {
            console.error('Erro ao carregar tabelas:', error);
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.match(/\.xlsx?$/)) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Selecione um arquivo Excel (.xlsx ou .xls)');
            }
        }
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.name.match(/\.xlsx?$/)) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Selecione um arquivo Excel (.xlsx ou .xls)');
        }
    };

    const handleUploadAndGetSheets = async () => {
        if (!file) return;
        setProgress(0);
        setError(null);

        try {
            intervalRef.current = setInterval(() => setProgress(prev => Math.min(prev + 15, 90)), 300);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(getApiUrl(PYTHON_API_URL, '/api/price-table/get-sheets'), {
                method: 'POST',
                body: formData
            });

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(100);

            const result = await response.json();
            if (result.success) {
                setSheets(result.sheets);
                setStep('sheets');
                if (result.sheets.length === 1) setSelectedSheet(result.sheets[0].name);
            } else {
                throw new Error(result.message || 'Erro ao ler sheets');
            }
        } catch (err) {
            setError(err.message);
            toast.error('Erro: ' + err.message);
        }
    };

    const handleAnalyzeSheet = async () => {
        if (!selectedSheet) return toast.error('Selecione uma sheet');

        setStep('analyzing');
        setProgress(0);

        try {
            intervalRef.current = setInterval(() => setProgress(prev => Math.min(prev + 8, 90)), 500);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sheet_name', selectedSheet);

            const response = await fetch(getApiUrl(PYTHON_API_URL, '/api/price-table/analyze-sheet'), {
                method: 'POST',
                body: formData
            });

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(100);

            const result = await response.json();
            if (result.success) {
                setAnalysis(result.data);
                setMapping(result.data.mapping || {});
                setNewTableName(file.name.replace(/\.[^/.]+$/, "").substring(0, 50));
                setStep('mapping');
                toast.success('Análise concluída!');
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err.message);
            setStep('sheets');
            toast.error('Erro: ' + err.message);
        }
    };

    const handleMappingChange = (field, columnIndex) => {
        setMapping(prev => ({
            ...prev,
            [field]: columnIndex === 'none' ? null : parseInt(columnIndex)
        }));
    };

    const handleProceedToMode = () => {
        const missing = SYSTEM_FIELDS.filter(f => f.required && mapping[f.key] == null).map(f => f.label);
        if (missing.length > 0) return toast.error(`Faltando: ${missing.join(', ')}`);
        setStep('mode');
    };

    const handleProceedToPreview = () => {
        if (importMode === 'new' && (!newTableName.trim() || !selectedIndustry)) {
            return toast.error('Preencha todos os campos');
        }
        if (importMode === 'update' && !selectedExistingTable) {
            return toast.error('Selecione a tabela');
        }
        setStep('preview');
    };

    const handleImport = async () => {
        setStep('importing');
        setProgress(0);

        try {
            intervalRef.current = setInterval(() => setProgress(prev => Math.min(prev + 5, 95)), 200);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sheet_name', selectedSheet);
            formData.append('mapping', JSON.stringify(mapping));
            formData.append('header_row', analysis?.header_row || 0);
            formData.append('data_start_row', analysis?.data_start_row || 1);
            formData.append('import_mode', importMode);
            formData.append('table_name', importMode === 'new' ? newTableName : selectedExistingTable);
            formData.append('industry_id', selectedIndustry);

            const response = await fetch(getApiUrl(PYTHON_API_URL, '/api/price-table/import'), {
                method: 'POST',
                body: formData
            });

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(100);

            const result = await response.json();
            if (result.success) {
                setStep('done');
                toast.success(`${result.total_imported} produtos importados!`);
                onImportComplete?.(result);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err.message);
            setStep('preview');
            toast.error('Erro: ' + err.message);
        }
    };

    const resetDialog = () => {
        setStep('upload');
        setFile(null);
        setSheets([]);
        setSelectedSheet('');
        setAnalysis(null);
        setMapping({});
        setImportMode('new');
        setNewTableName('');
        setSelectedIndustry('');
        setSelectedExistingTable('');
        setProgress(0);
        setError(null);
    };

    const handleClose = () => {
        resetDialog();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-visible">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg text-white">
                            <Wand2 size={22} />
                        </div>
                        <div>
                            <span className="block font-bold">Magic Import</span>
                            <span className="text-xs font-normal text-slate-500 italic">Mapeamento Dinâmico de Colunas</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps - Compact */}
                <div className="flex items-center justify-between py-3 px-2 bg-slate-50 rounded-lg text-xs">
                    {['Upload', 'Sheets', 'Análise', 'Mapeamento', 'Destino', 'Importar'].map((s, idx) => {
                        const stepOrder = ['upload', 'sheets', 'analyzing', 'mapping', 'mode', 'preview'];
                        const currentIdx = stepOrder.indexOf(step);
                        const isActive = idx <= currentIdx || step === 'importing' || step === 'done';
                        const isCurrent = stepOrder[idx] === step || (step === 'importing' && idx === 5) || (step === 'done' && idx === 5);

                        return (
                            <React.Fragment key={s}>
                                <div className={`flex items-center gap-1 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200'}`}>
                                        {idx + 1}
                                    </div>
                                    <span className="hidden md:inline font-medium">{s}</span>
                                </div>
                                {idx < 5 && <div className={`flex-1 h-0.5 mx-2 ${isActive ? 'bg-blue-300' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="py-4 min-h-[300px]">
                    {/* Upload */}
                    {step === 'upload' && (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : file ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-slate-400'}`}
                        >
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
                            {file ? (
                                <div className="flex flex-col items-center gap-3">
                                    <FileSpreadsheet className="h-12 w-12 text-green-600" />
                                    <p className="font-bold text-lg">{file.name}</p>
                                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <Button variant="outline" size="sm" onClick={() => setFile(null)}>Trocar</Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <CloudUpload className="h-12 w-12 text-slate-400" />
                                    <p className="font-medium">Arraste o arquivo Excel aqui</p>
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Selecionar
                                    </Button>
                                </div>
                            )}
                            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                        </div>
                    )}

                    {/* Sheets */}
                    {step === 'sheets' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                <Layers className="inline h-4 w-4 mr-2" />
                                {sheets.length} aba(s) encontrada(s). Selecione qual importar:
                            </div>
                            <div className="grid gap-2 max-h-[250px] overflow-y-auto">
                                {sheets.map((sheet, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedSheet(sheet.name)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3
                                            ${selectedSheet === sheet.name ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <Table2 className={`h-5 w-5 ${selectedSheet === sheet.name ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <div className="flex-1">
                                            <p className="font-bold">{sheet.name}</p>
                                            <p className="text-xs text-slate-500">{sheet.rows} linhas × {sheet.cols} colunas</p>
                                        </div>
                                        {selectedSheet === sheet.name && <CheckCircle className="h-5 w-5 text-blue-600" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analyzing */}
                    {step === 'analyzing' && (
                        <div className="text-center py-12">
                            <Wand2 className="h-16 w-16 text-amber-500 animate-pulse mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Processando Mágica...</h3>
                            <Progress value={progress} className="h-2 max-w-md mx-auto" />
                        </div>
                    )}

                    {/* Mapping */}
                    {step === 'mapping' && analysis && (
                        <div className="space-y-4">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                <CheckCircle className="inline h-4 w-4 mr-2" />
                                {analysis.detected_columns?.length || 0} colunas detectadas. Ajuste o mapeamento se necessário:
                            </div>

                            {/* Mapping Grid - Premium Style */}
                            <div className="grid grid-cols-3 gap-5 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                {SYSTEM_FIELDS.map(field => (
                                    <div key={field.key} className="flex flex-col">
                                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            {field.label}
                                            {field.required && <span className="text-red-500 text-sm">*</span>}
                                        </Label>
                                        <Select
                                            value={mapping[field.key]?.toString() || 'none'}
                                            onValueChange={(val) => handleMappingChange(field.key, val)}
                                        >
                                            <SelectTrigger className="h-12 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl font-medium hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-[9999] rounded-xl border-2" position="popper" sideOffset={4}>
                                                <SelectItem value="none" className="text-slate-400">-- Não importar --</SelectItem>
                                                {analysis.detected_columns?.map((col, idx) => (
                                                    <SelectItem key={idx} value={idx.toString()} className="py-2.5">
                                                        <span className="font-mono text-xs text-slate-400 mr-2">Col {idx + 1}:</span>
                                                        <span className="font-medium">{String(col || '').substring(0, 30)}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            {/* Preview Table */}
                            {analysis.preview?.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 uppercase">
                                        <Eye className="inline h-4 w-4 mr-2" />
                                        Preview ({analysis.preview.length} linhas)
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="p-2 text-left font-semibold w-32">Código</th>
                                                    <th className="p-2 text-left font-semibold">Descrição</th>
                                                    <th className="p-2 text-right font-semibold w-28">Preço</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.preview.slice(0, 5).map((row, idx) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="p-2 font-mono text-xs">{String(row.codigo || '-')}</td>
                                                        <td className="p-2 text-xs">{String(row.descricao || '-').substring(0, 60)}</td>
                                                        <td className="p-2 text-right font-semibold text-green-700">
                                                            R$ {parseFloat(row.preco || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode Selection */}
                    {step === 'mode' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div
                                    onClick={() => setImportMode('new')}
                                    className={`p-6 rounded-xl border-2 cursor-pointer text-center transition-all
                                        ${importMode === 'new' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <PlusCircle className={`h-10 w-10 mx-auto mb-3 ${importMode === 'new' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <p className="font-bold">Nova Tabela</p>
                                    <p className="text-xs text-slate-500 mt-1">Criar tabela de preços nova</p>
                                </div>
                                <div
                                    onClick={() => setImportMode('update')}
                                    className={`p-6 rounded-xl border-2 cursor-pointer text-center transition-all
                                        ${importMode === 'update' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <RefreshCw className={`h-10 w-10 mx-auto mb-3 ${importMode === 'update' ? 'text-orange-600' : 'text-slate-400'}`} />
                                    <p className="font-bold">Atualizar Existente</p>
                                    <p className="text-xs text-slate-500 mt-1">Atualizar preços de tabela existente</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                {importMode === 'new' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium">Nome da Tabela *</Label>
                                            <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="mt-1" placeholder="LP JANEIRO 2026" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Indústria *</Label>
                                            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent className="z-[9999]">
                                                    {industries
                                                        .filter(ind => ind.for_codigo && String(ind.for_codigo).trim() !== "")
                                                        .map(ind => (
                                                            <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>{ind.for_nomered || "Indústria sem nome"}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                                {importMode === 'update' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium">Indústria *</Label>
                                            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent className="z-[9999]">
                                                    {industries
                                                        .filter(ind => ind.for_codigo && String(ind.for_codigo).trim() !== "")
                                                        .map(ind => (
                                                            <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>{ind.for_nomered || "Indústria sem nome"}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedIndustry && (
                                            <div>
                                                <Label className="text-sm font-medium">Tabela *</Label>
                                                <Select value={selectedExistingTable} onValueChange={setSelectedExistingTable}>
                                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        {existingTables
                                                            .filter(t => t.itab_tabela && String(t.itab_tabela).trim() !== "")
                                                            .map((t, idx) => (
                                                                <SelectItem key={`${t.itab_tabela}-${idx}`} value={t.itab_tabela}>{t.itab_tabela}</SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="font-bold text-amber-800 mb-2">Resumo da Importação</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-amber-700 font-medium">Arquivo:</span> {file?.name}</div>
                                    <div><span className="text-amber-700 font-medium">Sheet:</span> {selectedSheet}</div>
                                    <div><span className="text-amber-700 font-medium">Modo:</span> {importMode === 'new' ? 'Nova Tabela' : 'Atualizar'}</div>
                                    <div><span className="text-amber-700 font-medium">Produtos:</span> ~{analysis?.total_rows || 0}</div>
                                    <div className="col-span-2"><span className="text-amber-700 font-medium">Destino:</span> {importMode === 'new' ? newTableName : selectedExistingTable}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Importing */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Importando...</h3>
                            <Progress value={progress} className="h-2 max-w-md mx-auto" />
                        </div>
                    )}

                    {/* Done */}
                    {step === 'done' && (
                        <div className="text-center py-12">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Importação Concluída!</h3>
                            <p className="text-slate-500">Os produtos foram importados com sucesso.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    {step === 'upload' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button onClick={handleUploadAndGetSheets} disabled={!file} className="bg-blue-600 hover:bg-blue-700">
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {step === 'sheets' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
                            <Button onClick={handleAnalyzeSheet} disabled={!selectedSheet} className="bg-amber-600 hover:bg-amber-700">
                                <Wand2 className="mr-2 h-4 w-4" /> Mapeamento Mágico
                            </Button>
                        </>
                    )}
                    {step === 'mapping' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('sheets')}>Voltar</Button>
                            <Button onClick={handleProceedToMode} className="bg-blue-600 hover:bg-blue-700">
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {step === 'mode' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
                            <Button onClick={handleProceedToPreview} className="bg-blue-600 hover:bg-blue-700">
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {step === 'preview' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('mode')}>Voltar</Button>
                            <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
                                <Upload className="mr-2 h-4 w-4" /> Confirmar Importação
                            </Button>
                        </>
                    )}
                    {step === 'done' && <Button onClick={handleClose}>Fechar</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AIImportDialog;
