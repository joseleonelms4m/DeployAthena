import { updateHub } from "../services/updateHub.service.js";
import { buildStateUpdate } from "./updatePage.controller.js";
import { Tools } from "../tools/tools.js";

const { saveState } = Tools


export async function updateHubController(hubs, state, selectedIPs, reply) {
    const selected = hubs.filter(h => selectedIPs.includes(h.ip));

    reply(buildStateUpdate(hubs, state))

    for (const hub of selected) {
        if (!state[hub.ip]) state[hub.ip] = { status: "PENDING", attempts: 0, lastAttempt: null };
        state[hub.ip].updateStatus = "UPDATE_PROGRESS";
        saveState(state);
        reply(buildStateUpdate(hubs, state));

        const result = await updateHub(hub);
        state[hub.ip].updateStatus = result === "OFFLINE" ? "UPDATE_FAILED" : result;
        saveState(state);
        reply(buildStateUpdate(hubs, state));
        console.log(`[UPDATE] ${hub.name}: ${result}`);
    }
    return;
}
