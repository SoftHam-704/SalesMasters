import React, { useState, useEffect, useMemo } from 'react';
import { ClientContactDialog } from './ClientContactDialog';
import ClientInsights from '../crm/ClientInsights';
import ClientIndustryDialog from './ClientIndustryDialog';
import { ClientAreasTab } from './ClientAreasTab';
import { ClientPurchasedIndustriesTab } from '../tabs/ClientPurchasedIndustriesTab';
import { ClientDiscountsTab } from './ClientDiscountsTab';
import ClientProspectionTab from './ClientProspectionTab';
import {
    FileText, Plus, Search, Pencil, Trash2, MapPin,
    Check, ChevronsUpDown, ArrowLeft, Printer, Save,
    ShieldCheck, Target, TrendingUp, Phone, Mail, Globe,
    Building2, LayoutDashboard, Database, Info, History,
    RefreshCw, User
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { NODE_API_URL, getApiUrl } from "../../utils/apiConfig";

const ClientForm = ({ data, onClose, onSave, open, onOpenChange }) => {


    const [formData, setFormData] = useState({});
    const [areas, setAreas] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [regions, setRegions] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [loadingAux, setLoadingAux] = useState(false);

    // UI Local State
    const [activeRelatedTab, setActiveRelatedTab] = useState('contatos');

    // --- Industries State ---
    const [industries, setIndustries] = useState([]);
    const [loadingIndustries, setLoadingIndustries] = useState(false);
    const [industryDialogOpen, setIndustryDialogOpen] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState(null);

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
            const res = await fetch(`${NODE_API_URL}/api/clients/${data.cli_codigo}/contacts/${contact.ani_lancto}`, {
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
            const res = await fetch(`${NODE_API_URL}/api/clients/${data.cli_codigo}/industries/${ind.cli_lancamento}`, {
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

    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (citySearch && citySearch.length > 2) {
                fetch(`${NODE_API_URL}/api/aux/cidades?search=${citySearch}`)
                    .then(res => res.json())
                    .then(res => setCityOptions(res.success ? res.data : (Array.isArray(res) ? res : [])))
                    .catch(e => console.error(e));
            } else if (!citySearch) {
                fetch(`${NODE_API_URL}/api/aux/cidades`)
                    .then(res => res.json())
                    .then(res => setCityOptions(res.success ? res.data : (Array.isArray(res) ? res : [])))
                    .catch(e => console.error(e));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [citySearch]);

    useEffect(() => {
        if (formData.cli_idcidade) {
            fetch(`${NODE_API_URL}/api/aux/cidades?id=${formData.cli_idcidade}`)
                .then(res => res.json())
                .then(res => {
                    const data = res.success ? res.data : (Array.isArray(res) ? res : []);
                    if (data && data.length > 0) {
                        if (!formData.cli_cidade) {
                            setFormData(prev => ({ ...prev, cli_cidade: data[0].cid_nome, cli_uf: data[0].cid_uf }));
                        }
                        setCityOptions([data[0]]);
                    }
                })
                .catch(e => console.error(e));
        }
    }, [formData.cli_idcidade]);

    useEffect(() => {
        if (formData.cli_idcidade) {
            fetch(getApiUrl(NODE_API_URL, `/api/v2/sectors?city_id=${formData.cli_idcidade}`))
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        setSectors(json.data);
                    } else {
                        setSectors([]);
                    }
                })
                .catch(e => {
                    console.error('Erro ao buscar setores', e);
                    setSectors([]);
                });
        } else {
            setSectors([]);
        }
    }, [formData.cli_idcidade]);

    const loadAuxData = async () => {
        setLoadingAux(true);
        try {
            const [areasRes, sellersRes, regionsRes] = await Promise.all([
                fetch(`${NODE_API_URL}/api/aux/areas`),
                fetch(`${NODE_API_URL}/api/aux/vendedores`),
                fetch(`${NODE_API_URL}/api/aux/regioes`)
            ]);

            if (areasRes.ok) {
                const json = await areasRes.json();
                setAreas(Array.isArray(json) ? json : (json.data || []));
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
        if (open) {
            if (data) {
                // Inicializa com os dados recebidos da lista (optimistic UI)
                setFormData(data);

                // Busca os dados COMPLETOS (inlc. coordenadas e colunas não listadas na grid)
                const id = data.cli_codigo || data.id;
                if (id) {
                    fetch(`${NODE_API_URL}/api/clients/${id}`)
                        .then(res => {
                            if (!res.ok) throw new Error('Falha ao buscar detalhes completos');
                            return res.json();
                        })
                        .then(fullData => {
                            console.log("Dados completos carregados:", fullData);
                            setFormData(prev => ({ ...prev, ...fullData }));
                        })
                        .catch(err => console.error("Erro ao carregar detalhes do cliente:", err));
                }
            } else {
                setFormData({
                    cli_tipopes: 'A',
                    cli_datacad: new Date().toISOString().split('T')[0],
                });
            }
            loadAuxData();
        }
    }, [data, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCitySelect = (city) => {
        setFormData(prev => ({
            ...prev,
            cli_idcidade: city.cid_codigo,
            cli_cidade: city.cid_nome,
            cli_uf: city.cid_uf,
            cli_setor_id: null
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

            const apiData = await response.json();

            setFormData(prev => ({
                ...prev,
                cli_nome: apiData.razao_social,
                cli_fantasia: apiData.nome_fantasia || apiData.razao_social.substring(0, 20),
                cli_endereco: `${apiData.logradouro}, ${apiData.numero}`,
                cli_complemento: apiData.complemento || '',
                cli_bairro: apiData.bairro,
                cli_cep: apiData.cep,
                cli_fone1: apiData.ddd_telefone_1 ? `(${apiData.ddd_telefone_1}) ${apiData.telefone1 || ''}` : prev.cli_fone1,
                cli_email: apiData.email || prev.cli_email,
                cli_tipopes: apiData.descricao_situacao_cadastral === 'ATIVA' ? 'A' : 'I',
                cli_dtabertura: apiData.data_inicio_atividade || prev.cli_dtabertura,
            }));

            toast.dismiss(toastId);
            toast.success("Dados encontrados com sucesso!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    };

    const handleConsultarCEP = async () => {
        const cep = formData.cli_cep?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            toast.error("Informe um CEP válido (8 dígitos) para consultar.");
            return;
        }

        const toastId = toast.loading("Buscando endereço...");

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) {
                throw new Error("Erro ao consultar CEP.");
            }

            const apiData = await response.json();

            if (apiData.erro) {
                throw new Error("CEP não encontrado.");
            }

            // Buscar cidade no banco local
            try {
                const cityResponse = await fetch(`${NODE_API_URL}/api/aux/cidades?uf=${apiData.uf}&nome=${apiData.localidade}`);
                if (cityResponse.ok) {
                    const cities = await cityResponse.json();
                    if (Array.isArray(cities) && cities.length > 0) {
                        const matchedCity = cities[0];
                        setFormData(prev => ({
                            ...prev,
                            cli_cep: apiData.cep,
                            cli_endereco: apiData.logradouro,
                            cli_bairro: apiData.bairro,
                            cli_cidade: matchedCity.cid_nome,
                            cli_uf: matchedCity.cid_uf,
                            cli_idcidade: matchedCity.cid_codigo
                        }));
                    } else {
                        // Cidade não encontrada no banco, preenche só com dados do CEP
                        setFormData(prev => ({
                            ...prev,
                            cli_cep: apiData.cep,
                            cli_endereco: apiData.logradouro,
                            cli_bairro: apiData.bairro,
                            cli_cidade: apiData.localidade,
                            cli_uf: apiData.uf
                        }));
                    }
                }
            } catch (cityError) {
                // Se falhar ao buscar cidade, preenche só com dados do CEP
                setFormData(prev => ({
                    ...prev,
                    cli_cep: apiData.cep,
                    cli_endereco: apiData.logradouro,
                    cli_bairro: apiData.bairro,
                    cli_cidade: apiData.localidade,
                    cli_uf: apiData.uf
                }));
            }

            toast.dismiss(toastId);
            toast.success("Endereço encontrado com sucesso!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    };

    const renderRelatedContent = (tabKey) => {
        const currentTab = tabKey || activeRelatedTab;
        switch (currentTab) {
            case 'contatos':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {loadingContacts ? (
                            <div className="col-span-full py-12 flex justify-center items-center text-slate-400 gap-2">
                                <TrendingUp className="animate-pulse" /> Buscando contatos...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 italic">Nenhum contato cadastrado.</div>
                        ) : (
                            contacts.map(contact => (
                                <div key={contact.ani_lancto} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-emerald-200 transition-all duration-300 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-40 transition-opacity blur-2xl" />

                                    <div className="flex justify-between items-start mb-5 relative z-10">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
                                            <User size={20} />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleEditContact(contact)}>
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDeleteContact(contact)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="font-extrabold text-slate-800 text-base mb-1 group-hover:text-emerald-700 transition-colors">{contact.ani_nome}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {contact.ani_funcao || 'Sem Cargo'}
                                        </div>

                                        <div className="space-y-2.5 border-t border-slate-50 pt-4">
                                            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium hover:text-emerald-600 transition-colors cursor-default">
                                                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                                    <Phone size={12} className="text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                {contact.ani_fone || '—'}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium hover:text-emerald-600 transition-colors cursor-default">
                                                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                                    <Mail size={12} className="text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                <span className="truncate">{contact.ani_email || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button
                            onClick={handleAddContact}
                            className="border-2 border-dashed border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all duration-300 min-h-[220px] group"
                        >
                            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-300 transition-all duration-300">
                                <Plus size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Novo Contato</span>
                        </button>
                    </div>
                );

            case 'industrias':
                return (
                    <div className="pt-4">
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b text-slate-500 uppercase font-bold">
                                            <th className="px-4 py-3 text-left">Indústria</th>
                                            <th className="px-4 py-3 text-left">Tab.</th>
                                            <th className="px-2 py-3 text-center">D1</th>
                                            <th className="px-2 py-3 text-center">D2</th>
                                            <th className="px-2 py-3 text-center">D3</th>
                                            <th className="px-4 py-3 text-left">Condição</th>
                                            <th className="px-4 py-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingIndustries ? (
                                            <tr><td colSpan={7} className="py-8 text-center">Buscando...</td></tr>
                                        ) : industries.length === 0 ? (
                                            <tr><td colSpan={7} className="py-8 text-center italic">Nenhuma indústria vinculada.</td></tr>
                                        ) : (
                                            industries.map(ind => (
                                                <tr key={ind.cli_lancamento} className="border-b hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-700">{ind.fornecedor_nome}</td>
                                                    <td className="px-4 py-3 text-slate-500">{ind.cli_tabela || '—'}</td>
                                                    <td className="px-2 py-3 text-center font-mono">{Number(ind.cli_desc1 || 0).toFixed(2)}</td>
                                                    <td className="px-2 py-3 text-center font-mono">{Number(ind.cli_desc2 || 0).toFixed(2)}</td>
                                                    <td className="px-2 py-3 text-center font-mono">{Number(ind.cli_desc3 || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-slate-600">{ind.cli_prazopg || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditIndustry(ind)}>
                                                                <Pencil size={14} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteIndustry(ind)}>
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Button onClick={handleAddIndustry} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> Nova Indústria
                        </Button>
                    </div>
                );

            case 'areas': return <div className="pt-4"><ClientAreasTab clientId={data?.cli_codigo} /></div>;


            case 'prospeccao': return <div className="pt-4"><ClientProspectionTab clientId={data?.cli_codigo} /></div>;
            case 'descontos': return <div className="pt-4"><ClientDiscountsTab clientId={data?.cli_codigo} /></div>;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 gap-0 bg-[#f8fafc] flex flex-col overflow-hidden border-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Editar Ficha de Cliente</DialogTitle>
                    <DialogDescription>Formulário detalhado para edição de dados do cliente.</DialogDescription>
                </DialogHeader>
                {/* Header Superior - Clean Premium */}
                <div className="bg-white h-[80px] px-8 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)] relative z-20 border-b border-slate-100">
                    <div className="flex items-center gap-6 relative z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl h-11 w-11 transition-all hover:scale-105 border border-slate-100"
                            onClick={() => onOpenChange(false)}
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-0.5">
                                <h2 className="text-slate-800 text-2xl font-black tracking-tight">
                                    {formData.cli_codigo ? 'Ficha do Cliente' : 'Novo Cliente'}
                                </h2>
                                {formData.cli_codigo && (
                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md uppercase tracking-tighter">
                                        ID: {String(formData.cli_codigo).padStart(5, '0')}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs font-semibold flex items-center gap-2 uppercase tracking-widest">
                                <Building2 size={12} className="text-emerald-500" />
                                {formData.cli_nome ? formData.cli_nome : 'PREENCHIMENTO DE FICHA...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-8 w-px bg-slate-100 mx-2" />
                        <Button variant="ghost" className="h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest rounded-xl" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button variant="outline" className="h-10 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl gap-2 font-bold text-xs uppercase tracking-widest px-5">
                            <Printer size={16} /> Imprimir
                        </Button>
                        <Button onClick={handleSave} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest gap-2 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Save size={18} /> Salvar Alterações
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                    <ScrollArea className="flex-1">
                        <div className="max-w-[1400px] mx-auto p-6 flex gap-6">
                            {/* Coluna Principal */}
                            <div className="flex-1 space-y-6">

                                {/* Coluna Principal - Sistema de Abas Unificado */}
                                <div className="flex-1">
                                    <Tabs defaultValue="geral" className="w-full">
                                        <div className="mb-8 flex justify-center sticky top-0 z-50 pt-2 pb-4">
                                            <TabsList className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                                                <TabsTrigger value="geral" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <Database size={14} className="mr-2" /> Geral
                                                </TabsTrigger>
                                                <TabsTrigger value="contatos" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <Phone size={14} className="mr-2" /> Contatos
                                                </TabsTrigger>
                                                {/* Add other triggers similarly if needed, but keeping them clean */}
                                                <TabsTrigger value="industrias" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <Building2 size={14} className="mr-2" /> Indústrias
                                                </TabsTrigger>
                                                <TabsTrigger value="descontos" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <TrendingUp size={14} className="mr-2" /> Descontos
                                                </TabsTrigger>
                                                <TabsTrigger value="prospeccao" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <Target size={14} className="mr-2" /> Prospecção
                                                </TabsTrigger>
                                                <TabsTrigger value="areas" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all duration-300">
                                                    <Globe size={14} className="mr-2" /> Áreas
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <div className="min-h-[600px]">
                                            <TabsContent value="geral" className="space-y-6 m-0 outline-none">
                                                {/* Painel I - Identificação Comercial */}
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                                <ShieldCheck size={18} />
                                                            </div>
                                                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">I - Identificação Comercial</h3>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 space-y-6">
                                                        <div className="grid grid-cols-4 gap-6">
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">CNPJ / CPF</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        value={formData.cli_cnpj || ''}
                                                                        onChange={(e) => handleChange('cli_cnpj', e.target.value)}
                                                                        className="h-11 bg-slate-50/50 border-slate-200 font-bold pr-10 rounded-xl focus:ring-emerald-500/20"
                                                                    />
                                                                    <Button
                                                                        size="icon" variant="ghost"
                                                                        className="absolute right-0 top-0 h-11 w-11 text-emerald-600 hover:bg-emerald-100 rounded-xl"
                                                                        onClick={handleConsultarCNPJ}
                                                                    >
                                                                        <Search size={16} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Inscrição</Label>
                                                                <Input
                                                                    value={formData.cli_inscricao || ''}
                                                                    onChange={(e) => handleChange('cli_inscricao', e.target.value)}
                                                                    className="h-11 bg-slate-50/50 border-slate-200 rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Status / Ativo</Label>
                                                                <div className="h-11 flex items-center px-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                                                                    <div className="flex items-center gap-3">
                                                                        <Switch
                                                                            checked={formData.cli_tipopes === 'A'}
                                                                            onCheckedChange={(checked) => handleChange('cli_tipopes', checked ? 'A' : 'I')}
                                                                        />
                                                                        <span className={cn(
                                                                            "text-[10px] font-bold uppercase tracking-wider",
                                                                            formData.cli_tipopes === 'A' ? "text-emerald-600" : "text-slate-400"
                                                                        )}>
                                                                            {formData.cli_tipopes === 'A' ? 'Ativo' : 'Inativo'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Abertura</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={formData.cli_dtabertura ? formData.cli_dtabertura.split('T')[0] : ''}
                                                                    onChange={(e) => handleChange('cli_dtabertura', e.target.value)}
                                                                    className="h-11 bg-slate-50/50 border-slate-200 font-mono rounded-xl"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Razão Social</Label>
                                                                <Input
                                                                    value={formData.cli_nome || ''}
                                                                    onChange={(e) => handleChange('cli_nome', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 font-bold text-slate-800 rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Nome Fantasia</Label>
                                                                <Input
                                                                    value={formData.cli_fantasia || ''}
                                                                    onChange={(e) => handleChange('cli_fantasia', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Nome Reduzido (ERP)</Label>
                                                                <Input
                                                                    value={formData.cli_nomred || ''}
                                                                    onChange={(e) => handleChange('cli_nomred', e.target.value)}
                                                                    className="h-11 bg-white border-orange-100 font-bold text-orange-700 shadow-sm shadow-orange-50 rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Rede de Lojas / Holding</Label>
                                                                <Input
                                                                    value={formData.cli_redeloja || ''}
                                                                    onChange={(e) => handleChange('cli_redeloja', e.target.value)}
                                                                    className="h-11 bg-white border-blue-100 font-bold text-blue-700 shadow-sm shadow-blue-50 rounded-xl"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>


                                                {/* Painel II - Localização e Logística */}
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                                <MapPin size={18} />
                                                            </div>
                                                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">II - Localização e Logística</h3>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 space-y-6">
                                                        {/* Linha 1: CEP, Endereço, Número */}
                                                        <div className="grid grid-cols-12 gap-5">
                                                            <div className="col-span-3 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">CEP</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        value={formData.cli_cep || ''}
                                                                        onChange={(e) => handleChange('cli_cep', e.target.value)}
                                                                        onBlur={handleConsultarCEP}
                                                                        className="h-11 bg-white border-slate-200 font-mono pr-10 rounded-xl"
                                                                        placeholder="00000-000"
                                                                        maxLength={9}
                                                                    />
                                                                    <Button
                                                                        size="icon" variant="ghost"
                                                                        className="absolute right-0 top-0 h-11 w-11 text-emerald-600 hover:bg-emerald-100 rounded-xl"
                                                                        onClick={handleConsultarCEP}
                                                                        type="button"
                                                                    >
                                                                        <Search size={16} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-7 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Logradouro / Endereço</Label>
                                                                <Input
                                                                    value={formData.cli_endereco || ''}
                                                                    onChange={(e) => handleChange('cli_endereco', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 px-4 rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Nº</Label>
                                                                <Input
                                                                    value={formData.cli_numero || ''}
                                                                    onChange={(e) => handleChange('cli_numero', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Linha 2: Cidade, Bairro, UF */}
                                                        <div className="grid grid-cols-12 gap-5">
                                                            <div className="col-span-5 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Cidade</Label>
                                                                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            aria-expanded={cityOpen}
                                                                            className="h-11 justify-between border-slate-200 bg-white text-slate-700 w-full rounded-xl hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all"
                                                                        >
                                                                            {formData.cli_cidade || "Selecionar..."}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[300px] p-0 z-[10000] rounded-2xl shadow-2xl border-emerald-100">
                                                                        <Command shouldFilter={false}>
                                                                            <CommandInput placeholder="Buscar cidade..." value={citySearch} onValueChange={setCitySearch} />
                                                                            <CommandList>
                                                                                <CommandEmpty>Não encontrado.</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {cityOptions.map((city) => (
                                                                                        <CommandItem key={city.cid_codigo} onSelect={() => handleCitySelect(city)}>
                                                                                            <Check className={cn("mr-2 h-4 w-4", formData.cli_idcidade === city.cid_codigo ? "opacity-100" : "opacity-0")} />
                                                                                            {city.cid_nome} - {city.cid_uf}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                            <div className="col-span-5 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Bairro</Label>
                                                                <Input
                                                                    value={formData.cli_bairro || ''}
                                                                    onChange={(e) => handleChange('cli_bairro', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">UF</Label>
                                                                <div className="h-11 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600">
                                                                    {formData.cli_uf || '—'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Linha 3: E-mail, Telefones, Complemento */}
                                                        <div className="grid grid-cols-12 gap-5">
                                                            <div className="col-span-4 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">E-mail Principal</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        value={formData.cli_email || ''}
                                                                        onChange={(e) => handleChange('cli_email', e.target.value)}
                                                                        className="h-11 bg-white border-slate-200 pl-11 rounded-xl"
                                                                        placeholder="email@exemplo.com"
                                                                    />
                                                                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-4 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Telefones</Label>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="relative">
                                                                        <Input
                                                                            value={formData.cli_fone1 || ''}
                                                                            onChange={(e) => handleChange('cli_fone1', e.target.value)}
                                                                            className="h-11 bg-white border-slate-200 pl-10 rounded-xl"
                                                                            placeholder="(00) 0000-0000"
                                                                        />
                                                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                                                                    </div>
                                                                    <div className="relative">
                                                                        <Input
                                                                            value={formData.cli_fone2 || ''}
                                                                            onChange={(e) => handleChange('cli_fone2', e.target.value)}
                                                                            className="h-11 bg-white border-slate-200 pl-10 rounded-xl"
                                                                            placeholder="(00) 00000-0000"
                                                                        />
                                                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-4 flex flex-col gap-2">
                                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Complemento</Label>
                                                                <Input
                                                                    value={formData.cli_complemento || ''}
                                                                    onChange={(e) => handleChange('cli_complemento', e.target.value)}
                                                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                                                    placeholder="Apto, Sala, etc."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Painel III - Complemento e Auditoria */}
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                                                                <Database size={18} />
                                                            </div>
                                                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">III - Distribuição e Localização</h3>
                                                        </div>
                                                    </div>
                                                    <div className="p-8">
                                                        <div className="grid grid-cols-2 gap-10">
                                                            <div className="space-y-6">
                                                                <div className="flex flex-col gap-2">
                                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendedor</Label>
                                                                    <Select value={formData.cli_vendedor_id?.toString() || ""} onValueChange={(val) => handleChange('cli_vendedor_id', parseInt(val))}>
                                                                        <SelectTrigger className="h-11 border-slate-200 rounded-xl shadow-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                        <SelectContent className="z-[9999] rounded-xl">
                                                                            {Array.isArray(sellers) && sellers.map(s => (
                                                                                <SelectItem key={s.ven_codigo} value={String(s.ven_codigo)}>{s.ven_nome}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Região</Label>
                                                                        <Select value={formData.cli_regiao_id?.toString() || ""} onValueChange={(val) => handleChange('cli_regiao_id', parseInt(val))}>
                                                                            <SelectTrigger className="h-11 border-slate-200 rounded-xl shadow-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                            <SelectContent className="z-[9999] rounded-xl">
                                                                                {Array.isArray(regions) && regions.map(r => (
                                                                                    <SelectItem key={r.reg_codigo} value={String(r.reg_codigo)}>{r.reg_descricao}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setor</Label>
                                                                        <Select value={formData.cli_atuacaoprincipal?.toString() || ""} onValueChange={(val) => handleChange('cli_atuacaoprincipal', parseInt(val))}>
                                                                            <SelectTrigger className="h-11 border-slate-200 rounded-xl shadow-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                            <SelectContent className="z-[9999] rounded-xl">
                                                                                {Array.isArray(areas) && areas.map(a => (
                                                                                    <SelectItem key={a.atu_id} value={String(a.atu_id)}>{a.atu_descricao}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Observação no Pedido</Label>
                                                                    <Input
                                                                        className="h-11 bg-white border-emerald-100 placeholder:text-emerald-200 shadow-sm rounded-xl"
                                                                        placeholder="Instruções para o vendedor..."
                                                                        value={formData.cli_obspedido || ''}
                                                                        onChange={(e) => handleChange('cli_obspedido', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin size={16} className="text-emerald-500" />
                                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Geoposicionamento</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Latitude</Label>
                                                                            <Input className="h-10 font-mono text-xs bg-white border-slate-200 rounded-lg" value={formData.cli_latitude || ''} onChange={(e) => handleChange('cli_latitude', e.target.value)} />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Longitude</Label>
                                                                            <Input className="h-10 font-mono text-xs bg-white border-slate-200 rounded-lg" value={formData.cli_longitude || ''} onChange={(e) => handleChange('cli_longitude', e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative rounded-xl overflow-hidden border border-slate-200/80 h-[160px] bg-slate-200 flex items-center justify-center">
                                                                        {formData.cli_latitude && formData.cli_longitude ? (
                                                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${formData.cli_latitude},${formData.cli_longitude}&zoom=15&size=400x160&markers=color:red%7C${formData.cli_latitude},${formData.cli_longitude}&key=AIzaSyB1ObkyqHaqFaHmdPxrEQwBmEUDpfQqJmY')` }} />
                                                                        ) : (
                                                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                                <MapPin size={24} className="opacity-30" />
                                                                                <span className="text-[9px] font-bold uppercase tracking-widest">Coordenadas Ausentes</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                                                            <Badge className="bg-emerald-500/90 text-[8px] text-white border-none py-0.5 px-2 shadow-sm rounded-full font-bold">LIVE MAP</Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="contatos" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Gestão de Contatos</h4>
                                                            <p className="text-sm text-slate-500">Pessoas e tomadores de decisão vinculados a este cliente</p>
                                                        </div>
                                                        <Button onClick={handleAddContact} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl px-6 shadow-lg shadow-emerald-600/20">
                                                            <Plus size={18} /> Novo Contato
                                                        </Button>
                                                    </div>
                                                    {renderRelatedContent('contatos')}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="industrias" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Indústrias Vinculadas</h4>
                                                            <p className="text-sm text-slate-500">Tabelas de descontos e condições comerciais por indústria</p>
                                                        </div>
                                                        <Button onClick={handleAddIndustry} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl px-6 shadow-lg shadow-emerald-600/20">
                                                            <Plus size={18} /> Víncular Indústria
                                                        </Button>
                                                    </div>
                                                    {renderRelatedContent('industrias')}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="financeiro" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-8">Dados Financeiros</h4>
                                                    {renderRelatedContent('financeiro')}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="prospeccao" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-8">Fluxo de Prospecção</h4>
                                                    {renderRelatedContent('prospeccao')}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="areas" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-8">Segmentação por Áreas</h4>
                                                    {renderRelatedContent('areas')}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="descontos" className="m-0 outline-none">
                                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 min-h-[500px]">
                                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-8">Descontos por Grupo / Indústria</h4>
                                                    {renderRelatedContent('descontos')}
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>
                            </div>

                            {/* Coluna Sidebar (Insights e Stats) */}
                            <div className="w-80 shrink-0 space-y-6">
                                {/* Profile / Rating Card - Premium Clean Design */}
                                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl transition-all group-hover:bg-blue-50" />

                                    <div className="flex flex-col items-center text-center relative z-10">
                                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-xl shadow-slate-200/50 group-hover:scale-105 transition-transform duration-500">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                                <User size={36} className="text-emerald-500" />
                                            </div>
                                        </div>

                                        <h4 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">
                                            {formData.cli_nomred || 'Nome Reduzido'}
                                        </h4>
                                        <div className="flex gap-2 items-center mb-6">
                                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">
                                                Gold Partner
                                            </Badge>
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                Ativo
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-5 pt-6 border-t border-slate-50 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível de Fidelidade</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <TrendingUp
                                                        key={i}
                                                        size={14}
                                                        className={cn(
                                                            "transition-all duration-300",
                                                            i <= 4 ? "text-emerald-500 scale-110" : "text-slate-100"
                                                        )}
                                                        fill={i <= 4 ? "currentColor" : "none"}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[11px] items-end">
                                                <span className="text-slate-500 font-medium">Comprometimento</span>
                                                <span className="font-black text-emerald-600 text-sm">85%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner p-[1px]">
                                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 w-[85%] shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Componente de Insights - Clean Theme */}
                                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                                    <ClientInsights clientId={data?.cli_codigo} />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Diálogos / Modais Internos */}
                <ClientContactDialog
                    open={contactDialogOpen}
                    onOpenChange={setContactDialogOpen}
                    contact={selectedContact}
                    clientId={data?.cli_codigo}
                    onSave={handleContactSaved}
                />
                <ClientIndustryDialog
                    open={industryDialogOpen}
                    onOpenChange={setIndustryDialogOpen}
                    industry={selectedIndustry}
                    clientId={data?.cli_codigo}
                    onSave={handleIndustrySaved}
                />
            </DialogContent>
        </Dialog>
    );
};

export default ClientForm;
