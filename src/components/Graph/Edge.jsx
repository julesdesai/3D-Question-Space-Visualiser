// src/components/Graph/Edge.jsx
import React from 'react';
import * as THREE from 'three';

const Edge = ({ start, end, isRelated }) => {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ];
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial 
        color={isRelated ? "#4a5568" : "#2a2a2a"}
        linewidth={2} 
        opacity={isRelated ? 0.8 : 0.1} 
        transparent={true} 
      />
    </line>
  );
};

export default Edge;