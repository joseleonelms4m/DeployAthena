import { useEffect, useRef, useState } from 'react';
import { createHubSocket, sendTask } from '../services/hubSocket';

export function useHubSocket() {
    const socketRef = useRef(null);
    const importCallbackRef = useRef(null);

    const [hubs, setHubs] = useState([]);
    const [shake, setShake] = useState(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const socket = createHubSocket();
        socketRef.current = socket;

        socket.addEventListener('open', () => {
            console.log('WebSocket conectado');
            setConnected(true);
            socket.send(JSON.stringify({ task: 'init' }));
        });

        socket.addEventListener('message', (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === 'state') {
                    setHubs(msg.hubs || []);
                    setShake(msg.shake || null);
                    setLoading(false);

                    // Respuesta de una importación
                    if (importCallbackRef.current) {
                        importCallbackRef.current();
                        importCallbackRef.current = null;
                    }
                }
            } catch (error) {
                console.error(
                    'Error procesando mensaje WebSocket:',
                    error
                );
            }
        });

        socket.addEventListener('close', () => {
            console.log('WebSocket desconectado');
            setConnected(false);
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            setConnected(false);
        });

        return () => {
            socket.close();
        };
    }, []);

    const executeTask = (
        task,
        selectedHubs = undefined,
        onResponse = null
    ) => {
        if (task === 'import' && onResponse) {
            importCallbackRef.current = onResponse;
        }

        sendTask(
            socketRef.current,
            task,
            selectedHubs
        );
    };

    return {
        hubs,
        shake,
        loading,
        connected,
        executeTask
    };
}