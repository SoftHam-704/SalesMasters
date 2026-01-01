import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    IconButton,
    Chip,
    Autocomplete
} from '@mui/material';
import { Download, AccountBalance, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const AccountsReceivableReportPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Filter states
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [status, setStatus] = useState('');
    const [clientes, setClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [centrosCusto, setCentrosCusto] = useState([]);
    const [selectedCentroCusto, setSelectedCentroCusto] = useState(null);

    useEffect(() => {
        loadFilters();
        fetchData();
    }, []);

    const loadFilters = async () => {
        try {
            const [cliResponse, ccResponse] = await Promise.all([
                axios.get('http://localhost:3005/api/financeiro/clientes'),
                axios.get('http://localhost:3005/api/financeiro/centro-custo')
            ]);
            setClientes(cliResponse.data.data || []);
            setCentrosCusto(ccResponse.data.data || []);
        } catch (err) {
            console.error('Error loading filters:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (dataInicio) params.dataInicio = dataInicio;
            if (dataFim) params.dataFim = dataFim;
            if (status) params.status = status;
            if (selectedCliente) params.idCliente = selectedCliente.id;
            if (selectedCentroCusto) params.idCentroCusto = selectedCentroCusto.id;

            const response = await axios.get('http://localhost:3005/api/financeiro/relatorios/contas-receber', { params });

            // Group by conta
            const grouped = {};
            response.data.data.forEach(row => {
                if (!grouped[row.id_conta]) {
                    grouped[row.id_conta] = {
                        ...row,
                        parcelas: []
                    };
                }
                if (row.id_parcela) {
                    grouped[row.id_conta].parcelas.push({
                        id: row.id_parcela,
                        numero_parcela: row.numero_parcela,
                        valor: row.valor_parcela,
                        data_vencimento: row.vencimento_parcela,
                        data_recebimento: row.recebimento_parcela,
                        status: row.status_parcela,
                        juros: row.juros,
                        desconto: row.desconto
                    });
                }
            });

            setData(Object.values(grouped));
        } catch (err) {
            console.error('Error fetching accounts receivable:', err);
            setError(err.response?.data?.message || 'Erro ao buscar contas a receber');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchData();
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contas a Receber');

        worksheet.addRow(['RELATÓRIO DE CONTAS A RECEBER']);
        worksheet.addRow([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]);
        worksheet.addRow([]);

        const headerRow = worksheet.addRow([
            'Documento', 'Cliente', 'Descrição', 'Valor Total', 'Valor Recebido',
            'Saldo', 'Vencimento', 'Status', 'Dias Atraso'
        ]);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };

        data.forEach(conta => {
            worksheet.addRow([
                conta.numero_documento,
                conta.cliente_nome,
                conta.descricao,
                parseFloat(conta.valor_total),
                parseFloat(conta.valor_recebido),
                parseFloat(conta.saldo),
                new Date(conta.data_vencimento).toLocaleDateString('pt-BR'),
                conta.status,
                conta.dias_atraso
            ]);
        });

        worksheet.getColumn(4).numFmt = '#,##0.00';
        worksheet.getColumn(5).numFmt = '#,##0.00';
        worksheet.getColumn(6).numFmt = '#,##0.00';
        worksheet.columns.forEach(col => col.width = 18);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `ContasReceber_${new Date().getTime()}.xlsx`);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            'ABERTO': 'warning',
            'RECEBIDO': 'success',
            'VENCIDO': 'error',
            'CANCELADO': 'default'
        };
        return colors[status] || 'default';
    };

    const totals = data.reduce((acc, conta) => ({
        total: acc.total + parseFloat(conta.valor_total || 0),
        recebido: acc.recebido + parseFloat(conta.valor_recebido || 0),
        saldo: acc.saldo + parseFloat(conta.saldo || 0)
    }), { total: 0, recebido: 0, saldo: 0 });

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalance sx={{ fontSize: 32, color: 'success.main' }} />
                    <Typography variant="h4" fontWeight="600">
                        Contas a Receber
                    </Typography>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Data Início"
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Data Fim"
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="ABERTO">Aberto</MenuItem>
                            <MenuItem value="RECEBIDO">Recebido</MenuItem>
                            <MenuItem value="VENCIDO">Vencido</MenuItem>
                            <MenuItem value="CANCELADO">Cancelado</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => option.nome_razao || ''}
                            value={selectedCliente}
                            onChange={(_, newValue) => setSelectedCliente(newValue)}
                            renderInput={(params) => <TextField {...params} label="Cliente" />}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            options={centrosCusto}
                            getOptionLabel={(option) => option.descricao || ''}
                            value={selectedCentroCusto}
                            onChange={(_, newValue) => setSelectedCentroCusto(newValue)}
                            renderInput={(params) => <TextField {...params} label="Centro de Custo" />}
                        />
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant="contained" onClick={handleFilter} disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Filtrar'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={exportToExcel}
                                disabled={loading || data.length === 0}
                                startIcon={<Download />}
                            >
                                Excel
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Data Table */}
            {data.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'success.main' }}>
                                    <TableCell sx={{ width: 50 }} />
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descrição</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Valor Total</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Recebido</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Saldo</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vencimento</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((conta) => (
                                    <React.Fragment key={conta.id_conta}>
                                        <TableRow hover>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => toggleRow(conta.id_conta)}>
                                                    {expandedRows.has(conta.id_conta) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>{conta.numero_documento}</TableCell>
                                            <TableCell>{conta.cliente_nome}</TableCell>
                                            <TableCell>{conta.descricao}</TableCell>
                                            <TableCell align="right">{formatCurrency(conta.valor_total)}</TableCell>
                                            <TableCell align="right">{formatCurrency(conta.valor_recebido)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(conta.saldo)}</TableCell>
                                            <TableCell>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>
                                                <Chip label={conta.status} color={getStatusColor(conta.status)} size="small" />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ p: 0 }}>
                                                <Collapse in={expandedRows.has(conta.id_conta)} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                        <Typography variant="subtitle2" gutterBottom>Parcelas:</Typography>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Parcela</TableCell>
                                                                    <TableCell align="right">Valor</TableCell>
                                                                    <TableCell>Vencimento</TableCell>
                                                                    <TableCell>Recebimento</TableCell>
                                                                    <TableCell>Status</TableCell>
                                                                    <TableCell align="right">Juros</TableCell>
                                                                    <TableCell align="right">Desconto</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {conta.parcelas.map((parcela) => (
                                                                    <TableRow key={parcela.id}>
                                                                        <TableCell>{parcela.numero_parcela}</TableCell>
                                                                        <TableCell align="right">{formatCurrency(parcela.valor)}</TableCell>
                                                                        <TableCell>{new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                                                        <TableCell>
                                                                            {parcela.data_recebimento ? new Date(parcela.data_recebimento).toLocaleDateString('pt-BR') : '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip label={parcela.status} color={getStatusColor(parcela.status)} size="small" />
                                                                        </TableCell>
                                                                        <TableCell align="right">{formatCurrency(parcela.juros)}</TableCell>
                                                                        <TableCell align="right">{formatCurrency(parcela.desconto)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 700 }}>TOTAIS</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(totals.total)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(totals.recebido)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                                        {formatCurrency(totals.saldo)}
                                    </TableCell>
                                    <TableCell colSpan={2} />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {!loading && data.length === 0 && (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Nenhuma conta a receber encontrada
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default AccountsReceivableReportPage;
