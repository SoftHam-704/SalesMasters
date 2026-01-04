import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import './FormCadPadraoV2.css';
import './FormLayout.css'; // ⬅️ Global Grid & Modern Styles

const FormCadPadraoV2 = ({ title, children, onSave, onCancel }) => {
    return (
        <div className="formv2-overlay">
            <motion.div
                className="formv2-container"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
            >
                <header>
                    <h2>{title}</h2>
                </header>

                <section className="formv2-content">
                    {children}
                </section>

                <footer>
                    <Button variant="outline" onClick={onCancel} className="bg-white hover:bg-gray-50">
                        Cancelar
                    </Button>
                    <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Salvar
                    </Button>
                </footer>
            </motion.div>
        </div>
    );
};

export default FormCadPadraoV2;
