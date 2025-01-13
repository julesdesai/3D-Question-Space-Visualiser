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
  const shouldShow = depth === 0 || isInPath || (parentId && activePath.includes(parentId));
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
  const [nodeRefs, setNodeRefs] = useState(new Map());
  const containerRef = useRef(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleNodeRef = (id, element) => {
    setNodeRefs(prev => new Map(prev.set(id, element)));
  };

  const centerOnNode = (nodeId) => {
    const nodeElement = nodeRefs.get(nodeId);
    const container = containerRef.current;
    
    if (nodeElement && container) {
      // Store the current scroll position
      const currentScroll = {
        top: container.scrollTop,
        left: container.scrollLeft
      };

      // Temporarily remove transform to get true positions
      const contentContainer = container.querySelector('.transition-transform');
      if (!contentContainer) return;
      
      contentContainer.style.transition = 'none';
      contentContainer.style.transform = 'translate(0, 0)';
      
      // Force browser to process the reset
      contentContainer.getBoundingClientRect();

      const nodeDot = nodeElement.querySelector('.rounded-full');
      if (!nodeDot) {
        // Restore transform if we can't find the node
        contentContainer.style.transform = `translate(${containerOffset.x}px, ${containerOffset.y}px)`;
        contentContainer.style.transition = '';
        return;
      }

      // Get clean measurements
      const containerRect = container.getBoundingClientRect();
      const nodeDotRect = nodeDot.getBoundingClientRect();

      // Calculate the absolute center position
      const targetX = containerRect.width / 2 - (nodeDotRect.left - containerRect.left + nodeDotRect.width / 2);
      const targetY = containerRect.height / 2 - (nodeDotRect.top - containerRect.top + nodeDotRect.height / 2);

      // Restore transition and apply new transform
      contentContainer.style.transition = '';
      setContainerOffset({ x: targetX, y: targetY });

      // Restore scroll position
      container.scrollTop = currentScroll.top;
      container.scrollLeft = currentScroll.left;
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left click
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
      {/* Fixed Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <h2 
          style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
          className="text-2xl font-semibold text-gray-100"
        >
          Knowledge Graph
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        <div 
          className="flex-1 relative overflow-hidden" 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="absolute inset-0 overflow-hidden">
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
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fixed UX Controls */}
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