import { vibrationOn } from "../services/vibrationOn.service.js";
import { buildStateUpdate } from "./updatePage.controller.js";
import { Tools } from "../tools/tools.js";

const { saveState } = Tools


export async function vibrationOnController(hubs, state, selectedIPs, reply) {
    const selected = hubs.filter(h => selectedIPs.includes(h.ip));

    reply(buildStateUpdate(hubs, state))

    for (const hub of selected) {
        if (!state[hub.ip]) state[hub.ip] = { status: "PENDING", attempts: 0, lastAttempt: null };
        const previousVibration = state[hub.ip].vibrationStatus || "PENDING";
        state[hub.ip].vibrationStatus = "IN_PROGRESS";
        saveState(state);
        reply(buildStateUpdate(hubs, state));

        const result = await vibrationOn(hub);
        if (result === "VIB_ON_OK") {
            state[hub.ip].vibrationStatus = "VIB_ON";
            saveState(state);
            reply(buildStateUpdate(hubs, state));
        } else {
            state[hub.ip].vibrationStatus = previousVibration;
            saveState(state);
            const alreadyToggled = previousVibration === "VIB_ON" || previousVibration === "VIB_OFF";
            reply(buildStateUpdate(hubs, state, alreadyToggled ? { ip: hub.ip, field: "vibration" } : undefined));
        }
        console.log(`[VIB-ON] ${hub.name}: ${result}`);
    }
    return;
}
