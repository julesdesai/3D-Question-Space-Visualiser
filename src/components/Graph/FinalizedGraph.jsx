// src/components/Graph/FinalizedGraph.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import EnhancedNode from './EnhancedNode';
import GraphConnections from './GraphConnections';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';
import { useCoordinateSystem } from '../../hooks/useCoordinateSystem';
import { Vector2D, NodeBounds } from '../../lib/CoordinateSystem';

const FinalizedGraph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connections, setConnections] = useState([]);
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});
  // State for panel visibility
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  // Initialize coordinate system
  const {
    updateNodeBounds,
    updateTransform,
    // eslint-disable-next-line no-unused-vars
    getConnections,
    // eslint-disable-next-line no-unused-vars
    setConnection,
    resetConnections
  } = useCoordinateSystem(data);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;

  // Find the root node (question)
  const rootNode = Object.entries(data || {}).find(([_, node]) => node.parent_id === null);
  const rootId = rootNode ? rootNode[0] : null;
  
  // Check if root is a question node
  const isQuestionRoot = rootId && data[rootId]?.node_type === 'question';

  // Create a stable reference for findPath
  const findPath = useCallback((targetId, path = []) => {
    if (!targetId) return path;
    const node = data[targetId];
    if (!node) return path;
    return findPath(node.parent_id, [targetId, ...path]);
  }, [data]);

  // Handle node click
  const handleNodeClick = useCallback((nodeId) => {
    console.log('Node clicked:', nodeId);
    const newPath = findPath(nodeId);
    
    setActivePath(newPath);
    setSelectedNode(data[nodeId]);
  }, [data, findPath]);

  // Update node references for position tracking
  const handleNodeRef = useCallback((id, element) => {
    if (!element || !(element instanceof HTMLElement)) return;
  
    const updateNodePosition = () => {
      try {
        const rect = element.getBoundingClientRect();
        
        // Calculate the center of the node
        const position = new Vector2D(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        
        const nodeBounds = new NodeBounds(
          position,
          rect.width,
          rect.height
        );
        
        updateNodeBounds(id, nodeBounds);
        
        // Store positions for connection drawing
        setNodePositions(prev => ({
          ...prev,
          [id]: { x: position.x, y: position.y }
        }));
      } catch (error) {
        console.error('Error updating node position:', error);
      }
    };
  
    // Use ResizeObserver to track size/position changes
    const observer = new ResizeObserver(updateNodePosition);
    observer.observe(element);
  
    // Initial position update
    requestAnimationFrame(updateNodePosition);
  
    // Cleanup
    return () => observer.disconnect();
  }, [updateNodeBounds]);

  // Update connections based on the current layout
  const updateConnections = useCallback(() => {
    if (!data) return;
    
    const newConnections = [];
    
    // Create connections for all parent-child relationships
    Object.entries(data).forEach(([childId, node]) => {
      const parentId = node.parent_id;
      if (!parentId) return; // Skip root node
      
      const sourcePos = nodePositions[parentId];
      const targetPos = nodePositions[childId];
      
      if (sourcePos && targetPos) {
        newConnections.push({
          from: sourcePos,
          to: targetPos,
          sourceId: parentId,
          targetId: childId,
          isReason: node.node_type === 'reason'
        });
      }
    });
    
    setConnections(newConnections);
  }, [data, nodePositions]);

  // Update transform when scale or offset changes
  useEffect(() => {
    updateTransform(scale, containerOffset);
    
    // After transform update, refresh connections
    updateConnections();
  }, [scale, containerOffset, updateTransform, updateConnections]);

  // Re-calculate connections when node positions change
  useEffect(() => {
    updateConnections();
  }, [nodePositions, updateConnections]);

  // Handle zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
    
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    const scaleChange = newScale - scale;
    const newX = containerOffset.x - ((x - containerOffset.x) * scaleChange / scale);
    const newY = containerOffset.y - ((y - containerOffset.y) * scaleChange / scale);
    
    setScale(newScale);
    setContainerOffset({ x: newX, y: newY });
  };

  // Handle panning
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - containerOffset.x,
      y: e.clientY - containerOffset.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setContainerOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set up mouse event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // Initial setup: center view and select question node
  useEffect(() => {
    if (!data || !containerRef.current) return;
    
    // Center the view
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    setContainerOffset({
      x: containerWidth / 2,
      y: containerHeight / 4
    });
    
    // Start with a smaller scale to see more nodes
    setScale(0.6);
    
    // Find and select question node
    const questionNode = Object.entries(data).find(([_, node]) => node.node_type === 'question');
    if (questionNode) {
      handleNodeClick(questionNode[0]);
    }
    
    // Reset connections
    resetConnections();
  }, [data, handleNodeClick, resetConnections]);

  // Improved spacing algorithm for dense graphs
  const calculateOptimalLayout = useCallback((nodeId, level = 0, siblingIndex = 0, totalSiblings = 1) => {
    if (!nodeId || !data[nodeId]) return {
      horizontalSpacing: 400,
      verticalSpacing: 200,
      siblingPositionFactor: 0,
      leafCount: 1,
      reasonNodes: [],
      otherChildren: []
    };
    
    // Get all children of this node
    const childNodes = Object.entries(data)
      .filter(([_, node]) => node.parent_id === nodeId)
      .map(([id]) => id);
    
    // Get reasons separately (to place above)
    const reasonNodes = childNodes.filter(id => data[id]?.node_type === 'reason');
    
    // Get non-reason children (to place below)
    const otherChildren = childNodes.filter(id => data[id]?.node_type !== 'reason');
    
    // Get number of leaf nodes for this subtree to determine width
    const getLeafCount = (id, memo = {}) => {
      if (!id || !data[id]) return 1;
      if (id in memo) return memo[id];
      
      const children = Object.entries(data)
        .filter(([_, node]) => node.parent_id === id && node.node_type !== 'reason')
        .map(([childId]) => childId);
      
      if (children.length === 0) {
        memo[id] = 1;
        return 1;
      }
      
      const count = children.reduce((sum, childId) => sum + getLeafCount(childId, memo), 0);
      memo[id] = Math.max(1, count); // Ensure minimum width of 1
      return memo[id];
    };
    
    // Width factors based on tree size and depth
    const leafCount = getLeafCount(nodeId);
    
    // Base width for each node, increases with depth to prevent overlap
    const nodeBaseWidth = 350 + (level * 50);
    
    // Scale width based on number of leaf nodes
    const leafScale = Math.min(1.2, 1 + (leafCount * 0.05));
    
    // Calculate width adjustment factor based on position in siblings
    const siblingPositionFactor = totalSiblings > 1 ? 
      (siblingIndex - (totalSiblings - 1) / 2) / (totalSiblings > 2 ? totalSiblings - 2 : 1) : 
      0;
    
    // Node horizontal spacing increases with tree width and depth
    const horizontalSpacing = nodeBaseWidth * leafScale;
    
    // Vertical spacing increases with depth for better visibility
    const verticalSpacing = 240 + (level * 30);
    
    return {
      horizontalSpacing,
      verticalSpacing,
      siblingPositionFactor,
      leafCount,
      reasonNodes,
      otherChildren
    };
  }, [data]);

  // Build the tree layout with improved spacing
  const renderTree = (nodeId, x = 0, y = 0, level = 0, siblingIndex = 0, totalSiblings = 1, isRoot = false, isQuestion = false) => {
    if (!nodeId || !data[nodeId]) return null;
    
    // If this is a question node, position it to the left of thesis nodes
    if (isQuestion) {
      // Find all thesis nodes
      const thesisNodes = Object.entries(data)
        .filter(([_, node]) => node.parent_id === nodeId)
        .map(([id]) => id);
      
      // Place the question node to the left
      return (
        <div 
          key={nodeId} 
          className="absolute transform transition-transform duration-300"
          style={{ 
            left: `-350px`, 
            top: `${y}px`
          }}
        >
          <EnhancedNode
            id={nodeId}
            data={data}
            onNodeClick={handleNodeClick}
            activePath={activePath}
            onNodeRef={handleNodeRef}
          />
          
          {/* Render thesis nodes to the right */}
          <div className="relative">
            {thesisNodes.map((thesisId, index) => {
              return renderTree(
                thesisId,
                400, // Position thesis nodes to the right of question
                index * 360 - ((thesisNodes.length - 1) * 180), // Distribute vertically
                level + 1,
                index,
                thesisNodes.length
              );
            })}
          </div>
        </div>
      );
    }
    
    // Get layout information for this node
    const layout = calculateOptimalLayout(nodeId, level, siblingIndex, totalSiblings);
    
    if (!layout) return null;
    
    const { 
      horizontalSpacing, 
      verticalSpacing, 
      siblingPositionFactor, 
      reasonNodes, 
      otherChildren 
    } = layout;
    
    // Position adjustment based on sibling position
    const siblingAdjustment = siblingPositionFactor * (horizontalSpacing * 0.5);
    const adjustedX = x + siblingAdjustment;
    
    return (
      <div 
        key={nodeId} 
        className="absolute transform transition-transform duration-300"
        style={{ 
          left: `${adjustedX}px`, 
          top: `${y}px`
        }}
      >
        {/* Render reason nodes above */}
        <div className="relative">
          {reasonNodes && reasonNodes.length > 0 && reasonNodes.map((reasonId, index) => {
            const reasonTotalWidth = reasonNodes.length * 250;
            const reasonStartX = -reasonTotalWidth / 2 + 125;
            const reasonX = reasonStartX + (index * 250);
            
            return (
              <div 
                key={reasonId} 
                className="absolute transform transition-transform duration-300"
                style={{ 
                  left: `${reasonX}px`, 
                  top: `-180px`
                }}
              >
                <EnhancedNode
                  id={reasonId}
                  data={data}
                  onNodeClick={handleNodeClick}
                  activePath={activePath}
                  onNodeRef={handleNodeRef}
                />
              </div>
            );
          })}
        </div>
        
        {/* Current node */}
        <EnhancedNode
          id={nodeId}
          data={data}
          onNodeClick={handleNodeClick}
          activePath={activePath}
          onNodeRef={handleNodeRef}
        />
        
        {/* Render non-reason children below */}
        <div className="relative">
          {otherChildren && otherChildren.length > 0 && otherChildren.map((childId, index) => {
            // Calculate total width needed for children
            const childLayout = calculateOptimalLayout(childId, level + 1);
            const childLeafCount = childLayout?.leafCount || 1;
            
            // Calculate child position
            const totalChildrenWidth = otherChildren.reduce((sum, id) => {
              const layout = calculateOptimalLayout(id, level + 1);
              return sum + (layout?.horizontalSpacing || 0) * (layout?.leafCount || 1);
            }, 0);
            
            // Calculate starting position
            let childrenStartX = -totalChildrenWidth / 2;
            
            // Calculate this child's position
            let childX = childrenStartX;
            for (let i = 0; i < index; i++) {
              const prevLayout = calculateOptimalLayout(otherChildren[i], level + 1);
              childX += (prevLayout?.horizontalSpacing || 0) * (prevLayout?.leafCount || 1);
            }
            
            // Center the child within its allocated space
            childX += (childLayout?.horizontalSpacing || 0) * childLeafCount / 2;
            
            return renderTree(
              childId,
              childX,
              verticalSpacing,
              level + 1,
              index,
              otherChildren.length
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex bg-white">
      <div className="relative flex-1 overflow-hidden">
        {/* Main graph area */}
        <div 
          className="absolute inset-0"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Connection lines */}
          <div
            className="w-full h-full"
            style={{ 
              transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              position: 'absolute',
              pointerEvents: 'none'
            }}
          >
            <GraphConnections connections={connections} />
          </div>
          
          {/* Zoomable/pannable content */}
          <div
            className="w-full h-full"
            style={{ 
              transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {rootId && renderTree(rootId, 0, 0, 0, 0, 1, true, isQuestionRoot)}
          </div>
          
          {/* Toggle panel button */}
          <button
            className="fixed top-5 right-5 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 text-sm z-10 shadow-md"
            onClick={() => setIsPanelVisible(!isPanelVisible)}
          >
            {isPanelVisible ? '≫ Hide Panel' : '≪ Show Panel'}
          </button>
          
          {/* Controls */}
          <div className="fixed bottom-5 left-5 bg-white p-4 rounded-lg shadow-lg z-10 flex flex-col gap-2">
            <div className="text-sm font-medium text-gray-700">Navigation Controls</div>
            <div className="text-xs text-gray-600">Click and drag to pan</div>
            <div className="text-xs text-gray-600">Scroll to zoom in/out</div>
            <div className="flex gap-2 mt-2">
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                onClick={() => setScale(prev => Math.min(prev + 0.1, MAX_SCALE))}
              >
                +
              </button>
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                onClick={() => setScale(prev => Math.max(prev - 0.1, MIN_SCALE))}
              >
                -
              </button>
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                onClick={() => {
                  if (containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth;
                    const containerHeight = containerRef.current.clientHeight;
                    setContainerOffset({
                      x: containerWidth / 2,
                      y: containerHeight / 4
                    });
                    setScale(0.6); // Start a bit more zoomed out to see more nodes
                  }
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Side panel with toggle functionality */}
      {selectedNode && isPanelVisible && (
        <div className="w-1/3 flex flex-col h-screen border-l border-gray-200 bg-white transition-all duration-300">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-serif text-gray-800">{selectedNode.summary}</h2>
            <div className="flex gap-2 mt-2">
              <div className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-700">
                {selectedNode.node_type}
              </div>
              {selectedNode.nonsense && (
                <div className="text-xs px-2 py-1 bg-red-100 rounded-full text-red-700">
                  Nonsense
                </div>
              )}
              {selectedNode.identical_to && (
                <div className="text-xs px-2 py-1 bg-blue-100 rounded-full text-blue-700">
                  Identical to another node
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="prose max-w-none">
              <ContentPanel node={selectedNode} />
            </div>
          </div>
          
          <div className="h-1/3 border-t border-gray-200 overflow-auto">
            <div className="p-4 bg-gray-50">
              <h3 className="text-lg font-serif text-gray-800">Ancestry Path</h3>
            </div>
            <div className="p-4">
              <AncestryPanel node={selectedNode} graphData={data} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalizedGraph;