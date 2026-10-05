import { deployHub } from "../services/deployHub.service.js";
import { buildStateUpdate } from "./updatePage.controller.js";
import { Tools } from "../tools/tools.js";

const { saveState, now } = Tools

export async function DeployHubController(hubs, state, selectedIPs, reply) {
    // Bloquear hubs ya exitosos en el servidor
    const selected = hubs.filter(h => selectedIPs.includes(h.ip) && (state[h.ip] || {}).status !== "SUCCESS");

    // Notificar de inmediato el estado "en progreso"
    reply(buildStateUpdate(hubs, state));

    // Deploy en background
    for (const hub of selected) {
        if (!state[hub.ip]) state[hub.ip] = { status: "PENDING", attempts: 0, lastAttempt: null };
        state[hub.ip].status = "IN_PROGRESS";
        state[hub.ip].lastAttempt = now();
        state[hub.ip].attempts = (state[hub.ip].attempts || 0) + 1;
        saveState(state);
        reply(buildStateUpdate(hubs, state));

        const result = await deployHub(hub);
        state[hub.ip].status = result;
        state[hub.ip].lastAttempt = now();
        saveState(state);
        reply(buildStateUpdate(hubs, state));
        console.log(`${hub.name}: ${result}`);
    }
    return;
}
