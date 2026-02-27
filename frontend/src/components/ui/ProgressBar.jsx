import React from 'react';

const ProgressBar = ({ progress, color = 'var(--accent)', height = '8px', glow = true }) => {
    return (
        <div style={{
            width: '100%', height, backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '4px', overflow: 'hidden'
        }}>
            <div style={{
                width: `${Math.max(0, Math.min(100, progress))}%`, height: '100%',
                backgroundColor: color, transition: 'width 0.5s ease',
                boxShadow: glow ? `0 0 8px ${color}` : 'none'
            }} />
        </div>
    );
};

export default ProgressBar;
