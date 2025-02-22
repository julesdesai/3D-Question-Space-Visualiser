import { useState, useEffect, useRef, useCallback } from 'react';
import Node from './Node';
import IdenticalConnections from './IdenticalConnections';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';

const Graph = ({ data }) => {
  const [activePath, setActivePath] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeRefs, setNodeRefs] = useState(new Map());
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [identicalConnections, setIdenticalConnections] = useState(new Map());

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;

  const handleNodeRef = useCallback((id, element) => {
    setNodeRefs(prev => new Map(prev.set(id, element)));
  }, []);

  const updateIdenticalConnections = useCallback(() => {
    const newConnections = new Map();
    
    // Find all nodes that are identical to others
    Object.entries(data).forEach(([id, node]) => {
      if (node.identical_to) {
        const sourceElement = document.querySelector(`[data-node-id="${id}"] .node-circle`);
        const targetElement = document.querySelector(`[data-node-id="${node.identical_to}"] .node-circle`);
        
        if (sourceElement && targetElement) {
          const fromRect = sourceElement.getBoundingClientRect();
          const toRect = targetElement.getBoundingClientRect();
          
          // Only create connection if both elements have valid positions
          if (fromRect && toRect && 
              fromRect.width && fromRect.height && 
              toRect.width && toRect.height) {
            
            newConnections.set(id, {
              from: {
                x: fromRect.left + fromRect.width/2,
                y: fromRect.top + fromRect.height/2
              },
              to: {
                x: toRect.left + toRect.width/2,
                y: toRect.top + toRect.height/2
              },
              sourceId: id,
              targetId: node.identical_to
            });
          }
        }
      }
    });
    
    setIdenticalConnections(newConnections);
  }, [data]);

  // Update connections whenever the active path changes
  useEffect(() => {
    updateIdenticalConnections();
  }, [activePath, updateIdenticalConnections]);

  // Update connections periodically to handle layout changes
  useEffect(() => {
    const interval = setInterval(updateIdenticalConnections, 1000);
    return () => clearInterval(interval);
  }, [updateIdenticalConnections]);

  const handleIdenticalConnection = useCallback((connection) => {
    setIdenticalConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(connection.sourceId, connection);
      return newMap;
    });
  }, []);

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

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setContainerOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

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
  }, [isDragging, dragStart]);

  const handleNodeClick = (nodeId) => {
    const findPath = (targetId, path = []) => {
      if (!targetId) return path;
      const node = data[targetId];
      if (!node) return path;
      return findPath(node.parent_id, [targetId, ...path]);
    };
    
    const newPath = findPath(nodeId);
    setActivePath(newPath);
    setSelectedNode(data[nodeId]);
  };

  useEffect(() => {
    const rootNode = Object.entries(data).find(([_, nodeData]) => 
      nodeData.parent_id === null
    );
    if (rootNode) {
      handleNodeClick(rootNode[0]);
    }
  }, [data]);

  const handleKeyNavigation = (e) => {
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
          .filter(([_, n]) => n.parent_id === currentId)
          .map(([id]) => id);
        if (children.length > 0) {
          nextId = children[0];
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const siblings = Object.entries(data)
          .filter(([_, n]) => n.parent_id === data[currentId]?.parent_id)
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
      case 'c':
      case 'C': {
        const rootNode = Object.entries(data).find(([_, n]) => n.parent_id === null);
        if (rootNode) {
          nextId = rootNode[0];
        }
        break;
      }
    }

    if (nextId) {
      handleNodeClick(nextId);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [selectedNode, data]);

  const rootNode = Object.entries(data).find(([_, nodeData]) => 
    nodeData.parent_id === null
  );

  if (!rootNode) return null;

  return (
    <div className="h-screen w-full flex bg-[#171717]">
      {/* Graph container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Fixed graph area */}
        <div className="absolute inset-0"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Graph content with zoom/pan */}
          <div className="w-full h-full overflow-hidden">
            <IdenticalConnections 
              connections={Array.from(identicalConnections.values())} 
            />
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px) scale(${scale})`,
                transformOrigin: '50% 50%'
              }}
            >
              <div className="h-full p-8">
                <div className="flex justify-center items-center h-full">
                  <Node
                    id={rootNode[0]}
                    data={data}
                    onNodeClick={handleNodeClick}
                    activePath={activePath}
                    depth={0}
                    onNodeRef={handleNodeRef}
                    onIdenticalConnection={handleIdenticalConnection}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fixed overlays */}
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
                  <span className="text-gray-200">{(selectedNode.nonsense || selectedNode.identical_to) ? 'Yes' : 'No'}</span>
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

          <div 
            className="fixed bottom-5 left-5 font-serif text-gray-400 p-4 rounded-lg text-sm z-10 bg-neutral-800"
          >
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
          {/* Content panel */}
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="p-4">
                <ContentPanel node={selectedNode} />
              </div>
            </div>
          </div>
          
          {/* Ancestry panel */}
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