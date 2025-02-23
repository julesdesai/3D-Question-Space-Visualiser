import { useState, useEffect, useRef, useCallback } from 'react';
import Node from './Node';
import ReasonsBand from './ReasonsBand';
import ManhattanConnections from './ManhattanConnections';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';
import { useCoordinateSystem } from '../../hooks/useCoordinateSystem';

const Graph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
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

  // Stabilize handleNodeClick
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

  // Handle node ref and bounds
  const handleNodeRef = useCallback((id, element) => {
    if (element) {
      requestAnimationFrame(() => {
        console.log(`Registering node ${id} with coordinate system`);
        updateNodeBounds(id, element);
      });
    }
  }, [updateNodeBounds]);

  useEffect(() => {
    console.log('Current connections:', getConnections());
  }, [getConnections]);

  // Update transform when scale or offset changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateTransform(scale, containerOffset);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [scale, containerOffset, updateTransform]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleChange = newScale - scale;
    const newX = containerOffset.x - ((x - containerOffset.x) * scaleChange / scale);
    const newY = containerOffset.y - ((y - containerOffset.y) * scaleChange / scale);
    
    setScale(newScale);
    setContainerOffset({ x: newX, y: newY });
  };

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
      console.log('Selecting initial thesis node:', thesisNodes[0]);
      handleNodeClick(thesisNodes[0]);
    }
  }, [thesisNodes, handleNodeClick, selectedNode]);

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

  // Get current connections
  const connections = getConnections();

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
            {/* Question in header */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <h1 className="text-2xl font-serif text-neutral-200">
                {questionNode?.[1].summary}
              </h1>
            </div>

            {/* Connections */}
            <ManhattanConnections 
              connections={connections}
              scale={scale}
              offset={containerOffset}
            />

            {/* Main content with zoom/pan */}
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
                transformOrigin: '50% 50%'
              }}
            >
              <div className="h-full p-8 pt-24">
                <div className="flex flex-col items-center">
                  {/* Reasons band */}
                  <ReasonsBand
                    data={data}
                    activePath={activePath}
                    onNodeClick={handleNodeClick}
                    onNodeRef={handleNodeRef}
                  />

                  {/* Thesis nodes and their descendants */}
                  <div className="flex gap-12">
                    {thesisNodes.map(id => (
                      <Node
                        key={id}
                        id={id}
                        data={data}
                        onNodeClick={handleNodeClick}
                        activePath={activePath}
                        depth={0}
                        onNodeRef={handleNodeRef}
                      />
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