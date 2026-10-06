import fs from "node:fs";
import { buildStateUpdate } from "./updatePage.controller.js";

export function clearHubs(hubs, state, reply) {

    const emptyCsv = "name,ip\n";

    fs.writeFile("./hubs.csv", emptyCsv, (err) => {

        if (err) {
            console.error("Error limpiando hubs.csv:", err);
            return;
        }

        // Vaciar completamente el array original
        hubs.splice(0, hubs.length);

        console.log("========== CLEAR ==========");
        console.log("Hubs después de limpiar:", hubs);
        console.log("Cantidad:", hubs.length);

        const response = buildStateUpdate(hubs, state);

        console.log("Respuesta enviada al frontend:");
        console.log(JSON.stringify(response, null, 2));

        console.log("============================");

        reply(response);
    });
}