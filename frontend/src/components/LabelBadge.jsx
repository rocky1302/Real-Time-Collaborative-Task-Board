import React from 'react';

export const LabelBadge = ({ name, color }) => {
    return (
        <span className="label-badge" style={{ backgroundColor: color || '#6366f1' }}>
            {name}
        </span>
    );
};
