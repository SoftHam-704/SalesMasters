// =====================================================
// 🟢 HOOK DE PRESENÇA ONLINE - SalesMaster Chat
// Gerencia status online/offline e heartbeat automático
// =====================================================

import { useEffect, useRef } from 'react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

/**
 * Hook para gerenciar presença online do usuário
 * - Marca como online ao carregar
 * - Envia heartbeat a cada 30s
 * - Marca como offline ao fechar janela/tab
 */
export const useUserPresence = (userId) => {
    const heartbeatIntervalRef = useRef(null);
    const isOnlineRef = useRef(false);

    // Função para marcar como online
    const setOnline = async () => {
        if (!userId || isOnlineRef.current) return;

        try {
            const deviceInfo = {
                browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'Desconhecido',
                os: navigator.platform || 'Desconhecido',
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
            };

            await fetch(getApiUrl(NODE_API_URL, '/api/chat/presence/online'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ device_info: deviceInfo })
            });

            isOnlineRef.current = true;
            console.log('🟢 [Presença] Marcado como online');
        } catch (error) {
            console.error('❌ [Presença] Erro ao marcar online:', error);
        }
    };

    // Função para marcar como offline
    const setOffline = async () => {
        if (!userId || !isOnlineRef.current) return;

        try {
            // Usar sendBeacon para garantir que a requisição seja enviada mesmo ao fechar a janela
            const url = getApiUrl(NODE_API_URL, '/api/chat/presence/offline');
            const data = new Blob([JSON.stringify({})], { type: 'application/json' });

            // Tentar sendBeacon primeiro (mais confiável)
            if (navigator.sendBeacon) {
                const formData = new FormData();
                formData.append('userId', userId);
                navigator.sendBeacon(url, formData);
            } else {
                // Fallback para fetch com keepalive
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId
                    },
                    keepalive: true // Importante: mantém requisição mesmo após página fechar
                });
            }

            isOnlineRef.current = false;
            console.log('⚪ [Presença] Marcado como offline');
        } catch (error) {
            console.error('❌ [Presença] Erro ao marcar offline:', error);
        }
    };

    // Função para enviar heartbeat
    const sendHeartbeat = async () => {
        if (!userId || !isOnlineRef.current) return;

        try {
            await fetch(getApiUrl(NODE_API_URL, '/api/chat/presence/heartbeat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                }
            });
            console.log('💓 [Presença] Heartbeat enviado');
        } catch (error) {
            console.error('❌ [Presença] Erro no heartbeat:', error);
        }
    };

    useEffect(() => {
        if (!userId) return;

        // Marcar como online ao carregar
        setOnline();

        // Iniciar heartbeat a cada 30 segundos
        heartbeatIntervalRef.current = setInterval(() => {
            sendHeartbeat();
        }, 30000); // 30s

        // Handler para beforeunload (CRÍTICO: marcar offline ao fechar)
        const handleBeforeUnload = () => {
            setOffline();
        };

        // Handler para visibility change (tab fica invisível/visível)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab ficou oculta - pode estar inativo
                console.log('👁️ [Presença] Tab oculta');
            } else {
                // Tab voltou a ficar visível - reativar
                console.log('👁️ [Presença] Tab visível novamente');
                sendHeartbeat();
            }
        };

        // Adicionar event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup ao desmontar componente
        return () => {
            // Limpar interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }

            // Remover listeners
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            // Marcar como offline
            setOffline();
        };
    }, [userId]);

    // Retornar funções úteis
    return {
        setOnline,
        setOffline,
        sendHeartbeat,
        isOnline: isOnlineRef.current
    };
};

export default useUserPresence;
