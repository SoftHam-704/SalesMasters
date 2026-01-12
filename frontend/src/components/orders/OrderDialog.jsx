import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, X, Zap, Sparkles } from 'lucide-react';
import OrderForm from './OrderForm';
import { motion, AnimatePresence } from 'framer-motion';

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
            <DialogContent
                className="w-[1450px] max-w-[98vw] p-0 gap-0 bg-white border border-slate-200 shadow-2xl h-[95vh] flex flex-col overflow-hidden rounded-[2rem] transition-all duration-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 z-[100]" />

                <div className="flex-1 overflow-hidden relative">
                    {/* Interior Glows */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

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
