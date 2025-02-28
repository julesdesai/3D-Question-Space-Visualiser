import { useState, useEffect, useRef, useCallback } from 'react';
// Use the FilteredNode component to ensure reason nodes are excluded
import FilteredNode from './FilteredNode';
import BasicReasonCloud from './BasicReasonCloud';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';
import { useCoordinateSystem } from '../../hooks/useCoordinateSystem';
import { Vector2D, NodeBounds } from '../../lib/CoordinateSystem';

const Graph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  // Remove unused selectedNodeId state
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Find the question node and thesis nodes
  const questionNode = Object.entries(data).find(([_, node]) => node.node_type === 'question');
  const thesisNodes = Object.entries(data)
    .filter(([_, node]) => node.node_type === 'thesis' && node.parent_id === questionNode?.[0])
    .map(([id]) => id);

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

  // Handle initial thesis node selection
  useEffect(() => {
    if (thesisNodes.length > 0 && !selectedNode) {
      handleNodeClick(thesisNodes[0]);
    }
  }, [thesisNodes, handleNodeClick, selectedNode]);

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback((e) => {
    if (!selectedNode) return;

    const currentId = Object.entries(data).find(([_, n]) => n === selectedNode)?.[0];
    if (!currentId) return;

    let nextId = null;

    switch (e.key) {
      case 'ArrowUp': {
        const parent = data[currentId]?.parent_id;
        if (parent) {
          nextId = parent;
        }
        break;
      }
      case 'ArrowDown': {
        const children = Object.entries(data)
          .filter(([_, n]) => n.parent_id === currentId && n.node_type !== 'reason')
          .map(([id]) => id);
        if (children.length > 0) {
          nextId = children[0];
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const siblings = Object.entries(data)
          .filter(([_, n]) => n.parent_id === data[currentId]?.parent_id && n.node_type !== 'reason')
          .map(([id]) => id);
        const currentIndex = siblings.indexOf(currentId);
        if (currentIndex !== -1) {
          const newIndex = e.key === 'ArrowLeft'
            ? (currentIndex - 1 + siblings.length) % siblings.length
            : (currentIndex + 1) % siblings.length;
          nextId = siblings[newIndex];
        }
        break;
      }
      default:
        break;
    }

    if (nextId) {
      handleNodeClick(nextId);
    }
  }, [selectedNode, data, handleNodeClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [handleKeyNavigation]);

  // We're not using connections in this version, but getting them for future use
  getConnections();

// We've removed the initial setup of reason connections as requested
// This will be addressed in a future update
useEffect(() => {
  // Wait for nodes to be registered
  if (!data) return;

  console.log('Setting up initial connections');
  resetConnections();
  
  // No reason node connections - reasons are only shown in the cloud
  // but not in the dialectical chain
}, [data, resetConnections]);

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
            {/* Question in header - moved outside the transform to keep in foreground */}
            <div className="fixed top-20 left-0 right-0 text-center z-20">
              <h1 className="text-2xl font-serif text-neutral-200 bg-[#171717] bg-opacity-80 px-4 py-2 inline-block rounded-lg">
                {questionNode?.[1].summary}
              </h1>
            </div>

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
                  {/* Connections removed as requested */}
                  {/* We'll address connections in a future update */}

                  {/* Thesis nodes and their descendants */}
                  <div className="flex gap-12">
                    {thesisNodes.map(id => (
                      <div key={id} className="flex flex-col items-center relative">
                        {/* We position the basic reason cloud directly above the thesis node */}
                        <div className="relative" style={{ position: "relative" }}>
                          <BasicReasonCloud
                            data={data}
                            thesisId={id}
                            activePath={activePath}
                            onNodeClick={handleNodeClick}
                          />
                          <FilteredNode
                            id={id}
                            data={data}
                            onNodeClick={handleNodeClick}
                            activePath={activePath}
                            depth={0}
                            onNodeRef={handleNodeRef}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info panel overlay */}
          {selectedNode && (
            <div 
              className="fixed top-20 left-5 font-serif text-gray-400 p-4 rounded-lg text-sm z-10 bg-neutral-800"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-4">
                  <span>Type:</span>
                  <span className="text-gray-200">{selectedNode.node_type}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Terminal:</span>
                  <span className="text-gray-200">
                    {(selectedNode.nonsense || selectedNode.identical_to) ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Nonsense:</span>
                  <span className="text-gray-200">{selectedNode.nonsense ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Identical To:</span>
                  <span className="text-gray-200">
                    {selectedNode.identical_to ? data[selectedNode.identical_to]?.summary || 'Unknown' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation help overlay */}
          <div className="fixed bottom-5 left-5 font-serif text-gray-400 p-4 rounded-lg text-sm z-10 bg-neutral-800">
            <div>Click node to select</div>
            <div>Arrow keys to navigate:</div>
            <div>↑ Parent | ↓ Child</div>
            <div>← → Between siblings</div>
            <div>Click and drag to pan</div>
            <div>Scroll to zoom</div>
          </div>
        </div>
      </div>

      {/* Side panels */}
      {selectedNode && (
        <div className="w-1/3 flex flex-col h-screen border-l border-gray-800 bg-[#171717]">
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="p-4">
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

export default Graph;