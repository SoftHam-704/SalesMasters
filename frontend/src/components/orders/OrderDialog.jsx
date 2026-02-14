import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import OrderForm from './OrderForm';
import OrderFormProjetos from './OrderFormProjetos';

const OrderDialog = ({ open, onOpenChange, selectedIndustry, onOrderCreated, selectedOrder, readOnly, forceProjetos }) => {
    // Detect Tenant Type
    const tenantConfigStr = sessionStorage.getItem('tenantConfig');
    let isProjetos = forceProjetos || false;
    try {
        if (!isProjetos && tenantConfigStr) {
            const config = JSON.parse(tenantConfigStr);
            isProjetos = config.ramoatv === 'Projetos' || config.ramoatv === 'Logística';
        }
    } catch (e) { console.error("Error parsing tenant config", e); }

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleSave = (orderData) => {
        if (onOrderCreated) {
            onOrderCreated(orderData);
        }
        handleClose();
    };

    const FormComponent = isProjetos ? OrderFormProjetos : OrderForm;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[1450px] max-w-[98vw] p-0 gap-0 bg-white border border-slate-200 shadow-2xl h-[95vh] flex flex-col overflow-hidden rounded-[2rem] transition-all duration-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
                <div className={`absolute top-0 left-0 w-full h-1.5 z-[100] ${isProjetos ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500'}`} />

                <div className="flex-1 overflow-hidden relative">
                    <FormComponent
                        selectedIndustry={selectedIndustry}
                        onClose={handleClose}
                        onSave={handleSave}
                        existingOrder={selectedOrder}
                        readOnly={readOnly}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderDialog;
