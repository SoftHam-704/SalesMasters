/**
 * useOrderForm Hook
 * Extracted from OrderForm.jsx (legacy) — core state management for order header.
 * Shared between legacy OrderForm and new Aura OrderFormModal.
 *
 * Phase 1: Header data, totals, save, item loading, CLI_IND conditions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { orderService } from '@/services/orders';
import { auxDataService } from '@/services/orders/auxDataService';
import { usePriceTable, useAuxData, useCliIndData, useSmartDiscounts } from '@/hooks/orders';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const maskCnpjCpf = (value) => {
    if (!value) return "";
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length === 11) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleanValue.length === 14) {
        return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
};

const initialFormState = {
    ped_pedido: '',
    ped_data: new Date().toISOString().split('T')[0],
    ped_situacao: '',
    ped_cliente: '',
    ped_transp: '',
    ped_vendedor: '',
    ped_condpag: '',
    ped_comprador: '',
    ped_tipofrete: 'C',
    ped_pedcli: '',
    ped_pedindu: '',
    ped_industria: '',
    ped_tabela: '',
    ped_pri: 0, ped_seg: 0, ped_ter: 0,
    ped_qua: 0, ped_qui: 0, ped_sex: 0,
    ped_set: 0, ped_oit: 0, ped_nov: 0,
    ped_totbruto: 0,
    ped_totliq: 0,
    ped_totalipi: 0,
    ped_permiterepe: false,
    ped_obs: '',
};

/**
 * @param {Object} options
 * @param {Object|null} options.selectedIndustry - Industry object (for_codigo, for_nomered, for_des1..for_des10)
 * @param {Object|null} options.existingOrder - Existing order data (edit/view mode)
 * @param {Object|null} options.userParams - User parameters from /api/parametros
 * @param {'new'|'edit'|'view'} options.mode - Form mode
 */
