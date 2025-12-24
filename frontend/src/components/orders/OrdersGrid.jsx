import './OrdersGrid.css';

const getRowColor = (situacao) => {
    switch (situacao) {
        case 'C': return 'row-cotacao-pendente';      // Vermelho
        case 'A': return 'row-cotacao-confirmada';    // Azul
        case 'F': return 'row-faturado';              // Verde
        case 'E': return 'row-excluido';              // Marrom
        case 'G': return 'row-garantia';              // Laranja
        case 'N': return 'row-notificacao';           // Amarelo
        default: return '';                            // Pedido (P)
    }
};

const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export default function OrdersGrid({ orders, loading }) {
    if (loading) {
        return (
            <div className="orders-grid-container">
                <div className="orders-grid-loading">Carregando pedidos...</div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="orders-grid-container">
                <div className="orders-grid-empty">
                    Nenhum pedido encontrado. Selecione uma indústria ou use os filtros.
                </div>
            </div>
        );
    }

    return (
        <div className="orders-grid-container">
            <table className="orders-grid">
                <thead>
                    <tr>
                        <th>nr pedido</th>
                        <th>Ped. Cliente</th>
                        <th>Ped. Indústria</th>
                        <th>Data</th>
                        <th>Reduzido</th>
                        <th>Cliente</th>
                        <th>Sit</th>
                        <th>Tot. bruto</th>
                        <th>Total líquido</th>
                        <th>Impostos</th>
                        <th>Tot. faturado</th>
                        <th>Condições de pagamento</th>
                        <th>Envio</th>
                        <th>Tabela utilizada</th>
                        <th>Indústria</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr
                            key={order.ped_numero}
                            className={getRowColor(order.ped_situacao)}
                        >
                            <td>{order.ped_pedido}</td>
                            <td>{order.ped_cliind}</td>
                            <td>{order.ped_nffat}</td>
                            <td>{formatDate(order.ped_data)}</td>
                            <td>{order.cli_nomred}</td>
                            <td className="cell-cliente">{order.cli_razao}</td>
                            <td className="cell-situacao">{order.ped_situacao}</td>
                            <td className="cell-currency">{formatCurrency(order.ped_totbruto)}</td>
                            <td className="cell-currency">{formatCurrency(order.ped_totliq)}</td>
                            <td className="cell-currency">{formatCurrency(order.ped_totalipi)}</td>
                            <td className="cell-currency">-</td>
                            <td>{order.ped_condpag}</td>
                            <td>{formatDate(order.ped_dataenvio)}</td>
                            <td>{order.ped_tabela}</td>
                            <td>{order.for_nomered}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
