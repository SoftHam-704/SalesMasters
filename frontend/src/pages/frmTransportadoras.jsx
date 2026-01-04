import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import CarrierForm from "../components/forms/CarrierForm";
import GridCadPadraoV2 from "../components/GridCadPadraoV2";

const FrmTransportadoras = () => {
    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCarrier, setSelectedCarrier] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/carriers');
            const data = await response.json();
            if (data.success) {
                setCarriers(data.data);
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
        if (!window.confirm(`Deseja realmente excluir a transportadora "${carrier.tra_nome}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/carriers/${carrier.tra_codigo}`, {
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
                ? `http://localhost:3005/api/v2/carriers/${selectedCarrier.tra_codigo}`
                : 'http://localhost:3005/api/v2/carriers';

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

    // Definição das colunas
    const columns = [
        {
            key: 'tra_codigo',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'tra_nome',
            label: 'Nome',
            cellClass: 'font-semibold text-orange-600'
        },
        {
            key: 'tra_fone',
            label: 'Telefone',
            render: (row) => row.tra_fone || '—'
        },
        {
            key: 'tra_cidade',
            label: 'Cidade',
            render: (row) => row.tra_cidade || '—'
        }
    ];

    // Filtrar dados localmente
    const filteredCarriers = searchTerm
        ? carriers.filter(carrier =>
            carrier.tra_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            carrier.tra_cnpj?.includes(searchTerm) ||
            carrier.tra_cidade?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : carriers;

    return (
        <>
            {isFormOpen && (
                <CarrierForm
                    data={selectedCarrier}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadraoV2
                title="Transportadoras"
                subtitle="Gerencie as transportadoras"
                icon={Truck}
                data={filteredCarriers}
                titleKey="tra_nome"
                subtitleKey="tra_cidade"
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
};

export default FrmTransportadoras;
