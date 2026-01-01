import { useState, useEffect } from "react";
import { Table as TableIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import GridCadPadrao from "../components/GridCadPadrao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FrmTabPreco = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const fetchTables = async (page = 1) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3005/api/price-tables`);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success) {
                // Client-side filtering/pagination since API returns all summaries
                let data = result.data;

                if (searchTerm) {
                    const lower = searchTerm.toLowerCase();
                    data = data.filter(item =>
                        item.nome_tabela.toLowerCase().includes(lower) ||
                        (item.industria_nome && item.industria_nome.toLowerCase().includes(lower))
                    );
                }

                setPagination({
                    page: 1,
                    limit: data.length,
                    total: data.length,
                    totalPages: 1
                });
                setTables(data);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar tabelas: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, [searchTerm]);

    const columns = [
        {
            key: 'industria_nome',
            label: 'Indústria',
            width: '200px',
            render: (row) => (
                <Badge variant="outline" className="font-bold border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                    {row.industria_nome || `ID: ${row.industria}`}
                </Badge>
            )
        },
        {
            key: 'nome_tabela',
            label: 'Tabela',
            render: (row) => <span className="font-medium uppercase">{row.nome_tabela}</span>
        },
        {
            key: 'data_criacao',
            label: 'Data Tabela',
            width: '120px',
            render: (row) => row.data_criacao ? format(new Date(row.data_criacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'
        },
        {
            key: 'data_vencimento',
            label: 'Vencimento',
            width: '120px',
            render: (row) => row.data_vencimento ? format(new Date(row.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'
        },
        {
            key: 'total_produtos',
            label: 'Qtd. Itens',
            width: '100px',
            align: 'center',
            render: (row) => <Badge variant="secondary">{row.total_produtos}</Badge>
        },
        {
            key: 'todas_ativas',
            label: 'Status',
            width: '100px',
            align: 'center',
            render: (row) => (
                <Badge
                    className={row.todas_ativas
                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20"
                        : "bg-red-500/15 text-red-700 border-red-500/20"}
                >
                    {row.todas_ativas ? 'ATIVA' : 'INATIVA'}
                </Badge>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <GridCadPadrao
                title="Tabelas de Preço"
                subtitle="Gerenciamento de tabelas e vigências"
                icon={TableIcon}
                data={tables}
                loading={loading}
                columns={columns}
                searchPlaceholder="Buscar por tabela ou indústria..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                pagination={pagination}
                showActions={false} // No edit/delete actions for grouped view
                newButtonLabel="Nova Importação"
                onNew={() => window.location.href = '/utilitarios/importacao-precos'}
            />
        </div>
    );
};

export default FrmTabPreco;
