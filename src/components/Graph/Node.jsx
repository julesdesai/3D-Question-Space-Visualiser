// src/components/Graph/Node.jsx
import React from 'react';
import { Html } from '@react-three/drei';

const Node = ({ position, summary, content, selected, onClick }) => {
  const color = selected ? '#6366f1' : '#60a5fa';

  const handleClick = (event) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <mesh position={position} onClick={handleClick}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={color} />
      <Html position={[0, 0.7, 0]}>
        <div style={{
          background: '#262626',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          fontFamily: 'Crimson Text, Georgia, serif',
          color: '#f5f5f5',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {summary}
        </div>
      </Html>
    </mesh>
  );
};

export default Node;