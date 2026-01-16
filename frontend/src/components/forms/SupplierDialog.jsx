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
import { FileText, Save, Plus, Pencil, Trash2, Radio, Search, Image } from "lucide-react";
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

    useEffect(() => {
        console.log('SupplierDialog Effect:', { supplier, open });
        if (supplier) {
            setFormData(supplier);
            loadContacts(supplier.id);
            loadGoals(supplier.id, selectedYear);
        } else {
            setFormData({});
            setContacts([]);
            setGoals({});
        }
    }, [supplier, selectedYear]);

    // Close if not open
    if (!open) return null;

    const loadContacts = async (supplierId) => {
        if (!supplierId) return;
        setLoadingContacts(true);
        try {
            const response = await fetch(`https://salesmasters.softham.com.br/api/suppliers/${supplierId}/contacts`);
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
                `https://salesmasters.softham.com.br/api/suppliers/${supplier.id}/contacts/${contact.con_codigo}`,
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
            const response = await fetch(`https://salesmasters.softham.com.br/api/suppliers/${supplierId}/goals/${year}`);
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
                `https://salesmasters.softham.com.br/api/suppliers/${supplier.id}/goals/${selectedYear}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goals)
                }
            );
            const result = await response.json();
            if (result.success) {
                toast.success(result.message);
            }
        } catch (error) {
            toast.error('Erro ao salvar metas');
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

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                razaoSocial: data.razao_social,
                nomeReduzido: data.nome_fantasia || data.razao_social.substring(0, 20),
                endereco: `${data.logradouro}, ${data.numero} ${data.complemento || ''}`,
                bairro: data.bairro,
                cidade: data.municipio,
                uf: data.uf,
                cep: data.cep,
                telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone1 || ''}` : prev.telefone,
                email: data.email || prev.email,
                situacao: data.descricao_situacao_cadastral === 'ATIVA' ? 'Ativo' : 'Inativo'
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

    // TABS CONFIGURATION
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
                    <div className="space-y-4 p-4">
                        {/* ROW 1: CNPJ, IE, Situacao */}
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 min-w-[200px] relative">
                                <Label className="text-xs text-muted-foreground">CNPJ <span className="text-[10px] text-gray-400 font-normal">Somente números</span></Label>
                                <div className="relative flex items-center">
                                    <Input
                                        className="h-9 text-sm font-mono pr-10 bg-yellow-50/50 border-yellow-200 focus:border-yellow-400"
                                        value={formData.cnpj || ''}
                                        onChange={(e) => handleChange('cnpj', e.target.value)}
                                        onFocus={handleCNPJFocus}
                                        onBlur={handleCNPJBlur}
                                        readOnly={!!supplier?.id}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-0 h-9 w-9 text-muted-foreground hover:text-emerald-600"
                                        onClick={handleConsultarCNPJ}
                                        disabled={!!supplier?.id}
                                        title="Consultar na Receita Federal"
                                    >
                                        <Radio className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="w-48">
                                <Label className="text-xs text-muted-foreground">Inscrição</Label>
                                <Input className="h-9 text-sm bg-muted/10 font-mono" value={formData.inscricao || ''} readOnly />
                            </div>
                            <div className="w-40">
                                <Label className="text-xs text-muted-foreground">Situação</Label>
                                <Select
                                    value={formData.situacao === "Ativo" ? "ativo" : "inativo"}
                                    onValueChange={(val) => handleChange('situacao', val === 'ativo' ? 'Ativo' : 'Inativo')}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="inativo">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ROW 2: Razao Social */}
                        <div>
                            <Label className="text-xs text-muted-foreground">Razão social</Label>
                            <Input
                                className="h-9 text-sm font-bold bg-white text-black text-lg"
                                value={formData.razaoSocial || ''}
                                onChange={(e) => handleChange('razaoSocial', e.target.value)}
                            />
                        </div>

                        {/* ROW 3: Address */}
                        <div className="flex gap-4 items-end">
                            <div className="flex-[2]">
                                <Label className="text-xs text-muted-foreground">Endereço</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={formData.endereco || ''}
                                    onChange={(e) => handleChange('endereco', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Bairro</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={formData.bairro || ''}
                                    onChange={(e) => handleChange('bairro', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-end">
                            <div className="flex-[2]">
                                <Label className="text-xs text-muted-foreground">Cidade</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={formData.cidade || ''}
                                    onChange={(e) => handleChange('cidade', e.target.value)}
                                />
                            </div>
                            <div className="w-20">
                                <Label className="text-xs text-muted-foreground">UF</Label>
                                <Input
                                    className="h-9 text-sm text-center"
                                    value={formData.uf || ''}
                                    onChange={(e) => handleChange('uf', e.target.value)}
                                />
                            </div>
                            <div className="w-32">
                                <Label className="text-xs text-muted-foreground">Cep</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={formData.cep || ''}
                                    onChange={(e) => handleChange('cep', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ROW 4: Phones, Email, Reduzido */}
                        <div className="flex gap-4 items-end">
                            <div className="w-40">
                                <Label className="text-xs text-muted-foreground">Telefone</Label>
                                <Input
                                    className="h-9 text-sm font-mono"
                                    value={formData.telefone || ''}
                                    onChange={(e) => handleChange('telefone', e.target.value)}
                                />
                            </div>
                            <div className="w-40">
                                <Label className="text-xs text-muted-foreground">Telefone 2</Label>
                                <Input className="h-9 text-sm font-mono" placeholder="" />
                            </div>
                            <div className="flex-[1.5]">
                                <Label className="text-xs text-muted-foreground">E-mail</Label>
                                <Input
                                    className="h-9 text-sm"
                                    value={formData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground font-semibold">Nome reduzido</Label>
                                <Input
                                    className="h-9 text-sm font-bold text-red-900 border-red-500 bg-red-50/20"
                                    value={formData.nomeReduzido || ''}
                                    onChange={(e) => handleChange('nomeReduzido', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'complemento':
                return (
                    <div className="grid grid-cols-2 gap-4 p-1">
                        <div className="space-y-1.5">
                            <div>
                                <Label className="text-[10px] text-muted-foreground">Imagem para aplicativos</Label>
                                <Input
                                    className="h-7 text-xs bg-yellow-50/50 border-yellow-200"
                                    value={formData.homepage || ''}
                                    onChange={(e) => handleChange('homepage', e.target.value)}
                                />
                            </div>

                            {/* Novo Campo de Logotipo */}
                            <div>
                                <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Image size={12} /> Logotipo (Indústria)
                                </Label>
                                <div className="space-y-2 mt-1">
                                    <div className="relative">
                                        <Input
                                            className="h-7 text-xs pr-8"
                                            value={formData.for_locimagem?.startsWith('data:') ? 'IMAGEM CARREGADA (Base64)' : (formData.for_locimagem || '')}
                                            readOnly
                                            placeholder="Selecione uma imagem..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('supplierLogoInput')?.click()}
                                            className="absolute right-1 top-1 text-gray-400 hover:text-emerald-600"
                                            title="Carregar Imagem"
                                        >
                                            <Search size={14} />
                                        </button>
                                        <input
                                            type="file"
                                            id="supplierLogoInput"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // Validar tamanho (ex: 1MB para indústrias para não pesar demais o grid)
                                                    if (file.size > 1024 * 1024) {
                                                        toast.error('A imagem é muito grande. O limite é 1MB.');
                                                        return;
                                                    }

                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64String = reader.result;
                                                        handleChange('for_locimagem', base64String);
                                                        toast.success('Logotipo carregado! Clique em Salvar para gravar permanentemente.');
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="w-full h-32 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {formData.for_locimagem ? (
                                            <img
                                                src={formData.for_locimagem.startsWith('data:') ? formData.for_locimagem : getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(formData.for_locimagem)}`)}
                                                alt="Logo"
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <Image className="text-gray-300" size={24} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label className="text-[10px] text-muted-foreground">Cód. representante</Label>
                                    <Input className="h-7 text-xs text-center bg-muted/10" defaultValue="1" />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-[10px] text-muted-foreground">Comissão (%)</Label>
                                    <Input className="h-7 text-xs text-center bg-muted/10" defaultValue="5.00%" />
                                </div>
                            </div>

                            <div className="bg-muted/10 p-2 rounded-lg border">
                                <Label className="mb-2 block text-[10px] font-semibold">Desconto padrão da indústria</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <div key={num} className="text-center">
                                            <div className="text-[9px] text-muted-foreground mb-0.5">{num}º</div>
                                            <Input
                                                className="h-6 text-center text-[10px] px-0.5"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Observações movido pra cá */}
                            <div>
                                <Label className="text-[10px] text-muted-foreground">Observações</Label>
                                <Textarea className="h-20 resize-none text-xs bg-muted/10" />
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
                    <div className="w-full text-xs h-full flex flex-col">
                        <div className="flex justify-between items-center p-1 bg-muted/20 border-b">
                            <span className="font-semibold text-muted-foreground ml-2">Contatos do Fornecedor</span>
                            <Button
                                size="sm"
                                onClick={handleNewContact}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-xs gap-1"
                                disabled={!supplier?.id}
                            >
                                <Plus className="h-3 w-3" /> Novo Contato
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto bg-white/5">
                            <div className="grid grid-cols-12 bg-muted/20 p-1.5 font-semibold text-muted-foreground text-[10px] border-b sticky top-0">
                                <div className="col-span-3 pl-2">Nome</div>
                                <div className="col-span-2">Cargo</div>
                                <div className="col-span-2">Telefone</div>
                                <div className="col-span-2">Celular</div>
                                <div className="col-span-2">Data nasc</div>
                                <div className="col-span-1 text-center">Ações</div>
                            </div>
                            {loadingContacts ? (
                                <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                            ) : contacts.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">Nenhum contato cadastrado</div>
                            ) : (
                                contacts.map((contact, i) => (
                                    <div key={i} className="grid grid-cols-12 p-1.5 border-b border-white/5 hover:bg-white/5 items-center">
                                        <div className="col-span-3 pl-2 text-blue-400 font-medium">{contact.con_nome}</div>
                                        <div className="col-span-2">{contact.con_cargo}</div>
                                        <div className="col-span-2">{contact.con_telefone}</div>
                                        <div className="col-span-2">{contact.con_celular}</div>
                                        <div className="col-span-2">{formatBirthDate(contact.con_dtnasc)}</div>
                                        <div className="col-span-1 flex gap-1 justify-center">
                                            <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-blue-500" onClick={() => handleEditContact(contact)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-red-500" onClick={() => handleDeleteContact(contact)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'politica_com':
                return (
                    <div className="space-y-2 p-2 h-full flex flex-col">
                        <Label className="text-sm font-semibold text-foreground">Política Comercial</Label>
                        <Textarea
                            className="flex-1 bg-yellow-50 border-yellow-200 font-mono text-xs resize-none"
                            placeholder="Ex: PEDIDO MÍNIMO 500 REAIS..."
                            value={formData.obs2 || ''}
                            onChange={(e) => handleChange('obs2', e.target.value)}
                        />
                    </div>
                );

            case 'meta':
                return (
                    <div className="space-y-4 p-2 h-full overflow-auto">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold text-foreground">Metas Anuais (em Reais)</Label>
                            <select
                                className="border rounded px-2 py-1 text-xs"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month) => {
                                const fieldName = `met_${month.toLowerCase()}`;
                                const value = goals[fieldName] || 0;
                                return (
                                    <div key={month} className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">{month}</Label>
                                        <Input
                                            className="text-right text-xs font-mono h-7"
                                            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                                                setGoals(prev => ({ ...prev, [fieldName]: parseFloat(numericValue) || 0 }));
                                            }}
                                            onFocus={(e) => { e.target.value = value.toString(); e.target.select(); }}
                                            onBlur={(e) => {
                                                const numericValue = parseFloat(e.target.value) || 0;
                                                setGoals(prev => ({ ...prev, [fieldName]: numericValue }));
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveGoals} className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs">
                                <Save className="h-3 w-3 mr-2" /> Salvar Metas
                            </Button>
                        </div>
                    </div>
                );

            case 'clientes':
                return <SupplierCustomersTab supplierId={supplier?.id} />;

            default:
                return (
                    <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center bg-gray-50/50 rounded border border-dashed border-gray-300 m-2">
                        <p>Funcionalidade "{relatedTabs.find(t => t.id === activeTab)?.label}" em breve.</p>
                    </div>
                );
        }
    };

    return (
        <>
            <FormCadPadrao
                title={supplier?.id ? `Editar Fornecedor: ${formData.nome || formData.razaoSocial || supplier.id}` : 'Novo Fornecedor'}
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
