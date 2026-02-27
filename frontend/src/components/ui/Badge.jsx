import React from 'react';

const Badge = ({ children, severity, style }) => {
    const colors = {
        critical: 'var(--critical)',
        high: 'var(--high)',
        medium: 'var(--medium)',
        low: 'var(--low)',
        fp: 'var(--fp)'
    };

    const color = colors[severity?.toLowerCase()] || 'var(--text-secondary)';
    const isFP = severity?.toLowerCase() === 'fp';

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            color: color, backgroundColor: `${color}25`, border: `1px solid ${color}`,
            ...style
        }}>
            {isFP && <span style={{ fontSize: '10px' }}>✓</span>}
            {children}
        </span>
    );
};

export default Badge;
