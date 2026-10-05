import EquipmentRow from './EquipmentRow';

function EquipmentTable({
    hubs,
    selectedHubs,
    onSelect,
    shake,
}) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Equipo</th>
                        <th>IP</th>
                        <th>Deploy</th>
                        <th>Último intento</th>
                        <th>Binario</th>
                        <th>PERCLOS</th>
                        <th>Vibración</th>
                    </tr>
                </thead>

                <tbody>
                    {hubs.map((hub) => (
                        <EquipmentRow
                            key={hub.ip}
                            hub={hub}
                            selected={selectedHubs.includes(hub.ip)}
                            onSelect={onSelect}
                            shake={shake}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default EquipmentTable;