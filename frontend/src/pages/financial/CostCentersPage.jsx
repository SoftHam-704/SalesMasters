import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Alert,
    Snackbar,
    Card,
    CardContent,
    Grid,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountBalance,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const CostCentersPage = () => {
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        codigo: '',
        descricao: '',
        ativo: true
    });

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const fetchCostCenters = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/financeiro/centro-custo');
            const response = await axios.get(url);
            setCostCenters(response.data.data || []);
        } catch (error) {
            showSnackbar('Erro ao carregar centros de custo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (center = null) => {
        if (center) {
            setEditingCenter(center);
            setFormData({
                codigo: center.codigo || '',
                descricao: center.descricao || '',
                ativo: center.ativo ?? true
            });
        } else {
            setEditingCenter(null);
            setFormData({
                codigo: '',
                descricao: '',
                ativo: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCenter(null);
    };

    const handleSave = async () => {
        if (!formData.codigo.trim() || !formData.descricao.trim()) {
            showSnackbar('Por favor, preencha o código e a descrição', 'warning');
            return;
        }

        try {
            if (editingCenter) {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/centro-custo/${editingCenter.id}`);
                await axios.put(url, formData);
                showSnackbar('Centro de custo atualizado com sucesso!', 'success');
            } else {
                const url = getApiUrl(NODE_API_URL, '/api/financeiro/centro-custo');
                await axios.post(url, formData);
                showSnackbar('Centro de custo cadastrado com sucesso!', 'success');
            }
            handleCloseDialog();
            fetchCostCenters();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Erro ao salvar centro de custo', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir este centro de custo?')) {
            try {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/centro-custo/${id}`);
                await axios.delete(url);
                showSnackbar('Centro de custo excluído com sucesso!', 'success');
                fetchCostCenters();
            } catch (error) {
                showSnackbar(error.response?.data?.message || 'Erro ao excluir centro de custo', 'error');
            }
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const filteredCenters = costCenters.filter(center =>
        (center.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (center.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header com Estilo Premium */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 4,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AccountBalance sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                            Centros de Custo
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                            Organização financeira por departamentos e projetos
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.3)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Novo Centro de Custo
                </Button>
            </Box>

            {/* Barra de Busca Refinada */}
            <Card sx={{
                borderRadius: 4,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px border-slate-100',
                mb: 4,
                overflow: 'visible'
            }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <TextField
                        fullWidth
                        placeholder="Pesquisar por código, nome ou departamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1.5, color: '#94a3b8' }} />,
                            sx: {
                                borderRadius: 3,
                                bgcolor: '#f8fafc',
                                '& fieldset': { border: 'none' },
                                '&:hover fieldset': { border: 'none' },
                                '&.Mui-focused fieldset': { border: 'none' },
                                fontWeight: 500,
                                fontSize: '0.95rem'
                            }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Tabela com Visual Moderno */}
            <TableContainer component={Paper} sx={{
                borderRadius: 4,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                border: '1px border-slate-100'
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em', py: 2.5 }}>Código</TableCell>
                            <TableCell sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em' }}>Descrição do Centro de Custo</TableCell>
                            <TableCell sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em' }}>Status</TableCell>
                            <TableCell align="center" sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCenters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body1" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                        Nenhum centro de custo encontrado
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCenters.map((center) => (
                                <TableRow
                                    key={center.id}
                                    sx={{
                                        '&:hover': { bgcolor: '#f8fafc' },
                                        transition: 'background-color 0.2s ease',
                                        '& td': { borderBottom: '1px solid #f1f5f9' }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        <Box sx={{
                                            display: 'inline-block',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1.5,
                                            bgcolor: '#eef2ff',
                                            color: '#4f46e5'
                                        }}>
                                            {center.codigo}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#334155' }}>{center.descricao}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={center.ativo ? 'Ativo' : 'Inativo'}
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                height: 24,
                                                borderRadius: 2,
                                                bgcolor: center.ativo ? '#dcfce7' : '#f1f5f9',
                                                color: center.ativo ? '#166534' : '#475569',
                                                border: 'none'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="Editar Cadastro">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(center)}
                                                    sx={{
                                                        color: '#6366f1',
                                                        bgcolor: '#f5f3ff',
                                                        '&:hover': { bgcolor: '#e0e7ff', transform: 'scale(1.1)' },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir Centro">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(center.id)}
                                                    sx={{
                                                        color: '#ef4444',
                                                        bgcolor: '#fef2f2',
                                                        '&:hover': { bgcolor: '#fee2e2', transform: 'scale(1.1)' },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog - Redesenhado */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 5,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 2 }}>
                            <AccountBalance sx={{ color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="800">
                                {editingCenter ? 'Editar Registro' : 'Novo Registro'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>
                                Configuração de Centro de Custo
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 4, mt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="caption" fontWeight="800" sx={{ color: '#64748b', ml: 1, textTransform: 'uppercase' }}>
                                Código Identificador
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Ex: ADMIN, VENDAS, TI..."
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                variant="outlined"
                                sx={{
                                    mt: 0.5,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: '#f8fafc',
                                        fontWeight: 700
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" fontWeight="800" sx={{ color: '#64748b', ml: 1, textTransform: 'uppercase' }}>
                                Descrição Completa
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Digite o nome amigável do centro de custo..."
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                multiline
                                rows={3}
                                sx={{
                                    mt: 0.5,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: '#f8fafc',
                                        fontWeight: 500
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid #f1f5f9',
                                bgcolor: '#f8fafc'
                            }}>
                                <Typography variant="body2" fontWeight="700" sx={{ flex: 1, color: '#475569' }}>
                                    Status do Registro
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant={formData.ativo ? "contained" : "outlined"}
                                        color="success"
                                        onClick={() => setFormData({ ...formData, ativo: true })}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Ativo
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={!formData.ativo ? "contained" : "outlined"}
                                        color="error"
                                        onClick={() => setFormData({ ...formData, ativo: false })}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Inativo
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            color: '#64748b',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            fontWeight: 800,
                            textTransform: 'none',
                            borderRadius: 3,
                            px: 5,
                            py: 1.2,
                            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                            }
                        }}
                    >
                        Confirmar e Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontWeight: 600
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CostCentersPage;
