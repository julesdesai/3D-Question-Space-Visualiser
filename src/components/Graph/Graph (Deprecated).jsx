// src/components/Graph/Graph.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Node from './Node';
import Edge from './Edge';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';

// Camera animation component
const CameraController = ({ targetPosition, enabled }) => {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls);

  useFrame(() => {
    if (enabled && controls && targetPosition) {
      const targetVector = new THREE.Vector3(...targetPosition);
      const currentDirection = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      
      // Adjust the height offset based on whether looking at root or child nodes
      const heightOffset = new THREE.Vector3(0, 2, 0);
      const targetDistance = 15;
      
      // Position camera to look slightly downward
      const targetCameraPos = targetVector.clone()
        .add(heightOffset)
        .add(new THREE.Vector3(
          currentDirection.x * targetDistance,
          Math.abs(currentDirection.y) * targetDistance * 0.7, // Reduce vertical component
          currentDirection.z * targetDistance
        ));

      camera.position.lerp(targetCameraPos, 0.05);
      controls.target.lerp(targetVector, 0.05);
      controls.update();
    }
  });

  return null;
};

// Scene setup component
const Scene = ({ nodes, edges, selectedNode, onNodeClick, cameraTarget, isAnimating }) => {
  const controlsRef = useRef();

  return (
    <>
      <CameraController targetPosition={cameraTarget} enabled={isAnimating} />
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <fog attach="fog" args={['#1a1a1a', 35, 50]} />
      
      {edges}
      {nodes}
      
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        maxDistance={100}
        minDistance={5}
      />
    </>
  );
};

