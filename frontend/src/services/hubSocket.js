const WS_PORT = 8080;

export function createHubSocket() {
    const socket = new WebSocket(
        `ws://${window.location.hostname}:${WS_PORT}`
    );

    return socket;
}

export function sendTask(socket, task, hubs = undefined) {
    console.log('Socket:', socket);
    console.log('ReadyState:', socket?.readyState);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket no está conectado');
        return;
    }

    const message = { task };

    if (hubs !== undefined) {
        message.hubs = hubs;
    }

    console.log('Mensaje que se enviará:', message);

    socket.send(JSON.stringify(message));

    console.log('Mensaje enviado');
}