import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import SellerForm from "../components/forms/SellerForm";
import GridCadPadrao from "../components/GridCadPadrao";
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';

const FrmVendedores = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [selectedSeller, setSelectedSeller] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchSellers = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm,
            });

            const url = getApiUrl(NODE_API_URL, `/api/sellers?${query.toString()}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success) {
                setSellers(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar vendedores: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSellers(1);
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleNew = () => {
        setSelectedSeller(null);
        setIsFormOpen(true);
    };

    const handleEdit = (seller) => {
        setSelectedSeller(seller);
        setIsFormOpen(true);
    };

    const handleSave = async (data) => {
        try {
            const method = data.ven_codigo ? 'PUT' : 'POST';
            const url = data.ven_codigo
                ? getApiUrl(NODE_API_URL, `/api/sellers/${data.ven_codigo}`)
                : getApiUrl(NODE_API_URL, `/api/sellers`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao salvar');

            toast.success("Vendedor salvo com sucesso!");
            setIsFormOpen(false);
            fetchSellers(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (seller) => {
        if (!window.confirm(`Tem certeza que deseja excluir o vendedor ${seller.ven_nome}?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/sellers/${seller.ven_codigo}`);
            const response = await fetch(url, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao excluir');

            toast.success("Vendedor excluído com sucesso!");
            fetchSellers(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    // Definição das colunas
    const columns = [
        {
            key: 'ven_codigo',
            label: 'ID',
            width: '80px',
            isId: true // Marca como coluna de ID para formatação com 5 dígitos
        },
        {
            key: 'ven_nome',
            label: 'Nome',
            cellClass: 'font-semibold text-foreground/90'
        },
        {
            key: 'ven_fone1',
            label: 'Telefone',
            cellClass: 'font-mono text-muted-foreground',
            render: (row) => row.ven_fone1 || '—'
        },
        {
            key: 'ven_nomeusu',
            label: 'Usuário',
            cellClass: 'text-muted-foreground',
            render: (row) => row.ven_nomeusu || '—'
        }
    ];

    return (
        <>
            {isFormOpen && (
                <SellerForm
                    data={selectedSeller}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadrao
                title="Vendedores"
                subtitle="Gerencie sua equipe de vendedores"
                icon={Users}
                data={sellers}
                loading={loading}
                columns={columns}
                searchPlaceholder="Buscar por nome, CPF ou e-mail..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                pagination={pagination}
                onPageChange={fetchSellers}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={() => fetchSellers(pagination.page)}
                newButtonLabel="Novo Vendedor"
            />
        </>
    );
};

export default FrmVendedores;
