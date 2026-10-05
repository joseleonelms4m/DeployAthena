import { perclosOn } from "../services/perclosOn.service.js";
import { buildStateUpdate } from "./updatePage.controller.js";
import { Tools } from "../tools/tools.js";

const { saveState } = Tools


export async function perclosOnController(hubs, state, selectedIPs, reply) {
    const selected = hubs.filter(h => selectedIPs.includes(h.ip));

    reply(buildStateUpdate(hubs, state))

    for (const hub of selected) {
        if (!state[hub.ip]) state[hub.ip] = { status: "PENDING", attempts: 0, lastAttempt: null };
        const previousPerclos = state[hub.ip].perclosStatus || "PENDING";
        state[hub.ip].perclosStatus = "IN_PROGRESS";
        saveState(state);
        reply(buildStateUpdate(hubs, state));

        const result = await perclosOn(hub);
        if (result === "PERCLOS_ON_OK") {
            state[hub.ip].perclosStatus = "PERCLOS_ON";
            saveState(state);
            reply(buildStateUpdate(hubs, state));
        } else {
            state[hub.ip].perclosStatus = previousPerclos;
            saveState(state);
            reply(buildStateUpdate(hubs, state, { ip: hub.ip, field: "perclos" }));
        }
        console.log(`[PERCLOS-ON] ${hub.name}: ${result}`);
    }
    return;
}
