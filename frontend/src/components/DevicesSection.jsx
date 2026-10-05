import { useMemo, useState } from 'react';
import { Input } from 'antd';
import {
    ProductOutlined,
    SearchOutlined
} from '@ant-design/icons';

import HubTable from './HubTable';
import ActionBar from './ActionBar';

function DevicesSection({
    hubs,
    shake,
    selectedIPs,
    onSelectionChange,
    onAction
}) {

    const [search, setSearch] = useState('');

    const filteredHubs = useMemo(() => {

        const value = search.toLowerCase().trim();

        if (!value) {
            return hubs;
        }

        return hubs.filter((hub) =>
            hub.name?.toLowerCase().includes(value) ||
            hub.ip?.toLowerCase().includes(value)
        );

    }, [hubs, search]);

    const allSelected =
        hubs.length > 0 &&
        selectedIPs.length === hubs.length;

    const handleSelectAll = () => {

        if (allSelected) {
            onSelectionChange([]);
            return;
        }

        onSelectionChange(
            hubs.map(hub => hub.ip)
        );
    };

    return (
        <section className="devices-section">
            <div className="devices-top">
                <div className="section-heading devices-heading">
                    <div className="section-icon">
                        <ProductOutlined />
                    </div>
                    <div>
                        <h2>Equipos</h2>
                    </div>
                </div>
                <Input
                    className="table-search"
                    prefix={<SearchOutlined />}
                    placeholder="Buscar equipo o IP..."
                    autoComplete="off"
                    allowClear
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />
            </div>
            <HubTable
                hubs={filteredHubs}
                shake={shake}
                selectedIPs={selectedIPs}
                onSelectionChange={onSelectionChange}
            />
            <ActionBar
                selectedIPs={selectedIPs}
                onAction={onAction}
                onSelectAll={handleSelectAll}
                allSelected={allSelected}
            />
        </section>
    );
}

export default DevicesSection;