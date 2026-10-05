function StatusBadge({ status }) {
    const styles = {
        pending: {
            background: '#64748b',
            color: '#fff',
            label: 'PENDING',
        },
        success: {
            background: '#15803d',
            color: '#fff',
            label: 'OK',
        },
        error: {
            background: '#c2410c',
            color: '#fff',
            label: 'ERROR',
        },
    };

    const config = styles[status] || styles.pending;

    return (
        <span
            style={{
                background: config.background,
                color: config.color,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
            }}
        >
            {config.label}
        </span>
    );
}

export default StatusBadge;