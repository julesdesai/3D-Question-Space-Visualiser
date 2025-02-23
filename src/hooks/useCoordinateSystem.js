// src/hooks/useCoordinateSystem.js

import { useRef, useCallback, useEffect } from 'react';
import { CoordinateSystem, ConnectionManager, Vector2D, NodeBounds } from '../lib/CoordinateSystem';

export function useCoordinateSystem(graphData) {
  const coordSystemRef = useRef(null);
  const connectionManagerRef = useRef(null);

  // Initialize systems if they don't exist
  if (!coordSystemRef.current) {
    console.log('Initializing coordinate system');
    coordSystemRef.current = new CoordinateSystem();
  }
  if (!connectionManagerRef.current) {
    console.log('Initializing connection manager');
    connectionManagerRef.current = new ConnectionManager(coordSystemRef.current);
  }

  // Update node bounds in the coordinate system
  const updateNodeBounds = useCallback((nodeId, element) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const position = new Vector2D(rect.left, rect.top);
    const bounds = new NodeBounds(position, rect.width, rect.height);
    
    console.log(`Setting bounds for node ${nodeId}:`, bounds);
    coordSystemRef.current.setNodeBounds(nodeId, bounds);

    // After updating bounds, refresh connections for this node
    if (connectionManagerRef.current) {
      connectionManagerRef.current.updateNodeConnections(nodeId);
    }
  }, []);

  // Update transform (scale and offset)
  const updateTransform = useCallback((scale, offset) => {
    coordSystemRef.current.updateTransform(scale, new Vector2D(offset.x, offset.y));
  }, []);

  // Set up a connection between nodes
  const setConnection = useCallback((sourceId, targetId, type) => {
    console.log(`Setting up ${type} connection from ${sourceId} to ${targetId}`);
    connectionManagerRef.current.setConnection(sourceId, targetId, type);
  }, []);

  // Reset all connections
  const resetConnections = useCallback(() => {
    console.log('Resetting all connections');
    connectionManagerRef.current.clear();
  }, []);

  // Initialize connections when graph data changes
  useEffect(() => {
    console.log('Setting up initial connections');
    resetConnections();

    // Set up reason connections
    Object.entries(graphData)
      .filter(([_, node]) => node.node_type === 'reason')
      .forEach(([id, node]) => {
        console.log(`Creating reason connection: ${id} -> ${node.parent_id}`);
        setConnection(id, node.parent_id, 'reason');
      });

    // Set up identical connections
    Object.entries(graphData)
      .filter(([_, node]) => node.identical_to)
      .forEach(([id, node]) => {
        console.log(`Creating identical connection: ${id} -> ${node.identical_to}`);
        setConnection(id, node.identical_to, 'identical');
      });
  }, [graphData, setConnection, resetConnections]);

  // Get current connections
  const getConnections = useCallback(() => {
    const connections = connectionManagerRef.current.getScreenConnections();
    console.log('Current connections:', connections);
    return connections;
  }, []);

  return {
    updateNodeBounds,
    updateTransform,
    getConnections,
    setConnection,
    resetConnections
  };
}