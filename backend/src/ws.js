import http from 'http';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';

export class WebSocketServer extends EventEmitter {

    constructor(options = {}) {
        super()
        this.OPCODES = { text: 0x01, close: 0x08 }; //0x01 Denotes a text frame, 0x08 Denotes that client wants to close the connection
        this.GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
        this.port = options.port || 8080
        this._init()
    }

    _init() {
        //throw and error if server exists
        if (this._server) throw new Error('Server already initialized');

        //create server with upgrade required
        this._server = http.createServer((req, res) => {
            // CSS
            if (req.url === '/ws-page.css') {
                const cssFile = new URL(
                    './views/ws-page.css',
                    import.meta.url
                );
                res.writeHead(200, {
                    'Content-Type': 'text/css'
                });
                res.end(fs.readFileSync(cssFile, 'utf-8'));
                return;
            }

            // JAVASCRIPT
            if (req.url === '/ws-page.js') {
                const jsFile = new URL(
                    './views/ws-page.js',
                    import.meta.url
                );
                res.writeHead(200, {
                    'Content-Type': 'application/javascript'
                });
                res.end(fs.readFileSync(jsFile, 'utf-8'));
                return;
            }

            // HTML
            if (req.method === 'GET') {
                const pageFile = new URL(
                    './views/ws-page.html',
                    import.meta.url
                );
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end(fs.readFileSync(pageFile, 'utf-8'));
                return;
            }

            const UPGRADE_REQUIRED = 426;

            res.writeHead(UPGRADE_REQUIRED, {
                'Content-Type': 'text/plain',
                'Upgrade': 'WebSocket',
            });

            res.end(http.STATUS_CODES[UPGRADE_REQUIRED]);
        });

        //handle handshake
        this._server.on('upgrade', (req, socket) => {
            // ...upgrade request code...
            this.emit('headers', req);

            if (req.headers.upgrade !== 'websocket') {
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }

            const acceptKey = req.headers['sec-websocket-key'];
            const acceptValue = this._generateAcceptValue(acceptKey);

            const responseHeaders = [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Accept: ${acceptValue}`,
            ];

            socket.write(responseHeaders.concat('\r\n').join('\r\n'));

            // ...add connection stablish event listener...

            this.emit('connection', socket)

            // ...close connection...
            /*this.on('close', () => {
                console.log('closing....', socket);
                socket.destroy();
            });*/

            // ...add data event listener...
            socket.on('error', (err) => {
                console.log(`WebSocket socket error: ${err.code || err.message}`);
            });

            socket.on('data', (buffer) =>
                this.emit(
                    'data',
                    this.parseFrame(buffer, socket),
                    (data) => socket.write(this.createFrame(data))
                )
            );
        });
    }

    _generateAcceptValue(acceptKey) {
        return crypto
            .createHash('sha1')
            .update(acceptKey + this.GUID, 'binary')
            .digest('base64');
    }


    listen(callback) {
        this._server.listen(this.port, callback);
    }

    parseFrame(buffer, socket) {
        // ... first byte processing ...
        const firstByte = buffer.readUInt8(0); //read first byte
        const opCode = firstByte & 0b00001111; // get last 4 bits of a byte

        // ... close frame handling ...
        if (opCode === this.OPCODES.close) {
            this.emit('close', socket);
            socket.destroy()
            return null;
        } else if (opCode !== this.OPCODES.text) { // refuse to process anything other than plain text
            return;
        }

        // second byte processing next...
        const secondByte = buffer.readUInt8(1);

        let offset = 2; //bcz we've already read first and second bytes buffer
        let payloadLength = secondByte & 0b01111111; // get last 7 bits of a second byte

        if (payloadLength === 126) {
            offset += 2;
        } else if (payloadLength === 127) {
            offset += 8;
        }

        //first bit of the second byte indicates if the payload is masked
        const isMasked = Boolean((secondByte >>> 7) & 0b00000001);

        if (isMasked) {
            const maskingKey = buffer.readUInt32BE(offset); // read 4-byte (32-bit) masking key
            offset += 4;
            const payload = buffer.subarray(offset); //subarray after the offset
            const result = this._unmask(payload, maskingKey);
            return result.toString('utf-8');
        }

        return buffer.subarray(offset).toString('utf-8'); //subarray after the offset
    }

    createFrame(data) {
        const payload = JSON.stringify(data);

        const payloadByteLength = Buffer.byteLength(payload);
        let payloadBytesOffset = 2;
        let payloadLength = payloadByteLength;

        if (payloadByteLength > 65535) { // length value cannot fit in 2 bytes
            payloadBytesOffset += 8;
            payloadLength = 127;
        } else if (payloadByteLength > 125) {
            payloadBytesOffset += 2;
            payloadLength = 126;
        }

        const buffer = Buffer.alloc(payloadBytesOffset + payloadByteLength);

        // first byte
        buffer.writeUInt8(0b10000001, 0); // [FIN (1), RSV1 (0), RSV2 (0), RSV3 (0), Opсode (0x01 - text frame)]

        buffer[1] = payloadLength; // second byte - actual payload size (if <= 125 bytes) or 126, or 127

        if (payloadLength === 126) { // write actual payload length as a 16-bit unsigned integer
            buffer.writeUInt16BE(payloadByteLength, 2);
        } else if (payloadByteLength === 127) { // write actual payload length as a 64-bit unsigned integer
            buffer.writeBigUInt64BE(BigInt(payloadByteLength), 2);
        }

        buffer.write(payload, payloadBytesOffset);
        return buffer;
    }

    _unmask(payload, maskingKey) { //unmask payload
        const result = Buffer.alloc(payload.byteLength);

        for (let i = 0; i < payload.byteLength; ++i) {
            const j = i % 4;
            const maskingKeyByteShift = j === 3 ? 0 : (3 - j) << 3;
            const maskingKeyByte = (maskingKeyByteShift === 0 ? maskingKey : maskingKey >>> maskingKeyByteShift) & 0b11111111;
            const transformedByte = maskingKeyByte ^ payload.readUInt8(i);
            result.writeUInt8(transformedByte, i);
        }

        return result;
    }
}