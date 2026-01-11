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
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountTree,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const ChartOfAccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        codigo: '',
        descricao: '',
        tipo: 'RECEITA',
        nivel: 1,
        codigo_pai: '',
        ativo: true
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/financeiro/plano-contas');
            const response = await axios.get(url);
            setAccounts(response.data.data || []);
        } catch (error) {
            showSnackbar('Erro ao carregar plano de contas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (account = null) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                codigo: account.codigo,
                descricao: account.descricao,
                tipo: account.tipo,
                nivel: account.nivel,
                codigo_pai: account.codigo_pai || '',
                ativo: account.ativo
            });
        } else {
            setEditingAccount(null);
            setFormData({
                codigo: '',
                descricao: '',
                tipo: 'RECEITA',
                nivel: 1,
                codigo_pai: '',
                ativo: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAccount(null);
    };

    const handleSave = async () => {
        try {
            if (editingAccount) {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/plano-contas/${editingAccount.id}`);
                await axios.put(url, formData);
                showSnackbar('Conta atualizada com sucesso!', 'success');
            } else {
                const url = getApiUrl(NODE_API_URL, '/api/financeiro/plano-contas');
                await axios.post(url, formData);
                showSnackbar('Conta cadastrada com sucesso!', 'success');
            }
            handleCloseDialog();
            fetchAccounts();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Erro ao salvar conta', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir esta conta?')) {
            try {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/plano-contas/${id}`);
                await axios.delete(url);
                showSnackbar('Conta excluída com sucesso!', 'success');
                fetchAccounts();
            } catch (error) {
                showSnackbar(error.response?.data?.message || 'Erro ao excluir conta', 'error');
            }
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const filteredAccounts = accounts.filter(account =>
        account.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeColor = (tipo) => {
        return tipo === 'RECEITA' ? 'success' : 'error';
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountTree sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h4" fontWeight="700">
                            Plano de Contas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerencie a estrutura contábil do sistema
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
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
                    Nova Conta
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ border: '2px solid #4caf50', bgcolor: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Total de Contas
                            </Typography>
                            <Typography variant="h3" fontWeight="700" color="success.main">
                                {accounts.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ border: '2px solid #4caf50', bgcolor: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Receitas
                            </Typography>
                            <Typography variant="h3" fontWeight="700" color="success.main">
                                {accounts.filter(a => a.tipo === 'RECEITA').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ border: '2px solid #4caf50', bgcolor: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Despesas
                            </Typography>
                            <Typography variant="h3" fontWeight="700" color="error.main">
                                {accounts.filter(a => a.tipo === 'DESPESA').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

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
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descrição</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nível</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAccounts.map((account) => (
                            <TableRow
                                key={account.id}
                                hover
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>{account.codigo}</TableCell>
                                <TableCell>{account.descricao}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={account.tipo}
                                        color={getTypeColor(account.tipo)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{account.nivel}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={account.ativo ? 'Ativo' : 'Inativo'}
                                        color={account.ativo ? 'success' : 'default'}
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
                                                onClick={() => handleOpenDialog(account)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(account.id)}
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
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700 }}>
                    {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <MenuItem value="RECEITA">Receita</MenuItem>
                                <MenuItem value="DESPESA">Despesa</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descrição"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nível"
                                type="number"
                                value={formData.nivel}
                                onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                                InputProps={{ inputProps: { min: 1, max: 5 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código Pai (opcional)"
                                value={formData.codigo_pai}
                                onChange={(e) => setFormData({ ...formData, codigo_pai: e.target.value })}
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

export default ChartOfAccountsPage;