export function useOrderForm({ selectedIndustry, existingOrder, userParams, mode } = {}) {
    // Core form state
    const [formData, setFormData] = useState(initialFormState);
    const [displayNumber, setDisplayNumber] = useState('(Novo)');
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [summaryItems, setSummaryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPersisted, setIsPersisted] = useState(!!existingOrder);

    // Display names for entity combos
    const [selectedClientName, setSelectedClientName] = useState('');
    const [selectedTranspName, setSelectedTranspName] = useState('');
    const [selectedSellerName, setSelectedSellerName] = useState('');

    // Existing hooks
    const industryCode = formData.ped_industria || selectedIndustry?.for_codigo || selectedIndustry?.code;
    const auxData = useAuxData(industryCode);
    const priceTable = usePriceTable(industryCode, formData.ped_tabela);
    const cliIndData = useCliIndData();
    const smartDiscounts = useSmartDiscounts();

    // Refs
    const initDone = useRef(false);

    // Fetch smart discounts when client changes
    useEffect(() => {
        if (formData.ped_cliente) {
            smartDiscounts.fetchClientDiscounts(formData.ped_cliente);
        }
        smartDiscounts.fetchTableGroupDiscounts();
    }, [formData.ped_cliente]);

    // Load user parameters
    const [internalUserParams, setInternalUserParams] = useState(null);

    useEffect(() => {
        if (userParams) {
            setInternalUserParams(userParams);
            return;
        }
        const loadUserParams = async () => {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user?.id) {
                        const response = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${user.id}`));
                        const data = await response.json();
                        if (data.success && data.data) {
                            setInternalUserParams(data.data);
                        }
                    }
                } catch (e) {
                    console.error('Erro ao carregar parâmetros do usuário:', e);
                }
            }
        };
        loadUserParams();
    }, [userParams]);

    // Initialize form (existing order or new)
    useEffect(() => {
        const initializeForm = async () => {
            if (existingOrder) {
                // Determine correct status prioritizing ped_status for quotes
                let status = existingOrder.ped_situacao;
                if (!status || status === 'P') {
                    const s = String(existingOrder.ped_status || '').toUpperCase();
                    if (s.includes('COTA')) status = 'C';
                    else if (s === 'PEDIDO') status = 'P';
                }
                if (!status) status = 'P';

                const formattedOrder = {
                    ...existingOrder,
                    ped_situacao: status,
                    ped_data: existingOrder.ped_data
                        ? new Date(existingOrder.ped_data).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    ped_cliente: existingOrder.ped_cliente || '',
                    ped_transp: existingOrder.ped_transp || '',
                    ped_vendedor: existingOrder.ped_vendedor || '',
                    ped_pedindu: existingOrder.ped_pedindustria || existingOrder.ped_pedindu || '',
                    ped_pedcli: existingOrder.ped_cliind || existingOrder.ped_pedcli || '',
                };

                setFormData(prev => ({ ...prev, ...formattedOrder }));
                setDisplayNumber(existingOrder.ped_pedido);
                setAllowDuplicates(existingOrder.ped_permiterepe || false);
                setIsPersisted(true);

                // Initial display names from base order
                setSelectedClientName(existingOrder.cli_nomred || existingOrder.cli_nome || '');
                setSelectedTranspName(existingOrder.tra_nome || '');
                setSelectedSellerName(existingOrder.ven_nome || '');

                // Enrich client data if missing (CNPJ, City, group) - Using precise ID lookup
                if (existingOrder.ped_cliente) {
                    try {
                        const res = await auxDataService.getClientById(existingOrder.ped_cliente);
                        if (res.success && res.data) {
                            const fullClient = res.data;
                            setFormData(prev => ({
                                ...prev,
                                cli_cnpj: fullClient.cli_cnpj,
                                cli_cidade: fullClient.cli_cidade || fullClient.cid_nome || '',
                                cli_uf: fullClient.cli_uf,
                                cli_grupo: fullClient.cli_grupo,
                            }));
                            const initClientName = fullClient.cli_nomred || fullClient.cli_nome || '';
                            const initClientCnpj = fullClient.cli_cnpj ? ` - ${maskCnpjCpf(fullClient.cli_cnpj)}` : '';
                            setSelectedClientName(initClientName + initClientCnpj);
                        }
                    } catch (e) {
                        console.error('Error enriching client data:', e);
                    }
                }

                // Load items
                if (existingOrder.ped_pedido) {
                    loadSummaryItems(existingOrder.ped_pedido);
                }
            } else if (internalUserParams !== null || !userParams) {
                // New order
                const params = internalUserParams || {};
                const newOrderState = {
                    ...initialFormState,
                    ped_industria: selectedIndustry?.for_codigo || selectedIndustry?.code || '',
                    ped_pri: selectedIndustry?.for_des1 || 0,
                    ped_seg: selectedIndustry?.for_des2 || 0,
                    ped_ter: selectedIndustry?.for_des3 || 0,
                    ped_qua: selectedIndustry?.for_des4 || 0,
                    ped_qui: selectedIndustry?.for_des5 || 0,
                    ped_sex: selectedIndustry?.for_des6 || 0,
                    ped_set: selectedIndustry?.for_des7 || 0,
                    ped_oit: selectedIndustry?.for_des8 || 0,
                    ped_nov: selectedIndustry?.for_des9 || 0,
                    ped_dez: selectedIndustry?.for_des10 || 0,
                    ped_tipofrete: params.par_tipofretepadrao || 'C',
                    ped_situacao: params.par_iniciapedido || 'P',
                    ped_obs: params.par_obs_padrao || '',
                };

                if (params.par_itemduplicado === 'S') {
                    setAllowDuplicates(true);
                }

                setFormData(newOrderState);
                setSummaryItems([]);
                setDisplayNumber('(Novo)');
                setIsPersisted(false);
                loadNextNumber();
            }
        };

        initializeForm();
    }, [existingOrder, selectedIndustry, internalUserParams, mode]);

    // Recalculate totals when items change
    useEffect(() => {
        if (summaryItems.length > 0) {
            const totals = summaryItems.reduce((acc, item) => {
                const totBruto = parseFloat(item.ite_totbruto) || 0;
                const totLiq = parseFloat(item.ite_totliquido) || 0;
                const ipiRate = parseFloat(item.ite_ipi) || 0;
                const stRate = parseFloat(item.ite_st) || 0;
                const valComIpi = totLiq * (1 + ipiRate / 100);
                const valComSt = valComIpi * (1 + stRate / 100);

                return {
                    bruto: acc.bruto + totBruto,
                    liq: acc.liq + totLiq,
                    ipi: acc.ipi + (valComIpi - totLiq),
                    comImpostos: acc.comImpostos + valComSt,
                };
            }, { bruto: 0, liq: 0, ipi: 0, comImpostos: 0 });

            if (
                Math.abs((formData.ped_totbruto || 0) - totals.bruto) > 0.01 ||
                Math.abs((formData.ped_totliq || 0) - totals.liq) > 0.01 ||
                Math.abs((formData.ped_totalipi || 0) - totals.ipi) > 0.01
            ) {
                setFormData(prev => ({
                    ...prev,
                    ped_totbruto: totals.bruto,
                    ped_totliq: totals.liq,
                    ped_totalipi: totals.ipi,
                    ped_totalcomimpostos: totals.comImpostos,
                }));
            }
        } else if ((formData.ped_totbruto || 0) > 0 || (formData.ped_totliq || 0) > 0) {
            setFormData(prev => ({
                ...prev,
                ped_totbruto: 0,
                ped_totliq: 0,
                ped_totalipi: 0,
                ped_totalcomimpostos: 0,
            }));
        }
    }, [summaryItems]);

    // Load next order number
    const loadNextNumber = useCallback(async () => {
        try {
            let initials = 'SM';
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const first = user.nome ? user.nome.charAt(0) : '';
                    const last = user.sobrenome ? user.sobrenome.charAt(0) : '';
                    initials = (first + last).toUpperCase() || 'SM';
                } catch (e) {
                    console.error('Erro ao processar iniciais do usuário:', e);
                }
            }

            const data = await orderService.getNextNumber(initials);
            if (data.success) {
                setDisplayNumber(data.data.formatted_number);
                setFormData(prev => ({
                    ...prev,
                    ped_pedido: data.data.formatted_number,
                    ped_numero: data.data.sequence,
                }));
            }
        } catch (error) {
            console.error('Error loading next number:', error);
            toast.error('Erro ao buscar próximo número');
        }
    }, []);

    // Load summary items from backend
    const loadSummaryItems = useCallback(async (orderId = null) => {
        const idToLoad = orderId || formData.ped_pedido;
        if (!idToLoad || idToLoad === '(Novo)' || isSaving) return;

        try {
            const data = await orderService.getItems(idToLoad);
            if (data.success) {
                setSummaryItems(data.data);
            }
        } catch (error) {
            console.error('Error loading summary items:', error);
        }
    }, [formData.ped_pedido, isSaving]);

    // Handle field change
    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Apply CLI_IND conditions
    const applyCliIndConditions = useCallback((conditions) => {
        if (!conditions) return;
        console.log('🎯 [useOrderForm] Aplicando condições especiais CLI_IND:', conditions);

        setFormData(prev => ({
            ...prev,
            ped_pri: parseFloat(conditions.cli_desc1) || prev.ped_pri,
            ped_seg: parseFloat(conditions.cli_desc2) || prev.ped_seg,
            ped_ter: parseFloat(conditions.cli_desc3) || prev.ped_ter,
            ped_qua: parseFloat(conditions.cli_desc4) || prev.ped_qua,
            ped_qui: parseFloat(conditions.cli_desc5) || prev.ped_qui,
            ped_sex: parseFloat(conditions.cli_desc6) || prev.ped_sex,
            ped_set: parseFloat(conditions.cli_desc7) || prev.ped_set,
            ped_oit: parseFloat(conditions.cli_desc8) || prev.ped_oit,
            ped_nov: parseFloat(conditions.cli_desc9) || prev.ped_nov,
            ped_transp: conditions.cli_transportadora || prev.ped_transp,
            ped_condpag: conditions.cli_prazopg || prev.ped_condpag,
            ped_comprador: conditions.cli_comprador || prev.ped_comprador,
            ped_tipofrete: conditions.cli_frete || prev.ped_tipofrete,
            ped_tabela: conditions.cli_tabela || prev.ped_tabela,
        }));

        // Resolve display names from carrier lookup
        if (conditions.cli_transportadora && auxData.carriers) {
            const carrier = auxData.carriers.find(c =>
                (c.tra_codigo || c.codigo) == conditions.cli_transportadora
            );
            if (carrier) setSelectedTranspName(carrier.tra_nome || carrier.nome);
        }

        if (conditions.cli_vendedor && auxData.sellers) {
            handleFieldChange('ped_vendedor', conditions.cli_vendedor);
            const seller = auxData.sellers.find(s =>
                (s.ven_codigo || s.codigo) == conditions.cli_vendedor
            );
            if (seller) setSelectedSellerName(seller.ven_nome || seller.nome);
        }

        toast.info('✅ Condições especiais aplicadas!', { duration: 2000 });
    }, [auxData.carriers, auxData.sellers, handleFieldChange]);

    // Handle save (header only in Phase 1)
    const handleSave = useCallback(async (options = {}) => {
        const { silent = false } = options;

        // Validate required fields
        const missingFields = [];
        const industryId = formData.ped_industria || selectedIndustry?.for_codigo || selectedIndustry?.code;

        if (!industryId) missingFields.push('Indústria');
        if (!formData.ped_cliente) missingFields.push('Cliente');
        if (!formData.ped_transp) missingFields.push('Transportadora');
        if (!formData.ped_tabela) missingFields.push('Tabela de Preço');
        if (!formData.ped_vendedor) missingFields.push('Vendedor');

        if (missingFields.length > 0) {
            toast.error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
            return null;
        }

        if (!formData.ped_pedido || formData.ped_pedido === '(Novo)') {
            toast.error('Número do pedido ainda não carregado. Aguarde um momento...');
            loadNextNumber();
            return null;
        }

        setIsSaving(true);
        setLoading(true);

        try {
            let initials = 'SM';
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    initials = `${user.nome?.charAt(0) || ''}${user.sobrenome?.charAt(0) || ''}`.toUpperCase() || 'SM';
                } catch (e) { /* ignore */ }
            }

            const dataToSave = {
                ...formData,
                ped_industria: industryId,
                ped_permiterepe: allowDuplicates,
                user_initials: initials,
                _isPersisted: isPersisted,
            };

            const result = await orderService.save(dataToSave);
            const savedPedidoId = result.data?.ped_pedido;

            if (result.success && savedPedidoId) {
                setIsPersisted(true);

                if (!silent) {
                    toast.success(result.message);
                }

                setFormData(prev => ({
                    ...prev,
                    ped_pedido: result.data.ped_pedido,
                    ped_numero: result.data.ped_numero,
                }));
                setDisplayNumber(result.data.ped_pedido);

                return result.data;
            }

            return null;
        } catch (error) {
            console.error('Error saving order:', error);
            toast.error(error.message || 'Erro ao salvar pedido');
            return null;
        } finally {
            setLoading(false);
            setTimeout(() => setIsSaving(false), 100);
        }
    }, [formData, selectedIndustry, allowDuplicates, isPersisted, loadNextNumber]);

    // Fetchers for DbComboBox (exposed for consumers that need search)
    const fetchClients = useCallback(async (search) => {
        const res = await auxDataService.getClients('A', search);
        return (res.data || []).map(c => ({
            label: `${c.cli_nomred || c.cli_nome} - ${maskCnpjCpf(c.cli_cnpj)}`,
            value: c.cli_codigo,
            nomred: c.cli_nomred,
            nome: c.cli_nome,
            cnpj: c.cli_cnpj,
            cidade: c.cli_cidade,
            uf: c.cli_uf,
            cli_vendedor: c.cli_vendedor,
            ...c,
        }));
    }, []);

    const fetchCarriers = useCallback(async (search) => {
        const res = await auxDataService.getCarriers(search);
        return (res.data || []).map(t => ({
            label: t.nome || t.tra_nome,
            value: t.codigo || t.tra_codigo,
            ...t,
        }));
    }, []);

    const fetchSellers = useCallback(async (search) => {
        const res = await auxDataService.getSellers(search);
        return (res.data || []).map(s => ({
            label: s.nome || s.ven_nome,
            value: s.codigo || s.ven_codigo,
            ...s,
        }));
    }, []);

    const fetchPriceTables = useCallback(async (search) => {
        const indCode = selectedIndustry?.for_codigo || selectedIndustry?.code || formData.ped_industria;
        if (!indCode) return [];
        const res = await auxDataService.getPriceTables(indCode, search);
        return (res.data || []).map(t => ({
            label: t.nome_tabela || t.tab_descricao || t.itab_nome,
            value: t.nome_tabela || t.itab_idtabela || t.tab_codigo || t.codigo,
            ...t,
        }));
    }, [selectedIndustry, formData.ped_industria]);

    // Handle client selection (with CLI_IND auto-apply)
    const handleClientSelect = useCallback(async (clientOption) => {
        if (!clientOption) return;

        console.log('👤 [useOrderForm] Cliente selecionado:', clientOption);

        // Use both mapped and original field names for maximum compatibility
        const cnpj = clientOption.cnpj || clientOption.cli_cnpj || '';
        const cidade = clientOption.cidade || clientOption.cli_cidade || '';
        const uf = clientOption.uf || clientOption.cli_uf || '';
        const grupo = clientOption.cli_grupo || clientOption.grupo || '';

        setFormData(prev => ({
            ...prev,
            ped_cliente: clientOption.value,
            cli_cnpj: cnpj,
            cli_cidade: cidade,
            cli_uf: uf,
            cli_grupo: grupo,
        }));

        setSelectedClientName(clientOption.label);

        // Auto-fetch CLI_IND conditions
        const indCode = formData.ped_industria || selectedIndustry?.for_codigo || selectedIndustry?.code;
        if (clientOption.value && indCode) {
            try {
                const conditions = await cliIndData.fetchConditions(clientOption.value, indCode);
                if (conditions) applyCliIndConditions(conditions);
            } catch (e) {
                console.error('Erro ao buscar condições CLI_IND:', e);
            }
        }

        // Auto-assign seller from client record
        if (clientOption.cli_vendedor) {
            handleFieldChange('ped_vendedor', clientOption.cli_vendedor);
            const seller = auxData.sellers?.find(s =>
                (s.ven_codigo || s.codigo) == clientOption.cli_vendedor
            );
            if (seller) setSelectedSellerName(seller.ven_nome || seller.nome);
        }
    }, [handleFieldChange, formData.ped_industria, selectedIndustry, cliIndData, auxData.sellers, applyCliIndConditions]);

    // Handle carrier selection
    const handleCarrierSelect = useCallback((carrierOption) => {
        if (!carrierOption) return;
        handleFieldChange('ped_transp', carrierOption.value);
        setSelectedTranspName(carrierOption.label);
    }, [handleFieldChange]);

    // Handle seller selection
    const handleSellerSelect = useCallback((sellerOption) => {
        if (!sellerOption) return;
        handleFieldChange('ped_vendedor', sellerOption.value);
        setSelectedSellerName(sellerOption.label);
    }, [handleFieldChange]);

    // Handle price table selection
    const handlePriceTableSelect = useCallback((tableOption) => {
        if (!tableOption) return;
        handleFieldChange('ped_tabela', tableOption.value);
    }, [handleFieldChange]);

    return {
        // Core state
        formData,
        setFormData,
        handleFieldChange,
        displayNumber,

        // Items
        summaryItems,
        setSummaryItems,
        loadSummaryItems,

        // Options
        allowDuplicates,
        setAllowDuplicates,

        // Display names
        selectedClientName,
        selectedTranspName,
        selectedSellerName,
        setSelectedClientName,
        setSelectedTranspName,
        setSelectedSellerName,

        // Actions
        handleSave,
        loadNextNumber,

        // Entity selection handlers
        handleClientSelect,
        handleCarrierSelect,
        handleSellerSelect,
        handlePriceTableSelect,

        // Fetchers (for DbComboBox)
        fetchClients,
        fetchCarriers,
        fetchSellers,
        fetchPriceTables,

        // Status
        loading,
        isSaving,
        isPersisted,

        // Sub-hooks (exposed for advanced consumers)
        auxData,
        priceTable,
        cliIndData,
        smartDiscounts,
        applyCliIndConditions,
    };
}
