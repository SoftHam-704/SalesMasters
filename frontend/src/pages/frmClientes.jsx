import { useState, useEffect, useMemo } from "react";
import { Users, Plus, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import GridCadPadrao from "@/components/GridCadPadrao";
import ClientForm from "../components/forms/ClientForm";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import ClientHelpModal from "@/components/crm/ClientHelpModal";

const FrmClientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [showInactive, setShowInactive] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const ITEMS_PER_PAGE = 15;

    const [selectedClient, setSelectedClient] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = String(value).replace(/\D/g, '');
        if (raw.length === 14) {
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        } else if (raw.length === 11) {
            return raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        }
        return value;
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: '1',
                limit: '5000',
                search: '',
                active: 'all'
            });

            const url = getApiUrl(NODE_API_URL, `/api/clients?${query.toString()}`);
            const response = await fetch(url);

            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                const adaptedData = result.data.map(item => ({
                    id: item.cli_codigo,
                    codigo: item.cli_codigo,
                    cnpj: item.cli_cnpj || '',
                    nome: item.cli_nome || '',
                    nomered: item.cli_nomred || item.cli_nomered || '',
                    cidade: item.cli_cidade || '',
                    uf: item.cli_uf || '',
                    vendedor: item.cli_vendedor || '',
                    redelojas: item.cli_redeloja || '',
                    telefone: item.cli_fone || '',
                    email: item.cli_email || '',
                    situacao: item.cli_status === true || item.cli_status === 'true' || item.cli_status === 1 ? "Ativo" : "Inativo",
                    _original: item
                }));

                adaptedData.sort((a, b) => (a.nomered || a.nome || '').localeCompare(b.nomered || b.nome || ''));
                setClients(adaptedData);
            } else {
                toast.warning("Nenhum dado retornado pela API");
            }
        } catch (error) {
            console.error("[Clientes] Erro:", error);
            toast.error("Erro ao carregar clientes: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Effect to handle URL parameters (e.g., from Dashboard)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setSearchTerm(id);
        }
    }, [window.location.search]);

    const handleSave = async (clientData) => {
        setLoading(true);
        try {
            const method = selectedClient ? 'PUT' : 'POST';
            const url = selectedClient
                ? getApiUrl(NODE_API_URL, `/api/clients/${selectedClient.cli_codigo || selectedClient.id}`)
                : getApiUrl(NODE_API_URL, '/api/clients');

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setIsFormOpen(false);
                fetchClients();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row) => {
        if (!confirm(`Deseja realmente excluir o cliente ${row.nomered || row.nome}?`)) return;

        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/clients/${row.id}`);
            const response = await fetch(url, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                fetchClients();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao excluir: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return clients.filter(c => {
            const matchesSearch =
                (c.nomered || '').toLowerCase().includes(term) ||
                (c.nome || '').toLowerCase().includes(term) ||
                (c.cnpj || '').includes(term) ||
                (c.redelojas || '').toLowerCase().includes(term) ||
                (c.cidade || '').toLowerCase().includes(term) ||
                String(c.codigo || '').includes(term);

            const matchesStatus = showInactive ? true : c.situacao === "Ativo";

            return matchesSearch && matchesStatus;
        });
    }, [clients, searchTerm, showInactive]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, page]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const columns = [
        {
            key: 'codigo',
            label: 'Código',
            isId: true,
            width: '100px',
            render: (row) => (
                <span className="font-mono text-sm text-slate-600 font-bold">
                    #{String(row.codigo).padStart(5, '0')}
                </span>
            )
        },
        {
            key: 'cnpj',
            label: 'CNPJ/CPF',
            width: '160px',
            render: (row) => (
                <span className="font-mono text-sm text-black font-medium">
                    {formatCNPJ(row.cnpj)}
                </span>
            )
        },
        {
            key: 'nomered',
            label: 'Nome Reduzido',
            width: '200px',
            align: 'center',
            render: (row) => (
                <Badge variant="outline" className="w-full justify-center font-bold text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 uppercase text-sm py-1" title={row.nomered || row.nome}>
                    {row.nomered || row.nome}
                </Badge>
            )
        },
        {
            key: 'nome',
            label: 'Razão Social',
            width: '280px',
            render: (row) => (
                <span className="text-xs text-black truncate block max-w-[280px]" title={row.nome}>
                    {row.nome}
                </span>
            )
        },
        {
            key: 'redelojas',
            label: 'Rede/Lojas',
            width: '150px',
            render: (row) => (
                row.redelojas ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs truncate max-w-[140px]" title={row.redelojas}>
                        {row.redelojas}
                    </Badge>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )
            )
        },
        {
            key: 'cidade',
            label: 'Cidade/UF',
            width: '160px',
            render: (row) => (
                <span className="text-sm text-slate-600">
                    {row.cidade ? `${row.cidade}/${row.uf || ''}` : '—'}
                </span>
            )
        },
        {
            key: 'situacao',
            label: 'Status',
            width: '100px',
            align: 'center',
            render: (row) => (
                <Badge
                    variant={row.situacao === "Ativo" ? "default" : "secondary"}
                    className={row.situacao === "Ativo"
                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        : "bg-slate-100 text-slate-500"
                    }
                >
                    {row.situacao}
                </Badge>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <ClientForm
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setSelectedClient(null);
                }}
                data={selectedClient?._original || selectedClient}
                onSave={handleSave}
            />

            <ClientHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />

            <GridCadPadrao
                title="Base de Clientes"
                subtitle={`Gerencie seus clientes (${filteredData.length} exibidos de ${clients.length} carregados)`}
                icon={Users}
                data={paginatedData}
                loading={loading}
                columns={columns}
                onNew={() => { setSelectedClient(null); setIsFormOpen(true); }}
                onEdit={(row) => { setSelectedClient(row); setIsFormOpen(true); }}
                onDelete={handleDelete}
                searchPlaceholder="Buscar por nome, CNPJ, código, cidade ou rede..."
                searchValue={searchTerm}
                onSearchChange={(value) => { setSearchTerm(value); setPage(1); }}
                pagination={{
                    page,
                    limit: ITEMS_PER_PAGE,
                    total: filteredData.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchClients}
                newButtonLabel="Novo Cliente"
                extraControls={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                            <Checkbox
                                id="showInactive"
                                checked={showInactive}
                                onCheckedChange={setShowInactive}
                            />
                            <label
                                htmlFor="showInactive"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-600"
                            >
                                Mostrar inativos
                            </label>
                        </div>
                        <Button
                            onClick={() => setHelpOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-lg shadow-md flex items-center gap-2"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Ajuda</span>
                        </Button>
                    </div>
                }
            />
        </div>
    );
};

export default FrmClientes;
