import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, X } from 'lucide-react';
import OrderForm from './OrderForm';

const OrderDialog = ({ open, onOpenChange, selectedIndustry, onOrderCreated, selectedOrder }) => {
    const handleClose = () => {
        onOpenChange(false);
    };

    const handleSave = (orderData) => {
        if (onOrderCreated) {
            onOrderCreated(orderData);
        }
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="w-[1350px] max-w-[98vw] p-0 gap-0 bg-transparent border-none shadow-2xl h-[85vh] flex flex-col">
                <DialogHeader className="bg-teal-600 text-white px-4 py-2 flex flex-row items-center justify-between shrink-0 rounded-t-lg">
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        Novo Pedido <span className="text-teal-200 font-normal">• {selectedIndustry?.for_nomered}</span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                        Preencha os dados do pedido
                    </DialogDescription>
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-700/50 rounded px-2 py-1 text-xs flex items-center gap-1">
                            <Package className="h-3 w-3" /> Cadastro de Pedido
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-teal-700 hover:text-white" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-hidden bg-slate-50/50">
                    <OrderForm
                        selectedIndustry={selectedIndustry}
                        onClose={handleClose}
                        onSave={handleSave}
                        existingOrder={selectedOrder}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderDialog;
