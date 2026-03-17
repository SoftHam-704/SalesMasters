import { useState, useRef, useEffect } from "react";
import "./SmartOrderDialog.css";
import SmartOrderButton from './SmartOrderButton';
import { smartOrderService } from '@/services/smartOrderService';
import { toast } from 'sonner';
import { Trash2, X, Sparkles, FileUp, Search, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const SmartOrderDialog = ({ onOrderGenerated, disabled, orderId, orderNumber }) => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState("upload");
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Listen for global F2 trigger
    useEffect(() => {
        const handleGlobalF2 = (e) => {
            if (e.key === 'F2' && !disabled) {
                setOpen(true);
            }
        };
        window.addEventListener('keydown', handleGlobalF2);
        return () => window.removeEventListener('keydown', handleGlobalF2);
    }, [disabled]);

    // Helper para fechar e resetar
    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setStep("upload");
            setFileName("");
            setFile(null);
        }, 300);
    };

    function handleFile(e) {
        const selected = e.target.files[0];
        if (!selected) return;
        setFile(selected);
        setFileName(selected.name);
    }

    const [previewItems, setPreviewItems] = useState([]);

    async function startMapping() {
        if (!file) return;

        setStep("analyzing");

        try {
            const result = await smartOrderService.uploadFile(file);
            if (result.success) {
                setPreviewItems(result.data || []);
                setStep("preview");
            } else {
                toast.error(result.message || 'Erro ao processar arquivo.');
                setStep("upload");
            }
        } catch (error) {
            toast.error(`Erro ao enviar arquivo: ${error.message}`);
            setStep("upload");
        }
    }

    const confirmImport = async () => {
        if (onOrderGenerated) {
            const success = await onOrderGenerated(previewItems);
            if (success !== false) {
                toast.success('Itens confirmados e importados com sucesso.');
                handleClose();
            }
        }
    };

    const handleRemoveItem = (idx) => {
        setPreviewItems(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <>
            <SmartOrderButton
                onClick={() => {
                    if (!disabled) setOpen(true);
                }}
                disabled={disabled}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[700px] p-0 border-none bg-transparent shadow-none" hideCloseButton>
                    {/* Acessibilidade */}
                    <div className="sr-only">
                        <DialogTitle>Magic Load - Inteligência Artificial</DialogTitle>
                        <DialogDescription>Extração automática de itens via PDF, Excel ou Imagem.</DialogDescription>
                    </div>

                    <div className="ia-dialog pointer-events-auto">

                        {/* HEADER */}
                        <div className="ia-header">
                            <div className="ia-title">
                                <div className="ia-bot">
                                    <Sparkles size={24} />
                                </div>
                                <h3>Magic Load</h3>
                            </div>
                            <button type="button" className="close-btn" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <p className="ia-subtitle">
                            Nossa inteligência artificial avançada lê seus arquivos (PDF, Excel ou Fotos) e extrai os itens para o seu pedido instantaneamente.
                        </p>

                        {disabled && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3 text-amber-800">
                                <AlertCircle size={20} className="text-amber-500 shrink-0" />
                                <div className="text-xs font-bold leading-tight">
                                    MODO SOMENTE LEITURA<br/>
                                    <span className="font-normal opacity-70">A importação automática está desativada para pedidos já finalizados ou bloqueados.</span>
                                </div>
                            </div>
                        )}

                        {/* CONTENT */}
                        <div className="ia-content">

                            {/* TELA 1 – UPLOAD */}
                            {step === "upload" && (
                                <div className="ia-screen">
                                    <div 
                                        className="upload-zone cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            e.preventDefault();
                                            const droppedFile = e.dataTransfer.files[0];
                                            if (droppedFile) {
                                                setFile(droppedFile);
                                                setFileName(droppedFile.name);
                                            }
                                        }}
                                    >
                                        <div className="mb-4 text-stone-300">
                                            <FileUp size={48} strokeWidth={1} />
                                        </div>
                                        <p className="upload-text">Arraste seu arquivo aqui ou use o botão</p>

                                        <button 
                                            type="button" 
                                            className="upload-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={disabled}
                                        >
                                            Selecionar Arquivo
                                        </button>

                                        <input
                                            id="smart-file-input"
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*,.pdf,.xlsx,.xls"
                                            onChange={handleFile}
                                            className="hidden"
                                            style={{ display: 'none' }}
                                            disabled={disabled}
                                        />

                                        <p className="upload-types">
                                            PDF • Excel • JPG • PNG • Manuscritos
                                        </p>

                                        {fileName && (
                                            <div className="file-name flex items-center gap-2">
                                                <Check size={14} />
                                                {fileName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TELA 2 – ANALISANDO */}
                            {step === "analyzing" && (
                                <div className="ia-screen">
                                    <div className="analyzing-box">
                                        <div className="magnifier">
                                            ✨
                                        </div>
                                        <h4>Transcrevendo dados...</h4>
                                        <p className="text-sm text-stone-400 mt-4 font-mono uppercase tracking-widest">
                                            {fileName}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PREVIEW STEP – MINI GRID */}
                            {step === "preview" && (
                                <div className="ia-screen preview">
                                    <div className="flex items-center justify-between w-full mb-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Search size={16} />
                                            Conferência de Itens ({previewItems.length})
                                        </h4>
                                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                                            <AlertCircle size={12} />
                                            Revise antes de confirmar
                                        </div>
                                    </div>
                                    
                                    <div className="preview-container">
                                        <table className="preview-table">
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Descrição</th>
                                                    <th className="w-16 text-center">Qtd</th>
                                                    <th className="w-24 text-right">Preço</th>
                                                    <th className="w-12 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="code-col">{item.codigo || item.codigo_produto || '?'}</td>
                                                        <td className="truncate max-w-[300px]">{item.descricao || item.produto || 'Item não identificado'}</td>
                                                        <td className="text-center font-bold">{item.quantidade || item.quant || 1}</td>
                                                        <td className="text-right text-stone-500">
                                                            {item.preco
                                                                ? parseFloat(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                                : 'sob consulta'}
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(idx)}
                                                                className="text-stone-400 hover:text-rose-500 transition-colors"
                                                                title="Remover item"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* FOOTER */}
                        <div className="ia-footer">
                            <div className="footer-info">
                                MÓDULO INTELIGENTE | PEDIDO: {orderNumber || 'NOVO'}
                            </div>
                            <div className="action-buttons">
                                <button type="button" className="secondary" onClick={handleClose}>
                                    Cancelar
                                </button>

                                {step === "upload" && (
                                    <button
                                        type="button"
                                        className="primary"
                                        disabled={!file}
                                        onClick={startMapping}
                                    >
                                        Iniciar Mapeamento
                                    </button>
                                )}

                                {step === "analyzing" && (
                                    <button type="button" className="primary" disabled>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Analisando...
                                        </div>
                                    </button>
                                )}

                                {step === "preview" && (
                                    <button type="button" className="primary" onClick={confirmImport}>
                                        Confirmar Tudo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

