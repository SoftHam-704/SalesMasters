import { useEffect, useState } from "react";
import FormCadPadrao from '../FormCadPadrao';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Plus, Pencil, Trash2, Radio, Search, Image, MapPin, Phone, Mail } from "lucide-react";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { toast } from "sonner";
import { ContactDialog } from "./ContactDialog";
import { SupplierCustomersTab } from "../tabs/SupplierCustomersTab";

export function SupplierDialog({ open, onOpenChange, supplier, onSave }) {
    const [formData, setFormData] = useState({});
    const [contacts, setContacts] = useState([]);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [goals, setGoals] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
            loadContacts(supplier.id);
            loadGoals(supplier.id, selectedYear);
        } else {
            setFormData({
                situacao: 'Ativo'
            });
            setContacts([]);
            setGoals({});
        }
    }, [supplier, selectedYear]);

    if (!open) return null;

    const loadContacts = async (supplierId) => {
        if (!supplierId) return;
        setLoadingContacts(true);
        try {
            const response = await fetch(`${NODE_API_URL}/api/suppliers/${supplierId}/contacts`);
            const result = await response.json();
            if (result.success) {
                setContacts(result.data);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const handleNewContact = () => {
        setSelectedContact(null);
        setContactDialogOpen(true);
    };

    const handleEditContact = (contact) => {
        setSelectedContact(contact);
        setContactDialogOpen(true);
    };

    const handleDeleteContact = async (contact) => {
        if (!confirm(`Excluir contato ${contact.con_nome}?`)) return;

        try {
            const response = await fetch(
                `${NODE_API_URL}/api/suppliers/${supplier.id}/contacts/${contact.con_codigo}`,
                { method: 'DELETE' }
            );
            const result = await response.json();
            if (result.success) {
                toast.success(result.message);
                loadContacts(supplier.id);
            }
        } catch (error) {
            toast.error('Erro ao excluir contato');
        }
    };

    const handleContactSaved = () => {
        loadContacts(supplier.id);
    };

    const loadGoals = async (supplierId, year) => {
        if (!supplierId) return;
        try {
            const response = await fetch(`${NODE_API_URL}/api/suppliers/${supplierId}/goals/${year}`);
            const result = await response.json();
            if (result.success) {
                setGoals(result.data);
            }
        } catch (error) {
            toast.error('Erro ao carregar metas');
        }
    };

    const handleSaveGoals = async () => {
        if (!supplier?.id) return;
        try {
            const response = await fetch(
                `${NODE_API_URL}/api/suppliers/${supplier.id}/goals/${selectedYear}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goals)
                }
            );
            const result = await response.json();
            if (result.success) {
                toast.success(result.message || 'Metas salvas com sucesso!');
            } else {
                toast.error(result.message || 'Erro ao salvar metas');
                console.error('[GOALS] Save failed:', result);
            }
        } catch (error) {
            toast.error('Erro de conexão ao salvar metas');
            console.error('[GOALS] Save error:', error);
        }
    };

    const formatBirthDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleConsultarCNPJ = async () => {
        const cnpj = formData.cnpj?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
            toast.error("Informe um CNPJ válido (14 dígitos) para consultar.");
            return;
        }

        const toastId = toast.loading("Consultando Receita Federal...");

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error("CNPJ não encontrado.");
                throw new Error("Erro na consulta à Receita.");
            }

            const apiData = await response.json();

            setFormData(prev => ({
                ...prev,
                razaoSocial: apiData.razao_social,
                nomeReduzido: apiData.nome_fantasia || apiData.razao_social.substring(0, 20),
                endereco: `${apiData.logradouro}, ${apiData.numero} ${apiData.complemento || ''}`,
                bairro: apiData.bairro,
                cidade: apiData.municipio,
                uf: apiData.uf,
                cep: apiData.cep,
                telefone: apiData.ddd_telefone_1 ? `(${apiData.ddd_telefone_1}) ${apiData.telefone1 || ''}` : prev.telefone,
                email: apiData.email || prev.email,
                situacao: apiData.descricao_situacao_cadastral === 'ATIVA' ? 'Ativo' : 'Inativo'
            }));

            toast.dismiss(toastId);
            toast.success("Dados encontrados com sucesso!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    };

    const handleCNPJFocus = () => {
        if (formData.cnpj) {
            handleChange('cnpj', formData.cnpj.replace(/\D/g, ''));
        }
    };

    const handleCNPJBlur = () => {
        const raw = formData.cnpj?.replace(/\D/g, '') || '';
        if (raw.length === 14) {
            const formatted = raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
            handleChange('cnpj', formatted);
        }
    };

    const mainTabs = [
        { id: 'principal', label: 'Principal', icon: <FileText size={16} /> },
        { id: 'complemento', label: 'Complemento', icon: <FileText size={16} /> },
    ];

    const relatedTabs = [
        { id: 'contatos', label: 'Contatos' },
        { id: 'clientes', label: 'Clientes que já compraram' },
        { id: 'politica_desc', label: 'Política de descontos' },
        { id: 'politica_com', label: 'Política comercial' },
        { id: 'meta', label: 'Meta anual' },
    ];

    const renderTabContent = (activeTab) => {
        switch (activeTab) {
            case 'principal':
                return (
                    <div className="space-y-6 p-1">
                        {/* Seção 1: Identificação */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Identificação e Status</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-5 flex flex-col gap-1">
                                    <Label>CNPJ (Somente números)</Label>
                                    <div className="relative group">
                                        <Input
                                            className="h-10 text-sm font-mono font-bold pr-10 border-slate-200 group-hover:border-emerald-300 transition-all"
                                            value={formData.cnpj || ''}
                                            onChange={(e) => handleChange('cnpj', e.target.value)}
                                            onFocus={handleCNPJFocus}
                                            onBlur={handleCNPJBlur}
                                            readOnly={!!supplier?.id}
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                            onClick={handleConsultarCNPJ}
                                            disabled={!!supplier?.id}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="col-span-6 md:col-span-4 flex flex-col gap-1">
                                    <Label>Inscrição Estadual</Label>
                                    <Input
                                        className="h-10 text-sm font-mono border-slate-200"
                                        value={formData.inscricao || ''}
                                        onChange={(e) => handleChange('inscricao', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3 flex flex-col gap-1">
                                    <Label>Situação do Cadastro</Label>
                                    <Select
                                        value={formData.situacao === "Ativo" ? "ativo" : "inativo"}
                                        onValueChange={(val) => handleChange('situacao', val === 'ativo' ? 'Ativo' : 'Inativo')}
                                    >
                                        <SelectTrigger className={`h-10 text-sm font-bold ${formData.situacao === 'Ativo' ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-500 bg-slate-50/30'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            <SelectItem value="ativo">● ATIVO</SelectItem>
                                            <SelectItem value="inativo">● INATIVO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-8 flex flex-col gap-1">
                                    <Label>Razão Social Completa</Label>
                                    <Input
                                        className="h-10 text-sm font-bold border-slate-200 focus:border-emerald-500"
                                        value={formData.razaoSocial || ''}
                                        onChange={(e) => handleChange('razaoSocial', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <Label className="text-orange-600 !color-orange-600">Nome Reduzido (Exibição)</Label>
                                    <Input
                                        className="h-10 text-sm font-bold text-orange-700 border-orange-200 bg-orange-50/10 focus:border-orange-500 focus:ring-orange-500/10"
                                        value={formData.nomeReduzido || ''}
                                        onChange={(e) => handleChange('nomeReduzido', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Localização */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                    <MapPin size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Endereço e Localização</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-8 flex flex-col gap-1">
                                    <Label>Logradouro / Endereço</Label>
                                    <Input
                                        className="h-10 text-sm border-slate-200"
                                        value={formData.endereco || ''}
                                        onChange={(e) => handleChange('endereco', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <Label>Bairro</Label>
                                    <Input
                                        className="h-10 text-sm border-slate-200"
                                        value={formData.bairro || ''}
                                        onChange={(e) => handleChange('bairro', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-7 flex flex-col gap-1">
                                    <Label>Cidade</Label>
                                    <Input
                                        className="h-10 text-sm border-slate-200"
                                        value={formData.cidade || ''}
                                        onChange={(e) => handleChange('cidade', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2 flex flex-col gap-1">
                                    <Label className="text-center">UF</Label>
                                    <Input
                                        className="h-10 text-sm text-center font-bold border-slate-200"
                                        value={formData.uf || ''}
                                        onChange={(e) => handleChange('uf', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-8 md:col-span-3 flex flex-col gap-1">
                                    <Label>CEP</Label>
                                    <Input
                                        className="h-10 text-sm font-mono border-slate-200"
                                        value={formData.cep || ''}
                                        onChange={(e) => handleChange('cep', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Canais de Contato */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                    <Phone size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Comunicação Direta</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-3 flex flex-col gap-1">
                                    <Label>Telefone Fixo</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                                        <Input
                                            className="h-10 text-sm pl-9 font-mono border-slate-200"
                                            value={formData.telefone || ''}
                                            onChange={(e) => handleChange('telefone', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-3 flex flex-col gap-1">
                                    <Label>Telefone Auxiliar</Label>
                                    <Input className="h-10 text-sm font-mono border-slate-200" placeholder="(00) 0000-0000" />
                                </div>
                                <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                                    <Label>E-mail Corporativo</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                                        <Input
                                            className="h-10 text-sm pl-9 border-slate-200"
                                            value={formData.email || ''}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'complemento':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
                        <div className="space-y-6">
                            {/* Logo Upload Section */}
                            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Image size={18} className="text-emerald-500" /> Logotipo Institucional
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => document.getElementById('supplierLogoInput')?.click()}
                                        variant="outline"
                                        className="h-8 text-xs font-bold gap-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Plus size={14} /> Trocar Imagem
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-full h-44 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex items-center justify-center overflow-hidden group/logo relative">
                                        {formData.for_logotipo && formData.for_logotipo.startsWith('data:') ? (
                                            <>
                                                <img
                                                    src={formData.for_logotipo}
                                                    alt="Logo Preview"
                                                    className="max-h-[85%] max-w-[85%] object-contain transition-all duration-500 group-hover/logo:scale-110"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 font-bold text-xs"
                                                        onClick={() => {
                                                            handleChange('for_logotipo', '');
                                                            handleChange('for_locimagem', '');
                                                        }}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <div className="p-4 bg-slate-100 rounded-full">
                                                    <Image size={40} />
                                                </div>
                                                <span className="text-xs uppercase font-black tracking-widest text-slate-400">Nenhuma Imagem</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="supplierLogoInput"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            // Validar tipo de arquivo
                                            if (!file.type.startsWith('image/')) {
                                                alert('Selecione apenas arquivos de imagem (PNG, JPEG, GIF, WebP).');
                                                return;
                                            }

                                            // Validar tamanho original (max 5MB antes da compressão)
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert('A imagem é muito grande (máx. 5MB). Escolha uma imagem menor.');
                                                return;
                                            }

                                            // Compressor de imagem estilo MasterFisher
                                            const compressImage = (imageFile) => {
                                                return new Promise((resolve, reject) => {
                                                    const reader = new FileReader();
                                                    reader.readAsDataURL(imageFile);
                                                    reader.onload = (event) => {
                                                        const img = new window.Image();
                                                        img.src = event.target.result;
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            const MAX_WIDTH = 300;
                                                            const MAX_HEIGHT = 200;
                                                            let width = img.width;
                                                            let height = img.height;

                                                            // Redimensionar proporcionalmente
                                                            if (width > height) {
                                                                if (width > MAX_WIDTH) {
                                                                    height *= MAX_WIDTH / width;
                                                                    width = MAX_WIDTH;
                                                                }
                                                            } else {
                                                                if (height > MAX_HEIGHT) {
                                                                    width *= MAX_HEIGHT / height;
                                                                    height = MAX_HEIGHT;
                                                                }
                                                            }

                                                            canvas.width = Math.round(width);
                                                            canvas.height = Math.round(height);
                                                            const ctx = canvas.getContext('2d');
                                                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                                                            // Exporta como JPEG comprimido (qualidade 0.7)
                                                            const base64 = canvas.toDataURL('image/jpeg', 0.7);

                                                            // Validar tamanho final (máx. 100KB de base64)
                                                            const rawBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
                                                            if (rawBase64.length > 100000) {
                                                                // Tentar com qualidade menor
                                                                const base64Low = canvas.toDataURL('image/jpeg', 0.4);
                                                                resolve(base64Low);
                                                            } else {
                                                                resolve(base64);
                                                            }
                                                        };
                                                        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
                                                    };
                                                    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                                                });
                                            };

                                            try {
                                                const optimizedBase64 = await compressImage(file);
                                                handleChange('for_logotipo', optimizedBase64);
                                                handleChange('for_locimagem', ''); // Limpar campo legado
                                                console.log(`✅ Logo otimizado: ${(optimizedBase64.length / 1024).toFixed(1)} KB (${Math.round(300)}x${Math.round(200)} max)`);
                                            } catch (err) {
                                                console.error('❌ Erro ao processar imagem:', err);
                                                alert('Erro ao processar a imagem. Tente outro arquivo.');
                                            }
                                            // Limpar input para permitir re-selecionar o mesmo arquivo
                                            e.target.value = '';
                                        }}
                                    />
                                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold">Imagem será comprimida automaticamente • Máx 300x200px • JPEG</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-blue-600">Cód. Representante (Integrador)</Label>
                                    <Input
                                        className="h-10 text-sm font-black text-center text-blue-700 bg-blue-50 border-blue-100"
                                        value={formData.for_codrep || ''}
                                        onChange={(e) => handleChange('for_codrep', e.target.value)}
                                        placeholder="Ex: 1"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-emerald-600">Comissão de Venda (%)</Label>
                                    <Input
                                        className="h-10 text-sm font-black text-center text-emerald-700 bg-emerald-50 border-emerald-100"
                                        value={formData.for_percom || ''}
                                        onChange={(e) => handleChange('for_percom', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-2xl p-5 shadow-xl">
                                <Label className="mb-4 block text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-900/50 pb-2">Descontos Padrão (D1-D10)</Label>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <div key={num} className="flex flex-col items-center gap-1 group">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">D{num}</span>
                                            <Input
                                                className="h-9 text-center text-sm font-mono font-bold bg-slate-800 border-slate-700 text-emerald-400 p-0 focus:ring-emerald-500/30"
                                                value={formData[`for_des${num}`] || ''}
                                                onChange={(e) => handleChange(`for_des${num}`, e.target.value)}
                                                placeholder="0.0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Observações Internas (Notas Privadas)</Label>
                                <Textarea
                                    className="h-28 text-sm bg-slate-50 border-slate-200 focus:bg-white leading-relaxed p-4"
                                    value={formData.observacoes || ''}
                                    onChange={(e) => handleChange('observacoes', e.target.value)}
                                    placeholder="Instruções internas..."
                                />
                            </div>


                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const renderRelatedContent = (activeTab) => {
        switch (activeTab) {
            case 'contatos':
                return (
                    <div className="w-full h-full flex flex-col pt-4">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-slate-800 tracking-tight">Time de Atendimento</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">{contacts.length} cadastrados</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleNewContact}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 gap-2 shadow-lg shadow-emerald-600/10"
                                disabled={!supplier?.id}
                            >
                                <Plus size={16} /> Adicionar Integrante
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_80px] bg-slate-50/80 backdrop-blur-sm p-4 font-black text-slate-500 text-[10px] uppercase tracking-widest border-b sticky top-0 z-10">
                                <div className="pl-2">Nome Completo</div>
                                <div>Cargo / Função</div>
                                <div>Ramal / Fixo</div>
                                <div>Celular / WhatsApp</div>
                                <div>Aniversário</div>
                                <div className="text-center">Gerenciar</div>
                            </div>
                            <div className="flex-1 overflow-auto divide-y divide-slate-50">
                                {loadingContacts ? (
                                    <div className="flex items-center justify-center p-20 flex-col gap-3">
                                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando contatos...</span>
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                            <Mail size={40} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-400 uppercase text-xs tracking-wider">Nenhum integrante encontrado</p>
                                            <p className="text-sm text-slate-400">Clique em "Adicionar Integrante" para começar.</p>
                                        </div>
                                    </div>
                                ) : (
                                    contacts.map((contact, i) => (
                                        <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_80px] p-4 hover:bg-emerald-50/20 transition-all items-center group">
                                            <div className="pl-2 flex flex-col">
                                                <span className="font-bold text-blue-900 text-sm group-hover:text-blue-700 transition-colors">{contact.con_nome}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{contact.con_email || 'sem e-mail'}</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-600 uppercase tracking-tight">{contact.con_cargo}</div>
                                            <div className="text-slate-500 font-mono text-xs">{contact.con_telefone || '-'}</div>
                                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700">
                                                {contact.con_celular && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>}
                                                {contact.con_celular || '-'}
                                            </div>
                                            <div className="text-slate-500 px-2 py-1 bg-slate-50 rounded text-xs font-bold inline-block w-fit">{formatBirthDate(contact.con_dtnasc)}</div>
                                            <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-100" onClick={() => handleEditContact(contact)}>
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={() => handleDeleteContact(contact)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'politica_com':
                return (
                    <div className="space-y-4 pt-4 h-full flex flex-col">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                    <FileText size={18} />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Política Comercial e Regras</h4>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notas detalhadas para o representante</span>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute top-4 left-4 h-[calc(100%-32px)] w-1 bg-amber-200/50 rounded-full"></div>
                            <Textarea
                                className="w-full h-full bg-amber-50/10 border-slate-200 font-mono text-sm resize-none pl-8 pr-6 py-6 focus:ring-amber-500/20 leading-relaxed shadow-inner rounded-2xl"
                                placeholder="Insira aqui os termos de frete, pedido mínimo, descontos por região, bonificações, etc..."
                                value={formData.for_obs2 || formData.obs2 || ''}
                                onChange={(e) => handleChange('for_obs2', e.target.value)}
                            />
                        </div>
                    </div>
                );

            case 'meta':
                return (
                    <div className="space-y-6 pt-4 h-full">
                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20"><Radio size={20} className="animate-pulse" /></div>
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Radar de Metas {selectedYear}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Planejamento estratégico de volume de vendas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-white normal-case text-[10px] font-black mr-2">ALTERAR ANO:</Label>
                                <select
                                    className="bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-xs font-black text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-700 transition-colors"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month) => {
                                const fieldName = `met_${month.toLowerCase()}`;
                                const value = goals[fieldName] || 0;
                                const isEditing = editingField === fieldName;

                                return (
                                    <div key={month} className={`
                                        relative overflow-hidden group p-4 rounded-2xl border transition-all duration-300
                                        ${isEditing ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/40'}
                                    `}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isEditing ? 'text-blue-600' : 'text-slate-400'}`}>{month}</span>
                                            {value > 0 && !isEditing && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                        </div>

                                        <div className="relative mt-2">
                                            <Input
                                                className={`
                                                    text-right text-base font-black font-mono h-10 border-none bg-transparent p-0 transition-all
                                                    ${isEditing ? 'text-blue-600' : 'text-slate-800'}
                                                `}
                                                value={isEditing ? tempValue : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                                onChange={(e) => isEditing && setTempValue(e.target.value)}
                                                onFocus={() => {
                                                    setEditingField(fieldName);
                                                    setTempValue(value ? value.toString().replace('.', ',') : '');
                                                }}
                                                onBlur={() => {
                                                    const numeric = parseFloat(tempValue.replace(/\./g, '').replace(',', '.')) || 0;
                                                    setGoals(prev => ({ ...prev, [fieldName]: numeric }));
                                                    setEditingField(null);
                                                }}
                                            />
                                            {isEditing && (
                                                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 animate-[width-expand_0.3s_ease]"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center bg-blue-600 p-5 rounded-3xl shadow-2xl shadow-blue-600/20 translate-y-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Anual Planejado</span>
                                <span className="text-xl font-black text-white font-mono">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        Object.values(goals).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
                                    )}
                                </span>
                            </div>
                            <Button
                                onClick={handleSaveGoals}
                                className="bg-white hover:bg-slate-50 text-blue-600 font-extrabold h-12 px-8 gap-3 rounded-2xl shadow-xl hover:scale-105 transition-all"
                            >
                                <Save className="h-5 w-5" /> Confirmar Planejamento
                            </Button>
                        </div>
                    </div>
                );

            case 'clientes':
                return (
                    <div className="h-full bg-white flex flex-col pt-4">
                        <SupplierCustomersTab supplierId={supplier?.id} />
                    </div>
                );

            default:
                return (
                    <div className="p-20 text-center flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 m-2">
                        <div className="p-5 bg-white rounded-full shadow-sm mb-4">
                            <FileText size={48} className="text-slate-200" />
                        </div>
                        <h5 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Em Desenvolvimento</h5>
                        <p className="text-slate-400 text-xs mt-1">Esta funcionalidade estará disponível em breve.</p>
                    </div>
                );
        }
    };

    return (
        <>
            <FormCadPadrao
                title={supplier?.id ? `Fornecedor: ${formData.nomeReduzido || formData.razaoSocial || supplier.id}` : 'Novo Fornecedor'}
                onClose={() => onOpenChange(false)}
                onSave={() => onSave(formData)}
                tabs={mainTabs}
                relatedTabs={relatedTabs}
                renderTabContent={renderTabContent}
                renderRelatedContent={renderRelatedContent}
            />

            <ContactDialog
                open={contactDialogOpen}
                onOpenChange={setContactDialogOpen}
                contact={selectedContact}
                supplierId={supplier?.id}
                onSave={handleContactSaved}
            />
        </>
    );
}
