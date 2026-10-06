import { Button, Space, App } from 'antd';

import {
    CheckSquareOutlined,
    RocketFilled,
    UploadOutlined,
    BellFilled,
    BellOutlined,
    DeleteOutlined
} from '@ant-design/icons';

function ActionBar({
    selectedIPs,
    onAction,
    onSelectAll,
    allSelected
}) {
    const disabled = selectedIPs.length === 0;
    
    const { modal } = App.useApp();

    const handleClearHubs = () => {
        modal.confirm({
            title: 'Limpiar equipos',
            content:
                'Se eliminarán todos los equipos de la lista actual de Athena. Esto no desinstala ni modifica nada en los equipos físicos. ¿Desea continuar?',
            okText: 'Sí, limpiar equipos',
            cancelText: 'Cancelar',
            okType: 'danger',
            centered: true,
            onOk: () => onAction('clear')
        });
    };

    return (
        <div className="actions">

            {/* Selección */}
            <div className="action-group selection-group">

                <Button
                    className="action-btn action-neutral"
                    icon={<CheckSquareOutlined />}
                    onClick={onSelectAll}
                >
                    {allSelected
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'
                    }
                </Button>

            </div>

            <div className="action-divider" />

            {/* Deployment */}
            <div className="action-group deploy-group">

                <span className="action-group-title">
                    Deployment
                </span>

                <Space size={6}>

                    <Button
                        className="action-btn action-info"
                        icon={<RocketFilled />}
                        disabled={disabled}
                        onClick={() => onAction('deploy')}
                    >
                        Deploy seleccionados
                    </Button>

                    <Button
                        className="action-btn action-info"
                        icon={<UploadOutlined />}
                        disabled={disabled}
                        onClick={() => onAction('update')}
                    >
                        Actualizar hub
                    </Button>

                </Space>

            </div>

            <div className="action-divider" />

            {/* PERCLOS */}
            <div className="action-group">

                <span className="action-group-title">
                    PERCLOS
                </span>

                <Space size={6}>

                    <Button
                        className="action-btn action-success"
                        disabled={disabled}
                        onClick={() => onAction('perclosOn')}
                    >
                        Activar
                    </Button>

                    <Button
                        className="action-btn action-danger"
                        disabled={disabled}
                        onClick={() => onAction('perclosOff')}
                    >
                        Desactivar
                    </Button>

                </Space>

            </div>

            <div className="action-divider" />

            {/* Vibración */}
            <div className="action-group">

                <span className="action-group-title">
                    Vibración
                </span>

                <Space size={6}>

                    <Button
                        className="action-btn action-info"
                        icon={<BellFilled />}
                        disabled={disabled}
                        onClick={() => onAction('vibrationOn')}
                    >
                        Activar
                    </Button>

                    <Button
                        className="action-btn action-neutral"
                        icon={<BellOutlined />}
                        disabled={disabled}
                        onClick={() => onAction('vibrationOff')}
                    >
                        Desactivar
                    </Button>

                </Space>

            </div>

            <div className="action-divider" />

            {/* Administración */}
            <div className="action-group">

                <span className="action-group-title">
                    Administración
                </span>

                <Button
                    className="action-btn action-danger"
                    icon={<DeleteOutlined />}
                    onClick={handleClearHubs}
                >
                    Limpiar equipos
                </Button>

            </div>

        </div>
    );
}

export default ActionBar;