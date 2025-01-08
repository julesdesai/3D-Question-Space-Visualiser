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

const Node = ({ 
  position, 
  summary, 
  content, 
  node_type, 
  selected, 
  onClick,
  relationToSelected 
}) => {
  const nodeStyle = NODE_TYPES[node_type] || NODE_TYPES.thesis;
  const color = selected ? nodeStyle.selectedColor : nodeStyle.color;
  const htmlRef = useRef();
  const meshRef = useRef();

  // Calculate visibility based on relationship
  const isFamily = relationToSelected === 'parent' || 
                  relationToSelected === 'child' || 
                  relationToSelected === 'selected' ||
                  relationToSelected === 'sibling';

  useFrame(({ camera }) => {
    if (htmlRef.current && meshRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.position);
      
      // Make unrelated nodes very faint
      let opacity = isFamily ? 1 : 0.1;
      
      // Apply distance-based fading only to family nodes
      if (isFamily) {
        opacity *= 1 - Math.min(Math.max((distance - 8) / 15, 0), 0.5);
      }

      // Hide labels completely for non-family nodes
      htmlRef.current.style.opacity = isFamily ? opacity : 0;
      
      // Scale nodes based on relationship
      const scale = selected ? 1.2 : 
                   isFamily ? 1 : 0.5;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh
      position={position}
      onClick={onClick}
      ref={meshRef}
    >
      <sphereGeometry args={[nodeStyle.size, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        transparent
        opacity={isFamily ? 0.9 : 0.1}
        roughness={0.7}
        metalness={0.3}
      />
      <Html position={[0, nodeStyle.size + 0.3, 0]}>
        <div 
          ref={htmlRef}
          onClick={onClick}
          style={{
            background: '#262626',
            padding: '0.75rem 1rem',  // Increased padding
            borderRadius: '0.375rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontFamily: 'Crimson Text, Georgia, serif',
            color: '#f5f5f5',
            fontSize: '1rem',  // Increased font size
            whiteSpace: 'normal',  // Allow text to wrap
            maxWidth: '300px',     // Increased max width
            width: 'max-content',  // Adjust width to content
            minWidth: '200px',     // Minimum width
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            transform: `translate(-50%, -50%) scale(${selected ? 1.2 : 1})`,
            userSelect: 'none',
            display: isFamily ? 'block' : 'none',
            lineHeight: '1.4'      // Better line height for readability
          }}
          onMouseEnter={(e) => {
            if (isFamily) e.currentTarget.style.backgroundColor = '#363636';
          }}
          onMouseLeave={(e) => {
            if (isFamily) e.currentTarget.style.backgroundColor = '#262626';
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