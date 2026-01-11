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
    MenuItem,
    Card,
    CardContent,
    Grid,
    Tooltip,
    Tab,
    Tabs
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const FinancialSuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        nome_razao: '',
        nome_fantasia: '',
        cpf_cnpj: '',
        tipo_pessoa: 'J',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        ativo: true
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/financeiro/fornecedores');
            const response = await axios.get(url);
            setSuppliers(response.data.data || []);
        } catch (error) {
            showSnackbar('Erro ao carregar fornecedores', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                nome_razao: supplier.nome_razao || '',
                nome_fantasia: supplier.nome_fantasia || '',
                cpf_cnpj: supplier.cpf_cnpj || '',
                tipo_pessoa: supplier.tipo_pessoa || 'J',
                email: supplier.email || '',
                telefone: supplier.telefone || '',
                endereco: supplier.endereco || '',
                numero: supplier.numero || '',
                complemento: supplier.complemento || '',
                bairro: supplier.bairro || '',
                cidade: supplier.cidade || '',
                uf: supplier.uf || '',
                cep: supplier.cep || '',
                ativo: supplier.ativo
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                nome_razao: '',
                nome_fantasia: '',
                cpf_cnpj: '',
                tipo_pessoa: 'J',
                email: '',
                telefone: '',
                endereco: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                uf: '',
                cep: '',
                ativo: true
            });
        }
        setOpenDialog(true);
        setTabValue(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSupplier(null);
    };

    const handleSave = async () => {
        try {
            if (editingSupplier) {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/fornecedores/${editingSupplier.id}`);
                await axios.put(url, formData);
                showSnackbar('Fornecedor atualizado com sucesso!', 'success');
            } else {
                const url = getApiUrl(NODE_API_URL, '/api/financeiro/fornecedores');
                await axios.post(url, formData);
                showSnackbar('Fornecedor cadastrado com sucesso!', 'success');
            }
            handleCloseDialog();
            fetchSuppliers();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Erro ao salvar fornecedor', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir este fornecedor?')) {
            try {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/fornecedores/${id}`);
                await axios.delete(url);
                showSnackbar('Fornecedor excluído com sucesso!', 'success');
                fetchSuppliers();
            } catch (error) {
                showSnackbar(error.response?.data?.message || 'Erro ao excluir fornecedor', 'error');
            }
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.cpf_cnpj?.includes(searchTerm)
    );

    const activeSuppliers = suppliers.filter(s => s.ativo).length;
    const pfSuppliers = suppliers.filter(s => s.tipo_pessoa === 'F').length;
    const pjSuppliers = suppliers.filter(s => s.tipo_pessoa === 'J').length;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Business sx={{ fontSize: 40, color: 'error.main' }} />
                    <Box>
                        <Typography variant="h4" fontWeight="700">
                            Fornecedores Financeiros
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerencie os fornecedores para contas a pagar
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    color="error"
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
                    Novo Fornecedor
                </Button>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome ou CPF/CNPJ..."
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
                    <TableHead sx={{ bgcolor: 'error.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nome/Razão Social</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CPF/CNPJ</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Telefone</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSuppliers.map((supplier) => (
                            <TableRow
                                key={supplier.id}
                                hover
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>{supplier.nome_razao}</TableCell>
                                <TableCell>{supplier.cpf_cnpj}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={supplier.tipo_pessoa === 'F' ? 'PF' : 'PJ'}
                                        color={supplier.tipo_pessoa === 'F' ? 'info' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{supplier.telefone}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={supplier.ativo ? 'Ativo' : 'Inativo'}
                                        color={supplier.ativo ? 'success' : 'default'}
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
                                                onClick={() => handleOpenDialog(supplier)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(supplier.id)}
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
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 700 }}>
                    {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                        <Tab label="Dados Básicos" />
                        <Tab label="Endereço" />
                    </Tabs>

                    {tabValue === 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Tipo de Pessoa"
                                    value={formData.tipo_pessoa}
                                    onChange={(e) => setFormData({ ...formData, tipo_pessoa: e.target.value })}
                                >
                                    <MenuItem value="F">Pessoa Física</MenuItem>
                                    <MenuItem value="J">Pessoa Jurídica</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={formData.tipo_pessoa === 'F' ? 'CPF' : 'CNPJ'}
                                    value={formData.cpf_cnpj}
                                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={formData.tipo_pessoa === 'F' ? 'Nome Completo' : 'Razão Social'}
                                    value={formData.nome_razao}
                                    onChange={(e) => setFormData({ ...formData, nome_razao: e.target.value })}
                                    required
                                />
                            </Grid>
                            {formData.tipo_pessoa === 'J' && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nome Fantasia"
                                        value={formData.nome_fantasia}
                                        onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="E-mail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Telefone"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {tabValue === 1 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="CEP"
                                    value={formData.cep}
                                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={7}>
                                <TextField
                                    fullWidth
                                    label="Endereço"
                                    value={formData.endereco}
                                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField
                                    fullWidth
                                    label="Número"
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Complemento"
                                    value={formData.complemento}
                                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Bairro"
                                    value={formData.bairro}
                                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Cidade"
                                    value={formData.cidade}
                                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                                <TextField
                                    fullWidth
                                    label="UF"
                                    value={formData.uf}
                                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                                    inputProps={{ maxLength: 2 }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="error"
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

export default FinancialSuppliersPage;
