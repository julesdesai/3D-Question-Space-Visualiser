// src/components/Graph/Edge.jsx
import React from 'react';
import * as THREE from 'three';

const Edge = ({ start, end }) => {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ];
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#999999" />
    </line>
  );
};

export default Edge;