const Graph = ({ data }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [cameraTarget, setCameraTarget] = useState([0, 0, 0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef();

  const getNodeChildren = useCallback((nodeId) => {
    return Object.entries(data).filter(([_, node]) => node.parent_id === nodeId);
  }, [data]);

  const calculateNodePositions = useCallback(() => {
    const positions = {};
    const rootNodes = Object.entries(data).filter(([_, node]) => node.parent_id === null);

    // Find root node
    const rootNode = rootNodes[0]?.[0] || null;

    // Improved hyperboloid parameters
    const params = {
      minRadius: 5,        // Minimum radius for the first level
      radiusGrowth: 1.5,   // How much radius increases per level
      levelHeight: 4,      // Vertical distance between levels
      siblingSpread: 1.2,  // Angular spread between siblings
      branchSpread: 0.8    // Angular spread between different branches
    };

    const calculateHyperboloidPosition = (depth, index, totalSiblings, parentPosition = null) => {
      // Calculate radius with exponential growth
      const radius = params.minRadius + (Math.pow(params.radiusGrowth, depth) - 1);
      
      let theta;
      if (parentPosition) {
        // For children, calculate angle relative to parent
        const parentTheta = Math.atan2(parentPosition[1], parentPosition[0]);
        // Spread siblings more evenly
        const spreadAngle = (params.siblingSpread * Math.PI) / Math.max(totalSiblings, 1);
        const offset = (index - (totalSiblings - 1) / 2) * spreadAngle;
        theta = parentTheta + offset * params.branchSpread;
      } else {
        // For root nodes, spread evenly in a half circle at the top
        theta = (Math.PI / 2) + ((index - (totalSiblings - 1) / 2) / totalSiblings) * Math.PI;
      }

      // Add slight randomization to prevent exact overlaps
      const jitter = 0.1;
      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        0
      );

      const basePosition = new THREE.Vector3(
        radius * Math.cos(theta),
        depth * params.levelHeight, // Y is now our depth direction
        radius * Math.sin(theta)    // Z is now our up direction
      );

      return basePosition.add(randomOffset).toArray();
    };

    // Improved tree building with better branch separation
    const buildTree = (nodeId, depth = 0, branchAngle = 0) => {
      const children = getNodeChildren(nodeId);
      const position = positions[nodeId];

      // Sort children to maintain consistent layout
      children.sort(([idA], [idB]) => idA.localeCompare(idB));

      children.forEach(([childId], index) => {
        const childPosition = calculateHyperboloidPosition(
          depth + 1,
          index,
          children.length,
          position
        );
        positions[childId] = childPosition;
        buildTree(childId, depth + 1, branchAngle + (index / children.length) * 2 * Math.PI);
      });
    };

    // Position root nodes and their subtrees
    rootNodes.forEach(([nodeId], index) => {
      positions[nodeId] = calculateHyperboloidPosition(0, index, rootNodes.length);
      buildTree(nodeId);
    });

    return positions;
  }, [data, getNodeChildren]);

  const nodePositions = calculateNodePositions();

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    const nodeId = Object.keys(data).find(key => data[key] === node);
    const position = nodePositions[nodeId];
    
    if (position) {
      setCameraTarget(position);
      setIsAnimating(true);  // Always keep animation enabled
    }
  }, [data, nodePositions]);

  const getRelationToSelected = useCallback((node) => {
    if (!selectedNode) return null;
    if (node === selectedNode) return 'selected';
    if (node.parent_id === selectedNode.parent_id) return 'sibling';
    if (node.parent_id && data[node.parent_id] === selectedNode) return 'child';
    if (selectedNode.parent_id && data[selectedNode.parent_id] === node) return 'parent';
    return null;
  }, [selectedNode, data]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'c' || event.key === 'C') {
      // Find root node and focus on it
      const rootNode = Object.values(data).find(node => node.parent_id === null);
      if (rootNode) {
        handleNodeClick(rootNode);
      }
      return;
    }

    if (selectedNode) {
      const currentNodeId = Object.keys(data).find(key => data[key] === selectedNode);
      let nextNode = null;

      switch (event.key) {
        case 'ArrowUp':
          if (selectedNode.parent_id) {
            nextNode = data[selectedNode.parent_id];
          }
          break;
        case 'ArrowDown':
          const children = getNodeChildren(currentNodeId);
          if (children.length > 0) {
            nextNode = data[children[0][0]];
          }
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          const siblings = Object.entries(data)
            .filter(([_, node]) => node.parent_id === selectedNode.parent_id)
            .map(([id, node]) => node);
          const currentIndex = siblings.indexOf(selectedNode);
          const nextIndex = event.key === 'ArrowLeft' 
            ? (currentIndex - 1 + siblings.length) % siblings.length
            : (currentIndex + 1) % siblings.length;
          nextNode = siblings[nextIndex];
          break;
      }

      if (nextNode) {
        handleNodeClick(nextNode);
      }
    }
  }, [selectedNode, data, getNodeChildren, handleNodeClick]);

  useEffect(() => {
    // Find root node on mount
    const rootNode = Object.values(data).find(node => node.parent_id === null);
    if (rootNode) {
      handleNodeClick(rootNode);
    }
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []); // Empty dependency array means this runs once on mount

  const edges = Object.entries(data).map(([id, node]) => {
    if (node.parent_id) {
      const isRelated = selectedNode && (
        node === selectedNode ||
        data[node.parent_id] === selectedNode ||
        node.parent_id === selectedNode.parent_id
      );
      
      return (
        <Edge
          key={`edge-${id}`}
          start={nodePositions[node.parent_id]}
          end={nodePositions[id]}
          isRelated={isRelated}
        />
      );
    }
    return null;
  });

  const nodes = Object.entries(data).map(([id, node]) => (
    <Node
      key={id}
      position={nodePositions[id]}
      summary={node.summary}
      content={node.content}
      node_type={node.node_type}
      selected={selectedNode === node}
      relationToSelected={getRelationToSelected(node)}
      onClick={() => handleNodeClick(node)}
    />
  ));

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex',
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',  // Prevent scrolling
        position: 'fixed',   // Fix the container
        top: 0,
        left: 0
      }}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      <div style={{ 
        width: '70%', 
        height: '100%', 
        position: 'relative' 
      }}>
        <Canvas
          camera={{ 
            position: [20, 20, 20], 
            fov: 50
          }}
        >
          <Scene
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
            cameraTarget={cameraTarget}
            isAnimating={isAnimating}
          />
        </Canvas>

        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: '#666',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <div>Click node to focus</div>
          <div>Arrow keys to navigate:</div>
          <div>↑ Parent | ↓ Child</div>
          <div>← → Between siblings</div>
          <div>Press 'C' to center on root</div>
          <div>Drag to rotate | Scroll to zoom</div>
        </div>
      </div>

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