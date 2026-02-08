import { useState, useEffect, useMemo } from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import CarrierForm from "../components/forms/CarrierForm";
import GridCadPadrao from "../components/GridCadPadrao";
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';

const FrmTransportadoras = () => {
    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCarrier, setSelectedCarrier] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/v2/carriers');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                const adaptedData = data.data.map(item => ({
                    id: item.tra_codigo,
                    nome: item.tra_nome,
                    cnpj: item.tra_cgc,
                    telefone: item.tra_fone,
                    cidade: item.tra_cidade,
                    uf: item.tra_uf,
                    _original: item
                }));
                setCarriers(adaptedData);
            }
        } catch (error) {
            console.error('Erro ao carregar transportadoras:', error);
            toast.error('Erro ao carregar transportadoras');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarriers();
    }, []);

    const handleNew = () => {
        setSelectedCarrier(null);
        setIsFormOpen(true);
    };

    const handleEdit = (carrier) => {
        setSelectedCarrier(carrier);
        setIsFormOpen(true);
    };

    const handleDelete = async (carrier) => {
        if (!window.confirm(`Deseja realmente excluir a transportadora "${carrier.nome}"?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/v2/carriers/${carrier.id}`);
            const response = await fetch(url, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Transportadora excluída com sucesso!');
                fetchCarriers();
            } else {
                toast.error(data.message || 'Erro ao excluir transportadora');
            }
        } catch (error) {
            console.error('Erro ao excluir transportadora:', error);
            toast.error('Erro ao excluir transportadora');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedCarrier
                ? getApiUrl(NODE_API_URL, `/api/v2/carriers/${selectedCarrier.id}`)
                : getApiUrl(NODE_API_URL, '/api/v2/carriers');

            const method = selectedCarrier ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Transportadora salva com sucesso!');
                setIsFormOpen(false);
                fetchCarriers();
            } else {
                toast.error(data.message || 'Erro ao salvar transportadora');
            }
        } catch (error) {
            console.error('Erro ao salvar transportadora:', error);
            toast.error('Erro ao salvar transportadora');
        }
    };

    // Filtrar dados localmente
    const filteredCarriers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return carriers.filter(carrier =>
            (carrier.nome || '').toLowerCase().includes(term) ||
            (carrier.cnpj || '').includes(term) ||
            (carrier.cidade || '').toLowerCase().includes(term)
        );
    }, [carriers, searchTerm]);

    // Paginação
    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredCarriers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCarriers, page]);

    const totalPages = Math.ceil(filteredCarriers.length / ITEMS_PER_PAGE);

    // Definição das colunas (formato tabela)
    const columns = [
        {
            key: 'id',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'nome',
            label: 'Nome',
            width: '300px',
            render: (row) => (
                <span className="font-semibold text-orange-600">{row.nome}</span>
            )
        },
        {
            key: 'telefone',
            label: 'Telefone',
            width: '150px',
            render: (row) => row.telefone || '—'
        },
        {
            key: 'cidade',
            label: 'Cidade',
            width: '200px',
            render: (row) => row.cidade ? `${row.cidade}/${row.uf || ''}` : '—'
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <CarrierForm
                open={isFormOpen}
                data={selectedCarrier}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />

            <GridCadPadrao
                title="Transportadoras"
                subtitle={`Gerencie as transportadoras (${filteredCarriers.length} exibidos de ${carriers.length} carregados)`}
                icon={Truck}
                data={paginatedData}
                loading={loading}
                columns={columns}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchValue={searchTerm}
                onSearchChange={(value) => { setSearchTerm(typeof value === 'string' ? value : value?.target?.value || ''); setPage(1); }}
                pagination={{
                    page,
                    limit: ITEMS_PER_PAGE,
                    total: filteredCarriers.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchCarriers}
            />
        </div>
    );
};

export default FrmTransportadoras;
