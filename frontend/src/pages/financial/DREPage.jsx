import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { Download, Assessment, TrendingUp, TrendingDown } from '@mui/icons-material';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const DREPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Filter states
    const [mes, setMes] = useState(() => new Date().getMonth() + 1);
    const [ano, setAno] = useState(() => new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:3005/api/financeiro/relatorios/dre', {
                params: { mes, ano }
            });
            setData(response.data.data);
        } catch (err) {
            console.error('Error fetching DRE:', err);
            setError(err.response?.data?.message || 'Erro ao buscar DRE');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchData();
    };

    const exportToExcel = async () => {
        if (!data) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DRE');

        worksheet.addRow(['DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)']);
        worksheet.addRow([`Período: ${String(mes).padStart(2, '0')}/${ano}`]);
        worksheet.addRow([]);

        // Receitas
        worksheet.addRow(['RECEITAS']).font = { bold: true, size: 12 };
        data.receitas.forEach(item => {
            const indent = '  '.repeat(item.nivel - 1);
            worksheet.addRow([
                indent + item.descricao,
                parseFloat(item.valor),
                parseFloat(item.percentual)
            ]);
        });

        worksheet.addRow([]);
        const totalRecRow = worksheet.addRow(['TOTAL RECEITAS', data.totais.receitas, 100]);
        totalRecRow.font = { bold: true };
        totalRecRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };

        worksheet.addRow([]);

        // Despesas
        worksheet.addRow(['DESPESAS']).font = { bold: true, size: 12 };
        data.despesas.forEach(item => {
            const indent = '  '.repeat(item.nivel - 1);
            worksheet.addRow([
                indent + item.descricao,
                parseFloat(item.valor),
                parseFloat(item.percentual)
            ]);
        });

        worksheet.addRow([]);
        const totalDespRow = worksheet.addRow(['TOTAL DESPESAS', data.totais.despesas, '']);
        totalDespRow.font = { bold: true };
        totalDespRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };

        worksheet.addRow([]);
        const resultRow = worksheet.addRow(['RESULTADO LÍQUIDO', data.totais.resultado, '']);
        resultRow.font = { bold: true, size: 14 };
        resultRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: data.totais.resultado >= 0 ? 'FF2196F3' : 'FFFF9800' }
        };

        worksheet.getColumn(2).numFmt = '#,##0.00';
        worksheet.getColumn(3).numFmt = '0.00"%"';
        worksheet.columns = [
            { width: 40 },
            { width: 20 },
            { width: 15 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `DRE_${mes}_${ano}.xlsx`);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const renderTreeRow = (item, isReceita = true) => {
        const paddingLeft = item.nivel * 20;
        const fontWeight = item.nivel === 1 ? 700 : item.nivel === 2 ? 600 : 400;

        return (
            <TableRow key={item.codigo} hover>
                <TableCell sx={{ pl: `${paddingLeft}px`, fontWeight }}>
                    {item.descricao}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight, color: isReceita ? 'success.main' : 'error.main' }}>
                    {formatCurrency(item.valor)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight }}>
                    {parseFloat(item.percentual).toFixed(2)}%
                </TableCell>
            </TableRow>
        );
    };

    const months = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Assessment sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight="600">
                        DRE - Demonstração do Resultado
                    </Typography>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Mês"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            SelectProps={{ native: true }}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Ano"
                            value={ano}
                            onChange={(e) => setAno(e.target.value)}
                            SelectProps={{ native: true }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant="contained" onClick={handleFilter} disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Gerar DRE'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={exportToExcel}
                                disabled={loading || !data}
                                startIcon={<Download />}
                            >
                                Excel
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Summary Cards */}
            {data && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ border: '2px solid #4caf50', bgcolor: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <TrendingUp sx={{ color: '#4caf50' }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Receitas
                                    </Typography>
                                </Box>


                                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                                    {formatCurrency(data.totais.receitas)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ border: '2px solid #e53935', bgcolor: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <TrendingDown sx={{ color: '#e53935' }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Despesas
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ color: '#e53935', fontWeight: 700 }}>
                                    {formatCurrency(data.totais.despesas)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ border: '2px solid #4caf50', bgcolor: 'white' }}>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Resultado Líquido
                                </Typography>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: data.totais.resultado >= 0 ? '#4caf50' : '#e53935',
                                        fontWeight: 700
                                    }}
                                >
                                    {formatCurrency(data.totais.resultado)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* DRE Table */}
            {data && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Detalhamento Hierárquico
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Conta</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Valor (R$)</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>% Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ bgcolor: '#e8f5e9', fontWeight: 700, fontSize: '1.1rem', color: '#2e7d32', borderLeft: '4px solid #4caf50' }}>
                                        RECEITAS
                                    </TableCell>
                                </TableRow>
                                {data.receitas.map(item => renderTreeRow(item, true))}
                                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                                    <TableCell sx={{ color: '#2e7d32', fontWeight: 700, borderLeft: '4px solid #4caf50' }}>TOTAL RECEITAS</TableCell>
                                    <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                                        {formatCurrency(data.totais.receitas)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>100.00%</TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={3} sx={{ height: 20 }} />
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={3} sx={{ bgcolor: '#ffebee', fontWeight: 700, fontSize: '1.1rem', color: '#c62828', borderLeft: '4px solid #e53935' }}>
                                        DESPESAS
                                    </TableCell>
                                </TableRow>
                                {data.despesas.map(item => renderTreeRow(item, false))}
                                <TableRow sx={{ bgcolor: '#ffebee' }}>
                                    <TableCell sx={{ color: '#c62828', fontWeight: 700, borderLeft: '4px solid #e53935' }}>TOTAL DESPESAS</TableCell>
                                    <TableCell align="right" sx={{ color: '#c62828', fontWeight: 700 }}>
                                        {formatCurrency(data.totais.despesas)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#c62828', fontWeight: 700 }}>-</TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={3} sx={{ height: 20 }} />
                                </TableRow>

                                <TableRow sx={{ bgcolor: data.totais.resultado >= 0 ? '#e3f2fd' : '#fff3e0' }}>
                                    <TableCell sx={{ color: data.totais.resultado >= 0 ? '#1565c0' : '#e65100', fontWeight: 700, fontSize: '1.2rem', borderLeft: `4px solid ${data.totais.resultado >= 0 ? '#1976d2' : '#ff9800'}` }}>
                                        RESULTADO LÍQUIDO
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: data.totais.resultado >= 0 ? '#1565c0' : '#e65100', fontWeight: 700, fontSize: '1.2rem' }}>
                                        {formatCurrency(data.totais.resultado)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: data.totais.resultado >= 0 ? '#1565c0' : '#e65100', fontWeight: 700 }}>-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {!loading && !data && (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Selecione o período e clique em "Gerar DRE"
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default DREPage;
