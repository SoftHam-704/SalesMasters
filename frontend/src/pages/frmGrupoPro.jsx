import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import ProductGroupForm from "../components/forms/ProductGroupForm";
import GridCadPadraoV2 from "../components/GridCadPadraoV2";

const FrmGrupoPro = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/v2/product-groups');
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
            const response = await fetch(`https://salesmasters.softham.com.br/api/v2/product-groups/${group.gru_codigo}`, {
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
                ? `https://salesmasters.softham.com.br/api/v2/product-groups/${selectedGroup.gru_codigo}`
                : 'https://salesmasters.softham.com.br/api/v2/product-groups';

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

            <GridCadPadraoV2
                title="Grupos de Produtos"
                subtitle="Gerencie os grupos de produtos"
                icon={Package}
                data={filteredGroups.map(g => ({
                    ...g,
                    formattedCommission: `Comissão: ${g.gru_percomiss ? g.gru_percomiss.toFixed(2) : '0.00'}%`
                }))}
                titleKey="gru_nome"
                subtitleKey="formattedCommission"
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
};

export default FrmGrupoPro;
