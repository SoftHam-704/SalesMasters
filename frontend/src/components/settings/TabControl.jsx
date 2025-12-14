import React, { useState } from 'react';
import './TabControl.css';

export const TabControl = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = React.Children.toArray(children);

    return (
        <div className="tab-control">
            <div className="tab-headers">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`tab-header ${activeTab === index ? 'active' : ''}`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab.props.icon && (
                            <span className="tab-icon">{tab.props.icon}</span>
                        )}
                        <span className="tab-label">{tab.props.label}</span>
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {tabs[activeTab]}
            </div>
        </div>
    );
};

export const Tab = ({ children }) => {
    return <div className="tab-pane">{children}</div>;
};
