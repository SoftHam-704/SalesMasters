import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Package, AlertTriangle } from 'lucide-react';
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
    onImportComplete
}) => {
    const entrySpeed = userParams?.par_qtdenter || 4;
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
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
    // DISABLED: AI Import logic is now handled exclusively by OrderForm/F5 grid.
    // This effect was consuming items and clearing them, causing them to disappear.
    /*
    useEffect(() => {
    if (importedItems && importedItems.length > 0 && products.length > 0) {
        let addedCount = 0;
        const newItems = [];

        importedItems.forEach(importItem => {
            // Find product by Code
            // The backend returns 'codigo' which matches pro_codprod
            const product = products.find(p => String(p.pro_codprod) === String(importItem.codigo));

            if (product) {
                const precoBruto = parseFloat(product.itab_precobruto || 0);
                const quant = parseFloat(importItem.quantidade) || 1;

                // Build item structure
                const rawItem = {
                    ite_produto: product.pro_codprod,
                    ite_idproduto: product.pro_id,
                    ite_embuch: '',
                    ite_nomeprod: product.pro_nome,
                    ite_puni: precoBruto,
                    ite_totbruto: precoBruto,
                    ite_ipi: product.itab_ipi || 0,
                    ite_st: product.itab_st || 0,
                    ite_quant: quant,
                    ite_mult: parseFloat(product.pro_mult) || 0,
                    ite_promocao: 'N',
                    // Apply header discounts
                    ite_des1: headerDiscounts?.ped_pri || 0,
                    ite_des2: headerDiscounts?.ped_seg || 0,
                    ite_des3: headerDiscounts?.ped_ter || 0,
                    ite_des4: headerDiscounts?.ped_qua || 0,
                    ite_des5: headerDiscounts?.ped_qui || 0,
                    ite_des6: headerDiscounts?.ped_sex || 0,
                    ite_des7: headerDiscounts?.ped_set || 0,
                    ite_des8: headerDiscounts?.ped_oit || 0,
                    ite_des9: headerDiscounts?.ped_nov || 0,

                    // Default fields
                    ite_des10: 0,
                    ite_valcomipi: 0,
                    ite_valcomst: 0,
                };

                // Calculate totals
                // We need to use valid calculation logic. 
                // To avoid duplicating 'calculateItem' logic (which depends on scope), 
                // we can't easily call it here if it uses closure scope (which it doesn't currently seems to).
                // Actually calculateItem IS defined in scope below. We can't use it here easily if it is defined later.
                // But we can move calculateItem or copy logic.
                // Since calculateItem is simple pure function of 'item', we can inline logic or move it up.
                // For now, simpler to inline basic calculation or define calculation outside.

                const calculated = calculateLogic(rawItem);

                newItems.push({
                    ...calculated,
                    tempId: Date.now() + Math.random(),
                    ite_industria: selectedIndustry || null,
                    ite_seq: 0 // Will be assigned later or handled by backend/list
                });

                addedCount++;
            }
        });

        if (newItems.length > 0) {
            setOrderItems(prev => {
                // Update sequences
                const maxSeq = prev.length > 0 ? Math.max(...prev.map(i => i.ite_seq || 0)) : 0;
                return [...prev, ...newItems.map((item, idx) => ({ ...item, ite_seq: maxSeq + idx + 1 }))];
            });
            toast.success(`${addedCount} itens importados via IA!`);
        }

        if (onImportComplete) onImportComplete();
    */
    // }
    // }, [importedItems, products]);

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

    // Auto-focus no campo código quando o componente monta (F3 é aberto)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (codeInputRef.current) {
                codeInputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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
        if (!currentItem.ite_produto) {
            toast.error('Selecione um produto');
            return;
        }

        // Packaging/multiple validation
        const mult = parseFloat(currentItem.ite_mult) || 0;
        const quant = parseFloat(currentItem.ite_quant) || 0;

        if (!forceIgnorePackaging && mult > 0 && quant % mult !== 0) {
            setPackagingWarning(true);
            return;
        }

        setPackagingWarning(false);

        // Duplicates check - agora pergunta se quer somar a quantidade
        if (!allowDuplicates) {
            const existingItem = orderItems.find(item =>
                item.ite_produto === currentItem.ite_produto &&
                item.ite_embuch === currentItem.ite_embuch &&
                item.ite_seq !== currentItem.ite_seq && // Non-editing duplicate
                item.tempId !== currentItem.tempId
            );
            if (existingItem) {
                // Mostrar diálogo perguntando se quer somar a quantidade
                setDuplicateWarning({
                    existingItem,
                    newQuant: parseFloat(currentItem.ite_quant) || 0
                });
                return;
            }
        }

        setOrderItems(prev => {
            const items = [...prev];
            const existingIndex = items.findIndex(item =>
                (currentItem.tempId && item.tempId === currentItem.tempId) ||
                (currentItem.ite_seq && item.ite_seq === currentItem.ite_seq)
            );

            if (existingIndex > -1) {
                items[existingIndex] = {
                    ...currentItem,
                    ite_industria: selectedIndustry || null
                };
                toast.success('Item atualizado (Memória)');
            } else {
                const newItem = {
                    ...currentItem,
                    ite_industria: selectedIndustry || null,
                    tempId: Date.now(),
                    ite_seq: items.length > 0 ? Math.max(...items.map(i => i.ite_seq || 0)) + 1 : 1
                };
                items.push(newItem);
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

        setSyncing(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/orders/${pedPedido}/items/sync`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderItems)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Itens sincronizados com sucesso!');
                if (onItemsChange) onItemsChange(data.totals, orderItems);
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
            ite_promocao: isPromo ? 'S' : 'N', // Marca se usou preço promocional
            // Se zerarDescontos, não aplica descontos do cabeçalho
            ite_des1: zerarDescontos ? 0 : (headerDiscounts?.ped_pri || 0),
            ite_des2: zerarDescontos ? 0 : (headerDiscounts?.ped_seg || 0),
            ite_des3: zerarDescontos ? 0 : (headerDiscounts?.ped_ter || 0),
            ite_des4: zerarDescontos ? 0 : (headerDiscounts?.ped_qua || 0),
            ite_des5: zerarDescontos ? 0 : (headerDiscounts?.ped_qui || 0),
            ite_des6: zerarDescontos ? 0 : (headerDiscounts?.ped_sex || 0),
            ite_des7: zerarDescontos ? 0 : (headerDiscounts?.ped_set || 0),
            ite_des8: zerarDescontos ? 0 : (headerDiscounts?.ped_oit || 0),
            ite_des9: zerarDescontos ? 0 : (headerDiscounts?.ped_nov || 0),
        };

        const calculatedItem = calculateItem(newItem);
        setCurrentItem(calculatedItem);

        // Auto-save in "Muito Rápido" mode (entrySpeed = 1)
        if (autoSaveOnSelect) {
            setTimeout(() => {
                handleSaveItemDirect(calculatedItem);
            }, 100);
        }
    };

    const handleSelectProduct = (product) => {
        const precoPromo = parseFloat(product.itab_precopromo || 0);
        const precoEspecial = parseFloat(product.itab_precoespecial || 0);
        const precoBruto = parseFloat(product.itab_precobruto || 0);

        // Se tem preço promocional, pergunta ao usuário
        if (precoPromo > 0) {
            setPriceChoice({
                product,
                tipo: 'promo',
                precoAlternativo: precoPromo,
                precoBruto
            });
            return;
        }

        // Se tem preço especial (e diferente do bruto), pergunta ao usuário
        if (precoEspecial > 0 && precoEspecial !== precoBruto) {
            setPriceChoice({
                product,
                tipo: 'especial',
                precoAlternativo: precoEspecial,
                precoBruto
            });
            return;
        }

        // Sem preço alternativo, usa bruto normalmente
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
        return products.filter(p => {
            const matchesCode = p.pro_codprod?.toLowerCase().includes(term);
            const matchesDesc = p.pro_nome?.toLowerCase().includes(term);

            if (searchMode === 'C') return matchesCode;
            return matchesCode || matchesDesc;
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

    const inputClasses = "h-7 text-xs border-emerald-300 focus:border-emerald-600 bg-white placeholder:text-emerald-400 shadow-sm border-2";
    const labelClasses = "text-[11px] text-teal-800 font-bold uppercase tracking-wide mb-0.5 block";

    return (
        <div className="flex h-full gap-4 p-4 overflow-hidden bg-slate-50/50">
            {/* Left Column: Entry and List (6/12) */}
            <div className="flex-[6] flex flex-col gap-4 overflow-hidden">

                {/* Item Entry Card */}
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="w-32">
                            <Label className={labelClasses}>Código</Label>
                            <Input
                                ref={codeInputRef}
                                value={currentItem.ite_produto}
                                onChange={(e) => handleItemChange('ite_produto', e.target.value)}
                                onKeyDown={handleCodeKeyDown}
                                className={cn(inputClasses, "bg-amber-50 border-amber-200 font-bold text-black")}
                                placeholder="Digite código..."
                            />
                        </div>
                        <div className="w-32">
                            <Label className={labelClasses}>Compl.</Label>
                            <Input
                                value={currentItem.ite_embuch}
                                onChange={(e) => handleItemChange('ite_embuch', e.target.value)}
                                disabled={!enableComplement}
                                className={cn(inputClasses, !enableComplement && "bg-slate-100 text-slate-400")}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className={labelClasses}>Descrição</Label>
                            <Input
                                value={currentItem.ite_nomeprod}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 border-slate-200 truncate")}
                            />
                        </div>
                    </div>

                    {/* Discount Levels Grid */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <div key={num} className="flex-1 min-w-[50px]">
                                <Label className="text-[9px] text-teal-600/70 font-bold uppercase text-center mb-0.5 block">{num}º</Label>
                                <Input
                                    value={parseFloat(currentItem[`ite_des${num}`] || 0).toFixed(2)}
                                    onChange={(e) => handleItemChange(`ite_des${num}`, e.target.value)}
                                    disabled={!enableDiscounts}
                                    className={cn("h-6 text-[10px] text-center p-0 rounded-md border-emerald-100 focus:border-emerald-400 bg-emerald-50/20 text-emerald-700 font-medium", !enableDiscounts && "bg-slate-100 text-slate-400")}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Technical and Calculations Grid */}
                    <div className="flex gap-2 items-end flex-wrap">
                        <div className="w-16">
                            <Label className={labelClasses}>% Add</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={parseFloat(currentItem.ite_des10 || 0).toFixed(2)}
                                onChange={(e) => handleItemChange('ite_des10', e.target.value)}
                                disabled={!enableAddPercent}
                                className={cn(inputClasses, "bg-emerald-50 text-center font-bold text-teal-700 border-emerald-300", !enableAddPercent && "bg-slate-100 text-slate-400")}
                            />
                        </div>
                        <div className="w-16">
                            <Label className={labelClasses}>Quant.</Label>
                            <Input
                                type="number"
                                step={userParams?.par_usadecimais === 'S' ? (1 / Math.pow(10, userParams?.par_qtddecimais || 2)).toString() : "1"}
                                value={currentItem.ite_quant}
                                onChange={(e) => handleItemChange('ite_quant', e.target.value)}
                                className={cn(inputClasses, "text-center font-bold")}
                            />
                        </div>
                        <div className="w-20">
                            <Label className={labelClasses}>Bruto</Label>
                            <Input
                                value={parseFloat(currentItem.ite_totbruto).toFixed(2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right")}
                            />
                        </div>
                        <div className="w-20">
                            <Label className={labelClasses}>Líquido</Label>
                            <Input
                                value={parseFloat(currentItem.ite_puniliq).toFixed(userParams?.par_qtddecimais || 2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right font-bold text-emerald-600")}
                            />
                        </div>
                        <div className="w-20">
                            <Label className={labelClasses}>Final</Label>
                            <Input
                                value={parseFloat(currentItem.ite_valcomst / (currentItem.ite_quant || 1)).toFixed(2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right")}
                            />
                        </div>
                        <div>
                            <Label className={labelClasses}>IPI</Label>
                            <div className="relative w-20">
                                <Input
                                    value={parseFloat(currentItem.ite_ipi || 0).toFixed(2)}
                                    readOnly
                                    className={cn(inputClasses, "pr-5 text-center text-red-500 font-bold border-red-100 bg-red-50/30")}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-red-400 font-bold">%</span>
                            </div>
                        </div>
                        <div>
                            <Label className={labelClasses}>ST</Label>
                            <div className="relative w-20">
                                <Input
                                    value={parseFloat(currentItem.ite_st || 0).toFixed(2)}
                                    readOnly
                                    className={cn(inputClasses, "pr-5 text-center text-orange-500 font-bold border-orange-100 bg-orange-50/30")}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-orange-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Boxes */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100 flex flex-col items-center">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase whitespace-nowrap">Total Bruto</span>
                            <span className="text-sm font-bold text-emerald-700">R$ {((currentItem.ite_totbruto || 0) * (currentItem.ite_quant || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-teal-50/50 rounded-lg p-2 border border-teal-100 flex flex-col items-center">
                            <span className="text-[9px] font-bold text-teal-600 uppercase whitespace-nowrap">Total Líquido</span>
                            <span className="text-sm font-bold text-teal-700">R$ {(currentItem.ite_totliquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-cyan-50/50 rounded-lg p-2 border border-cyan-100 flex flex-col items-center">
                            <span className="text-[9px] font-bold text-cyan-600 uppercase whitespace-nowrap">Total c/ Imposto</span>
                            <span className="text-sm font-bold text-cyan-700">R$ {(currentItem.ite_valcomst || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Packaging Warning */}
                    {packagingWarning && (
                        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-red-700 uppercase">ATENÇÃO: Quantidade fora da embalagem!</h4>
                                    <p className="text-sm text-red-600">
                                        Este produto é vendido em múltiplos de <span className="font-bold">{currentItem.ite_mult}</span> unidades.
                                        A quantidade <span className="font-bold">{currentItem.ite_quant}</span> não é um múltiplo válido.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-3 justify-end">
                                <Button
                                    onClick={() => setPackagingWarning(false)}
                                    className="bg-slate-200 text-slate-700 hover:bg-slate-300 h-8 px-4 font-bold"
                                >
                                    <X className="h-4 w-4 mr-1" /> Cancelar
                                </Button>
                                <Button
                                    onClick={() => handleSaveItem(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 font-bold"
                                >
                                    <AlertTriangle className="h-4 w-4 mr-1" /> Salvar Mesmo Assim
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Duplicate Warning - Perguntar se quer somar a quantidade */}
                    {duplicateWarning && (
                        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-amber-700 uppercase">Produto já existe no pedido!</h4>
                                    <p className="text-sm text-amber-700">
                                        O produto <span className="font-bold">{duplicateWarning.existingItem.ite_produto}</span> já foi digitado com quantidade{' '}
                                        <span className="font-bold">{duplicateWarning.existingItem.ite_quant}</span>.
                                    </p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Deseja somar <span className="font-bold">+{duplicateWarning.newQuant}</span> ao item existente?{' '}
                                        <span className="font-bold text-amber-800">
                                            (Total: {parseFloat(duplicateWarning.existingItem.ite_quant) + duplicateWarning.newQuant})
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-3 justify-end">
                                <Button
                                    onClick={() => {
                                        setDuplicateWarning(null);
                                        resetCurrentItem();
                                        if (codeInputRef.current) codeInputRef.current.focus();
                                    }}
                                    className="bg-slate-200 text-slate-700 hover:bg-slate-300 h-8 px-4 font-bold"
                                >
                                    <X className="h-4 w-4 mr-1" /> Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddToDuplicate}
                                    className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 font-bold"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Somar Quantidade
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Price Choice Dialog - Perguntar sobre preço promo/especial */}
                    {priceChoice && (
                        <div className={cn(
                            "border-2 rounded-lg p-4 animate-pulse",
                            priceChoice.tipo === 'promo' ? "bg-orange-50 border-orange-400" : "bg-blue-50 border-blue-400"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                                    priceChoice.tipo === 'promo' ? "bg-orange-500" : "bg-blue-500"
                                )}>
                                    <span className="text-white text-lg font-bold">$</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className={cn(
                                        "text-lg font-bold uppercase",
                                        priceChoice.tipo === 'promo' ? "text-orange-700" : "text-blue-700"
                                    )}>
                                        {priceChoice.tipo === 'promo' ? 'Preço Promocional Detectado!' : 'Preço Especial Detectado!'}
                                    </h4>
                                    <p className={cn(
                                        "text-sm",
                                        priceChoice.tipo === 'promo' ? "text-orange-600" : "text-blue-600"
                                    )}>
                                        <span className="font-bold">{priceChoice.product?.pro_codprod}</span> - {priceChoice.product?.pro_nome}
                                    </p>
                                </div>
                            </div>

                            {/* Comparação de preços */}
                            <div className="grid grid-cols-2 gap-4 mt-4 mb-3">
                                <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                                    <span className="text-xs text-slate-500 uppercase block">Preço Bruto</span>
                                    <span className="text-xl font-bold text-slate-700">
                                        {priceChoice.precoBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 block mt-1">✓ Aplica descontos do cabeçalho</span>
                                </div>
                                <div className={cn(
                                    "rounded-lg p-3 border-2 text-center",
                                    priceChoice.tipo === 'promo' ? "bg-orange-100 border-orange-400" : "bg-blue-100 border-blue-400"
                                )}>
                                    <span className={cn(
                                        "text-xs uppercase block font-bold",
                                        priceChoice.tipo === 'promo' ? "text-orange-600" : "text-blue-600"
                                    )}>
                                        {priceChoice.tipo === 'promo' ? 'Preço Promo' : 'Preço Especial'}
                                    </span>
                                    <span className={cn(
                                        "text-xl font-bold",
                                        priceChoice.tipo === 'promo' ? "text-orange-700" : "text-blue-700"
                                    )}>
                                        {priceChoice.precoAlternativo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    {priceChoice.tipo === 'promo' ? (
                                        <span className="text-[10px] text-orange-600 block mt-1">⚠️ ZERA os descontos (já é líquido)</span>
                                    ) : (
                                        <span className="text-[10px] text-blue-600 block mt-1">✓ Aplica descontos do cabeçalho</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button
                                    onClick={handlePriceChoiceBruto}
                                    className="bg-slate-200 text-slate-700 hover:bg-slate-300 h-9 px-4 font-bold"
                                >
                                    Usar Bruto {priceChoice.precoBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Button>
                                <Button
                                    onClick={handlePriceChoiceAlternativo}
                                    className={cn(
                                        "h-9 px-4 font-bold text-white",
                                        priceChoice.tipo === 'promo'
                                            ? "bg-orange-600 hover:bg-orange-700"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    )}
                                >
                                    Usar {priceChoice.tipo === 'promo' ? 'Promo' : 'Especial'} {priceChoice.precoAlternativo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            onClick={handleSaveItem}
                            className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9 px-6 font-bold shadow-sm flex items-center gap-2"
                        >
                            <Check className="h-4 w-4" /> Salvar
                        </Button>
                        <Button
                            onClick={handleFinalizeItems}
                            disabled={syncing || orderItems.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-6 font-bold shadow-md flex items-center gap-2"
                        >
                            {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Finalizar Itens
                        </Button>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100">
                        <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Itens já digitados no pedido</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-[11px]">
                            <thead className="bg-slate-50 text-teal-800 sticky top-0 uppercase text-[10px]">
                                <tr>
                                    <th className="p-2 border-b font-bold text-left">Seq</th>
                                    <th className="p-2 border-b font-bold text-left">Código</th>
                                    <th className="p-2 border-b font-bold text-left w-1/4">Descrição</th>
                                    <th className="p-2 border-b font-bold text-center">Quant</th>
                                    <th className="p-2 border-b font-bold text-right">Unitário</th>
                                    <th className="p-2 border-b font-bold text-right">Total Liq</th>
                                    <th className="p-2 border-b font-bold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center text-emerald-300 italic align-middle">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Package className="h-8 w-8" />
                                                <span>&lt;Sem dados&gt;</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orderItems.slice().sort((a, b) => (b.ite_seq || 0) - (a.ite_seq || 0)).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/30 border-b border-slate-50 transition-colors">
                                            <td className="p-2 font-bold text-slate-400">{String(item.ite_seq || (orderItems.length - idx)).padStart(3, '0')}</td>
                                            <td className="p-2 font-medium text-teal-800">{item.ite_produto}</td>
                                            <td className="p-2 truncate max-w-[150px]">{item.ite_nomeprod}</td>
                                            <td className="p-2 text-center font-bold">
                                                {userParams?.par_usadecimais === 'S'
                                                    ? Number(item.ite_quant || 0).toFixed(userParams?.par_qtddecimais || 2)
                                                    : parseInt(item.ite_quant || 0)}
                                            </td>
                                            <td className="p-2 text-right">R$ {parseFloat(item.ite_puniliq).toFixed(userParams?.par_qtddecimais || 2)}</td>
                                            <td className="p-2 text-right font-bold text-emerald-700">R$ {parseFloat(item.ite_totliquido).toFixed(2)}</td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => setCurrentItem(item)}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteItem(item)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Right Column: Product Selector with Tabs (6/12) */}
            <div className="flex-[6] bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                {/* Header */}
                <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100">
                    <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider text-center">
                        {rightPanelTab === 'tabela' ? 'Tabela de Produtos da Indústria' : `Histórico de Compras${currentItem.ite_produto ? `: ${currentItem.ite_produto}` : ''}`}
                    </h3>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {/* Tab: Tabela de Preços */}
                    {rightPanelTab === 'tabela' && (
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0 uppercase">
                                <tr>
                                    <th className="p-1.5 border-b text-left">Código</th>
                                    <th className="p-1.5 border-b text-left">Conv.</th>
                                    <th className="p-1.5 border-b text-left">Descrição</th>
                                    <th className="p-1.5 border-b text-right">Bruto</th>
                                    <th className="p-1.5 border-b text-right text-orange-600">Promo</th>
                                    <th className="p-1.5 border-b text-right text-blue-600">Especial</th>
                                    <th className="p-1.5 border-b text-center">Mult</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingProducts ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-emerald-400 italic">Carregando produtos...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-emerald-300 italic">Selecione uma tabela de preços</td></tr>
                                ) : (
                                    getFilteredProducts().map((product, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => {
                                                handleSelectProduct(product);
                                                setSelectedProductIndex(0);
                                            }}
                                            className={cn(
                                                "cursor-pointer border-b border-slate-50 transition-colors",
                                                idx === selectedProductIndex
                                                    ? "bg-emerald-100 dark:bg-emerald-800"
                                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                            )}
                                        >
                                            <td className="p-1.5 font-bold text-teal-700 dark:text-teal-300">{product.pro_codprod}</td>
                                            <td className="p-1.5 font-mono text-slate-400 text-[9px]">{product.pro_codigonormalizado}</td>
                                            <td className="p-1.5 font-medium truncate max-w-[120px] dark:text-white">{product.pro_nome}</td>
                                            <td className="p-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {parseFloat(product.itab_precobruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className={cn("p-1.5 text-right font-bold", parseFloat(product.itab_precopromo || 0) > 0 ? "text-orange-600 bg-orange-50" : "text-slate-300")}>
                                                {parseFloat(product.itab_precopromo || 0) > 0
                                                    ? parseFloat(product.itab_precopromo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : '-'}
                                            </td>
                                            <td className={cn("p-1.5 text-right font-bold", parseFloat(product.itab_precoespecial || 0) > 0 ? "text-blue-600 bg-blue-50" : "text-slate-300")}>
                                                {parseFloat(product.itab_precoespecial || 0) > 0
                                                    ? parseFloat(product.itab_precoespecial).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : '-'}
                                            </td>
                                            <td className="p-1.5 text-center text-slate-400">{product.pro_mult || '000'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Tab: Histórico de Compras */}
                    {rightPanelTab === 'historico' && (
                        <table className="w-full text-[10px]">
                            <thead className="bg-amber-50 text-amber-700 sticky top-0 uppercase">
                                <tr>
                                    <th className="p-2 border-b text-left">Data</th>
                                    <th className="p-2 border-b text-left">Pedido</th>
                                    <th className="p-2 border-b text-center">Quant</th>
                                    <th className="p-2 border-b text-right">Unit. Liq</th>
                                    <th className="p-2 border-b text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingHistory ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-amber-400 italic">Carregando histórico...</td></tr>
                                ) : !currentItem.ite_produto ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-amber-300 italic">Digite um código de produto para ver o histórico</td></tr>
                                ) : productHistory.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-amber-300 italic">Nenhum histórico encontrado para este produto</td></tr>
                                ) : (
                                    productHistory.map((hist, idx) => (
                                        <tr key={idx} className="border-b border-amber-50 hover:bg-amber-50/50">
                                            <td className="p-2 font-medium text-slate-600">
                                                {new Date(hist.ped_data).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-2 font-mono text-amber-700 font-bold">{hist.ped_pedido}</td>
                                            <td className="p-2 text-center font-bold">{hist.ite_quant}</td>
                                            <td className="p-2 text-right text-emerald-600 font-bold">
                                                {parseFloat(hist.ite_puniliq || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="p-2 text-right font-bold text-slate-700">
                                                {parseFloat(hist.ite_totliquido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer with Tabs and Info */}
                <div className="border-t border-emerald-100 flex flex-col">
                    {/* Info Row */}
                    {rightPanelTab === 'tabela' && (
                        <div className="px-2 py-1 bg-slate-50/50 border-b border-emerald-100">
                            <span className="text-[10px] text-slate-500">
                                {hasMoreItems ? (
                                    <>Mostrando <span className="font-bold">{MAX_ITEMS_WITHOUT_FILTER}</span> de <span className="font-bold">{products.length}</span> itens • <span className="text-teal-600 font-medium">Digite código para filtrar</span></>
                                ) : (
                                    <><span className="font-bold">{getFilteredProducts().length}</span> {getFilteredProducts().length === 1 ? 'item' : 'itens'} {currentItem.ite_produto?.trim() ? 'encontrados' : ''}</>
                                )}
                            </span>
                        </div>
                    )}
                    {rightPanelTab === 'historico' && (
                        <div className="px-2 py-1 bg-amber-50/50 border-b border-amber-100">
                            <span className="text-[10px] text-amber-600">
                                <span className="font-bold">{productHistory.length}</span> {productHistory.length === 1 ? 'pedido anterior' : 'pedidos anteriores'}
                            </span>
                        </div>
                    )}

                    {/* Tabs at Bottom */}
                    <div className="flex">
                        <button
                            onClick={() => handleRightPanelTabChange('tabela')}
                            className={cn(
                                "flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors",
                                rightPanelTab === 'tabela'
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            )}
                        >
                            Tab. Preços
                        </button>
                        <button
                            onClick={() => handleRightPanelTabChange('historico')}
                            className={cn(
                                "flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors",
                                rightPanelTab === 'historico'
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            )}
                        >
                            Histórico
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemEntry;
