import { useState } from 'react';
import { Alert } from 'antd';

import Header from '../components/Header';
import Loader from '../components/Loader';
import FileManagement from '../components/FileManagement';
import DevicesSection from '../components/DevicesSection';
import Terminal from '../components/Terminal';
import { exportReport } from '../services/reportExport';
import { useHubSocket } from '../hooks/useHubSocket';
import ImportStatus from '../components/ImportStatus';

function WsPage() {

    const {
        hubs,
        shake,
        loading,
        connected,
        executeTask
    } = useHubSocket();

    const [importedHubs] = useState([]);
    const [selectedIPs, setSelectedIPs] = useState([]);
    const [logs, setLogs] = useState([]);
    
    const [importStatus, setImportStatus] = useState(null);
    const [importErrors, setImportErrors] = useState([]);

    const displayedHubs = importedHubs.length > 0
        ? importedHubs
        : hubs;

    const handleAction = (task) => {
    if (task === 'clear') {
        executeTask('clear', []);
        setSelectedIPs([]);
        return;
    }

    executeTask(task, selectedIPs);
};


    const handleCloseImportStatus = () => {
        setImportStatus(null);
        setImportErrors([]);
    };



    const handleImport = async (file) => {
    setImportStatus('validating');
    setImportErrors([]);

    try {
        const csvContent = await file.text();

        const lines = csvContent
            .split(/\r?\n/)
            .filter(line => line.trim());

        const errors = [];

        // Verificar que exista contenido
        if (lines.length === 0) {
            errors.push({
                position: 1,
                name: '',
                ip: '',
                message: 'El archivo CSV está vacío.'
            });
        }

        // Verificar encabezado
        if (lines.length > 0) {
            const header = lines[0]
                .split(',')
                .map(value => value.trim().toLowerCase());

            if (
                header.length < 2 ||
                header[0] !== 'name' ||
                header[1] !== 'ip'
            ) {
                errors.push({
                    position: 1,
                    name: '',
                    ip: '',
                    message:
                        'El encabezado debe tener el formato: name,ip'
                });
            }
        }

        // Validar todas las filas
        const dataLines = lines.slice(1);

        for (let i = 0; i < dataLines.length; i++) {
            const position = i + 2;

            const [name, ip] = dataLines[i].split(',');

            const equipo = name?.trim() || '';
            const direccionIP = ip?.trim() || '';

            // Nombre vacío
            if (!equipo) {
                errors.push({
                    position,
                    name: 'Sin nombre',
                    ip: direccionIP,
                    message: 'El nombre del equipo está vacío.'
                });
            }

            // IP inválida
            if (!isValidIP(direccionIP)) {
                errors.push({
                    position,
                    name: equipo || 'Sin nombre',
                    ip: direccionIP,
                    message: direccionIP
                        ? 'No es una IP válida.'
                        : 'La IP está vacía.'
                });
            }
        }

        // Si existen errores, no importamos
        if (errors.length > 0) {
            setImportErrors(errors);
            setImportStatus('error');
            return;
        }

        // CSV correcto
        setImportStatus('importing');

        executeTask(
            'import',
            JSON.stringify(csvContent),
            () => {
                setImportStatus('success');
            }
        );

    } catch (error) {
        console.error('Error importando CSV:', error);

        setImportErrors([
            {
                position: '-',
                name: '-',
                ip: '-',
                message: 'No fue posible leer el archivo CSV.'
            }
        ]);

        setImportStatus('error');
    }
};


    const handleClearTerminal = () => {
        setLogs([]);
    };

    return (
        <>
            {loading && <Loader />}

            <main className="app-container">

                <Header />
                <ImportStatus
                    status={importStatus}
                    errors={importErrors}
                    onClose={handleCloseImportStatus}
                />

                {!connected && !loading && (
                    <Alert
                        title="Desconectado del servidor"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 20 }}
                    />
                )}

                <FileManagement
                    hubs={displayedHubs}
                    onImport={handleImport}
                    onBinaryUpload={(file) => {
                        console.log('Binary:', file);
                    }}
                    onExportPdf={() => {
                        console.log('Export PDF');
                    }}
                    onExportReport={() => exportReport(hubs)}
                />

                <DevicesSection
                    hubs={displayedHubs}
                    shake={shake}
                    selectedIPs={selectedIPs}
                    onSelectionChange={setSelectedIPs}
                    onAction={handleAction}
                />

                <Terminal
                    logs={logs}
                    onClear={handleClearTerminal}
                />

            </main>
        </>
    );
}

function isValidIP(ip) {
    if (!ip || !ip.trim()) {
        return false;
    }

    const parts = ip.trim().split('.');

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {
        if (part === '' || !/^\d+$/.test(part)) {
            return false;
        }

        const number = Number(part);

        return number >= 0 && number <= 255;
    });
}


export default WsPage;