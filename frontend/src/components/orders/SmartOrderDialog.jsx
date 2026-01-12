import { useState, useRef } from "react";
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
    const fileInputRef = useRef(null);

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

    // Trigger file input click
    const handleUploadClick = () => {
        console.log("🖱️ [IA FRONT] Clicou em Selecionar Arquivo");
        fileInputRef.current?.click();
    };



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
            const startTime = Date.now();
            const result = await smartOrderService.uploadFile(file);
            const duration = Date.now() - startTime;
            console.log(`🔙 [SMART FRONT] Resposta do Serviço em ${duration}ms:`, result);

            if (result.success) {
                console.log(`✅ [SMART FRONT] Sucesso! ${result.data?.length || 0} itens extraídos`);
                // Store items for preview and move to preview step
                setPreviewItems(result.data || []);
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
                                                onChange={handleFile}
                                            />
                                        </label>

                                        <p className="upload-types" style={{ marginTop: '10px' }}>
                                            Suporta: Excel, Fotos (JPG/PNG), Manuscritos
                                        </p>

                                        {fileName && (
                                            <p className="file-name">{fileName}</p>
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
                                    <div className="preview-container">
                                        <table className="preview-table">
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Descrição</th>
                                                    <th className="w-16 text-center">Qtd</th>
                                                    <th className="w-20 text-right">Preço</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="code-col">{item.codigo || item.codigo_produto || '?'}</td>
                                                        <td className="truncate max-w-[200px]">{item.descricao || item.produto || 'Item sem nome'}</td>
                                                        <td className="text-center">{item.quantidade || item.quant || 1}</td>
                                                        <td className="text-right">
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
                        <div className="ia-footer">
                            <div className="footer-info">
                                Ped: {orderNumber || '-'} | ID: {orderId || '-'}
                            </div>
                            <div className="action-buttons">
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
