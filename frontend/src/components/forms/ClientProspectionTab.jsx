import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-hot-toast';
import ClientProspectionDialog from './ClientProspectionDialog';

export default function ClientProspectionTab({ clientId }) {
    const [industries, setIndustries] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchIndustries = async () => {
        try {
            const response = await fetch(`http://localhost:3005/api/clients/${clientId}/industries`);
            if (!response.ok) throw new Error('Erro ao buscar indústrias');
            const data = await response.json();
            // Handle both formats: array or {success, data}
            const industries = Array.isArray(data) ? data : (data.data || []);
            setIndustries(industries);
        } catch (error) {
            console.error('Error fetching industries:', error);
            toast.error('Erro ao carregar indústrias');
            setIndustries([]);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchIndustries();
        }
    }, [clientId]);

    const handleAdd = () => {
        setDialogOpen(true);
    };

    const handleDelete = async (industry) => {
        if (!confirm('Deseja realmente excluir esta indústria?')) return;

        try {
            const response = await fetch(
                `http://localhost:3005/api/clients/${clientId}/industries/${industry.cli_forcodigo}`,
                { method: 'DELETE' }
            );

            if (!response.ok) throw new Error('Erro ao excluir indústria');

            toast.success('Indústria excluída com sucesso!');
            fetchIndustries();
        } catch (error) {
            console.error('Error deleting industry:', error);
            toast.error('Erro ao excluir indústria');
        }
    };

    const handleSave = () => {
        fetchIndustries();
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Indústrias em Potencial</h3>
                <Button
                    onClick={handleAdd}
                    size="sm"
                    className="h-6 text-[10px] bg-green-600 hover:bg-green-700"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                </Button>
            </div>

            <div
                className="border rounded-md overflow-auto"
                style={{ height: '280px' }}
            >
                {industries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[11px] text-gray-500">
                        Nenhuma indústria cadastrada
                    </div>
                ) : (
                    <table className="w-full text-[10px]">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-2 py-1.5 text-left font-medium text-gray-700">
                                    Indústria
                                </th>
                                <th className="px-2 py-1.5 text-center font-medium text-gray-700 w-20">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {industries.map((industry, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-2 py-1.5">{industry.industria || industry.fornecedor_nome}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-red-50"
                                            onClick={() => handleDelete(industry)}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-600" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ClientProspectionDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                clientId={clientId}
                onSave={handleSave}
            />
        </div>
    );
}
