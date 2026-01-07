import { useState } from "react";
import { createPortal } from "react-dom";
import "./SmartOrderDialog.css";
import SmartOrderButton from './SmartOrderButton';
import { smartOrderService } from '@/services/smartOrderService';
import { toast } from 'sonner';

export const SmartOrderDialog = ({ onOrderGenerated, disabled, orderId, orderNumber }) => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState("upload");
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState(null);

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
        console.log("🖱️ [IA FRONT] Botão Mapear Clicado!");
        if (!file) {
            console.error("❌ [IA FRONT] Nenhum arquivo selecionado.");
            return;
        }

        setStep("analyzing");

        try {
            console.log("📡 [SMART FRONT] Chamando smartOrderService.uploadFile...", file.name);
            const result = await smartOrderService.uploadFile(file);
            console.log("🔙 [SMART FRONT] Resposta do Serviço:", result);

            if (result.success) {
                console.log(`✅ [SMART FRONT] Sucesso! ${result.data.length} itens extraídos`);
                // Store items for preview and move to preview step
                setPreviewItems(result.data);
                setStep("preview");
            } else {
                console.error('❌ [SMART FRONT] Erro:', result.message);
                toast.error(result.message || 'Erro ao processar arquivo.');
                setStep("upload");
            }
        } catch (error) {
            console.error('❌ [IA FRONT] Exceção no upload:', error);
            toast.error(`Erro ao enviar arquivo: ${error.message}`);
            setStep("upload");
        }
    }

    // Confirm import after preview
    const confirmImport = async () => {
        if (onOrderGenerated) {
            const success = await onOrderGenerated(previewItems);
            if (success !== false) {
                toast.success('Itens confirmados e importados com sucesso.');
                handleClose();
            }
        }
    };


    return (
        <>
            <SmartOrderButton
                onClick={() => {
                    if (!disabled) setOpen(true);
                }}
                disabled={disabled}
            />

            {open && createPortal(
                <div className="ia-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) handleClose();
                }}>
                    <div className="ia-dialog">

                        {/* HEADER */}
                        <div className="ia-header">
                            <div className="ia-title">
                                <span className="ia-bot">✨</span>
                                <h3>Lançar Ítens com Sugestão Inteligente</h3>
                            </div>
                            <button type="button" className="close-btn" onClick={handleClose}>✕</button>
                        </div>

                        <p className="ia-subtitle">
                            Envie uma foto de pedido, planilha ou PDF e o sistema identifica os itens automaticamente.
                        </p>

                        {/* CONTENT */}
                        <div className={`ia-content ${step}`}>

                            {/* TELA 1 – UPLOAD */}
                            {step === "upload" && (
                                <div className="ia-screen upload">
                                    <div className="upload-zone">
                                        <p className="upload-text">Arraste a foto/arquivo aqui ou</p>

                                        <label className="upload-button">
                                            Selecionar Arquivo
                                            <input
                                                type="file"
                                                accept="image/*,.pdf,.xlsx,.xls"
                                                hidden
                                                onChange={handleFile}
                                            />
                                        </label>

                                        <span className="upload-types">
                                            Suporta: Excel, Fotos (JPG/PNG), Manuscritos
                                        </span>

                                        {fileName && (
                                            <span className="file-name">{fileName}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TELA 2 – ANALISANDO */}
                            {step === "analyzing" && (
                                <div className="ia-screen analyzing">
                                    <div className="analyzing-box">
                                        <div className="magnifier">
                                            🔍
                                        </div>
                                        <h4>Analisando arquivo...</h4>
                                        <p className="text-sm text-gray-400 mt-2">{fileName}</p>
                                    </div>
                                </div>
                            )}

                            {/* PREVIEW STEP – MINI GRID */}
                            {step === "preview" && (
                                <div className="ia-screen preview w-full">
                                    <h4 className="mb-2 text-sm font-semibold">Pré-visualização dos itens ({previewItems.length})</h4>
                                    <div className="overflow-auto max-h-[200px] border rounded border-gray-200">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="p-2 border-b">Código</th>
                                                    <th className="p-2 border-b">Descrição</th>
                                                    <th className="p-2 border-b w-16 text-center">Qtd</th>
                                                    <th className="p-2 border-b w-20 text-right">Preço</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewItems.map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                        <td className="p-2 font-mono text-gray-600">{item.codigo || item.codigo_produto || '?'}</td>
                                                        <td className="p-2 truncate max-w-[200px]">{item.descricao || item.produto || 'Item sem nome'}</td>
                                                        <td className="p-2 text-center">{item.quantidade || item.quant || 1}</td>
                                                        <td className="p-2 text-right">
                                                            {item.preco
                                                                ? parseFloat(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                                : '-'}
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
                        <div className="ia-footer flex justify-between items-center">
                            <div className="text-xs text-gray-400 font-mono">
                                Ped: {orderNumber || '-'} | ID: {orderId || '-'}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" className="secondary" onClick={handleClose}>
                                    Cancelar
                                </button>

                                {step === "upload" && (
                                    <button
                                        type="button"
                                        className="primary"
                                        disabled={!fileName}
                                        onClick={startMapping}
                                    >
                                        Mapear ítens
                                    </button>
                                )}

                                {step === "analyzing" && (
                                    <button type="button" className="primary loading" disabled>
                                        Executar mapeamento
                                    </button>
                                )}

                                {step === "preview" && (
                                    <button type="button" className="primary" onClick={confirmImport}>
                                        Confirmar importação
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
