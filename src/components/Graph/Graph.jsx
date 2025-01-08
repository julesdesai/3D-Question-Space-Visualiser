// src/components/Graph/Graph.jsx
import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Node from './Node';
import Edge from './Edge';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';

const Graph = ({ data }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  const calculateNodePositions = useCallback(() => {
    const positions = {};
    const nodes = Object.entries(data);
    
    nodes.forEach(([id, node], index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = 5;
      positions[id] = [
        Math.cos(angle) * radius,
        node.depth * -2,
        Math.sin(angle) * radius,
      ];
    });
    
    return positions;
  }, [data]);

  const nodePositions = calculateNodePositions();

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      backgroundColor: '#1a1a1a'
    }}>
      {/* Graph container - left side */}
      <div style={{ 
        width: '70%', 
        height: '100%', 
        position: 'relative' 
      }}>
        <Canvas camera={{ position: [0, 5, 15], fov: 75 }}>
          <color attach="background" args={['#1a1a1a']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {Object.entries(data).map(([id, node]) => {
            if (node.parent_id) {
              return (
                <Edge
                  key={`edge-${id}`}
                  start={nodePositions[node.parent_id]}
                  end={nodePositions[id]}
                />
              );
            }
            return null;
          })}
          
          {Object.entries(data).map(([id, node]) => (
            <Node
              key={id}
              position={nodePositions[id]}
              summary={node.summary}
              content={node.content}
              selected={selectedNode === node}
              onClick={() => {
                console.log('Node clicked:', node.summary);
                setSelectedNode(node);
              }}
            />
          ))}
          
          <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Panels container - right side */}
      <div style={{ 
        width: '30%',
        height: '100%',
        borderLeft: '1px solid #333',
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <AncestryPanel node={selectedNode} graphData={data} />
        <ContentPanel node={selectedNode} />
      </div>
    </div>
  );
};

export default Graph;