import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const SOCKET_URL = 'http://localhost:5000';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user && !socketInstance) {
            socketInstance = io(SOCKET_URL);

            socketInstance.on('connect', () => {
                console.log('Connected to WebSocket');
                socketInstance?.emit('join', user.id);
            });

            socketInstance.on('new_invitation', (data: any) => {
                console.log('New invitation received:', data);
                const sender = data.sender_name || data.invited_by_name || 'Quelqu\'un';
                toast.info(`Nouvelle invitation de ${sender} pour la tontine ${data.tontine_name}`, {
                    autoClose: 10000,
                    onClick: () => {
                        window.location.href = '/invitations';
                    }
                });

                // Global event for UI refresh
                window.dispatchEvent(new CustomEvent('refresh_notifications'));
                if (window.location.pathname === '/invitations') {
                    window.dispatchEvent(new CustomEvent('refresh_invitations'));
                }
            });

            socketInstance.on('new_payment', (data: any) => {
                console.log('New payment received:', data);
                toast.success(`💳 Nouveau paiement de ${data.sender_name} (${data.amount} XOF) pour ${data.tontine_name}`, {
                    autoClose: 10000,
                    onClick: () => {
                        window.location.href = '/payment';
                    }
                });

                // Global event for UI refresh
                window.dispatchEvent(new CustomEvent('refresh_notifications'));
                if (window.location.pathname === '/payment') {
                    window.dispatchEvent(new CustomEvent('refresh_pending_payments'));
                }
            });

            socketInstance.on('notification', (data: any) => {
                console.log('Real-time notification received:', data);
                if (data.broadcast) {
                   toast.warn(`📢 ANNONCE : ${data.message}`, {
                     position: "top-center",
                     autoClose: 15000,
                     theme: "dark"
                   });
                } else {
                   toast.info(data.message);
                }
                window.dispatchEvent(new CustomEvent('refresh_notifications'));
            });

            socketInstance.on('disconnect', () => {
                console.log('Disconnected from WebSocket');
                socketInstance = null;
            });
        }

        // Handle logout: if user becomes null, disconnect
        if (!user && socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
        }
    }, [user]);

    return socketInstance;
};
