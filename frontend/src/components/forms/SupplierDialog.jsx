import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, X, User, Building, MapPin, Mail, Phone, Radio, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ContactDialog } from "./ContactDialog";

export function SupplierDialog({ open, onOpenChange, supplier, onSave }) {
    const [formData, setFormData] = useState({});
    const [contacts, setContacts] = useState([]);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [goals, setGoals] = useState({});

    useEffect(() => {
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

    const loadContacts = async (supplierId) => {
        if (!supplierId) return;
        setLoadingContacts(true);
        try {
            const response = await fetch(`http://localhost:3001/api/suppliers/${supplierId}/contacts`);
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
                `http://localhost:3001/api/suppliers/${supplier.id}/contacts/${contact.con_codigo}`,
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
            const response = await fetch(`http://localhost:3001/api/suppliers/${supplierId}/goals/${year}`);
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
                `http://localhost:3001/api/suppliers/${supplier.id}/goals/${selectedYear}`,
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
        console.log(`🔄 handleChange - field: ${field}, value:`, value);
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
        // Remove formatting, leave only numbers
        if (formData.cnpj) {
            handleChange('cnpj', formData.cnpj.replace(/\D/g, ''));
        }
    };

    const handleCNPJBlur = () => {
        // Apply mask if 14 digits
        const raw = formData.cnpj?.replace(/\D/g, '') || '';
        if (raw.length === 14) {
            const formatted = raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
            handleChange('cnpj', formatted);
        }
    };


    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <div className="flex items-center gap-2 text-foreground/80">
                            <Building className="h-5 w-5" />
                            <DialogTitle>Editar Fornecedor</DialogTitle>
                        </div>
                        <DialogDescription>
                            Preencha os dados do fornecedor nas abas abaixo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 p-6 space-y-6">
                        {/* Section: DADOS */}
                        <div className="bg-muted/10 border rounded-xl overflow-hidden">
                            <div className="bg-muted/20 px-4 py-2 border-b text-sm font-semibold text-muted-foreground">
                                Dados
                            </div>
                            <div className="p-4">
                                <Tabs defaultValue="principal" className="w-full">
                                    <TabsList className="mb-4 bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-2">
                                        <TabsTrigger
                                            value="principal"
                                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md border border-b-0 px-6 py-2"
                                        >
                                            <FileText className="mr-2 h-4 w-4" /> Principal
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="complemento"
                                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md border border-b-0 px-6 py-2"
                                        >
                                            <FileText className="mr-2 h-4 w-4" /> Complemento
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="principal" className="space-y-4">
                                        {/* ROW 1: CNPJ, IE, Situacao */}
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3">
                                                <Label className="text-xs text-muted-foreground">CNPJ <span className="text-[10px]">(Somente números)</span></Label>
                                                <div className="relative flex items-center">
                                                    <Input
                                                        className="bg-yellow-50/50 border-yellow-200 focus:border-yellow-400 font-mono text-sm pr-10"
                                                        value={formData.cnpj || ''}
                                                        onChange={(e) => handleChange('cnpj', e.target.value)}
                                                        onFocus={handleCNPJFocus}
                                                        onBlur={handleCNPJBlur}
                                                        readOnly={!!supplier?.id} // Editable only if creating new
                                                        placeholder="Digite o CNPJ"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="absolute right-0 h-full w-9 text-muted-foreground hover:text-emerald-600"
                                                        onClick={handleConsultarCNPJ}
                                                        disabled={!!supplier?.id}
                                                        title="Consultar na Receita Federal"
                                                    >
                                                        <Radio className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-xs text-muted-foreground">Inscrição</Label>
                                                <Input className="bg-muted/10 font-mono text-sm" value={formData.inscricao || ''} readOnly />
                                            </div>
                                            <div className="col-span-6 md:col-span-4 lg:col-span-3">
                                                <Label className="text-xs text-muted-foreground">Situação</Label>
                                                <Select
                                                    value={formData.situacao === "Ativo" ? "ativo" : "inativo"}
                                                    onValueChange={(val) => handleChange('situacao', val === 'ativo' ? 'Ativo' : 'Inativo')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
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
                                                className="bg-muted/10 shadow-sm"
                                                value={formData.razaoSocial || ''}
                                                onChange={(e) => handleChange('razaoSocial', e.target.value)}
                                            />
                                        </div>

                                        {/* ROW 3: Address */}
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-5">
                                                <Label className="text-xs text-muted-foreground">Endereço</Label>
                                                <Input
                                                    className="bg-muted/10"
                                                    value={formData.endereco || ''}
                                                    onChange={(e) => handleChange('endereco', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-xs text-muted-foreground">Bairro</Label>
                                                <Input
                                                    className="bg-muted/10"
                                                    value={formData.bairro || ''}
                                                    onChange={(e) => handleChange('bairro', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs text-muted-foreground">Cidade</Label>
                                                <Input
                                                    className="bg-muted/10"
                                                    value={formData.cidade || ''}
                                                    onChange={(e) => handleChange('cidade', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Label className="text-xs text-muted-foreground">UF</Label>
                                                <Input
                                                    className="bg-muted/10 text-center"
                                                    value={formData.uf || ''}
                                                    onChange={(e) => handleChange('uf', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Label className="text-xs text-muted-foreground">Cep</Label>
                                                <Input
                                                    className="bg-muted/10"
                                                    value={formData.cep || ''}
                                                    onChange={(e) => handleChange('cep', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* ROW 4: Phones */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Telefone</Label>
                                                <Input
                                                    className="bg-muted/10 font-mono text-sm"
                                                    value={formData.telefone || ''}
                                                    onChange={(e) => handleChange('telefone', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Telefone 2</Label>
                                                <Input className="bg-muted/10 font-mono text-sm" placeholder="" />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Fax</Label>
                                                <Input className="bg-muted/10 font-mono text-sm" placeholder="" />
                                            </div>
                                        </div>

                                        {/* ROW 5: Email & Nome Reduzido */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">E-mail</Label>
                                                <Input
                                                    className="bg-muted/10"
                                                    value={formData.email || ''}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Nome reduzido</Label>
                                                <Input
                                                    className="border-red-400 focus:ring-red-200 bg-red-50/10"
                                                    value={formData.nomeReduzido || ''}
                                                    onChange={(e) => handleChange('nomeReduzido', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="complemento" className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Imagem para aplicativos</Label>
                                                    <Input className="bg-yellow-50/50 border-yellow-200" defaultValue="https://www.softham.com.br/clientes/nds/2m.jpg" />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Logotipo</Label>
                                                    <Input className="bg-muted/10" defaultValue="z:\logo\2mplas.jpg" />
                                                </div>
                                                <div>
                                                    {/* Text Area for Observations logic if needed */}
                                                    <Label className="text-xs text-muted-foreground">Observações</Label>
                                                    <Textarea className="h-24 resize-none bg-muted/10" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Cód. representante</Label>
                                                        <Input className="bg-muted/10 text-center" defaultValue="1" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Comissão (%)</Label>
                                                        <Input className="bg-muted/10 text-center" defaultValue="5.00%" />
                                                    </div>
                                                </div>

                                                <div className="bg-muted/10 p-4 rounded-lg border">
                                                    <Label className="mb-3 block text-xs font-semibold">Desconto padrão da indústria</Label>
                                                    <div className="grid grid-cols-5 gap-3">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                            <div key={num} className="text-center">
                                                                <div className="text-[10px] text-muted-foreground mb-1">{num}º</div>
                                                                <Input
                                                                    className="h-8 text-center text-xs px-1"
                                                                    placeholder="0.00%"
                                                                // Logical binding to be added
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>

                        {/* Section: Sub-tabs (Lower section) */}
                        <div>
                            <Tabs defaultValue="contatos">
                                <TabsList className="w-full justify-start bg-emerald-600/10 p-0 h-auto gap-1 rounded-none border-b border-emerald-600/20">
                                    <TabsTrigger value="contatos" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md rounded-b-none px-6 py-2 border-b-0 h-9 text-xs">Contatos</TabsTrigger>
                                    <TabsTrigger value="clientes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md rounded-b-none px-6 py-2 border-b-0 h-9 text-xs">Clientes que já compraram</TabsTrigger>
                                    <TabsTrigger value="politica_desc" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md rounded-b-none px-6 py-2 border-b-0 h-9 text-xs">Política de descontos</TabsTrigger>
                                    <TabsTrigger value="politica_com" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md rounded-b-none px-6 py-2 border-b-0 h-9 text-xs">Política comercial</TabsTrigger>
                                    <TabsTrigger value="meta" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-t-md rounded-b-none px-6 py-2 border-b-0 h-9 text-xs">Meta anual</TabsTrigger>
                                </TabsList>
                                <TabsContent value="contatos" className="bg-white/5 border border-t-0 p-0 rounded-b-md min-h-[150px]">
                                    {/* Contacts Table */}
                                    <div className="w-full text-sm">
                                        <div className="flex justify-between items-center p-2 bg-muted/10 border-b">
                                            <span className="text-xs font-semibold text-muted-foreground">Contatos do Fornecedor</span>
                                            <Button
                                                size="sm"
                                                onClick={handleNewContact}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs gap-1"
                                                disabled={!supplier?.id}
                                            >
                                                <Plus className="h-3 w-3" /> Novo Contato
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-12 bg-muted/20 p-2 font-semibold text-muted-foreground text-xs border-b">
                                            <div className="col-span-3 pl-2">Nome</div>
                                            <div className="col-span-2">Cargo</div>
                                            <div className="col-span-2">Telefone</div>
                                            <div className="col-span-2">Celular</div>
                                            <div className="col-span-2">Data nasc</div>
                                            <div className="col-span-1 text-center">Ações</div>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {loadingContacts ? (
                                                <div className="p-4 text-center text-muted-foreground text-xs">
                                                    Carregando contatos...
                                                </div>
                                            ) : contacts.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground text-xs">
                                                    Nenhum contato cadastrado
                                                </div>
                                            ) : (
                                                contacts.map((contact, i) => (
                                                    <div key={i} className="grid grid-cols-12 p-2 px-2 border-b border-white/5 hover:bg-white/5 items-center text-xs">
                                                        <div className="col-span-3 pl-2 text-blue-400 font-medium">{contact.con_nome}</div>
                                                        <div className="col-span-2">{contact.con_cargo}</div>
                                                        <div className="col-span-2">{contact.con_telefone}</div>
                                                        <div className="col-span-2">{contact.con_celular}</div>
                                                        <div className="col-span-2">{formatBirthDate(contact.con_dtnasc)}</div>
                                                        <div className="col-span-1 flex gap-1 justify-center">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 hover:text-blue-500"
                                                                onClick={() => handleEditContact(contact)}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 hover:text-red-500"
                                                                onClick={() => handleDeleteContact(contact)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="politica_com" className="bg-white/5 border border-t-0 p-4 rounded-b-md min-h-[200px]">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-foreground">Política Comercial</Label>
                                        <Textarea
                                            className="min-h-[180px] bg-yellow-50 border-yellow-200 font-mono text-sm resize-none"
                                            placeholder="Ex: PEDIDO MÍNIMO 500 REAIS&#10;PREÇOS LÍQUIDOS&#10;PRAZO DE PAGAMENTO NEGOCIÁVEL"
                                            value={formData.obs2 || ''}
                                            onChange={(e) => handleChange('obs2', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Digite as informações sobre política comercial, pedido mínimo, prazos, etc.
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="meta" className="bg-white/5 border border-t-0 p-4 rounded-b-md min-h-[200px]">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm font-semibold text-foreground">Metas Anuais (em Reais)</Label>
                                            <select
                                                className="border rounded px-3 py-1 text-sm"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            >
                                                <option value={2024}>2024</option>
                                                <option value={2025}>2025</option>
                                                <option value={2026}>2026</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-6 gap-2">
                                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month) => {
                                                const fieldName = `met_${month.toLowerCase()}`;
                                                const value = goals[fieldName] || 0;

                                                return (
                                                    <div key={month} className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{month}</Label>
                                                        <Input
                                                            type="text"
                                                            className="text-right text-sm font-mono"
                                                            value={new Intl.NumberFormat('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL'
                                                            }).format(value)}
                                                            onChange={(e) => {
                                                                // Remove currency formatting and parse
                                                                const numericValue = e.target.value
                                                                    .replace(/[^\d,]/g, '')
                                                                    .replace(',', '.');
                                                                setGoals(prev => ({
                                                                    ...prev,
                                                                    [fieldName]: parseFloat(numericValue) || 0
                                                                }));
                                                            }}
                                                            onFocus={(e) => {
                                                                // Show raw number on focus
                                                                e.target.value = value.toString();
                                                                e.target.select();
                                                            }}
                                                            onBlur={(e) => {
                                                                // Reformat on blur
                                                                const numericValue = parseFloat(e.target.value) || 0;
                                                                setGoals(prev => ({
                                                                    ...prev,
                                                                    [fieldName]: numericValue
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            onClick={handleSaveGoals}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <Save className="h-4 w-4 mr-2" /> Salvar Metas
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                    </div>

                    <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
                            <X className="h-4 w-4" /> Cancelar
                        </Button>
                        <Button onClick={() => onSave(formData)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg hover:shadow-emerald-600/20">
                            <Save className="h-4 w-4" /> Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contact Dialog */}
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
