import React, { useState, useEffect } from 'react';
import { ClientContactDialog } from './ClientContactDialog';
import ClientIndustryDialog from './ClientIndustryDialog';
import { ClientAreasTab } from './ClientAreasTab';
import { ClientPurchasedIndustriesTab } from '../tabs/ClientPurchasedIndustriesTab';
import { ClientDiscountsTab } from './ClientDiscountsTab';
import ClientProspectionTab from './ClientProspectionTab';
import { FileText, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Save, X } from "lucide-react";
import { NODE_API_URL, getApiUrl } from "../../utils/apiConfig";


const ClientForm = ({ data, onClose, onSave, open, onOpenChange }) => {
    if (!open) return null;

    const [formData, setFormData] = useState({});
    const [areas, setAreas] = useState([]);
    // const [cities, setCities] = useState([]); // Removed bulk load
    const [cityOptions, setCityOptions] = useState([]); // For async search
    const [sellers, setSellers] = useState([]);
    const [regions, setRegions] = useState([]);
    const [openSeller, setOpenSeller] = useState(false);
    const [loadingAux, setLoadingAux] = useState(false);

    // --- Industries State ---
    const [industries, setIndustries] = useState([]);
    const [loadingIndustries, setLoadingIndustries] = useState(false);
    const [industryDialogOpen, setIndustryDialogOpen] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    // ------------------------

    // --- Contacts State ---
    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    const fetchContacts = async () => {
        if (!data?.cli_codigo) return;
        setLoadingContacts(true);
        try {
            const res = await fetch(`${NODE_API_URL}/api/clients/${data.cli_codigo}/contacts`);
            if (res.ok) {
                const json = await res.json();
                setContacts(json.data);
            }
        } catch (error) {
            console.error("Erro ao buscar contatos", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchIndustries = async () => {
        if (!data?.cli_codigo) return;
        setLoadingIndustries(true);
        try {
            const res = await fetch(`${NODE_API_URL}/api/clients/${data.cli_codigo}/industries`);
            if (res.ok) {
                const json = await res.json();
                setIndustries(json.data);
            }
        } catch (error) {
            console.error("Erro ao buscar indústrias", error);
        } finally {
            setLoadingIndustries(false);
        }
    };

    useEffect(() => {
        if (data?.cli_codigo) {
            fetchContacts();
            fetchIndustries();
        } else {
            setContacts([]);
            setIndustries([]);
        }
    }, [data?.cli_codigo]);

    const handleAddContact = () => {
        setSelectedContact(null);
        setContactDialogOpen(true);
    };

    const handleEditContact = (contact) => {
        setSelectedContact(contact);
        setContactDialogOpen(true);
    };

    const handleDeleteContact = async (contact) => {
        if (!confirm(`Deseja excluir o contato ${contact.ani_nome}?`)) return;

        try {
            const res = await fetch(`" + NODE_API_URL + \/api/clients/${data.cli_codigo}/contacts/${contact.ani_lancto}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Contato excluído!");
                fetchContacts();
            } else {
                toast.error("Erro ao excluir contato");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir contato");
        }
    };

    const handleContactSaved = () => {
        fetchContacts();
    };
    // ----------------------

    // --- Industries Handlers ---
    const handleAddIndustry = () => {
        setSelectedIndustry(null);
        setIndustryDialogOpen(true);
    };

    const handleEditIndustry = (ind) => {
        setSelectedIndustry(ind);
        setIndustryDialogOpen(true);
    };

    const handleIndustrySaved = () => {
        fetchIndustries();
        setIndustryDialogOpen(false);
    };

    const handleDeleteIndustry = async (ind) => {
        if (!window.confirm(`Tem certeza que deseja remover a indústria ${ind.fornecedor_nome}?`)) return;
        try {
            const res = await fetch(`" + NODE_API_URL + \/api/clients/${data.cli_codigo}/industries/${ind.cli_lancamento}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Indústria removida.");
                fetchIndustries();
            } else {
                toast.error("Erro ao remover.");
            }
        } catch (error) {
            console.error("Erro ao deletar indústria", error);
        }
    };
    // ---------------------------

    // City Search State
    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState("");

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (citySearch && citySearch.length > 2) {
                fetch(`" + NODE_API_URL + \/api/aux/cidades?search=${citySearch}`)
                    .then(res => res.json())
                    .then(data => setCityOptions(data))
                    .catch(e => console.error(e));
            } else if (!citySearch) {
                // Initial load (top 10) or reset
                fetch(`" + NODE_API_URL + \/api/aux/cidades`)
                    .then(res => res.json())
                    .then(data => setCityOptions(data))
                    .catch(e => console.error(e));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [citySearch]);

    // Initial Load for Edit (Fetch correct city name if ID exists)
    useEffect(() => {
        if (formData.cli_idcidade) {
            fetch(`" + NODE_API_URL + \/api/aux/cidades?id=${formData.cli_idcidade}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        // If name is missing or different, we could update, but main goal is to have options ready if needed
                        // But actually, we just need to ensure the display name is correct.
                        // The form uses `formData.cli_cidade` for display usually?
                        // Let's assume formData has the name. If not, we update it.
                        if (!formData.cli_cidade) {
                            setFormData(prev => ({ ...prev, cli_cidade: data[0].cid_nome, cli_uf: data[0].cid_uf }));
                        }
                        setCityOptions([data[0]]); // Pre-populate options with selected city
                    }
                })
                .catch(e => console.error(e));
        }
    }, [formData.cli_idcidade]);

    const loadAuxData = async () => {
        setLoadingAux(true);
        try {
            const [areasRes, sellersRes, regionsRes] = await Promise.all([
                fetch('" + NODE_API_URL + \/api/aux/areas'),
                fetch('" + NODE_API_URL + \/api/aux/vendedores'),
                fetch('" + NODE_API_URL + \/api/aux/regioes')
            ]);

            if (areasRes.ok) {
                const json = await areasRes.json();
                setAreas(Array.isArray(json) ? json : json.data || []);
            }
            if (sellersRes.ok) {
                const json = await sellersRes.json();
                setSellers(Array.isArray(json) ? json : json.data || []);
            }
            if (regionsRes.ok) {
                const json = await regionsRes.json();
                setRegions(Array.isArray(json) ? json : json.data || []);
            }
        } catch (error) {
            console.error("Erro ao carregar dados auxiliares", error);
        } finally {
            setLoadingAux(false);
        }
    };

    useEffect(() => {
        // Initialize or load data
        if (data) {
            setFormData(data);
        } else {
            setFormData({
                cli_tipopes: 'A',
                cli_datacad: new Date().toISOString().split('T')[0],
                cli_uf: 'MS',
                cli_cidade: 'CAMPO GRANDE'
            });
        }

        // Load Aux Data
        loadAuxData();
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCitySelect = (city) => {
        setFormData(prev => ({
            ...prev,
            cli_idcidade: city.cid_codigo,
            cli_cidade: city.cid_nome,
            cli_uf: city.cid_uf
        }));
        setCityOpen(false);
    };

    const handleSave = () => {
        if (!formData.cli_nome) {
            toast.error("A Razão Social é obrigatória!");
            return;
        }
        if (!formData.cli_cnpj) {
            toast.error("O CNPJ/CPF é obrigatório!");
            return;
        }
        onSave(formData);
    };

    const mainTabs = [
        { id: 'principal', label: 'Principal', icon: <FileText size={16} /> },
        { id: 'complemento', label: 'Complemento', icon: <FileText size={16} /> },
        { id: 'dados', label: 'Dados/Cobrança', icon: <FileText size={16} /> },
    ];

    const relatedTabs = [
        { id: 'contatos', label: 'Contatos' },
        { id: 'industrias', label: 'Dados nas indústrias' },
        { id: 'compradas', label: 'Indústrias compradas' },
        { id: 'areas', label: 'Áreas de atuação' },
        { id: 'prospeccao', label: 'Prospecção' },
        { id: 'descontos', label: 'Descontos' },
        { id: 'metas', label: 'Metas' },
    ];


    const handleConsultarCNPJ = async () => {
        const cnpj = formData.cli_cnpj?.replace(/\D/g, '');
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

            // Find city
            const city = cities.find(c =>
                c.cid_nome.toUpperCase() === data.municipio.toUpperCase() &&
                c.cid_uf === data.uf
            );

            setFormData(prev => ({
                ...prev,
                cli_nome: data.razao_social,
                cli_fantasia: data.nome_fantasia || data.razao_social.substring(0, 20),
                cli_endereco: `${data.logradouro}, ${data.numero}`,
                cli_complemento: data.complemento || '',
                cli_bairro: data.bairro,
                cli_cep: data.cep,
                cli_fone1: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone1 || ''}` : prev.cli_fone1,
                cli_email: data.email || prev.cli_email,
                cli_tipopes: data.descricao_situacao_cadastral === 'ATIVA' ? 'A' : 'I',
                cli_dtabertura: data.data_inicio_atividade || prev.cli_dtabertura,
                // City binding
                ...(city ? {
                    cli_idcidade: city.cid_codigo,
                    cli_cidade: city.cid_nome,
                    cli_uf: city.cid_uf
                } : {})
            }));

            toast.dismiss(toastId);
            toast.success("Dados encontrados com sucesso!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    };

    const renderTabContent = (activeTab) => {
        switch (activeTab) {
            case 'principal':
                return (
                    <div className="space-y-1 p-1">
                        {/* Row 1: CNPJ | Inscricao | Status | Dt Abertura */}
                        <div className="flex gap-1.5 items-end">
                            <div className="w-40 relative">
                                <Label className="text-[10px]">CNPJ/CPF <span className="text-gray-400 text-[9px] font-normal">Somente números</span></Label>
                                <div className="relative flex items-center">
                                    <Input
                                        value={formData.cli_cnpj || ''}
                                        onChange={(e) => handleChange('cli_cnpj', e.target.value)}
                                        className="font-bold text-xs h-7 border-red-300 pr-8"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-0 h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                        onClick={handleConsultarCNPJ}
                                        title="Consultar CNPJ"
                                    >
                                        <Search className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="w-28">
                                <Label className="text-[10px]">Inscrição</Label>
                                <Input
                                    value={formData.cli_inscricao || ''}
                                    onChange={(e) => handleChange('cli_inscricao', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="w-24">
                                <Label className="text-[10px]">Status</Label>
                                <Select
                                    value={formData.cli_tipopes}
                                    onValueChange={(val) => handleChange('cli_tipopes', val)}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        <SelectItem value="A">ATIVO</SelectItem>
                                        <SelectItem value="I">INATIVO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-32">
                                <Label className="text-[10px]">Dt de abertura empresa</Label>
                                <Input
                                    type="date"
                                    value={formData.cli_dtabertura ? formData.cli_dtabertura.split('T')[0] : ''}
                                    onChange={(e) => handleChange('cli_dtabertura', e.target.value)}
                                    className="h-7 text-xs border-red-300 px-1"
                                />
                            </div>
                        </div>

                        {/* Row 2: Razao | Fantasia | Area */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-[2]">
                                <Label className="text-[10px]">Razão Social</Label>
                                <Input
                                    value={formData.cli_nome || ''}
                                    onChange={(e) => handleChange('cli_nome', e.target.value)}
                                    className="h-7 text-xs font-bold bg-white text-black"
                                />
                            </div>
                            <div className="flex-[2]">
                                <Label className="text-[10px]">Nome fantasia</Label>
                                <Input
                                    value={formData.cli_fantasia || ''}
                                    onChange={(e) => handleChange('cli_fantasia', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Principal área de atuação</Label>
                                <Select
                                    value={formData.cli_atuacaoprincipal?.toString()}
                                    onValueChange={(val) => handleChange('cli_atuacaoprincipal', parseInt(val))}
                                >
                                    <SelectTrigger className="h-7 text-xs border-red-300">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {areas.map(area => (
                                            <SelectItem key={area.atu_id} value={area.atu_id.toString()}>
                                                {area.atu_descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 2: Razao | Fantasia | Dt Abertura */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-[2]">
                                <Label className="text-[10px]">Endereço</Label>
                                <Input
                                    value={formData.cli_endereco || ''}
                                    onChange={(e) => handleChange('cli_endereco', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="w-20">
                                <Label className="text-[10px]">Compl.</Label>
                                <Input
                                    value={formData.cli_complemento || ''}
                                    onChange={(e) => handleChange('cli_complemento', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Bairro</Label>
                                <Input
                                    value={formData.cli_bairro || ''}
                                    onChange={(e) => handleChange('cli_bairro', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="w-20">
                                <Label className="text-[10px]">CEP</Label>
                                <Input
                                    value={formData.cli_cep || ''}
                                    onChange={(e) => handleChange('cli_cep', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 4: Cidade | UF | Telefone | Celular */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-[2] flex flex-col">
                                <Label className="text-[10px] mb-1">Cidades (cadastro nacional) - Digite para buscar</Label>
                                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={cityOpen}
                                            className={cn(
                                                "h-7 text-xs justify-between border-green-500 bg-green-50/50 text-emerald-900 w-full hover:bg-green-100",
                                                !formData.cli_cidade && "text-muted-foreground"
                                            )}
                                        >
                                            {formData.cli_cidade || "Selecione a cidade..."}
                                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Busque cidade..."
                                                value={citySearch}
                                                onValueChange={setCitySearch}
                                                className="h-8 text-xs"
                                            />
                                            <CommandList>
                                                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                                <CommandGroup>
                                                    {cityOptions.map((city) => (
                                                        <CommandItem
                                                            key={city.cid_codigo}
                                                            value={city.cid_nome} // Use Name for internal matching if filter was true, but we use ID for select
                                                            onSelect={() => handleCitySelect(city)}
                                                            className="text-xs"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-3 w-3",
                                                                    formData.cli_idcidade === city.cid_codigo ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {city.cid_nome} - {city.cid_uf}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="w-12">
                                <Label className="text-[10px]">UF</Label>
                                <Input
                                    value={formData.cli_uf || ''}
                                    readOnly
                                    className="h-7 text-xs bg-gray-100 text-black px-1 text-center"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Telefone</Label>
                                <Input
                                    value={formData.cli_fone1 || ''}
                                    onChange={(e) => handleChange('cli_fone1', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Celular</Label>
                                <Input
                                    value={formData.cli_fone2 || ''}
                                    onChange={(e) => handleChange('cli_fone2', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 5: Email | Nome Red | Rede Lojas | Fax (Optional, fit if space) */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-[1.5]">
                                <Label className="text-[10px]">E-mail</Label>
                                <Input
                                    value={formData.cli_email || ''}
                                    onChange={(e) => handleChange('cli_email', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Nome reduzido</Label>
                                <Input
                                    value={formData.cli_nomred || ''}
                                    onChange={(e) => handleChange('cli_nomred', e.target.value)}
                                    className="h-7 text-xs text-orange-600 font-bold"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Rede de lojas</Label>
                                <Input
                                    value={formData.cli_redeloja || ''}
                                    onChange={(e) => handleChange('cli_redeloja', e.target.value)}
                                    className="h-7 text-xs text-blue-800 font-bold"
                                />
                            </div>
                            <div className="w-24">
                                <Label className="text-[10px]">Fax</Label>
                                <Input
                                    value={formData.cli_fone3 || ''}
                                    onChange={(e) => handleChange('cli_fone3', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'complemento':
                return (
                    <div className="space-y-1.5 p-1">
                        {/* Row 1: Vendedor (Select?) | Logotipo */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-1 flex flex-col">
                                <Label className="text-[10px] mb-1">Vendedor</Label>
                                <Select
                                    value={formData.cli_vendedor?.toString()}
                                    onValueChange={(val) => handleChange('cli_vendedor', parseInt(val))}
                                >
                                    <SelectTrigger className="h-7 text-xs w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {sellers.map((seller) => (
                                            <SelectItem key={seller.ven_codigo} value={seller.ven_codigo.toString()}>
                                                {seller.ven_nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Logotipo (Skype)</Label>
                                <div className="flex gap-1">
                                    <Input
                                        value={formData.cli_skype || ''}
                                        onChange={(e) => handleChange('cli_skype', e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                    <Button size="icon" variant="outline" className="h-7 w-7"><Search size={12} /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Região | Regime */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-1">
                                <Label className="text-[10px]">Região</Label>
                                <Select
                                    value={formData.cli_regiao2?.toString()}
                                    onValueChange={(val) => handleChange('cli_regiao2', parseInt(val))}
                                >
                                    <SelectTrigger className="h-7 text-xs w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {regions && regions.length > 0 && regions.map((region) => (
                                            <SelectItem key={region.reg_codigo} value={region.reg_codigo.toString()}>
                                                {region.reg_descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Regime da empresa</Label>
                                <Select
                                    value={formData.cli_regimeemp}
                                    onValueChange={(val) => handleChange('cli_regimeemp', val)}
                                >
                                    <SelectTrigger className="h-7 text-xs text-cyan-500">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                                        <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                                        <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                                        <SelectItem value="Regime Especial">Regime Especial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 3: Email NFe | Caixa Postal */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-1">
                                <Label className="text-[10px]">E-mail NFe</Label>
                                <Input
                                    value={formData.cli_emailnfe || ''}
                                    onChange={(e) => handleChange('cli_emailnfe', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Caixa postal</Label>
                                <Input
                                    value={formData.cli_cxpostal || ''}
                                    onChange={(e) => handleChange('cli_cxpostal', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 4: Email Financeiro | Suframa | Vencimento */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-1">
                                <Label className="text-[10px]">E-mail setor financeiro</Label>
                                <Input
                                    value={formData.cli_emailfinanc || ''}
                                    onChange={(e) => handleChange('cli_emailfinanc', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[10px]">SUFRAMA</Label>
                                    <Input
                                        value={formData.cli_suframa || ''}
                                        onChange={(e) => handleChange('cli_suframa', e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px]">Vencimento</Label>
                                    <Input
                                        type="date"
                                        value={formData.cli_vencsuf ? formData.cli_vencsuf : ''}
                                        onChange={(e) => handleChange('cli_vencsuf', e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 5: Obs Pedido | Observacoes */}
                        <div className="flex gap-1.5 items-end">
                            <div className="flex-1">
                                <Label className="text-[10px]">Observações para o pedido</Label>
                                <Input
                                    value={formData.cli_obspedido || ''}
                                    onChange={(e) => handleChange('cli_obspedido', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Observações</Label>
                                <Input
                                    value={formData.cli_obs || ''}
                                    onChange={(e) => handleChange('cli_obs', e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 6: Ref Comerciais */}
                        <div>
                            <Label className="text-[10px]">Referências comerciais</Label>
                            <Input
                                value={formData.cli_refcom || ''}
                                onChange={(e) => handleChange('cli_refcom', e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>
                );

            case 'dados':
                return (
                    <div className="space-y-1.5 p-1">
                        {/* Comprador REMOVED */}

                        {/* Row 1: Dates & Audit */}
                        <div className="flex gap-1.5 items-end">
                            <div className="w-32">
                                <Label className="text-[10px]">Data cadastro</Label>
                                <Input
                                    type="date"
                                    readOnly
                                    value={formData.cli_datacad ? formData.cli_datacad.split('T')[0] : ''}
                                    className="h-7 text-xs bg-gray-100 text-black px-1"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-[10px]">Quem cadastrou/atualizou</Label>
                                <Input
                                    readOnly
                                    value={formData.cli_usuario || 'SISTEMA'}
                                    className="h-7 text-xs bg-gray-100 text-black"
                                />
                            </div>
                            <div className="w-32">
                                <Label className="text-[10px]">Data atualização</Label>
                                <Input
                                    type="date"
                                    readOnly
                                    value={formData.cli_dataalt ? formData.cli_dataalt.split('T')[0] : new Date().toISOString().split('T')[0]}
                                    className="h-7 text-xs bg-gray-100 text-black px-1"
                                />
                            </div>
                        </div>

                        {/* Cobraça Box */}
                        <div className="border rounded-md p-2 mt-2">
                            <h3 className="text-center font-bold text-xs mb-1">Dados para cobrança</h3>

                            <div className="space-y-1.5">
                                <div>
                                    <Label className="text-[10px]">Endereço</Label>
                                    <Input
                                        value={formData.cli_endcob || ''}
                                        onChange={(e) => handleChange('cli_endcob', e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                                <div className="flex gap-1.5 items-end">
                                    <div className="flex-1">
                                        <Label className="text-[10px]">Bairro</Label>
                                        <Input
                                            value={formData.cli_baicob || ''}
                                            onChange={(e) => handleChange('cli_baicob', e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-[10px]">Cidade</Label>
                                        <Input
                                            value={formData.cli_cidcob || ''}
                                            onChange={(e) => handleChange('cli_cidcob', e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-1.5 items-end">
                                    <div className="w-32">
                                        <Label className="text-[10px]">Cep</Label>
                                        <Input
                                            value={formData.cli_cepcob || ''}
                                            onChange={(e) => handleChange('cli_cepcob', e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="w-16">
                                        <Label className="text-[10px]">UF</Label>
                                        <Input
                                            value={formData.cli_ufcob || ''}
                                            onChange={(e) => handleChange('cli_ufcob', e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // Other tabs - Placeholders
            default: return null;
        }
    };

    const renderRelatedContent = (activeTab) => {
        if (activeTab === 'contatos') {
            return (
                <div className="h-full flex flex-col p-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm text-emerald-800">Contatos do Cliente</h3>
                        <Button size="sm" onClick={handleAddContact} className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">
                            <Plus size={14} /> Novo Contato
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto bg-white/5">
                        <div className="grid grid-cols-12 bg-muted/20 p-1.5 font-semibold text-muted-foreground text-[10px] border-b sticky top-0">
                            <div className="col-span-2 pl-2">Nome</div>
                            <div className="col-span-2">Função</div>
                            <div className="col-span-2">Telefone</div>
                            <div className="col-span-4">Email</div>
                            <div className="col-span-2 text-center">Ações</div>
                        </div>
                        {loadingContacts ? (
                            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                        ) : contacts.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">Nenhum contato encontrado.</div>
                        ) : (
                            contacts.map(contact => (
                                <div key={contact.ani_lancto || Math.random()} className="grid grid-cols-12 p-1.5 border-b border-white/5 hover:bg-white/5 items-center text-xs">
                                    <div className="col-span-2 pl-2 font-medium text-emerald-600 truncate">{contact.ani_nome}</div>
                                    <div className="col-span-2 truncate">{contact.ani_funcao}</div>
                                    <div className="col-span-2">{contact.ani_fone}</div>
                                    <div className="col-span-4 truncate" title={contact.ani_email}>{contact.ani_email}</div>
                                    <div className="col-span-2 flex gap-1 justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-blue-50"
                                            onClick={() => handleEditContact(contact)}
                                        >
                                            <Pencil className="h-3 w-3 text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-red-50"
                                            onClick={() => handleDeleteContact(contact)}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <ClientContactDialog
                        open={contactDialogOpen}
                        onOpenChange={setContactDialogOpen}
                        contact={selectedContact}
                        clientId={data?.cli_codigo}
                        onSave={handleContactSaved}
                    />
                </div>
            );
        }

        if (activeTab === 'industrias') {
            return (
                <div className="h-full flex flex-col p-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm text-emerald-800">Dados nas Indústrias</h3>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddIndustry} className="gap-2 bg-blue-600 hover:bg-blue-700 h-7 text-xs">
                                <Plus size={14} /> Nova Indústria
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-white/5">
                        <div className="grid grid-cols-[200px_repeat(8,60px)_150px_200px_50px] gap-1 bg-muted/20 p-1.5 font-semibold text-muted-foreground text-[10px] border-b sticky top-0 min-w-max">
                            <div className="pl-2">Indústria</div>
                            <div className="text-center">Desc 1</div>
                            <div className="text-center">Desc 2</div>
                            <div className="text-center">Desc 3</div>
                            <div className="text-center">Desc 4</div>
                            <div className="text-center">Desc 5</div>
                            <div className="text-center">Desc 6</div>
                            <div className="text-center">Desc 7</div>
                            <div className="text-center">Desc 8</div>
                            <div>Cond. Pagto</div>
                            <div>Transportadora</div>
                            <div className="text-center">Ações</div>
                        </div>
                        {loadingIndustries ? (
                            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                        ) : !industries || industries.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">Nenhuma informação encontrada.</div>
                        ) : (
                            industries.map(ind => (
                                <div key={ind.cli_lancamento} className="grid grid-cols-[200px_repeat(8,60px)_150px_200px_50px] gap-1 p-1.5 border-b border-white/5 hover:bg-white/5 items-center text-xs min-w-max">
                                    <div className="pl-2 font-medium text-emerald-600 truncate" title={ind.fornecedor_nome}>{ind.fornecedor_nome || 'N/A'}</div>
                                    <div className="text-center">{ind.cli_desc1 ? `${Number(ind.cli_desc1).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc2 ? `${Number(ind.cli_desc2).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc3 ? `${Number(ind.cli_desc3).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc4 ? `${Number(ind.cli_desc4).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc5 ? `${Number(ind.cli_desc5).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc6 ? `${Number(ind.cli_desc6).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc7 ? `${Number(ind.cli_desc7).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="text-center">{ind.cli_desc8 ? `${Number(ind.cli_desc8).toFixed(2)}%` : '0.00%'}</div>
                                    <div className="truncate" title={ind.cli_prazopg}>{ind.cli_prazopg}</div>
                                    <div className="truncate" title={ind.transportadora_nome || ind.cli_transportadora}>{ind.transportadora_nome || ind.cli_transportadora || '-'}</div>
                                    <div className="flex gap-1 justify-center">
                                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-blue-500" onClick={() => handleEditIndustry(ind)}>
                                            <FileText size={12} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-400" onClick={() => handleDeleteIndustry(ind)}>
                                            <X size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <ClientIndustryDialog
                        open={industryDialogOpen}
                        onOpenChange={setIndustryDialogOpen}
                        industry={selectedIndustry}
                        clientId={data?.cli_codigo}
                        onSave={handleIndustrySaved}
                    />
                </div>
            );

        }

        if (activeTab === 'areas') {
            return (
                <div className="h-full flex flex-col">
                    <ClientAreasTab clientId={data?.cli_codigo} />
                </div>
            );
        }

        if (activeTab === 'descontos') {
            return (
                <div className="h-full flex flex-col">
                    <ClientDiscountsTab clientId={data?.cli_codigo} />
                </div>
            );
        }

        if (activeTab === 'prospeccao') {
            return (
                <div className="h-full flex flex-col">
                    <ClientProspectionTab clientId={data?.cli_codigo} />
                </div>
            );
        }

        if (activeTab === 'compradas') {
            return (
                <div className="h-full flex flex-col">
                    <ClientPurchasedIndustriesTab clientId={data?.cli_codigo} />
                </div>
            );
        }

        return (
            <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center bg-gray-50/50 rounded border border-dashed border-gray-300 m-2">
                <p>Funcionalidade em breve.</p>
            </div>
        );
    };

    return (
        <FormCadPadrao
            open={open}
            onOpenChange={onOpenChange}
            title={formData.cli_codigo ? `Editar Cliente: ${formData.cli_nomred || formData.cli_nome || formData.cli_codigo}` : 'Novo Cliente'}
            onClose={() => {
                if (onOpenChange) onOpenChange(false);
                if (onClose) onClose();
            }}
            onSave={handleSave}
            tabs={mainTabs}
            relatedTabs={relatedTabs}
            renderTabContent={renderTabContent}
            renderRelatedContent={renderRelatedContent}
        />
    );
};

export default ClientForm;
