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
                codigo: center.codigo,
                descricao: center.descricao,
                ativo: center.ativo
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
        center.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCenters = costCenters.filter(c => c.ativo).length;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'secondary.main' }} />
                    <Box>
                        <Typography variant="h4" fontWeight="700">
                            Centros de Custo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerencie os departamentos e projetos
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    size="large"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1.5
                    }}
                >
                    Novo Centro
                </Button>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                />
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'secondary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descrição</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCenters.map((center) => (
                            <TableRow
                                key={center.id}
                                hover
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>{center.codigo}</TableCell>
                                <TableCell>{center.descricao}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={center.ativo ? 'Ativo' : 'Inativo'}
                                        color={center.ativo ? 'success' : 'default'}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenDialog(center)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(center.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', fontWeight: 700 }}>
                    {editingCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Código"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descrição"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                required
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="secondary"
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        Salvar
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
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CostCentersPage;
