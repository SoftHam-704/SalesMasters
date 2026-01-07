import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import GridCadPadrao from "../components/GridCadPadrao";
import ClientForm from "../components/forms/ClientForm";
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';

const FrmClientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [selectedClient, setSelectedClient] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Format helpers
    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = value.replace(/\D/g, '');
        if (raw.length === 11) { // CPF
            return raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        }
        if (raw.length === 14) { // CNPJ
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        return value;
    };


    const [statusFilter, setStatusFilter] = useState("true"); // 'true' = Ativos, 'false' = Inativos, 'all' = Todos

    const fetchClients = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm,
                active: statusFilter
            });

            const url = getApiUrl(NODE_API_URL, `/api/clients?${query.toString()}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success) {
                setClients(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar clientes: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Trigger fetch when these change
        fetchClients(1);
    }, [statusFilter, searchTerm]); // Added statusFilter dependency

    const handleNew = () => {
        setSelectedClient(null);
        setIsFormOpen(true);
    };

    const handleSave = async (clientData) => {
        // ... (existing handleSave)
        setLoading(true);
        try {
            const method = selectedClient ? 'PUT' : 'POST';
            const url = selectedClient
                ? getApiUrl(NODE_API_URL, `/api/clients/${selectedClient.cli_codigo}`)
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
                fetchClients(pagination.page);
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
        if (!confirm(`Deseja realmente excluir o cliente ${row.cli_nomred}?`)) return;

        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/clients/${row.cli_codigo}`);
            const response = await fetch(url, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                fetchClients(pagination.page);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao excluir: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'cli_codigo', label: 'Cód', width: '80px', isId: true },
        {
            key: 'cli_cnpj',
            label: 'CPF/CNPJ',
            width: '190px',
            render: (row) => <span className="font-bold text-sm whitespace-nowrap">{formatCNPJ(row.cli_cnpj)}</span>
        },
        {
            key: 'cli_nomred',
            label: 'Nome Reduzido',
            width: '180px', // Reverted to fixed but smaller width as requested "diminua um pouco"
            render: (row) => (
                <Badge variant="outline" className="w-full justify-center font-bold text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 uppercase truncate">
                    {row.cli_nomred}
                </Badge>
            )
        },
        {
            key: 'cli_nome',
            label: 'Razão Social / Nome',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground truncate">{row.cli_nome}</span>
                    {row.cli_fantasia && row.cli_fantasia !== row.cli_nome && (
                        <span className="text-xs text-muted-foreground truncate">{row.cli_fantasia}</span>
                    )}
                </div>
            )
        },
        {
            key: 'cli_cidade', // Keeping key, but data now comes from JOIN or fallback
            label: 'Cidade/UF',
            width: '150px',
            render: (row) => <span className="text-sm">{row.cli_cidade}/{row.cli_uf}</span>
        },
        {
            key: 'cli_tipopes',
            label: 'Situação',
            width: '100px',
            align: 'center',
            render: (row) => (
                <Badge
                    variant={row.cli_tipopes === 'A' ? "default" : "secondary"}
                    className={row.cli_tipopes === 'A'
                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20"
                        : "bg-slate-100 text-slate-500 border-slate-200"}
                >
                    {row.cli_tipopes === 'A' ? "Ativo" : "Inativo"}
                </Badge>
            )
        }
    ];

    // Extra controls for the grid (Status Filter)
    const extraControls = (
        <select
            className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="all">Todos</option>
        </select>
    );

    return (
        <div className="h-full bg-slate-50 p-6">
            <ClientForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                client={selectedClient} // Ensure this prop name matches usage in ClientForm (it was 'data' before, verify)
                // Wait, ClientForm uses 'data' prop. I should fix this to 'data' here or update ClientForm. 
                // Previous code passed 'client={selectedClient}' but let's check ClientForm definition.
                // ClientForm definition: const ClientForm = ({ data, ... })
                // Let's change prop name to 'data' here to be safe
                data={selectedClient}
                onSave={handleSave}
            />

            <GridCadPadrao
                title="Clientes"
                subtitle="Gerencie sua base de clientes"
                icon={Users}
                data={clients}
                loading={loading}
                columns={columns}
                searchPlaceholder="Buscar por nome, fantasia ou CNPJ..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                pagination={pagination}
                onPageChange={(page) => fetchClients(page)}
                onNew={handleNew}
                onEdit={(row) => { setSelectedClient(row); setIsFormOpen(true); }}
                onDelete={handleDelete}
                onRefresh={() => fetchClients(pagination.page)}
                newButtonLabel="Novo Cliente"
                extraControls={extraControls}
            />
        </div>
    );
};

export default FrmClientes;
