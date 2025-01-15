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

// SVG layer for identical node connections
const IdenticalConnections = ({ connections, isActive }) => (
  <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
    {connections.map(({ from, to }, idx) => (
      <line
        key={idx}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        className={`${isActive ? 'stroke-pink-400' : 'stroke-gray-600'} transition-colors duration-300`}
        strokeWidth="2"
        strokeDasharray="4"
      />
    ))}
  </svg>
);

// X symbol for terminal nodes
const XSymbol = ({ isActive }) => (
  <svg className="w-4 h-4" viewBox="0 0 16 16">
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

// Metadata display component
const NodeMetadata = ({ node }) => (
  <div className="mt-4 p-3 rounded-lg bg-gray-800/50">
    <div className="text-gray-400">Type: <span className="text-gray-200">{node.node_type}</span></div>
    <div className="text-gray-400">Terminal: <span className="text-gray-200">{(node.nonsense || node.identical_to) ? 'Yes' : 'No'}</span></div>
    <div className="text-gray-400">Nonsense: <span className="text-gray-200">{node.nonsense ? 'Yes' : 'No'}</span></div>
    <div className="text-gray-400">Identical To: <span className="text-gray-200">{node.identical_to || 'None'}</span></div>
  </div>
);

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
      const nodeElement = nodeRef.current;
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        const fromPosition = {
          x: rect.left + rect.width/2,
          y: rect.top + rect.height/2
        };
        onIdenticalConnection(id, fromPosition);
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
    <div className="flex flex-col items-center" ref={nodeRef}>
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
                w-4 h-4 rounded-full border-2
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [identicalConnections, setIdenticalConnections] = useState(new Map());

  const handleNodeRef = (id, element) => {
    setNodeRefs(prev => new Map(prev.set(id, element)));
  };

  const handleIdenticalConnection = (fromId, fromPosition) => {
    const toId = data[fromId]?.identical_to;
    if (toId) {
      const toNode = nodeRefs.get(toId);
      if (toNode) {
        const toRect = toNode.getBoundingClientRect();
        const toPosition = {
          x: toRect.left + toRect.width/2,
          y: toRect.top + toRect.height/2
        };
        setIdenticalConnections(prev => new Map(prev.set(fromId, {
          from: fromPosition,
          to: toPosition
        })));
      }
    }
  };

  useEffect(() => {
    // Clear identical connections when active path changes
    setIdenticalConnections(new Map());
  }, [activePath]);

  const centerOnNode = (nodeId) => {
    const nodeElement = nodeRefs.get(nodeId);
    const container = containerRef.current;
    
    if (nodeElement && container) {
      const currentScroll = {
        top: container.scrollTop,
        left: container.scrollLeft
      };

      const contentContainer = container.querySelector('.transition-transform');
      if (!contentContainer) return;
      
      contentContainer.style.transition = 'none';
      contentContainer.style.transform = 'translate(0, 0)';
      
      contentContainer.getBoundingClientRect();

      const nodeDot = nodeElement.querySelector('.rounded-full, svg');
      if (!nodeDot) {
        contentContainer.style.transform = `translate(${containerOffset.x}px, ${containerOffset.y}px)`;
        contentContainer.style.transition = '';
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const nodeDotRect = nodeDot.getBoundingClientRect();

      const targetX = containerRect.width / 2 - (nodeDotRect.left - containerRect.left + nodeDotRect.width / 2);
      const targetY = containerRect.height / 2 - (nodeDotRect.top - containerRect.top + nodeDotRect.height / 2);

      contentContainer.style.transition = '';
      setContainerOffset({ x: targetX, y: targetY });

      container.scrollTop = currentScroll.top;
      container.scrollLeft = currentScroll.left;
    }
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
    centerOnNode(nodeId);
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
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#171717' }}>
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <h2 
          style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
          className="text-2xl font-semibold text-gray-100"
        >
          Knowledge Graph
        </h2>
      </div>

      <div className="flex flex-1 relative">
        <div 
          className="flex-1 relative overflow-hidden" 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <IdenticalConnections 
              connections={Array.from(identicalConnections.values())} 
              isActive={true} 
            />
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px)`,
                pointerEvents: isDragging ? 'none' : 'auto'
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

          <div 
            style={{
              fontFamily: 'Crimson Text, Georgia, serif',
              backgroundColor: '#262626'
            }}
            className="fixed bottom-5 left-5 text-gray-400 p-4 rounded-lg text-sm z-10"
          >
            <div>Click node to focus</div>
            <div>Arrow keys to navigate:</div>
            <div>↑ Parent | ↓ Child</div>
            <div>← → Between siblings</div>
            <div>Press 'C' to center on root</div>
            <div>Click and drag to pan</div>
          </div>
        </div>

        {selectedNode && (
          <div 
            className="w-1/3 border-l flex flex-col h-full"
            style={{ borderColor: '#404040', backgroundColor: '#171717' }}
          >
            {/* Ancestry Panel */}
            <div className="h-1/2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="p-4">
                <AncestryPanel node={selectedNode} graphData={data} />
              </div>
            </div>
            
            {/* Content Panel */}
            <div 
              className="h-1/2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 border-t"
              style={{ borderColor: '#404040' }}
            >
              <div className="p-4">
                <ContentPanel node={selectedNode} />
                <NodeMetadata node={selectedNode} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Graph;