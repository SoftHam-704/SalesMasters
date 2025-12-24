import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, Edit2, Check, X, RefreshCw, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const OrderItemEntry = ({
    pedPedido,
    selectedIndustry,
    priceTableName,
    priceTableMemtable = [],
    memtableLoading = false,
    headerDiscounts,
    onItemsChange,
    allowDuplicates
}) => {
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const codeInputRef = React.useRef(null);

    const [currentItem, setCurrentItem] = useState({
        ite_produto: '',
        ite_complemento: '',
        ite_nomeprod: '',
        ite_quant: 1,
        ite_totbruto: 0,
        ite_puniliq: 0,
        ite_totliquido: 0,
        ite_ipi: 0,
        ite_des1: 0,
        ite_des2: 0,
        ite_des3: 0,
        ite_des4: 0,
        ite_des5: 0,
        ite_des6: 0,
        ite_des7: 0,
        ite_des8: 0,
        ite_des9: 0,
        ite_valcomipi: 0,
    });

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

    const loadOrderItems = async () => {
        try {
            const response = await fetch(`http://localhost:3005/api/orders/${pedPedido}/items`);
            if (response.ok) {
                const data = await response.json();
                setOrderItems(data.success ? data.data : []);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
        }
    };

    const calculateItem = (item) => {
        const quant = parseFloat(item.ite_quant) || 0;
        const bruto = parseFloat(item.ite_totbruto) || 0;
        const ipiPerc = parseFloat(item.ite_ipi) || 0;

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

        return {
            ...item,
            ite_puniliq: liquido,
            ite_totliquido: totLiq,
            ite_valcomipi: valComIpi
        };
    };

    const handleItemChange = (field, value) => {
        setCurrentItem(prev => {
            const newItem = { ...prev, [field]: value };
            return calculateItem(newItem);
        });
    };

    const handleSaveItem = () => {
        if (!currentItem.ite_produto) {
            toast.error('Selecione um produto');
            return;
        }

        // Duplicates check
        if (!allowDuplicates) {
            const isDuplicate = orderItems.some(item =>
                item.ite_produto === currentItem.ite_produto &&
                item.ite_complemento === currentItem.ite_complemento &&
                item.ite_seq !== currentItem.ite_seq && // Non-editing duplicate
                item.tempId !== currentItem.tempId
            );
            if (isDuplicate) {
                toast.error('Este produto já está no pedido.');
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
                items[existingIndex] = { ...currentItem };
                toast.success('Item atualizado (Memória)');
            } else {
                const newItem = {
                    ...currentItem,
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
            const response = await fetch(`http://localhost:3005/api/orders/${pedPedido}/items/sync`, {
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
            ite_complemento: '',
            ite_nomeprod: '',
            ite_quant: 1,
            ite_totbruto: 0,
            ite_puniliq: 0,
            ite_totliquido: 0,
            ite_ipi: 0,
            ite_des1: 0,
            ite_des2: 0,
            ite_des3: 0,
            ite_des4: 0,
            ite_des5: 0,
            ite_des6: 0,
            ite_des7: 0,
            ite_des8: 0,
            ite_des9: 0,
            ite_valcomipi: 0,
        });
    };

    const handleSelectProduct = (product) => {
        const newItem = {
            ...currentItem,
            ite_produto: product.pro_codigo,
            ite_complemento: product.pro_comple || '',
            ite_nomeprod: product.pro_descricao,
            ite_totbruto: product.preco || 0,
            ite_ipi: product.pro_peripi || 0,
            ite_des1: headerDiscounts?.ped_pri || 0,
            ite_des2: headerDiscounts?.ped_seg || 0,
            ite_des3: headerDiscounts?.ped_ter || 0,
            ite_des4: headerDiscounts?.ped_qua || 0,
            ite_des5: headerDiscounts?.ped_qui || 0,
            ite_des6: headerDiscounts?.ped_sex || 0,
            ite_des7: headerDiscounts?.ped_set || 0,
            ite_des8: headerDiscounts?.ped_oit || 0,
            ite_des9: headerDiscounts?.ped_nov || 0,
        };
        setCurrentItem(calculateItem(newItem));
    };

    const inputClasses = "h-7 text-xs border-emerald-100 focus:border-emerald-500 bg-white placeholder:text-emerald-300 shadow-sm";
    const labelClasses = "text-[10px] text-teal-700 font-bold uppercase tracking-wide mb-0.5 block";

    return (
        <div className="flex h-full gap-4 p-4 overflow-hidden bg-slate-50/50">
            {/* Left Column: Entry and List (7/12) */}
            <div className="flex-[7] flex flex-col gap-4 overflow-hidden">

                {/* Item Entry Card */}
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex gap-4">
                        <div className="w-24">
                            <Label className={labelClasses}>Código</Label>
                            <Input
                                ref={codeInputRef}
                                value={currentItem.ite_produto}
                                onChange={(e) => handleItemChange('ite_produto', e.target.value)}
                                className={cn(inputClasses, "bg-amber-50 border-amber-200 font-bold")}
                            />
                        </div>
                        <div className="w-32">
                            <Label className={labelClasses}>Complemento</Label>
                            <Input
                                value={currentItem.ite_complemento}
                                onChange={(e) => handleItemChange('ite_complemento', e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className={labelClasses}>Descrição</Label>
                            <Input
                                value={currentItem.ite_nomeprod}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 border-slate-200")}
                            />
                        </div>
                    </div>

                    {/* Discount Levels Grid */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <div key={num} className="flex-1 min-w-[50px]">
                                <Label className="text-[9px] text-teal-600/70 font-bold uppercase text-center mb-0.5">{num}º</Label>
                                <Input
                                    value={currentItem[`ite_des${num}`]}
                                    onChange={(e) => handleItemChange(`ite_des${num}`, e.target.value)}
                                    className="h-6 text-[10px] text-center p-0 rounded-md border-emerald-50 focus:border-emerald-400 bg-emerald-50/20 text-emerald-700 font-medium"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Technical and Calculations Grid */}
                    <div className="grid grid-cols-6 gap-2 items-end">
                        <div className="col-span-1">
                            <Label className={labelClasses}>% Add</Label>
                            <Input
                                value="0,00"
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-center font-bold text-teal-600")}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className={labelClasses}>Quant.</Label>
                            <Input
                                type="number"
                                value={currentItem.ite_quant}
                                onChange={(e) => handleItemChange('ite_quant', e.target.value)}
                                className={cn(inputClasses, "text-center font-bold")}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className={labelClasses}>Preço bruto</Label>
                            <Input
                                value={parseFloat(currentItem.ite_totbruto).toFixed(2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right")}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className={labelClasses}>Preço Liq</Label>
                            <Input
                                value={parseFloat(currentItem.ite_puniliq).toFixed(2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right font-bold text-emerald-600")}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className={labelClasses}>C/Impostos</Label>
                            <Input
                                value={parseFloat(currentItem.ite_valcomipi / (currentItem.ite_quant || 1)).toFixed(2)}
                                readOnly
                                className={cn(inputClasses, "bg-slate-50 text-right")}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className={labelClasses}>IPI</Label>
                            <div className="relative">
                                <Input
                                    value={currentItem.ite_ipi}
                                    onChange={(e) => handleItemChange('ite_ipi', e.target.value)}
                                    className={cn(inputClasses, "pr-4 text-center text-red-500 font-bold border-red-100 bg-red-50/30")}
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-red-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Boxes and Actions */}
                    <div className="flex gap-4 items-center pt-2">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <div className="bg-emerald-50/50 rounded-lg p-1.5 border border-emerald-100 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Total bruto</span>
                                <span className="text-sm font-bold text-emerald-700">R$ {((currentItem.ite_totbruto || 0) * (currentItem.ite_quant || 0)).toFixed(2)}</span>
                            </div>
                            <div className="bg-teal-50/50 rounded-lg p-1.5 border border-teal-100 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-teal-600 uppercase">Total líquido</span>
                                <span className="text-sm font-bold text-teal-700">R$ {(currentItem.ite_totliquido || 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-cyan-50/50 rounded-lg p-1.5 border border-cyan-100 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-cyan-600 uppercase">Total c/ impostos</span>
                                <span className="text-sm font-bold text-cyan-700">R$ {(currentItem.ite_valcomipi || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
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
                                    orderItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/30 border-b border-slate-50 transition-colors">
                                            <td className="p-2">{item.ite_seq}</td>
                                            <td className="p-2 font-medium text-teal-800">{item.ite_produto}</td>
                                            <td className="p-2 truncate max-w-[150px]">{item.ite_nomeprod}</td>
                                            <td className="p-2 text-center font-bold">{item.ite_quant}</td>
                                            <td className="p-2 text-right">R$ {parseFloat(item.ite_puniliq).toFixed(2)}</td>
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

            {/* Right Column: Product Selector (5/12) */}
            <div className="flex-[5] bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                    <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider text-center">Tabela de Produtos da Indústria</h3>
                    <div className="mt-2 relative">
                        <Input
                            placeholder="Buscar por código ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 text-xs bg-white border-emerald-200"
                        />
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-[10px]">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0 uppercase">
                            <tr>
                                <th className="p-2 border-b text-left">Código</th>
                                <th className="p-2 border-b text-left">Conversão</th>
                                <th className="p-2 border-b text-left">Descrição</th>
                                <th className="p-2 border-b text-right">Preço</th>
                                <th className="p-2 border-b text-center">Mult</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingProducts ? (
                                <tr><td colSpan="5" className="p-8 text-center text-emerald-400 italic">Carregando produtos...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-emerald-300 italic">Nenhum produto encontrado</td></tr>
                            ) : (
                                products
                                    .filter(p => p.pro_codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.pro_descricao?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((product, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => handleSelectProduct(product)}
                                            className="hover:bg-emerald-50 cursor-pointer border-b border-slate-50 transition-colors"
                                        >
                                            <td className="p-2 font-bold text-teal-700">{product.pro_codigo}</td>
                                            <td className="p-2 font-mono text-slate-400">{product.pro_comple}</td>
                                            <td className="p-2 font-medium">{product.pro_descricao}</td>
                                            <td className="p-2 text-right font-bold text-emerald-600">
                                                {parseFloat(product.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="p-2 text-center text-slate-400">{product.pro_mult || '000'}</td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-2 bg-emerald-50/50 border-t border-emerald-100 flex gap-2">
                    <Button variant="outline" className="flex-1 h-7 text-[10px] bg-white text-emerald-700 border-emerald-200">Tabela</Button>
                    <Button variant="outline" className="flex-1 h-7 text-[10px] bg-white text-emerald-700 border-emerald-200">Histórico</Button>
                </div>
            </div>
        </div>
    );
};

export default OrderItemEntry;
