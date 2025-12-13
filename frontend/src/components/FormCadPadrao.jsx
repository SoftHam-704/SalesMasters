import React, { useState } from 'react';
import { X } from 'lucide-react';
import './FormCadPadrao.css';

/**
 * FormCadPadrao - Formulário Padrão para Cadastros
 * Equivalente ao TfrmCadPad do Delphi
 * 
 * Props:
 * - title: Título do formulário
 * - data: Dados do registro (null para novo)
 * - onClose: Função para fechar o formulário
 * - onSave: Função para salvar os dados
 * - tabs: Array de abas principais [{ id, label, icon }]
 * - relatedTabs: Array de abas de dados relacionados [{ id, label }]
 * - renderTabContent: Função para renderizar conteúdo das abas principais
 * - renderRelatedContent: Função para renderizar conteúdo das abas relacionadas
 */
const FormCadPadrao = ({
    title = 'Cadastro',
    data = null,
    onClose,
    onSave,
    tabs = [],
    relatedTabs = [],
    renderTabContent,
    renderRelatedContent,
    children
}) => {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'principal');
    const [activeRelatedTab, setActiveRelatedTab] = useState(relatedTabs[0]?.id || '');

    const handleSave = () => {
        if (onSave) {
            onSave();
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                {/* Header */}
                <div className="form-header">
                    <h2>{title}</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Abas Principais */}
                {tabs.length > 0 && (
                    <div className="form-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Conteúdo das Abas Principais */}
                <div className="form-content">
                    {renderTabContent ? (
                        renderTabContent(activeTab)
                    ) : (
                        children
                    )}
                </div>

                {/* Abas de Dados Relacionados */}
                {relatedTabs.length > 0 && (
                    <>
                        <div className="related-tabs">
                            {relatedTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`tab ${activeRelatedTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveRelatedTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Conteúdo das Abas Relacionadas */}
                        <div className="related-content">
                            {renderRelatedContent && renderRelatedContent(activeRelatedTab)}
                        </div>
                    </>
                )}

                {/* Footer com Botões */}
                <div className="form-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormCadPadrao;
