// src/components/Graph/Node.jsx
import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const NODE_TYPES = {
  question: {
    color: '#2D3748',
    size: 0.4,
    selectedColor: '#4A5568',
    prefix: '(Q)'
  },
  thesis: {
    color: '#718096',
    size: 0.25,
    selectedColor: '#A0AEC0',
    prefix: '(T)'
  },
  synthesis: {
    color: '#A0AEC0',
    size: 0.25,
    selectedColor: '#CBD5E0',
    prefix: '(S)'
  },
  antithesis: {
    color: '#E2E8F0',
    size: 0.25,
    selectedColor: '#EDF2F7',
    prefix: '(A)'
  }
};

const Node = ({ position, summary, content, selected, onClick, node_type }) => {
  const nodeStyle = NODE_TYPES[node_type] || NODE_TYPES.thesis;
  const color = selected ? nodeStyle.selectedColor : nodeStyle.color;
  const htmlRef = useRef();
  const meshRef = useRef();

  useFrame(({ camera }) => {
    if (htmlRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.position);
      const opacity = 1 - Math.min(Math.max((distance - 8) / 15, 0), 0.8);
      htmlRef.current.style.opacity = opacity;
    }
  });

  const handleClick = (event) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <mesh position={position} onClick={handleClick} ref={meshRef}>
      <sphereGeometry args={[nodeStyle.size, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.7}
        metalness={0.3}
      />
      <Html position={[0, nodeStyle.size + 0.3, 0]}>
        <div 
          ref={htmlRef}
          onClick={handleClick}
          style={{
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
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            transform: 'translate(-50%, -50%)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#363636';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#262626';
          }}
        >
          <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{nodeStyle.prefix}</span>
          {summary}
        </div>
      </Html>
    </mesh>
  );
};

export default Node;