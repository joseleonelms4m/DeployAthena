import { WebSocketServer } from './ws.js';
import { Tools } from './tools/tools.js';
import { buildStateUpdate } from './controllers/updatePage.controller.js';
import { DeployHubController } from './controllers/deployHubWs.controller.js';
import { perclosOffController } from './controllers/perclosOffWs.controller.js';
import { perclosOnController } from './controllers/perclosOnWs.controller.js';
import { vibrationOffController } from './controllers/vibrationOffWs.controller.js';
import { vibrationOnController } from './controllers/vibrationOnWs.controller.js';
import { updateHubController } from './controllers/updateHubWs.controller.js';
import { loadHubs } from './controllers/loadHubs.controller.js';
import { clearHubs } from './controllers/clearHubs.controller.js';
///
const {logConnection, parseCSV, loadState} = Tools
let hubs = parseCSV();
console.log('HUBS INICIALES:', hubs);
const state = loadState();
///
const PORT = 8080
const server = new WebSocketServer({ port: PORT });

server.on('headers', ({ headers }) => console.log(headers));

server.on('connection', (socket) => {
    logConnection(`client connected: ${socket.remoteAddress}`)
})

server.on('data', (message, reply) => {
    if (!message) return;
    const data = JSON.parse(message);
    console.log('Received data:', data);
    //here goes the logic of my project
    const {task} = data
    switch(task){
        case "init":{
            return reply(buildStateUpdate(hubs, state));
        }
        case "deploy":{
            console.log('HUBS ANTES DE DEPLOY:', hubs);
    console.log('EQUIPOS RECIBIDOS:', data.hubs);
            DeployHubController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "perclosOff":{
            perclosOffController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "perclosOn":{
            perclosOnController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "vibrationOff":{
            vibrationOffController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "vibrationOn":{
            vibrationOnController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "update":{
            updateHubController(hubs, state, data.hubs || [], reply);
            return;
        }
        case "import":{
            loadHubs(hubs, state, data, reply)
            return;
        }
        case "clear":{
            clearHubs(hubs, state, reply);
        return;
        }
        default:{
            return reply({"choose": "non existant answer!!!"})
        }
    }
});

server.on('close', async (socket) => {
    logConnection(`client closed: ${socket.remoteAddress}`)
});

server.listen(() => {
    console.log(`WebSocket server listening on port ${PORT}`);
});

