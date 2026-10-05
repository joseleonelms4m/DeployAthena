import * as XLSX from 'xlsx';

function cleanValue(value) {
    if (!value) return '-';

    // Si viene como HTML, convertirlo a texto
    const container = document.createElement('div');
    container.innerHTML = String(value);

    return container.textContent
        .replace(/\s+/g, ' ')
        .trim() || '-';
}

export function exportReport(hubs) {
    if (!hubs) {
        hubs = [];
    }

    const fecha = new Date();

    //const fechaReporte = fecha.toLocaleString('es-PE', {
       // dateStyle: 'short',
       // timeStyle: 'short'
    //});

    // Datos limpios para Excel
    const data = hubs.map((hub) => ({
        'Equipo': cleanValue(hub.name),
        'IP': cleanValue(hub.ip),
        'Estado': cleanValue(hub.statusBadge),
        'Último intento': cleanValue(hub.lastAttempt),
        'Deploy': cleanValue(hub.updateBadge),
        'PERCLOS': cleanValue(hub.perclosBadge),
        'Vibración': cleanValue(hub.vibrationBadge)
    }));

    // Crear hoja
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ancho de columnas
    worksheet['!cols'] = [
        { wch: 20 }, // Equipo
        { wch: 18 }, // IP
        { wch: 18 }, // Estado
        { wch: 22 }, // Último intento
        { wch: 20 }, // Deploy
        { wch: 20 }, // PERCLOS
        { wch: 20 }  // Vibración
    ];

    // Filtro automático
    if (worksheet['!ref']) {
        worksheet['!autofilter'] = {
            ref: worksheet['!ref']
        };
    }

    // Crear libro
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Reporte'
    );

    // Nombre del archivo
    const fechaArchivo = fecha.toISOString().slice(0, 10);

    const nombreArchivo =
        `Reporte_Deploy_Athena_${fechaArchivo}.xlsx`;

    // Descargar
    XLSX.writeFile(workbook, nombreArchivo);

    console.log(`Reporte generado: ${nombreArchivo}`);
}