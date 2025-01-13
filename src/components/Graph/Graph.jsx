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

const Node = ({ 
  id,
  data, 
  onNodeClick, 
  activePath = [],
  depth = 0,
  isProgressiveMode,
  onNodeRef
}) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (nodeRef.current) {
      onNodeRef(id, nodeRef.current);
    }
  }, [id, onNodeRef]);

  const childNodes = Object.entries(data).filter(([_, nodeData]) => 
    nodeData.parent_id === id
  );

  const isInPath = activePath.includes(id);
  const parentId = data[id]?.parent_id;
  
  const shouldShow = isProgressiveMode || depth === 0 || isInPath || (parentId && activePath.includes(parentId));
  const showLabel = isInPath;

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
            className={`
              w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-300
              ${isInPath 
                ? 'border-pink-400 bg-pink-100' 
                : 'border-gray-600 bg-transparent border-dotted'}
              hover:border-pink-300
            `}
            onClick={() => onNodeClick(id)}
          />
          {showLabel && (
            <div 
              style={{
                fontFamily: 'Crimson Text, Georgia, serif',
                fontSize: '1.125rem',
                lineHeight: '1.6'
              }}
              className="mt-2 text-gray-200 text-center max-w-md px-4 transition-opacity duration-300"
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
                isProgressiveMode={isProgressiveMode}
                onNodeRef={onNodeRef}
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
  const [isProgressiveMode, setIsProgressiveMode] = useState(false);
  const [nodeRefs, setNodeRefs] = useState(new Map());
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });

  const handleNodeRef = (id, element) => {
    setNodeRefs(prev => new Map(prev.set(id, element)));
  };

  const centerOnNode = (nodeId) => {
    const nodeElement = nodeRefs.get(nodeId);
    const container = containerRef.current;
    
    if (nodeElement && container) {
      const scrollContainer = container.firstElementChild;
      
      // Get the current positions
      const nodeRect = nodeElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const headerHeight = 72; // Height of the fixed header

      // Calculate center point, accounting for the header
      const centerY = (containerRect.height - headerHeight) / 2 + headerHeight;
      const centerX = containerRect.width / 2;

      // Calculate the node's absolute position relative to the container
      const nodeTop = nodeElement.offsetTop;
      const nodeLeft = nodeElement.offsetLeft;
      
      // Calculate the required offset to center the node
      const targetX = centerX - nodeLeft;
      const targetY = centerY - nodeTop;

      // Apply different positioning logic based on view mode
      if (isProgressiveMode) {
        // In full structure view, ensure the entire graph is visible
        const graphBounds = container.querySelector('.flex.justify-center')?.getBoundingClientRect();
        if (graphBounds) {
          const scaleX = containerRect.width / graphBounds.width;
          const scaleY = containerRect.height / graphBounds.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
          
          // Adjust position based on scale
          setContainerOffset({
            x: targetX * scale,
            y: targetY * scale
          });
        }
      } else {
        // In focused view, center precisely on the node
        setContainerOffset({ x: targetX, y: targetY });
      }

      // Reset scroll position
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        scrollContainer.scrollLeft = 0;
      }
    }
  };

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
      {/* Fixed Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <h2 
          style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
          className="text-2xl font-semibold text-gray-100"
        >
          Knowledge Graph
        </h2>
        <button
          onClick={() => {
            setIsProgressiveMode(!isProgressiveMode);
            // Reset position when toggling view mode
            setTimeout(() => {
              const currentId = Object.entries(data).find(([_, n]) => n === selectedNode)?.[0];
              if (currentId) centerOnNode(currentId);
            }, 50);
          }}
          style={{
            fontFamily: 'Crimson Text, Georgia, serif',
            backgroundColor: '#262626'
          }}
          className={`
            px-4 py-2 rounded-lg text-sm transition-colors duration-300
            ${isProgressiveMode ? 'text-pink-400 border-pink-400' : 'text-gray-400 border-gray-600'}
            border
          `}
        >
          {isProgressiveMode ? 'Full Structure' : 'Focused View'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="w-full h-full transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translate(${containerOffset.x}px, ${containerOffset.y}px)` 
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
                    isProgressiveMode={isProgressiveMode}
                    onNodeRef={handleNodeRef}
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
            className="absolute bottom-5 left-5 text-gray-400 p-4 rounded-lg text-sm"
          >
            <div>Click node to focus</div>
            <div>Arrow keys to navigate:</div>
            <div>↑ Parent | ↓ Child</div>
            <div>← → Between siblings</div>
            <div>Press 'C' to center on root</div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              Toggle view mode to see full structure
            </div>
          </div>
        </div>

        {selectedNode && (
          <div 
            className="w-1/3 border-l overflow-auto"
            style={{ borderColor: '#404040', backgroundColor: '#171717' }}
          >
            <div className="p-4 flex flex-col gap-4">
              <AncestryPanel node={selectedNode} graphData={data} />
              <ContentPanel node={selectedNode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Graph;