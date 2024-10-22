import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div style={{
            width: '100%',
            backgroundColor: '#e0e0e0',
            borderRadius: '5px',
            overflow: 'hidden',
            margin: '10px 0'
        }}>
            <div style={{
                width: `${progress}%`,
                height: '10px',
                backgroundColor: '#76c7c0',
                transition: 'width 0.2s ease-in-out'
            }} />
        </div>
    );
};

export default ProgressBar;
