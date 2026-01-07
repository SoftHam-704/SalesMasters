import React from 'react';
import { motion } from 'framer-motion';
import { Cake, Phone, Trophy, Heart, Gamepad2 } from 'lucide-react';

export const BirthdayCard = ({ birthdays = [], loading = false }) => {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <p style={{ color: 'var(--text-secondary)' }}>Carregando aniversariantes...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}>
                        <Cake size={18} color="white" />
                    </div>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Aniversariantes do Mês
                    </h3>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    {birthdays.length} pessoa{birthdays.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* List */}
            <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '4px'
            }}>
                {birthdays.length === 0 ? (
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        padding: '1rem'
                    }}>
                        Nenhum aniversariante este mês
                    </p>
                ) : (
                    birthdays.map((b, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '0.6rem',
                                marginBottom: '0.5rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Name & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                                <p style={{
                                    fontWeight: '600',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    flex: 1
                                }}>
                                    {b.ani_nome || 'Nome não informado'}
                                </p>
                                <span style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {b.cli_datanasc ? `${new Date(b.cli_datanasc).getDate()}/${('0' + (new Date(b.cli_datanasc).getMonth() + 1)).slice(-2)}` : '--/--'}
                                </span>
                            </div>

                            {/* Function & Company */}
                            <p style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                margin: '0 0 0.25rem 0'
                            }}>
                                {b.ani_funcao && <span>{b.ani_funcao}</span>}
                                {b.ani_funcao && b.cli_nomred && <span> • </span>}
                                <span style={{ color: 'var(--text-primary)' }}>{b.cli_nomred}</span>
                            </p>

                            {/* Phone */}
                            {b.ani_fone && (
                                <p style={{
                                    fontSize: '0.65rem',
                                    color: '#059669',
                                    margin: '0 0 0.25rem 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Phone size={10} />
                                    {b.ani_fone}
                                </p>
                            )}

                            {/* Extra Info: Team, Sport, Hobby */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.4rem',
                                marginTop: '0.3rem'
                            }}>
                                {b.ani_timequetorce && (
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '0.6rem',
                                        color: '#7c3aed',
                                        background: '#ede9fe',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        <Trophy size={10} />
                                        {b.ani_timequetorce}
                                    </span>
                                )}
                                {b.ani_esportepreferido && (
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '0.6rem',
                                        color: '#0891b2',
                                        background: '#cffafe',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        <Heart size={10} />
                                        {b.ani_esportepreferido}
                                    </span>
                                )}
                                {b.ani_hobby && (
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        fontSize: '0.6rem',
                                        color: '#ea580c',
                                        background: '#ffedd5',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        <Gamepad2 size={10} />
                                        {b.ani_hobby}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};
