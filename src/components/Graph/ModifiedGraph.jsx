// src/components/Graph/ModifiedGraph.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import EnhancedNode from './EnhancedNode';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';
import { useCoordinateSystem } from '../../hooks/useCoordinateSystem';
import { Vector2D, NodeBounds } from '../../lib/CoordinateSystem';

const ModifiedGraph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [graphElements, setGraphElements] = useState(null);

  // Initialize coordinate system
  const {
    updateNodeBounds,
    updateTransform,
    getConnections,
    setConnection,
    resetConnections
  } = useCoordinateSystem(data);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;

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
    console.log('New path:', newPath);
    
    setActivePath(prev => {
      console.log('Setting active path from:', prev, 'to:', newPath);
      return newPath;
    });
    
    setSelectedNode(data[nodeId]);
  }, [data, findPath]);

  const handleNodeRef = useCallback((id, element) => {
    if (!element || !(element instanceof HTMLElement)) return;
  
    const updateNodePosition = () => {
      try {
        const rect = element.getBoundingClientRect();
        const circleElement = element.querySelector('.node-circle');
        const circleBounds = circleElement?.getBoundingClientRect();
        
        if (!circleBounds) return;
  
        // Use the circle's center position
        const position = new Vector2D(
          circleBounds.left + circleBounds.width / 2,
          circleBounds.top + circleBounds.height / 2
        );
        
        const nodeBounds = new NodeBounds(
          position,
          circleBounds.width,
          circleBounds.height
        );
        
        updateNodeBounds(id, nodeBounds);
      } catch (error) {
        console.error('Error updating node position:', error);
      }
    };
  
    // Create observer for this element
    const observer = new ResizeObserver(updateNodePosition);
    observer.observe(element);
  
    // Initial position update
    requestAnimationFrame(updateNodePosition);
  
    // Cleanup
    return () => observer.disconnect();
  }, [updateNodeBounds]);

  // Update transform when scale or offset changes
  useEffect(() => {
    updateTransform(scale, containerOffset);
    
    // Update all node positions after transform changes
    Object.entries(data).forEach(([id, _]) => {
      const element = document.querySelector(`[data-node-id="${id}"]`);
      if (element) {
        const circleElement = element.querySelector('.node-circle');
        if (circleElement) {
          const circleBounds = circleElement.getBoundingClientRect();
          const position = new Vector2D(
            circleBounds.left + circleBounds.width / 2,
            circleBounds.top + circleBounds.height / 2
          );
          updateNodeBounds(id, new NodeBounds(position, circleBounds.width, circleBounds.height));
        }
      }
    });
  }, [scale, containerOffset, updateTransform, data, updateNodeBounds]);

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

  // Build the graph structure
  useEffect(() => {
    if (!data) return;

    // Helper function to create a tree representation of the graph
    const buildGraphTree = () => {
      // Find the root node (question node)
      const rootNode = Object.entries(data).find(([_, node]) => node.parent_id === null);
      if (!rootNode) return null;

      const [rootId] = rootNode;

      // Function to recursively build the tree
      const buildTree = (nodeId, depth = 0, x = 0, parentX = 0) => {
        const children = Object.entries(data)
          .filter(([_, node]) => node.parent_id === nodeId)
          .map(([id]) => id);

        // If it's a leaf node with no children
        if (children.length === 0) {
          return (
            <div key={nodeId} className="flex flex-col items-center">
              <EnhancedNode
                id={nodeId}
                data={data}
                onNodeClick={handleNodeClick}
                activePath={activePath}
                onNodeRef={handleNodeRef}
              />
            </div>
          );
        }

        // For nodes with children
        return (
          <div key={nodeId} className="flex flex-col items-center">
            <EnhancedNode
              id={nodeId}
              data={data}
              onNodeClick={handleNodeClick}
              activePath={activePath}
              onNodeRef={handleNodeRef}
            />
            <div className="pt-8 w-full">
              <div className="h-8 w-1 mx-auto bg-gray-700"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              {children.map((childId, idx) => (
                <div key={childId} className="flex flex-col items-center">
                  {buildTree(childId, depth + 1, idx, x)}
                </div>
              ))}
            </div>
          </div>
        );
      };

      return buildTree(rootId);
    };

    // Build the graph and set it
    setGraphElements(buildGraphTree());
  }, [data, activePath, handleNodeClick, handleNodeRef]);

  // Handle initial node selection
  useEffect(() => {
    if (data && !selectedNode) {
      // Find the question node to start with
      const questionNode = Object.entries(data).find(([_, node]) => node.node_type === 'question');
      if (questionNode) {
        handleNodeClick(questionNode[0]);
      }
    }
  }, [data, selectedNode, handleNodeClick]);

  return (
    <div className="h-screen w-full flex bg-[#171717]">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="w-full h-full overflow-hidden">
            {/* Main content with zoom/pan */}
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
                transformOrigin: '50% 50%'
              }}
            >
              <div className="h-full p-8 pt-24">
                <div className="flex flex-col items-center relative">
                  {/* Render the entire graph */}
                  {graphElements}
                </div>
              </div>
            </div>
          </div>

          {/* Info panel overlay - fixed to the left */}
          <div className="fixed bottom-5 left-5 font-serif text-gray-400 p-4 rounded-lg text-sm z-10 bg-neutral-800">
            <div>Click node to select</div>
            <div>Click and drag to pan</div>
            <div>Scroll to zoom</div>
            <div className="mt-2 text-xs text-gray-500">Scale: {scale.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedNode && (
        <div className="w-1/3 flex flex-col h-screen border-l border-gray-800 bg-[#171717]">
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="p-4">
                <h2 className="text-xl font-serif text-white mb-4">{selectedNode.summary}</h2>
                <ContentPanel node={selectedNode} />
              </div>
            </div>
          </div>
          
          <div className="h-1/2 flex flex-col min-h-0 border-t border-gray-800">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="p-4">
                <AncestryPanel node={selectedNode} graphData={data} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifiedGraph;