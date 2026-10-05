import { Table, Checkbox } from 'antd';

function HubTable({
    hubs,
    selectedIPs,
    onSelectionChange
}) {

    const handleSelect = (ip) => {
        const exists = selectedIPs.includes(ip);

        if (exists) {
            onSelectionChange(
                selectedIPs.filter(item => item !== ip)
            );
        } else {
            onSelectionChange([
                ...selectedIPs,
                ip
            ]);
        }
    };

    const columns = [
        {
            title: '',
            key: 'selection',
            width: 45,
            align: 'center',
            render: (_, hub) => (
                <Checkbox
                    checked={selectedIPs.includes(hub.ip)}
                    onChange={() => handleSelect(hub.ip)}
                />
            )
        },
        {
            title: 'Equipo',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'IP',
            dataIndex: 'ip',
            key: 'ip'
        },
        {
            title: 'Deploy',
            key: 'deploy',
            render: (_, hub) => (
                <span
                    dangerouslySetInnerHTML={{
                        __html: hub.statusBadge
                    }}
                />
            )
        },
        {
            title: 'Último intento',
            dataIndex: 'lastAttempt',
            key: 'lastAttempt',
            className: 'last-attempt'
        },
        {
            title: 'Binario',
            key: 'binary',
            render: (_, hub) => (
                <span
                    dangerouslySetInnerHTML={{
                        __html: hub.updateBadge
                    }}
                />
            )
        },
        {
            title: 'PERCLOS',
            key: 'perclos',
            render: (_, hub) => (
                <span
                    dangerouslySetInnerHTML={{
                        __html: hub.perclosBadge
                    }}
                />
            )
        },
        {
            title: 'Vibración',
            key: 'vibration',
            render: (_, hub) => (
                <span
                    dangerouslySetInnerHTML={{
                        __html: hub.vibrationBadge
                    }}
                />
            )
        }
    ];

    return (
        <div className="table-container">

            <Table
                className="athena-table"
                columns={columns}
                dataSource={hubs}
                rowKey="ip"
                pagination={false}
                scroll={{
                    y: 430,
                    x: 'max-content'
                }}
            />

        </div>
    );
}

export default HubTable;