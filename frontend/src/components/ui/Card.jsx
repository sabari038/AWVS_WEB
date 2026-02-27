import React from 'react';

const Card = ({ title, children, style, action }) => {
    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            ...style
        }}>
            {title && (
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {title}
                    </h3>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
};

export default Card;
