import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import ProductGroupForm from "../components/forms/ProductGroupForm";
import GridCadPadrao from "../components/GridCadPadrao";

const FrmGrupoPro = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/product-groups');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            toast.error('Erro ao carregar grupos de produtos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleNew = () => {
        setSelectedGroup(null);
        setIsFormOpen(true);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setIsFormOpen(true);
    };

    const handleDelete = async (group) => {
        if (!window.confirm(`Deseja realmente excluir o grupo "${group.gru_nome}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/product-groups/${group.gru_codigo}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Grupo excluído com sucesso!');
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao excluir grupo');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir grupo');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedGroup
                ? `http://localhost:3005/api/v2/product-groups/${selectedGroup.gru_codigo}`
                : 'http://localhost:3005/api/v2/product-groups';

            const method = selectedGroup ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Grupo salvo com sucesso!');
                setIsFormOpen(false);
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar grupo');
        }
    };

    // Definição das colunas
    const columns = [
        {
            key: 'gru_codigo',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'gru_nome',
            label: 'Descrição',
            cellClass: 'font-semibold text-foreground/90'
        }
    ];

    // Filtrar dados localmente
    const filteredGroups = searchTerm
        ? groups.filter(g =>
            g.gru_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.gru_codigo?.toString().includes(searchTerm)
        )
        : groups;

    return (
        <>
            {isFormOpen && (
                <ProductGroupForm
                    data={selectedGroup}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadrao
                title="Grupos de Produtos"
                subtitle="Gerencie os grupos de produtos"
                icon={Package}
                data={filteredGroups}
                loading={loading}
                columns={columns}
                searchPlaceholder="Buscar por descrição ou código..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchGroups}
                newButtonLabel="Novo Grupo"
            />
        </>
    );
};

export default FrmGrupoPro;
