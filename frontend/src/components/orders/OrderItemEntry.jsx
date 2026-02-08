import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Package, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const OrderItemEntry = ({
    pedPedido,
    selectedIndustry,
    priceTableName,
    priceTableMemtable = [],
    memtableLoading = false,
    headerDiscounts,
    onItemsChange,
    allowDuplicates,
    pedCliente, // Cliente do pedido para buscar histórico
    userParams = { par_qtdenter: 4, par_usadecimais: 'S', par_qtddecimais: 2, par_fmtpesquisa: 'D' },
    importedItems,
    onImportComplete,
    importing = false,
    isActive = false,
    onFinalize = null,
    readOnly = false,
    clientDiscounts = [],
    tableDiscounts = []
}) => {
    const entrySpeed = userParams?.par_qtdenter || 4;
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [discountSource, setDiscountSource] = useState(null); // 'HEADER', 'TABLE', 'CLIENT'
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);
    const [packagingWarning, setPackagingWarning] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null); // { existingItem, newQuant }
    const [rightPanelTab, setRightPanelTab] = useState('tabela'); // 'tabela' ou 'historico'
    const [productHistory, setProductHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [priceChoice, setPriceChoice] = useState(null); // { product, tipo: 'promo'|'especial', precoAlternativo, precoBruto }
    const codeInputRef = React.useRef(null);
    const quantInputRef = React.useRef(null);
    const isImporting = React.useRef(false); // Trava para evitar que loadOrderItems sobrescreva importação em andamento

    // Helper to normalize codes for comparison (remove special chars)
    const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Helper for Select All on Focus
    const handleFocus = (e) => e.target.select();

    const [currentItem, setCurrentItem] = useState({
        ite_produto: '',
        ite_idproduto: null,
        ite_embuch: '',
        ite_nomeprod: '',
        ite_quant: 1,
        ite_puni: 0,
        ite_totbruto: 0,
        ite_puniliq: 0,
        ite_totliquido: 0,
        ite_ipi: 0,
        ite_st: 0,
        ite_des1: 0,
        ite_des2: 0,
        ite_des3: 0,
        ite_des4: 0,
        ite_des5: 0,
        ite_des6: 0,
        ite_des7: 0,
        ite_des8: 0,
        ite_des9: 0,
        ite_des10: 0, // % ADD - Adicional
        ite_valcomipi: 0,
        ite_valcomst: 0,
        ite_mult: 0, // Múltiplo/Embalagem do produto
        ite_promocao: 'N', // 'S' = Usou preço promo, 'N' = Não usou
    });

    // Handle Imported Items from AI
    useEffect(() => {
        if (importedItems && importedItems.length > 0 && products.length > 0) {
            isImporting.current = true;
            let addedCount = 0;
            const newItems = [];

            importedItems.forEach(importItem => {
                // Find product by Fuzzy Code Match
                const product = products.find(p => {
                    const dbCode = normalize(p.pro_codprod);
                    const dbNormRec = normalize(p.pro_codigonormalizado);

                    // Suporta os dois formatos: o da IA (.codigo) e o do OrderForm manual (.ite_produto)
                    const importCode = normalize(importItem.codigo || importItem.ite_produto);

                    if (dbCode === importCode || dbNormRec === importCode) return true;

                    // Comparação numérica (se ambos forem números válidos)
                    const dbNum = parseInt(dbCode, 10);
                    const importNum = parseInt(importCode, 10);
                    if (!isNaN(dbNum) && !isNaN(importNum) && dbNum === importNum) return true;

                    return false;
                });

                if (product) {
                    // Prioridade: Preço da IA (.preco) ou Preço do OrderForm (.ite_puni)
                    const precoManual = parseFloat(importItem.preco || importItem.ite_puni || 0);
                    const precoBruto = parseFloat(product.itab_precobruto || 0);
                    const precoFinal = precoManual > 0 ? precoManual : precoBruto;

                    const quant = parseFloat(importItem.quantidade || importItem.ite_quant) || 1;

                    // Build item structure
                    const rawItem = {
                        ite_produto: product.pro_codprod,
                        ite_idproduto: product.pro_id,
                        ite_embuch: importItem.ite_embuch || '',
                        ite_nomeprod: importItem.descricao || importItem.ite_nomeprod || product.pro_nome,
                        ite_puni: precoFinal,
                        ite_totbruto: precoFinal,
                        ite_ipi: product.itab_ipi || 0,
                        ite_st: product.itab_st || 0,
                        ite_quant: quant,
                        ite_mult: parseFloat(product.pro_mult) || 0,
                        ite_promocao: importItem.ite_promocao || 'N',
                        // Se o preço foi manual, zera descontos de tabela pra não aplicar por cima
                        ite_des1: precoManual > 0 ? 0 : (headerDiscounts?.ped_pri || 0),
                        ite_des2: precoManual > 0 ? 0 : (headerDiscounts?.ped_seg || 0),
                        ite_des3: precoManual > 0 ? 0 : (headerDiscounts?.ped_ter || 0),
                        ite_des4: precoManual > 0 ? 0 : (headerDiscounts?.ped_qua || 0),
                        ite_des5: precoManual > 0 ? 0 : (headerDiscounts?.ped_qui || 0),
                        ite_des6: precoManual > 0 ? 0 : (headerDiscounts?.ped_sex || 0),
                        ite_des7: precoManual > 0 ? 0 : (headerDiscounts?.ped_set || 0),
                        ite_des8: precoManual > 0 ? 0 : (headerDiscounts?.ped_oit || 0),
                        ite_des9: precoManual > 0 ? 0 : (headerDiscounts?.ped_nov || 0),
                        ite_des10: 0,
                        ite_valcomipi: 0,
                        ite_valcomst: 0,
                    };

                    const calculated = calculateLogic(rawItem);

                    newItems.push({
                        ...calculated,
                        tempId: Date.now() + Math.random(),
                        ite_industria: selectedIndustry || null,
                        ite_seq: 0
                    });

                    addedCount++;
                } else {
                    console.warn(`[AI Import] Product not found for code: ${importItem.codigo || importItem.ite_produto}`);
                }
            });

            if (newItems.length > 0) {
                // Filtrar itens que JÁ existem na lista para evitar duplicação ou sobrescrita acidental
                // Se já existir um produto com mesmo código, ignora
                const nonDuplicateNewItems = newItems.filter(newItem =>
                    !orderItems.some(existing => existing.ite_produto === newItem.ite_produto)
                );

                if (nonDuplicateNewItems.length === 0) {
                    console.log('[AI Import] Todos os itens já existem na lista. Passando reto.');
                    isImporting.current = false;
                    if (onImportComplete) onImportComplete();
                    return;
                }

                // 1. Calculate Full List (Existing + New)
                const maxSeq = orderItems.length > 0 ? Math.max(...orderItems.map(i => i.ite_seq || 0)) : 0;

                const itemsToSync = [
                    ...orderItems,
                    ...nonDuplicateNewItems.map((item, idx) => ({ ...item, ite_seq: maxSeq + idx + 1 }))
                ];

                // 2. Update Local State (MemTable)
                setOrderItems(itemsToSync);
                toast.success(`${addedCount} itens carregados para conferência!`);

                // 3. Notify Parent
                if (onItemsChange) onItemsChange(null, itemsToSync);

                // Libera e finaliza a importação local
                isImporting.current = false;
                if (onImportComplete) onImportComplete();
            } else {
                toast.warning('Nenhum produto correspondente encontrado na tabela.');
                isImporting.current = false;
                if (onImportComplete) onImportComplete();
            }
        }
    }, [importedItems, products, pedPedido, headerDiscounts, selectedIndustry]);

    // Helper for calculation (duplicated from calculateItem to avoid hoisting issues or deps)
    const calculateLogic = (item) => {
        const quant = parseFloat(item.ite_quant) || 0;
        const bruto = parseFloat(item.ite_puni) || 0;
        const ipiPerc = parseFloat(item.ite_ipi) || 0;
        const stPerc = parseFloat(item.ite_st) || 0;

        let liquido = bruto;
        for (let i = 1; i <= 9; i++) {
            const desc = parseFloat(item[`ite_des${i}`]) || 0;
            if (desc > 0) {
                liquido = liquido * (1 - desc / 100);
            }
        }

        const totBruto = bruto * quant;
        const totLiq = liquido * quant;
        const valComIpi = totLiq * (1 + ipiPerc / 100);
        const valComSt = valComIpi * (1 + stPerc / 100);

        return {
            ...item,
            ite_puniliq: liquido,
            ite_totliquido: totLiq,
            ite_valcomipi: valComIpi,
            ite_valcomst: valComSt
        };
    };

    // Auto-focus no campo código quando o componente monta ou quando a aba F3 se torna ativa
    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => {
                if (codeInputRef.current) {
                    codeInputRef.current.focus();
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // Entry speed field ENABLE flags (campos ficam visíveis mas desabilitados)
    // 1=Muito Rápido: código, quantidade (auto-salva após selecionar)
    // 2=Rápido: código, complemento, quantidade
    // 3=Lento: código, complemento, descontos, % add, quantidade
    // 4=Muito Lento: todos os campos habilitados
    const enableComplement = entrySpeed >= 2;
    const enableDiscounts = entrySpeed >= 3;
    const enableAddPercent = entrySpeed >= 3;
    const enablePriceFields = entrySpeed >= 4; // Bruto, Líquido, Com Imposto, IPI, ST sempre visíveis
    const autoSaveOnSelect = entrySpeed === 1;

    // Use memtable instead of loading products from backend
    useEffect(() => {
        if (priceTableMemtable && priceTableMemtable.length > 0) {
            setProducts(priceTableMemtable);
            setLoadingProducts(false);
        } else if (memtableLoading) {
            setLoadingProducts(true);
        } else {
            setProducts([]);
            setLoadingProducts(false);
        }
    }, [priceTableMemtable, memtableLoading]);

    // Load order items when pedPedido changes
    useEffect(() => {
        if (pedPedido && pedPedido !== '(Novo)') {
            loadOrderItems();
        }
    }, [pedPedido]);

    // Sync header discounts with currentItem when they change
    useEffect(() => {
        if (headerDiscounts) {
            setCurrentItem(prev => {
                const updated = {
                    ...prev,
                    ite_des1: headerDiscounts.ped_pri || 0,
                    ite_des2: headerDiscounts.ped_seg || 0,
                    ite_des3: headerDiscounts.ped_ter || 0,
                    ite_des4: headerDiscounts.ped_qua || 0,
                    ite_des5: headerDiscounts.ped_qui || 0,
                    ite_des6: headerDiscounts.ped_sex || 0,
                    ite_des7: headerDiscounts.ped_set || 0,
                    ite_des8: headerDiscounts.ped_oit || 0,
                    ite_des9: headerDiscounts.ped_nov || 0,
                };
                // Recalculate if there's a product selected
                return prev.ite_produto ? calculateItem(updated) : updated;
            });
        }
    }, [headerDiscounts]);

    const loadOrderItems = async () => {
        // Trava crítica: Se estivermos importando, NÃO podemos carregar do banco, senão limpamos a memória
        if (isImporting.current || importing || (importedItems && importedItems.length > 0)) {
            console.log('🛡️ [OrderItemEntry] loadOrderItems BLOQUEADO (Importação em curso)...');
            return;
        }

        console.log(`📡 [OrderItemEntry] Carregando itens do banco para o pedido: ${pedPedido}...`);

        try {
            const url = getApiUrl(NODE_API_URL, `/api/orders/${pedPedido}/items`);
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setOrderItems(data.success ? data.data : []);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
        }
    };

    // Função para buscar histórico de compras do produto para o cliente
    const loadProductHistory = async (productCode) => {
        if (!productCode || !pedCliente || !selectedIndustry) {
            setProductHistory([]);
            return;
        }

        setLoadingHistory(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/orders/product-history/${encodeURIComponent(productCode)}/${pedCliente}/${selectedIndustry}`);
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setProductHistory(data.success ? data.data : []);
            }
        } catch (error) {
            console.error('Error loading product history:', error);
            setProductHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handler para trocar de aba no painel direito
    const handleRightPanelTabChange = (tab) => {
        setRightPanelTab(tab);
        // Só busca histórico quando clica na aba e há um produto selecionado
        if (tab === 'historico' && currentItem.ite_produto) {
            loadProductHistory(currentItem.ite_produto);
        }
    };

    const calculateItem = (item) => {
        const quant = parseFloat(item.ite_quant) || 0;
        const bruto = parseFloat(item.ite_puni) || parseFloat(item.ite_totbruto) || 0;
        const ipiPerc = parseFloat(item.ite_ipi) || 0;
        const stPerc = parseFloat(item.ite_st) || 0;

        // Apply discounts sequentially
        let liquido = bruto;
        for (let i = 1; i <= 9; i++) {
            const desc = parseFloat(item[`ite_des${i}`]) || 0;
            if (desc > 0) {
                liquido = liquido * (1 - desc / 100);
            }
        }

        const totBruto = bruto * quant;
        const totLiq = liquido * quant;
        const valComIpi = totLiq * (1 + ipiPerc / 100);
        const valComSt = valComIpi * (1 + stPerc / 100);

        return {
            ...item,
            ite_puni: bruto,
            ite_totbruto: bruto,
            ite_puniliq: liquido,
            ite_totliquido: totLiq,
            ite_valcomipi: valComIpi,
            ite_valcomst: valComSt
        };
    };

    const handleItemChange = (field, value) => {
        setCurrentItem(prev => {
            const newItem = { ...prev, [field]: value };
            return calculateItem(newItem);
        });
    };

    const handleSaveItem = (forceIgnorePackaging = false) => {
        if (readOnly) return;

        let itemToSave = { ...currentItem };

        // 🛡️ CRITICAL FIX: Se o id do produto estiver nulo, tenta buscar pelo código 
        // (fallback para digitação manual sem seleção explícita da lista)
        if (!itemToSave.ite_idproduto && itemToSave.ite_produto) {
            const normalizedTerm = normalize(itemToSave.ite_produto);
            // Busca match exato pelo código ou código normalizado
            const product = products.find(p =>
                normalize(p.pro_codprod) === normalizedTerm ||
                normalize(p.pro_codigonormalizado) === normalizedTerm
            );

            if (product) {
                console.log(`🎯 [AUTO-RESOLVE] Resolvido item ${itemToSave.ite_produto} -> ID ${product.pro_id}`);
                itemToSave.ite_idproduto = product.pro_id;
                itemToSave.ite_nomeprod = product.pro_nome;

                // Se não tem preço ou é o default, pega do produto
                if (!itemToSave.ite_puni || itemToSave.ite_puni === 0) {
                    itemToSave.ite_puni = parseFloat(product.itab_precobruto || 0);
                    itemToSave.ite_totbruto = itemToSave.ite_puni;
                }

                // Garante impostos se vieram da tabela
                itemToSave.ite_ipi = product.itab_ipi || 0;
                itemToSave.ite_st = product.itab_st || 0;
                itemToSave.ite_mult = parseFloat(product.pro_mult) || 0;

                itemToSave = calculateItem(itemToSave);
            } else {
                toast.error('Produto não identificado. Selecione um item válido da lista.');
                if (codeInputRef.current) codeInputRef.current.focus();
                return;
            }
        }

        if (!itemToSave.ite_produto || !itemToSave.ite_idproduto) {
            toast.error('Selecione um produto válido');
            return;
        }

        // Packaging/multiple validation
        const mult = parseFloat(itemToSave.ite_mult) || 0;
        const quant = parseFloat(itemToSave.ite_quant) || 0;

        if (!forceIgnorePackaging && mult > 0 && quant % mult !== 0) {
            setPackagingWarning(true);
            return;
        }

        setPackagingWarning(false);

        // Duplicates check - agora pergunta se quer somar a quantidade
        if (!allowDuplicates) {
            const existingItem = orderItems.find(item =>
                item.ite_produto === itemToSave.ite_produto &&
                item.ite_embuch === itemToSave.ite_embuch &&
                item.ite_seq !== itemToSave.ite_seq && // Non-editing duplicate
                item.tempId !== itemToSave.tempId
            );
            if (existingItem) {
                // Mostrar diálogo perguntando se quer somar a quantidade
                setDuplicateWarning({
                    existingItem,
                    newQuant: parseFloat(itemToSave.ite_quant) || 0
                });
                return;
            }
        }

        setOrderItems(prev => {
            const items = [...prev];
            const existingIndex = items.findIndex(item =>
                (itemToSave.tempId && item.tempId === itemToSave.tempId) ||
                (itemToSave.ite_seq && item.ite_seq === itemToSave.ite_seq)
            );

            if (existingIndex > -1) {
                items[existingIndex] = {
                    ...itemToSave,
                    ite_industria: selectedIndustry || null
                };
                toast.success('Item atualizado (Memória)');
            } else {
                const newItemToAdd = {
                    ...itemToSave,
                    ite_industria: selectedIndustry || null,
                    tempId: Date.now(),
                    ite_seq: items.length > 0 ? Math.max(...items.map(i => i.ite_seq || 0)) + 1 : 1
                };
                items.push(newItemToAdd);
                toast.success('Item adicionado (Memória)');
            }
            if (onItemsChange) onItemsChange(null, items);
            return items;
        });

        resetCurrentItem();
        if (codeInputRef.current) codeInputRef.current.focus();
    };

    // Função para somar quantidade ao item duplicado existente
    const handleAddToDuplicate = () => {
        if (!duplicateWarning) return;

        const { existingItem, newQuant } = duplicateWarning;
        const existingQuant = parseFloat(existingItem.ite_quant) || 0;
        const totalQuant = existingQuant + newQuant;

        setOrderItems(prev => {
            const items = prev.map(item => {
                if (
                    (item.tempId && item.tempId === existingItem.tempId) ||
                    (item.ite_seq && item.ite_seq === existingItem.ite_seq)
                ) {
                    // Recalcular o item com a nova quantidade
                    const updatedItem = { ...item, ite_quant: totalQuant };
                    return calculateItem(updatedItem);
                }
                return item;
            });
            if (onItemsChange) onItemsChange(null, items);
            return items;
        });

        toast.success(`Quantidade ajustada de ${existingQuant} para ${totalQuant}`);
        setDuplicateWarning(null);
        resetCurrentItem();
        if (codeInputRef.current) codeInputRef.current.focus();
    };

    const handleDeleteItem = (itemToDelete) => {
        if (readOnly) return;
        setOrderItems(prev => {
            const items = prev.filter(item =>
                (item.tempId && item.tempId !== itemToDelete.tempId) ||
                (item.ite_seq && item.ite_seq !== itemToDelete.ite_seq)
            );
            if (onItemsChange) onItemsChange(null, items);
            return items;
        });
        toast.info('Item removido da memória');
    };

    const handleFinalizeItems = async () => {
        if (orderItems.length === 0) {
            toast.warning('Adicione pelo menos um item ao pedido');
            return;
        }

        // 🛡️ AUTO-RESOLVE: Tentar resolver IDs ausentes ou zerados antes de sincronizar
        const isInvalidId = (id) => !id || id === 0 || id === '0';

        let itemsToSync = orderItems.map(item => {
            if (isInvalidId(item.ite_idproduto) && item.ite_produto && products.length > 0) {
                const normalizedCode = normalize(item.ite_produto);
                const product = products.find(p =>
                    normalize(p.pro_codprod) === normalizedCode ||
                    normalize(p.pro_codigonormalizado) === normalizedCode
                );
                if (product) {
                    console.log(`🔄 [AUTO-RESOLVE] Resolvido: ${item.ite_produto} -> ID ${product.pro_id}`);
                    return { ...item, ite_idproduto: product.pro_id };
                }
            }
            return item;
        });

        // Verificar se ainda restam itens sem ID válido (apenas log de warning, não bloqueia)
        const stillInvalid = itemsToSync.filter(i => isInvalidId(i.ite_idproduto));
        if (stillInvalid.length > 0) {
            console.warn(`⚠️ [SYNC] ${stillInvalid.length} itens sem ID válido. Códigos:`, stillInvalid.map(i => i.ite_produto));
            // Não bloqueamos - o backend tem fallback para resolver
        }

        setSyncing(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/orders/${pedPedido}/items/sync`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemsToSync)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Itens sincronizados com sucesso!');
                // Atualiza o state local com os IDs resolvidos
                setOrderItems(itemsToSync);
                if (onItemsChange) onItemsChange(data.totals, itemsToSync);
                if (onFinalize) {
                    onFinalize();
                }
            } else {
                toast.error(data.message || 'Erro ao sincronizar itens');
            }
        } catch (error) {
            console.error('Error syncing items:', error);
            toast.error('Erro de conexão ao sincronizar');
        } finally {
            setSyncing(false);
        }
    };

    const resetCurrentItem = () => {
        setCurrentItem({
            ite_produto: '',
            ite_idproduto: null,
            ite_embuch: '',
            ite_nomeprod: '',
            ite_quant: 1,
            ite_puni: 0,
            ite_totbruto: 0,
            ite_puniliq: 0,
            ite_totliquido: 0,
            ite_ipi: 0,
            ite_st: 0,
            ite_des1: 0,
            ite_des2: 0,
            ite_des3: 0,
            ite_des4: 0,
            ite_des5: 0,
            ite_des6: 0,
            ite_des7: 0,
            ite_des8: 0,
            ite_des9: 0,
            ite_des10: 0, // % ADD - Adicional
            ite_valcomipi: 0,
            ite_valcomst: 0,
        });
    };

    // Função para aplicar o produto com o preço escolhido
    const applyProductWithPrice = (product, precoEscolhido, zerarDescontos, isPromo = false) => {
        const mult = parseFloat(product.pro_mult) || 0;
        const initialQuant = mult > 0 ? mult : 1;

        let appliedDiscounts = {};
        let source = 'HEADER';

        if (zerarDescontos || isPromo) {
            for (let i = 1; i <= 9; i++) appliedDiscounts[`ite_des${i}`] = 0;
            source = isPromo ? 'PROMO' : 'ZERO';
        } else {
            // 1. PRIORIDADE MÁXIMA: Cliente por Grupo (cli_descpro)
            // cli_grupo no cli_descpro correlaciona com pro_grupo no cad_prod
            const cliRule = clientDiscounts.find(r => String(r.cli_grupo) === String(product.pro_grupo));

            if (cliRule) {
                console.log(`⭐ [SMART-DISC] Regra especial de CLIENTE encontrada para o grupo ${product.pro_grupo}`);
                for (let i = 1; i <= 9; i++) appliedDiscounts[`ite_des${i}`] = parseFloat(cliRule[`cli_desc${i}`] || 0);
                source = 'CLIENT';
                toast.info(`Regra de grupo do CLIENTE aplicada!`, { icon: '⭐' });
            } else {
                // 2. PRIORIDADE 2: Tabela por Grupo (grupo_desc)
                // itab_grupodesconto na tabela de preço correlaciona com gid no grupo_desc
                const tableRule = tableDiscounts.find(r => String(r.gid) === String(product.itab_grupodesconto));
                if (tableRule) {
                    console.log(`📊 [SMART-DISC] Regra de TABELA encontrada para o grupo de desconto ${product.itab_grupodesconto}`);
                    for (let i = 1; i <= 9; i++) appliedDiscounts[`ite_des${i}`] = parseFloat(tableRule[`gde_desc${i}`] || 0);
                    source = 'TABLE';
                    toast.info(`Regra de grupo da TABELA aplicada!`, { icon: '📊' });
                } else {
                    // 3. FALLBACK: Descontos do Cabeçalho
                    const fieldMap = { 1: 'pri', 2: 'seg', 3: 'ter', 4: 'qua', 5: 'qui', 6: 'sex', 7: 'set', 8: 'oit', 9: 'nov' };
                    for (let i = 1; i <= 9; i++) {
                        appliedDiscounts[`ite_des${i}`] = parseFloat(headerDiscounts?.[`ped_${fieldMap[i]}`] || 0);
                    }
                    source = 'HEADER';
                }
            }
        }

        setDiscountSource(source);

        const newItem = {
            ...currentItem,
            ite_produto: product.pro_codprod,
            ite_idproduto: product.pro_id,
            ite_embuch: '',
            ite_nomeprod: product.pro_nome,
            ite_puni: precoEscolhido,
            ite_totbruto: precoEscolhido,
            ite_ipi: product.itab_ipi || 0,
            ite_st: product.itab_st || 0,
            ite_quant: initialQuant,
            ite_mult: mult,
            ite_promocao: isPromo ? 'S' : 'N',
            ...appliedDiscounts,
            ite_des10: 0,
            ite_esp: 0
        };

        const calculatedItem = calculateItem(newItem);
        setCurrentItem(calculatedItem);

        // Auto-save in "Muito Rápido" mode (entrySpeed = 1)
        if (autoSaveOnSelect) {
            setTimeout(() => {
                handleSaveItemDirect(calculatedItem);
            }, 100);
        } else {
            // Move focus to Quantity field for other modes
            setTimeout(() => {
                if (quantInputRef.current) {
                    quantInputRef.current.focus();
                }
            }, 100);
        }
    };

    const handleSelectProduct = (product) => {
        const precoPeso = parseFloat(product.itab_prepeso || 0);
        const proPeso = parseFloat(product.pro_peso || 0);
        const precoPromo = parseFloat(product.itab_precopromo || 0);
        const precoEspecial = parseFloat(product.itab_precoespecial || 0);
        const precoBruto = parseFloat(product.itab_precobruto || 0);

        // PRIORIDADE 1: Preço por peso/quantidade
        // Se o produto tem peso/quantidade definida (pro_peso > 0) E a tabela tem preço por peso (itab_prepeso > 0)
        // Usa o preço por peso diretamente, ignorando preços bruto/promo/especial
        if (proPeso > 0 && precoPeso > 0) {
            console.log(`🏋️ [PREÇO PESO] Produto ${product.pro_codprod} usa preço por peso: R$ ${precoPeso} (peso: ${proPeso})`);
            applyProductWithPrice(product, precoPeso, true, false); // zerarDescontos = true para preço fixo por peso
            return;
        }

        // PRIORIDADE 2: Se tem preço promocional, pergunta ao usuário
        if (precoPromo > 0) {
            setPriceChoice({
                product,
                tipo: 'promo',
                precoAlternativo: precoPromo,
                precoBruto
            });
            return;
        }

        // PRIORIDADE 3: Se tem preço especial (e diferente do bruto), pergunta ao usuário
        if (precoEspecial > 0 && precoEspecial !== precoBruto) {
            setPriceChoice({
                product,
                tipo: 'especial',
                precoAlternativo: precoEspecial,
                precoBruto
            });
            return;
        }

        // PRIORIDADE 4: Sem preço alternativo, usa bruto normalmente
        applyProductWithPrice(product, precoBruto, false);
    };

    // Handlers para o diálogo de escolha de preço
    const handlePriceChoiceAlternativo = () => {
        if (priceChoice) {
            const zerarDescontos = priceChoice.tipo === 'promo';
            const isPromo = priceChoice.tipo === 'promo';
            applyProductWithPrice(priceChoice.product, priceChoice.precoAlternativo, zerarDescontos, isPromo);
            setPriceChoice(null);
        }
    };

    const handlePriceChoiceBruto = () => {
        if (priceChoice) {
            applyProductWithPrice(priceChoice.product, priceChoice.precoBruto, false);
            setPriceChoice(null);
        }
    };

    // Direct save without relying on currentItem state (used for auto-save)
    const handleSaveItemDirect = (item) => {
        if (!item.ite_produto) return;

        // Packaging validation for auto-save
        const mult = parseFloat(item.ite_mult) || 0;
        const quant = parseFloat(item.ite_quant) || 0;

        if (mult > 0 && quant % mult !== 0) {
            setPackagingWarning(true);
            return;
        }

        setOrderItems(prev => {
            const items = [...prev];
            const newItem = {
                ...item,
                ite_industria: selectedIndustry || null,
                tempId: Date.now(),
                ite_seq: items.length > 0 ? Math.max(...items.map(i => i.ite_seq || 0)) + 1 : 1
            };
            items.push(newItem);
            if (onItemsChange) onItemsChange(null, items);
            return items;
        });

        toast.success('Item adicionado automaticamente');
        resetCurrentItem();
        if (codeInputRef.current) codeInputRef.current.focus();
    };

    // Função para obter produtos filtrados (com limite de performance)
    const MAX_ITEMS_WITHOUT_FILTER = 200;

    const getFilteredProducts = () => {
        const term = (currentItem.ite_produto || '').toLowerCase().trim();
        const searchMode = userParams?.par_fmtpesquisa || 'D'; // C=Apenas Código, D=Código+Descrição

        // Sem filtro: mostra apenas os primeiros 200 itens para performance
        if (!term) {
            return products.slice(0, MAX_ITEMS_WITHOUT_FILTER);
        }

        // Com filtro: filtra todos os produtos
        const normalizedTerm = normalize(term);

        return products.filter(p => {
            const matchesCode = normalize(p.pro_codprod || '').includes(normalizedTerm);
            const matchesNorm = normalize(p.pro_codigonormalizado || '').includes(normalizedTerm);
            const matchesDesc = p.pro_nome?.toLowerCase().includes(term);
            const matchesConv = p.pro_conversao?.toLowerCase().includes(term);

            if (searchMode === 'C') return matchesCode || matchesNorm || matchesConv;
            return matchesCode || matchesNorm || matchesDesc || matchesConv;
        });
    };

    // Verifica se há mais itens ocultos (para mostrar mensagem)
    const hasMoreItems = !currentItem.ite_produto?.trim() && products.length > MAX_ITEMS_WITHOUT_FILTER;

    // Handler de teclado para navegação com setas e Enter
    const handleCodeKeyDown = (e) => {
        const filtered = getFilteredProducts();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedProductIndex(prev =>
                prev < filtered.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedProductIndex(prev =>
                prev > 0 ? prev - 1 : 0
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length > 0 && filtered[selectedProductIndex]) {
                handleSelectProduct(filtered[selectedProductIndex]);
                setSelectedProductIndex(0);
            }
        }
    };

    // Reset índice quando o texto de busca muda
    useEffect(() => {
        setSelectedProductIndex(0);
    }, [currentItem.ite_produto]);

    // --- ESTILOS INDUSTRIAIS REFINADOS (FRONTEND SPECIALIST) ---
    const inputClasses = "h-10 text-sm border-slate-300 focus:border-emerald-600 bg-white placeholder:text-slate-400 font-bold text-slate-800 transition-none focus:ring-0 focus:outline-none rounded-sm border-[1px] shadow-sm active:bg-slate-50";
    const readonlyClasses = "h-10 text-sm border-slate-200 bg-slate-100 text-slate-600 font-bold border-[1px] cursor-default select-none rounded-sm";
    const labelClasses = "text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-1 block px-0.5";

    return (
        <div className="flex flex-col h-full bg-slate-100/40 overflow-hidden">

            {/* Main Content: 2 Columns Layout (Optimized for Workflow) */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">

                {/* Column 1: Entry Form & Current Items List (Stacked) */}
                <div className="flex-[5.5] flex flex-col gap-4 min-w-[500px]">

                    {/* Item Entry Card */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex flex-col gap-4">

                        {/* Row 1: Identification */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <Label className={labelClasses}>Código</Label>
                                <Input
                                    ref={codeInputRef}
                                    value={currentItem.ite_produto}
                                    onChange={(e) => handleItemChange('ite_produto', e.target.value)}
                                    onKeyDown={handleCodeKeyDown}
                                    onFocus={handleFocus}
                                    disabled={readOnly}
                                    className={cn(inputClasses, "border-emerald-600 text-base uppercase focus:bg-emerald-50/30")}
                                    placeholder="CÓDIGO..."
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className={labelClasses}>Compl.</Label>
                                <Input
                                    value={currentItem.ite_embuch}
                                    onChange={(e) => handleItemChange('ite_embuch', e.target.value)}
                                    onFocus={handleFocus}
                                    disabled={!enableComplement || readOnly}
                                    className={cn(inputClasses, !enableComplement && "bg-slate-50 text-slate-300 border-slate-100")}
                                />
                            </div>
                            <div className="col-span-7">
                                <Label className={labelClasses}>Descrição do Produto</Label>
                                <Input
                                    value={currentItem.ite_nomeprod}
                                    readOnly
                                    className={cn(readonlyClasses, "truncate text-slate-900 border-slate-100")}
                                />
                            </div>
                        </div>

                        {/* Row 2: Sequential Discount Grid */}
                        <div className={cn(
                            "p-2 rounded-sm border transition-all duration-300",
                            discountSource === 'CLIENT' ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20" :
                                discountSource === 'TABLE' ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20" :
                                    "bg-slate-50/50 border-slate-100"
                        )}>
                            <div className="flex items-center justify-between mb-2 px-1">
                                <div className="flex items-center gap-2">
                                    <span className={labelClasses}>Grade de Descontos Seqüenciais</span>
                                    {discountSource === 'CLIENT' && (
                                        <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">
                                            <Star className="h-2 w-2 fill-white" /> Regra Master
                                        </div>
                                    )}
                                    {discountSource === 'TABLE' && (
                                        <div className="flex items-center gap-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                            <Package className="h-2 w-2" /> Regra Tabela
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">D1 → D9</span>
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <div key={num} className="flex-1">
                                        <Input
                                            value={parseFloat(currentItem[`ite_des${num}`] || 0).toFixed(2)}
                                            onChange={(e) => handleItemChange(`ite_des${num}`, e.target.value)}
                                            onFocus={handleFocus}
                                            disabled={!enableDiscounts || readOnly}
                                            className={cn(
                                                "h-8 text-[11px] text-center p-0 rounded-sm border-slate-200 bg-white font-bold focus:border-emerald-600",
                                                !enableDiscounts && "bg-slate-50 text-slate-300 border-slate-100 opacity-60"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Add%, Qty, Bruto */}
                        <div className="flex gap-3">
                            <div className="w-24">
                                <Label className={labelClasses}>% Add</Label>
                                <Input
                                    type="number" step="0.01"
                                    value={parseFloat(currentItem.ite_des10 || 0).toFixed(2)}
                                    onChange={(e) => handleItemChange('ite_des10', e.target.value)}
                                    onFocus={handleFocus}
                                    disabled={!enableAddPercent || readOnly}
                                    className={cn(inputClasses, "text-center text-emerald-700 font-black", !enableAddPercent && "bg-slate-50 text-slate-300")}
                                />
                            </div>
                            <div className="w-28">
                                <Label className={cn(labelClasses, "text-emerald-700")}>Quantidade</Label>
                                <Input
                                    ref={quantInputRef}
                                    disabled={readOnly}
                                    type="number"
                                    step={userParams?.par_usadecimais === 'S' ? (1 / Math.pow(10, userParams?.par_qtddecimais || 2)).toString() : "1"}
                                    value={currentItem.ite_quant}
                                    onChange={(e) => handleItemChange('ite_quant', e.target.value)}
                                    onFocus={handleFocus}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveItem(); } }}
                                    className={cn(inputClasses, "text-center font-black text-lg h-10 border-emerald-600 bg-emerald-50/10")}
                                />
                            </div>
                            <div className="flex-1">
                                <Label className={labelClasses}>Preço Bruto</Label>
                                <Input
                                    value={parseFloat(currentItem.ite_totbruto).toFixed(2)}
                                    readOnly
                                    className={cn(readonlyClasses, "text-right px-4")}
                                />
                            </div>
                        </div>

                        {/* Row 4: Calculations (Unit Liq, IPI, ST) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className={labelClasses}>Líquido Unit.</Label>
                                <Input
                                    value={parseFloat(currentItem.ite_puniliq).toFixed(userParams?.par_qtddecimais || 2)}
                                    readOnly
                                    className={cn(readonlyClasses, "text-right text-emerald-800 bg-emerald-50/30 border-emerald-100")}
                                />
                            </div>
                            <div>
                                <Label className={labelClasses}>IPI (%)</Label>
                                <Input
                                    value={parseFloat(currentItem.ite_ipi || 0).toFixed(2)}
                                    readOnly
                                    className={cn(readonlyClasses, "text-center text-rose-700 bg-rose-50/30 border-rose-100")}
                                />
                            </div>
                            <div>
                                <Label className={labelClasses}>ST (%)</Label>
                                <Input
                                    value={parseFloat(currentItem.ite_st || 0).toFixed(2)}
                                    readOnly
                                    className={cn(readonlyClasses, "text-center text-orange-700 bg-orange-50/30 border-orange-100")}
                                />
                            </div>
                        </div>

                        {/* Warnings & Active Row Indicators */}
                        <div className="flex flex-col gap-2">
                            {packagingWarning && (
                                <div className="bg-rose-600 text-white p-2 rounded-sm text-[11px] font-bold flex items-center justify-between border-b-2 border-rose-800">
                                    <span className="uppercase flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Múltiplo Inválido: {currentItem.ite_mult}</span>
                                    <Button onClick={() => handleSaveItem(true)} className="h-6 bg-white text-rose-600 hover:bg-slate-100 text-[10px] uppercase font-black px-2">Forçar Salvar</Button>
                                </div>
                            )}
                            {duplicateWarning && (
                                <div className="bg-amber-500 text-white p-2 rounded-sm text-[11px] font-bold flex items-center justify-between border-b-2 border-amber-700">
                                    <span className="uppercase">Produto já no pedido. Deseja somar qte?</span>
                                    <div className="flex gap-1">
                                        <Button onClick={() => setDuplicateWarning(null)} className="h-6 bg-white text-slate-600 text-[10px]">CANC</Button>
                                        <Button onClick={handleAddToDuplicate} className="h-6 bg-white text-amber-600 text-[10px] font-black">SOMAR</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons: High Contrast Light Style */}
                        {!readOnly && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button
                                    onClick={handleSaveItem}
                                    disabled={!currentItem.ite_produto}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 h-12 font-black shadow-sm rounded-sm uppercase tracking-wider border-2 border-emerald-200 active:bg-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="h-5 w-5 stroke-[3]" /> SALVAR (ENTER)
                                </Button>
                                <Button
                                    onClick={handleFinalizeItems}
                                    disabled={syncing || orderItems.length === 0}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 h-12 font-black shadow-sm rounded-sm uppercase tracking-wider border-2 border-slate-300 active:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {syncing ? <RefreshCw className="h-5 w-5 animate-spin text-slate-400" /> : <Check className="h-5 w-5 stroke-[3]" />}
                                    FINALIZAR ITENS
                                </Button>
                            </div>
                        )}

                        {/* Current Item Totals summary */}
                        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Total Bruto</span>
                                <span className="text-base font-black text-slate-700">
                                    R$ {((currentItem.ite_totbruto || 0) * (currentItem.ite_quant || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col border-x border-slate-100 px-3">
                                <span className="text-[9px] font-black text-emerald-600 uppercase">Total Líquido</span>
                                <span className="text-base font-black text-emerald-700">
                                    R$ {(currentItem.ite_totliquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-teal-600 uppercase">Liq c/ Imposto</span>
                                <span className="text-base font-black text-teal-800">
                                    R$ {(currentItem.ite_valcomst || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Digitized Items Grid (Now below entry form) */}
                    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Itens Digitalizados no Pedido</h3>
                            <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{orderItems.length} ITENS</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-[11px] border-collapse">
                                <thead className="bg-[#f1f5f9] text-slate-500 sticky top-0 uppercase text-[9px] font-black border-b border-slate-200 z-10 shadow-sm">
                                    <tr className="h-8">
                                        <th className="px-2 text-center w-8">#</th>
                                        <th className="px-2 text-left">Código</th>
                                        <th className="px-2 text-right">Qte</th>
                                        <th className="px-2 text-right">Liq.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orderItems.slice().sort((a, b) => (b.ite_seq || 0) - (a.ite_seq || 0)).map((item, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => setCurrentItem(item)}
                                            className="hover:bg-emerald-50 border-b border-slate-100 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-2 py-2 text-center font-bold text-slate-400">{String(item.ite_seq || (orderItems.length - idx)).padStart(3, '0')}</td>
                                            <td className="px-2 py-2 font-black text-blue-700 uppercase">{item.ite_produto}</td>
                                            <td className="px-2 py-2 text-right font-black text-slate-900">{parseFloat(item.ite_quant).toFixed(0)}</td>
                                            <td className="px-2 py-2 text-right font-black text-emerald-700">R$ {parseFloat(item.ite_totliquido).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr><td colSpan="4" className="py-12 text-center text-slate-300 italic opacity-50"><Package className="h-6 w-6 mx-auto mb-1" />Vazio</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Column 2: Catalog & History (Breathing Room - Wider) */}
                <div className="flex-[6.5] flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                    {/* Header with Search feedback */}
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-white">
                        <h3 className="text-[10px] font-black uppercase tracking-widest">
                            {rightPanelTab === 'tabela' ? 'Catálogo da Indústria' : 'Histórico de Compras'}
                        </h3>
                        {rightPanelTab === 'tabela' && (
                            <span className="text-[9px] font-bold text-slate-400">Filtro: {currentItem.ite_produto || 'S/ Filtro'}</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/30">
                        {rightPanelTab === 'tabela' ? (
                            <table className="w-full text-[12px] border-separate border-spacing-0">
                                <thead className="bg-[#f8fafc] text-slate-500 sticky top-0 uppercase font-black text-[9px] border-b-2 border-slate-200 shadow-sm z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left border-b border-slate-200">Código</th>
                                        <th className="px-3 py-2 text-left border-b border-slate-200">Descrição</th>
                                        <th className="px-3 py-2 text-right border-b border-slate-200">Bruto</th>
                                        <th className="px-3 py-2 text-right border-b border-slate-200 text-orange-600">Promo</th>
                                        <th className="px-1 py-2 text-center border-b border-slate-200">M.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingProducts ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-emerald-500 font-bold italic">Processando catálogo...</td></tr>
                                    ) : (
                                        getFilteredProducts().map((product, idx) => (
                                            <tr
                                                key={idx}
                                                onClick={() => { handleSelectProduct(product); setSelectedProductIndex(0); }}
                                                className={cn(
                                                    "cursor-pointer h-10 transition-none",
                                                    idx === selectedProductIndex
                                                        ? "bg-blue-600 text-white shadow-inner font-black"
                                                        : "hover:bg-emerald-100/40 text-slate-700 bg-white border-b border-slate-50"
                                                )}
                                            >
                                                <td className={cn("px-3 font-black", idx === selectedProductIndex ? "text-white" : "text-blue-700")}>{product.pro_codprod}</td>
                                                <td className="px-3 font-bold truncate max-w-[200px]">{product.pro_nome}</td>
                                                <td className="px-3 text-right font-black">R$ {parseFloat(product.itab_precobruto || 0).toFixed(2)}</td>
                                                <td className={cn("px-3 text-right font-black", idx === selectedProductIndex ? "text-white" : "text-orange-600")}>
                                                    {parseFloat(product.itab_precopromo || 0) > 0 ? `R$ ${parseFloat(product.itab_precopromo).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-1 text-center text-[9px] font-bold text-slate-400">{product.pro_mult || ''}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            /* History Tab */
                            <div className="flex flex-col h-full">
                                {loadingHistory ? (
                                    <div className="m-auto text-emerald-500 animate-pulse font-black uppercase text-xs">Aguarde...</div>
                                ) : productHistory.length > 0 ? (
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-amber-50 text-amber-800 sticky top-0 uppercase font-black text-[9px] border-b border-amber-200">
                                            <tr className="h-8">
                                                <th className="px-3 text-left">Data</th>
                                                <th className="px-3 text-center">Pedido</th>
                                                <th className="px-3 text-right">Liq.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-100">
                                            {productHistory.map((h, i) => (
                                                <tr key={i} className="h-9 hover:bg-amber-50/50">
                                                    <td className="px-3 font-bold text-slate-600">{new Date(h.ped_data).toLocaleDateString()}</td>
                                                    <td className="px-3 text-center font-mono text-amber-700 font-black">{h.ped_pedido}</td>
                                                    <td className="px-3 text-right font-black text-emerald-700">R$ {h.ite_puniliq.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="m-auto text-slate-300 italic flex flex-col items-center">
                                        <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                                        <span>Sem histórico disponível</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Nav Tabs */}
                    <div className="flex bg-slate-50 border-t border-slate-200 p-1 gap-1">
                        <button
                            onClick={() => handleRightPanelTabChange('tabela')}
                            className={cn(
                                "flex-1 py-1.5 rounded-sm text-[10px] font-black uppercase transition-all",
                                rightPanelTab === 'tabela' ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200"
                            )}
                        >
                            CATÁLOGO
                        </button>
                        <button
                            onClick={() => handleRightPanelTabChange('historico')}
                            className={cn(
                                "flex-1 py-1.5 rounded-sm text-[10px] font-black uppercase transition-all",
                                rightPanelTab === 'historico' ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200"
                            )}
                        >
                            HISTÓRICO
                        </button>
                    </div>
                </div>

            </div>

            {/* Price Choices Modal Overlay (Floating) */}
            {priceChoice && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-[50]">
                    <div className={cn(
                        "bg-white border-b-4 rounded-sm p-5 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200",
                        priceChoice.tipo === 'promo' ? "border-orange-500" : "border-blue-500"
                    )}>
                        <h4 className="font-black text-lg uppercase text-slate-800 mb-1 flex items-center gap-2">
                            {priceChoice.tipo === 'promo' ? <Package className="text-orange-500" /> : <Package className="text-blue-500" />}
                            {priceChoice.tipo === 'promo' ? 'PREÇO PROMOCIONAL' : 'PREÇO ESPECIAL'}
                        </h4>
                        <p className="text-xs text-slate-500 font-bold mb-4 uppercase">{priceChoice.product?.pro_nome}</p>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <Button onClick={handlePriceChoiceBruto} variant="outline" className="h-16 flex flex-col border-2 rounded-sm">
                                <span className="text-[10px] uppercase text-slate-400 font-bold">BRUTO (C/ DESC.)</span>
                                <span className="text-xl font-black">R$ {priceChoice.precoBruto.toFixed(2)}</span>
                            </Button>
                            <Button onClick={handlePriceChoiceAlternativo} className={cn("h-16 flex flex-col rounded-sm", priceChoice.tipo === 'promo' ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700")}>
                                <span className="text-[10px] uppercase opacity-70 font-bold">{priceChoice.tipo === 'promo' ? 'VLR PROMO (LÍQ)' : 'VLR ESPECIAL'}</span>
                                <span className="text-xl font-black">R$ {priceChoice.precoAlternativo.toFixed(2)}</span>
                            </Button>
                        </div>
                        <Button variant="ghost" className="w-full text-slate-400 font-bold hover:text-slate-600" onClick={() => setPriceChoice(null)}>FECHAR</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderItemEntry;
