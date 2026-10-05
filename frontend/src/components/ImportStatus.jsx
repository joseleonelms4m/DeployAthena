import {
    Modal,
    Alert,
    Spin,
    Typography,
    List,
    Space,
    Button
} from 'antd';


const { Text } = Typography;

function ImportStatus({ status, errors = [], onClose }) {

    if (!status) {
        return null;
    }

    const isProcessing =
        status === 'validating' ||
        status === 'importing';

    return (
        <Modal
            open
            centered
            width={520}
            closable={false}
            maskClosable={!isProcessing}
            onCancel={onClose}
            footer={null}
            className="import-status-modal"
        >

            {/* PROCESANDO */}
            {isProcessing && (
                <div className="import-status-content">

                    <div className="import-status-icon processing">
                        <Spin size="small" />
                    </div>

                    <div className="import-status-info">
                        <Typography.Title level={5}>
                            {status === 'validating'
                                ? 'Validando archivo'
                                : 'Importando equipos'}
                        </Typography.Title>

                        <Text>
                            {status === 'validating'
                                ? 'Estamos revisando el formato y las IP de todos los equipos...'
                                : 'El archivo es válido. Estamos importando los equipos...'}
                        </Text>
                    </div>

                </div>
            )}

            {/* ÉXITO */}
            {status === 'success' && (
                <div className="import-status-result success">
                    <Typography.Text className="import-error-title"> Importación completada </Typography.Text>

                    <Alert
                        type="success"
                        showIcon
                        description="Los equipos fueron importados correctamente."
                    />

                    <Button
                        className="import-status-button"
                        onClick={onClose}
                    >
                        Cerrar
                    </Button>

                </div>
            )}

            {/* ERROR */}
            {status === 'error' && (
                <div className="import-status-result">

                    <Typography.Text className="import-error-title"> No fue posible importar el archivo </Typography.Text>
                    <Alert
                    
                        type="error"
                        showIcon
                        description={`Se encontraron ${errors.length} ${
                            errors.length === 1
                                ? 'error'
                                : 'errores'
                        }.`}
                    />

                    <List
                        bordered
                        size="small"
                        dataSource={errors}
                        className="import-status-errors"
                        renderItem={(error) => (
                            <List.Item>
                                <Space
                                    direction="vertical"
                                    size={2}
                                    style={{ width: '100%' }}
                                >
                                    <Text strong>
                                        Equipo: {error.name || 'Sin nombre'}
                                    </Text>

                                    <Text>
                                        Posición: {error.position}
                                    </Text>

                                    <Text>
                                        IP: {error.ip || 'Vacía'}
                                    </Text>

                                    <Text type="danger">
                                        {error.message}
                                    </Text>
                                </Space>
                            </List.Item>
                        )}
                    />

                    <Button
                        className="import-status-button"
                        onClick={onClose}
                    >
                        Cerrar
                    </Button>

                </div>
            )}

        </Modal>
    );
}

export default ImportStatus;

