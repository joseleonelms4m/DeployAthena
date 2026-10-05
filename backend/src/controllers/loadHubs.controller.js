import fs from "node:fs"
import { Tools } from "../tools/tools.js";
import { buildStateUpdate } from "./updatePage.controller.js";

const {parseCSV} = Tools

export function 
loadHubs(hubs, state, data, reply) {
    const csv = JSON.parse(data.hubs);
    fs.writeFile('./hubs.csv', csv, (err) => {
        if (err) {
            console.error('Error writing CSV file:', err);
            return;
        }

        const newHubs = parseCSV();

        console.log('HUBS DESPUÉS DE IMPORTAR:', newHubs);

        hubs.splice(0, hubs.length, ...newHubs);

        console.log('HUBS ORIGINALES ACTUALIZADOS:', hubs);

        reply(buildStateUpdate(hubs, state));
    });
}