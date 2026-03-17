import React, { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { Bell, Clock } from 'lucide-react';

/**
 * NotificationService
 * Global component to handle real-time agenda notifications.
 * Requests permission on mount and polls for pending reminders.
 */
const NotificationService = () => {

    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }
    }, []);

    const showNotification = useCallback((item) => {
        const { titulo, hora_inicio, tipo } = item;
        const msg = `Horário: ${hora_inicio ? hora_inicio.substring(0, 5) : 'Agora'}`;

        // 1. Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`Lembrete: ${titulo}`, {
                    body: msg,
                    icon: '/favicon.ico', // Adjust icon path as needed
                    tag: `agenda-${item.id}`
                });
            } catch (e) {
                console.warn('Failed to send browser notification:', e);
            }
        }

        // 2. In-App Toast (Sonner)
        toast.info(titulo, {
            description: msg,
            icon: <Bell className="text-emerald-500" size={16} />,
            duration: 10000, // 10 seconds
            action: {
                label: 'Marcar como Lido',
                onClick: () => markAsSent(item.id)
            }
        });
    }, []);

    const markAsSent = async (id) => {
        try {
            await axios.patch(`/agenda/notifications/${id}/sent`);
        } catch (error) {
            console.error('Erro ao marcar notificação como enviada:', error);
        }
    };

    const hasAuthError = React.useRef(false);
    
    const checkPendingNotifications = useCallback(async () => {
        // Only check if user is logged in and has a session token
        const user = sessionStorage.getItem('user');
        const sessionToken = localStorage.getItem('session_token');

        if (!user || !sessionToken || hasAuthError.current) return;

        try {
            const response = await axios.get('/agenda/notifications/pending');
            const pending = response.data.data;

            if (pending && pending.length > 0) {
                pending.forEach(item => {
                    showNotification(item);
                    markAsSent(item.id);
                });
            }
        } catch (error) {
            // Silently fail for 401 or other network errors during polling to avoid console noise
            if (error.response?.status === 401) {
                hasAuthError.current = true; // Stop polling on auth error
            } else {
                console.error('Polling notifications error:', error);
            }
        }
    }, [showNotification]);

    useEffect(() => {
        requestPermission();

        // Initial check
        checkPendingNotifications();

        // Setup polling (every 60 seconds)
        const interval = setInterval(checkPendingNotifications, 60000);

        return () => clearInterval(interval);
    }, [requestPermission, checkPendingNotifications]);

    // This is a headless component
    return null;
};

export default NotificationService;
