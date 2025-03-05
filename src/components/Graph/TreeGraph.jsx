// src/components/Graph/TreeGraph.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import EnhancedNode from './EnhancedNode';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';
import { useCoordinateSystem } from '../../hooks/useCoordinateSystem';
import { Vector2D, NodeBounds } from '../../lib/CoordinateSystem';

const TreeGraph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8); // Start with a bit of zoom out to see more
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize coordinate system
  const {
    updateNodeBounds,
    updateTransform,
    getConnections,
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
    
    setActivePath(newPath);
    setSelectedNode(data[nodeId]);
  }, [data, findPath]);

  const handleNodeRef = useCallback((id, element) => {
    if (!element || !(element instanceof HTMLElement)) return;
  
    const updateNodePosition = () => {
      try {
        const rect = element.getBoundingClientRect();
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
  }, [scale, containerOffset, updateTransform]);

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

  // Initialize with a centered view
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Center the view and position it near the top
      setContainerOffset({
        x: containerWidth / 2,
        y: containerHeight / 4 // Start closer to the top to see the tree grow down
      });

      // Find the question node to highlight initially
      const questionNode = Object.entries(data).find(([_, node]) => node.node_type === 'question');
      if (questionNode) {
        handleNodeClick(questionNode[0]);
      }
    }
  }, [handleNodeClick, data]);

  // Reset connections on mount
  useEffect(() => {
    resetConnections();
  }, [resetConnections]);

  // Render node tree recursively
  const renderNodes = (nodeId, parentX = 0, depth = 0) => {
    if (!nodeId || !data[nodeId]) return null;
    
    // Get all children of this node
    const childNodes = Object.entries(data)
      .filter(([_, node]) => node.parent_id === nodeId)
      .map(([id]) => id);
    
    // Calculate spacing based on number of children
    const childSpacing = childNodes.length > 3 ? "gap-12" : "gap-24";
    
    return (
      <div key={nodeId} className="flex flex-col items-center">
        <EnhancedNode
          id={nodeId}
          data={data}
          onNodeClick={handleNodeClick}
          activePath={activePath}
          onNodeRef={handleNodeRef}
        />
        
        {childNodes.length > 0 && (
          <>
            {/* Vertical connection line */}
            <div className="h-12 w-1 bg-gray-400"></div>
            
            {/* Horizontal line if more than one child */}
            {childNodes.length > 1 && (
              <div className="relative">
                <div className="h-1 bg-gray-400" style={{ width: `${(childNodes.length - 1) * 120}px` }}></div>
                
                {/* Vertical connectors for each child */}
                <div className={`flex ${childSpacing} absolute -left-12 -top-0.5`}>
                  {childNodes.map((_, i) => (
                    <div key={i} className="h-6 w-1 bg-gray-400"></div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Children */}
            <div className={`flex ${childSpacing} mt-6`}>
              {childNodes.map((childId, index) => (
                <div key={childId} className="flex flex-col items-center">
                  {renderNodes(childId, parentX + index, depth + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Find the root node (usually the question)
  const rootNode = Object.entries(data).find(([_, node]) => node.parent_id === null);
  const rootId = rootNode ? rootNode[0] : null;

  return (
    <div className="h-screen w-full flex bg-[#171717]">
      <div className="relative flex-1 overflow-hidden">
        <div 
          className="absolute inset-0"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="w-full h-full overflow-hidden">
            {/* Main content with zoom/pan */}
            <div
              className="w-full h-full p-16 transition-transform duration-100"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
                transformOrigin: '0 0'
              }}
            >
              {rootId && renderNodes(rootId)}
            </div>
          </div>

          {/* Zoom and pan controls */}
          <div className="fixed bottom-5 left-5 font-serif text-gray-400 p-4 rounded-lg text-sm z-10 bg-neutral-800">
            <div>Click node to select</div>
            <div>Click and drag to pan</div>
            <div>Scroll to zoom</div>
            <div className="mt-2 text-xs text-gray-500">Scale: {scale.toFixed(2)}</div>
          </div>
          
          {/* Zoom buttons */}
          <div className="fixed bottom-5 right-5 flex gap-2 z-10">
            <button 
              className="bg-neutral-800 text-white p-2 rounded-lg hover:bg-neutral-700"
              onClick={() => setScale(prev => Math.min(prev + 0.1, MAX_SCALE))}
            >
              +
            </button>
            <button 
              className="bg-neutral-800 text-white p-2 rounded-lg hover:bg-neutral-700"
              onClick={() => setScale(prev => Math.max(prev - 0.1, MIN_SCALE))}
            >
              -
            </button>
          </div>
          
          {/* Reset view button */}
          <button 
            className="fixed top-5 right-5 bg-neutral-800 text-white py-1 px-3 rounded-lg hover:bg-neutral-700 text-sm z-10"
            onClick={() => {
              if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;
                setContainerOffset({
                  x: containerWidth / 2,
                  y: containerHeight / 4
                });
                setScale(0.8);
              }
            }}
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Side panel for selected node details */}
      {selectedNode && (
        <div className="w-1/3 flex flex-col h-screen border-l border-gray-800 bg-[#171717] overflow-hidden">
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="p-4 bg-neutral-800">
              <h2 className="text-xl font-serif text-white">{selectedNode.summary}</h2>
              <div className="text-xs text-gray-400 mt-1">
                Type: {selectedNode.node_type}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ContentPanel node={selectedNode} />
            </div>
          </div>
          
          <div className="h-1/2 flex flex-col min-h-0 border-t border-gray-800">
            <div className="p-4 bg-neutral-800">
              <h3 className="text-lg font-serif text-white">Path & Ancestry</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AncestryPanel node={selectedNode} graphData={data} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeGraph;