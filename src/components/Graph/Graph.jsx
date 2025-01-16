import React, { useState, useEffect, useRef } from 'react';
import AncestryPanel from '../UI/AncestryPanel';
import ContentPanel from '../UI/ContentPanel';

const getNodePrefix = (nodeType) => {
  switch (nodeType?.toLowerCase()) {
    case 'question': return '(Q) ';
    case 'thesis': return '(T) ';
    case 'antithesis': return '(A) ';
    case 'synthesis': return '(S) ';
    default: return '';
  }
};

// IdenticalConnections component
const IdenticalConnections = ({ connections, isActive }) => (
  <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
    <defs>
      <marker
        id="arrowhead"
        markerWidth="4"
        markerHeight="4"
        refX="0"
        refY="2"
        orient="auto"
      >
        <polygon
          points="0 0, 4 2, 0 4"
          className="fill-pink-400 transition-colors duration-300"
        />
      </marker>
    </defs>
    {connections.map(({ from, to }, idx) => {
      // Calculate control point for the curve
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = distance * 0.2;

      // Create control point perpendicular to the line
      const controlX = midX - dy * offset / distance;
      const controlY = midY + dx * offset / distance;

      // Calculate stop point slightly before the target
      const stopDistance = 12;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const stopX = to.x - (stopDistance * Math.cos(angle));
      const stopY = to.y - (stopDistance * Math.sin(angle));

      return (
        <path
          key={idx}
          d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${stopX} ${stopY}`}
          fill="none"
          stroke="#ec4899"
          strokeWidth="1"
          strokeDasharray="3"
          markerEnd="url(#arrowhead)"
          className="transition-colors duration-300"
        />
      );
    })}
  </svg>
);

// X symbol for terminal nodes
const XSymbol = ({ isActive }) => (
  <svg className="w-4 h-4 node-circle" viewBox="0 0 16 16">
    <line 
      x1="4" y1="4" 
      x2="12" y2="12" 
      stroke={isActive ? '#ec4899' : '#4b5563'} 
      strokeWidth="2"
      className="transition-colors duration-300"
    />
    <line 
      x1="12" y1="4" 
      x2="4" y2="12" 
      stroke={isActive ? '#ec4899' : '#4b5563'} 
      strokeWidth="2"
      className="transition-colors duration-300"
    />
  </svg>
);

// Metadata display component with consistent styling
const NodeMetadata = ({ node }) => (
  <div className="p-4 bg-gray-900 border-t border-gray-800">
    <div className="space-y-2" style={{ fontFamily: 'Crimson Text, Georgia, serif' }}>
      <div className="flex justify-between">
        <span className="text-gray-400">Type:</span>
        <span className="text-gray-200">{node.node_type}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Terminal:</span>
        <span className="text-gray-200">{(node.nonsense || node.identical_to) ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Nonsense:</span>
        <span className="text-gray-200">{node.nonsense ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Identical To:</span>
        <span className="text-gray-200">{node.identical_to || 'None'}</span>
      </div>
    </div>
  </div>
);

// Node component
const Node = ({ 
  id,
  data, 
  onNodeClick, 
  activePath = [],
  depth = 0,
  onNodeRef,
  onIdenticalConnection
}) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (nodeRef.current) {
      onNodeRef(id, nodeRef.current);
    }
  }, [id, onNodeRef]);

  useEffect(() => {
    if (activePath.includes(id) && data[id]?.identical_to) {
      const sourceElement = nodeRef.current?.querySelector('.node-circle');
      const targetId = data[id].identical_to;
      const targetElement = document.querySelector(`[data-node-id="${targetId}"] .node-circle`);
      
      if (sourceElement && targetElement) {
        const fromRect = sourceElement.getBoundingClientRect();
        const toRect = targetElement.getBoundingClientRect();
        
        const fromPosition = {
          x: fromRect.left + fromRect.width/2,
          y: fromRect.top + fromRect.height/2
        };
        
        const toPosition = {
          x: toRect.left + toRect.width/2,
          y: toRect.top + toRect.height/2
        };
        
        onIdenticalConnection(id, fromPosition, toPosition);
      }
    }
  }, [id, activePath, data, onIdenticalConnection]);

  const childNodes = Object.entries(data).filter(([_, nodeData]) => 
    nodeData.parent_id === id
  );

  const isInPath = activePath.includes(id);
  const parentId = data[id]?.parent_id;
  const shouldShow = depth === 0 || isInPath || (parentId && activePath.includes(parentId));
  const showLabel = isInPath;
  const isNonsense = data[id]?.nonsense;
  const identicalTo = data[id]?.identical_to;
  const isTerminal = isNonsense || identicalTo;

  if (!shouldShow) return null;

  return (
    <div className="flex flex-col items-center" ref={nodeRef} data-node-id={id}>
      <div className="flex flex-col items-center relative">
        {depth > 0 && (
          <div className={`
            h-8 w-[2px] absolute -top-8
            ${isInPath ? 'bg-pink-400' : 'bg-gray-600'}
            transition-colors duration-300
          `}></div>
        )}
        
        <div className="flex flex-col items-center">
          <div 
            className="cursor-pointer transition-all duration-300"
            onClick={() => onNodeClick(id)}
          >
            {isTerminal ? (
              <XSymbol isActive={isInPath} />
            ) : (
              <div className={`
                w-4 h-4 rounded-full border-2 node-circle
                ${isInPath 
                  ? 'border-pink-400 bg-pink-100' 
                  : 'border-gray-600 bg-transparent border-dotted'}
                hover:border-pink-300
              `} />
            )}
          </div>
          {showLabel && (
            <div 
              style={{
                fontFamily: 'Crimson Text, Georgia, serif',
                fontSize: '1.125rem',
                lineHeight: '1.6',
                color: isNonsense ? '#ef4444' : '#e5e5e5'
              }}
              className="mt-2 text-center max-w-md px-4 transition-opacity duration-300"
            >
              {getNodePrefix(data[id]?.node_type)}{data[id]?.summary || ''}
            </div>
          )}
        </div>
      </div>

      {childNodes.length > 0 && (
        <div className="mt-8 flex flex-col items-center">
          <div className="flex gap-12">
            {childNodes.map(([childId]) => (
              <Node
                key={childId}
                id={childId}
                data={data}
                onNodeClick={onNodeClick}
                activePath={activePath}
                depth={depth + 1}
                onNodeRef={onNodeRef}
                onIdenticalConnection={onIdenticalConnection}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


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

  const handleNodeRef = (id, element) => {
    setNodeRefs(prev => new Map(prev.set(id, element)));
  };
  
  const handleIdenticalConnection = (fromId, fromPosition, toPosition) => {
    const toId = data[fromId]?.identical_to;
    if (toId) {
      setIdenticalConnections(prev => new Map(prev.set(fromId, {
        from: fromPosition,
        to: toPosition
      })));
    }
  };

  useEffect(() => {
    setIdenticalConnections(new Map());
  }, [activePath]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
    
    // Get pointer position relative to container
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate new position to zoom toward cursor
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
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="w-full h-full overflow-hidden">
            <IdenticalConnections 
              connections={Array.from(identicalConnections.values())} 
              isActive={true} 
            />
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out graph-container"
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
            style={{
              fontFamily: 'Crimson Text, Georgia, serif',
              backgroundColor: '#262626'
            }}
            className="fixed top-20 left-5 text-gray-400 p-4 rounded-lg text-sm z-10"
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
            style={{
              fontFamily: 'Crimson Text, Georgia, serif',
              backgroundColor: '#262626'
            }}
            className="fixed bottom-5 left-5 text-gray-400 p-4 rounded-lg text-sm z-10"
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