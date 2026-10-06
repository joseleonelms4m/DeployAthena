import { useState } from 'react';
import { Card, Button, Space, Alert } from 'antd';

import {
    SettingOutlined,
    UploadOutlined,
    DownloadOutlined,
    CloseOutlined,
    FileExcelOutlined
} from '@ant-design/icons';

function FileManagement({
    hubs,
    onImport,
    onBinaryUpload,
    onExportReport,
}) {

    const [csvFile, setCsvFile] = useState(null);
    const [binaryFile, setBinaryFile] = useState(null);

    const [csvStatus, setCsvStatus] = useState(null);
    const [binaryStatus, setBinaryStatus] = useState(null);


    // =========================================================
    // EXPORTAR CSV
    // =========================================================

    const handleExportCsv = () => {

        let csvContent;

        if (hubs && hubs.length > 0) {

            const rows = hubs.map((hub) => {
                return `${hub.name},${hub.ip}`;
            });

            csvContent = [
                'name,ip',
                ...rows
            ].join('\n');

        } else {

            csvContent = [
                'name,ip',
                'nombre1,ip1',
                'nombre2,ip2',
                'nombre3,ip3',
                'nombre4,ip4',
                'nombre5,ip5',
                'nombre6,ip6',
                'nombre7,ip7',
                'nombre8,ip8',
                'nombre9,ip9',
                'nombre10,ip10'
            ].join('\n');
        }


        const blob = new Blob(
            [csvContent],
            {
                type: 'text/csv;charset=utf-8;'
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'hubs.csv';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };


    // =========================================================
    // CSV
    // =========================================================

    const handleCsvSelect = async (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setCsvFile(file);
        setCsvStatus(null);

        try {

            await onImport(file);

            setCsvStatus('success');

        } catch {

            setCsvStatus('error');

        } finally {

            setCsvFile(null);

            const input =
                document.getElementById('csv-file');

            if (input) {
                input.value = '';
            }
        }
    };


    // =========================================================
    // PAQUETE DE ACTUALIZACIÓN (.tar)
    // =========================================================

    const handleBinarySelect = (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }


        // -----------------------------------------------------
        // Validar extensión
        // -----------------------------------------------------

        if (!file.name.toLowerCase().endsWith('.tar')) {

            setBinaryFile(null);
            setBinaryStatus('invalid');

            event.target.value = '';

            return;
        }


        // -----------------------------------------------------
        // Guardar archivo localmente en FileManagement
        // -----------------------------------------------------

        setBinaryFile(file);
        setBinaryStatus(null);


        // -----------------------------------------------------
        // IMPORTANTE:
        // entregar el archivo a WsPage
        // -----------------------------------------------------

        if (onBinaryUpload) {

            console.log(
                '[UPDATE] Archivo .tar seleccionado:',
                file.name
            );

            console.log(
                '[UPDATE] Tamaño:',
                file.size,
                'bytes'
            );

            onBinaryUpload(file);
        }


        // -----------------------------------------------------
        // Permitir seleccionar nuevamente el mismo archivo
        // -----------------------------------------------------

        event.target.value = '';
    };


    // =========================================================
    // CANCELAR PAQUETE
    // =========================================================

    const handleCancelBinary = () => {

        setBinaryFile(null);
        setBinaryStatus(null);


        const input =
            document.getElementById('binary-file');

        if (input) {
            input.value = '';
        }


        // Avisar a WsPage que ya no hay archivo seleccionado
        if (onBinaryUpload) {
            onBinaryUpload(null);
        }
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <section className="import-section">

            <div className="section-heading">

                <div className="section-icon">
                    <SettingOutlined />
                </div>

                <div>
                    <h2>Configuración de equipos</h2>
                </div>

            </div>


            <div className="file-management">


                {/* =================================================
                    CSV
                ================================================= */}

                <Card
                    className="athena-card"
                    title={
                        <div>

                            <div className="athena-card-title">
                                Importar equipos
                            </div>

                            <div className="athena-card-description">
                                Carga los equipos desde un archivo CSV
                                (Puedes mirar el formato CSV antes).
                            </div>

                        </div>
                    }
                    extra={
                        <Space>

                            <Button
                                className="athena-btn athena-btn-yellow"
                                icon={<DownloadOutlined />}
                                onClick={handleExportCsv}
                            >
                                Formato CSV
                            </Button>


                            <input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                hidden
                                onChange={handleCsvSelect}
                            />


                            {!csvFile && (
                                <Button
                                    className="athena-btn athena-btn-yellow"
                                    icon={<UploadOutlined />}
                                    onClick={() =>
                                        document
                                            .getElementById('csv-file')
                                            .click()
                                    }
                                >
                                    Seleccionar CSV
                                </Button>
                            )}

                        </Space>
                    }
                >

                    {csvFile && (
                        <div className="selected-file">
                            Archivo seleccionado:{' '}
                            <strong>
                                {csvFile.name}
                            </strong>
                        </div>
                    )}


                    {csvStatus === 'success' && (
                        <Alert
                            className="file-status"
                            type="success"
                            showIcon
                            title="Archivo importado correctamente"
                        />
                    )}


                    {csvStatus === 'error' && (
                        <Alert
                            className="file-status"
                            type="error"
                            showIcon
                            title="No se pudo importar el archivo"
                        />
                    )}

                </Card>



                {/* =================================================
                    PAQUETE DE ACTUALIZACIÓN
                ================================================= */}

                <Card
                    className="athena-card"
                    title={
                        <div>

                            <div className="athena-card-title">
                                Importar actualización
                            </div>

                            <div className="athena-card-description">
                                Carga el paquete .tar que contiene la
                                actualización de Athena.
                            </div>

                        </div>
                    }
                    extra={
                        <Space>

                            <input
                                id="binary-file"
                                type="file"
                                accept=".tar,application/x-tar"
                                hidden
                                onChange={handleBinarySelect}
                            />


                            {!binaryFile ? (

                                <Button
                                    className="athena-btn athena-btn-yellow"
                                    icon={<UploadOutlined />}
                                    onClick={() =>
                                        document
                                            .getElementById('binary-file')
                                            .click()
                                    }
                                >
                                    Seleccionar .tar
                                </Button>

                            ) : (

                                <>

                                    <Button
                                        className="athena-btn athena-btn-yellow"
                                        onClick={() =>
                                            document
                                                .getElementById('binary-file')
                                                .click()
                                        }
                                    >
                                        {binaryFile.name}
                                    </Button>


                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={handleCancelBinary}
                                    >
                                        Cancelar
                                    </Button>

                                </>

                            )}

                        </Space>
                    }
                >

                    {binaryStatus === 'invalid' && (
                        <Alert
                            className="file-status"
                            type="warning"
                            showIcon
                            title="Archivo no válido"
                            description="Selecciona un paquete con extensión .tar."
                        />
                    )}

                </Card>



                {/* =================================================
                    EXPORTAR REPORTE
                ================================================= */}

                <Card
                    className="athena-card"
                    title={
                        <div>

                            <div className="athena-card-title">
                                Descargar reporte
                            </div>

                            <div className="athena-card-description">
                                Descarga el reporte actual de los equipos.
                            </div>

                        </div>
                    }
                    extra={
                        <Button
                            className="athena-btn athena-btn-yellow"
                            icon={<FileExcelOutlined />}
                            onClick={onExportReport}
                        >
                            Descargar reporte
                        </Button>
                    }
                />

            </div>

        </section>
    );
}

export default FileManagement;