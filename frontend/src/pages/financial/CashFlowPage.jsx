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
    TableRow
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp } from '@mui/icons-material';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CashFlowPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);

    // Filter states
    const [dataInicio, setDataInicio] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day of current month
        return date.toISOString().split('T')[0];
    });
    const [dataFim, setDataFim] = useState(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    });
    const [agrupamento, setAgrupamento] = useState('DIARIO');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:3005/api/financeiro/relatorios/fluxo-caixa', {
                params: { dataInicio, dataFim, agrupamento }
            });
            setData(response.data.data || []);
        } catch (err) {
            console.error('Error fetching cash flow:', err);
            setError(err.response?.data?.message || 'Erro ao buscar fluxo de caixa');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchData();
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fluxo de Caixa');

        // Header
        worksheet.addRow(['FLUXO DE CAIXA']);
        worksheet.addRow([`Período: ${dataInicio} a ${dataFim}`]);
        worksheet.addRow([`Agrupamento: ${agrupamento}`]);
        worksheet.addRow([]);

        // Table header
        const headerRow = worksheet.addRow(['Período', 'Entradas (R$)', 'Saídas (R$)', 'Saldo (R$)', 'Saldo Acumulado (R$)']);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4CAF50' }
        };

        // Data rows
        data.forEach(row => {
            worksheet.addRow([
                row.periodo,
                parseFloat(row.entradas),
                parseFloat(row.saidas),
                parseFloat(row.saldo),
                parseFloat(row.saldo_acumulado)
            ]);
        });

        // Format columns
        worksheet.getColumn(2).numFmt = '#,##0.00';
        worksheet.getColumn(3).numFmt = '#,##0.00';
        worksheet.getColumn(4).numFmt = '#,##0.00';
        worksheet.getColumn(5).numFmt = '#,##0.00';
        worksheet.columns.forEach(col => col.width = 20);

        // Generate file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `FluxoCaixa_${new Date().getTime()}.xlsx`);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const chartData = data.map(item => ({
        name: item.periodo,
        Entradas: parseFloat(item.entradas),
        Saídas: parseFloat(item.saidas),
        Saldo: parseFloat(item.saldo_acumulado)
    }));

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight="600">
                        Fluxo de Caixa
                    </Typography>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
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
                            label="Agrupamento"
                            value={agrupamento}
                            onChange={(e) => setAgrupamento(e.target.value)}
                        >
                            <MenuItem value="DIARIO">Diário</MenuItem>
                            <MenuItem value="SEMANAL">Semanal</MenuItem>
                            <MenuItem value="MENSAL">Mensal</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleFilter}
                                disabled={loading}
                            >
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

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Chart */}
            {data.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Gráfico de Fluxo de Caixa
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="Entradas" stroke="#4CAF50" strokeWidth={2} />
                            <Line type="monotone" dataKey="Saídas" stroke="#f44336" strokeWidth={2} />
                            <Line type="monotone" dataKey="Saldo" stroke="#2196F3" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            )}

            {/* Data Table */}
            {data.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Detalhamento
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Período</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Entradas</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Saídas</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Saldo</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Saldo Acumulado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{row.periodo}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                            {formatCurrency(row.entradas)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                                            {formatCurrency(row.saidas)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(row.saldo)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                            {formatCurrency(row.saldo_acumulado)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {!loading && data.length === 0 && (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Nenhum dado encontrado para o período selecionado
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default CashFlowPage;
