import React, { useState , useEffect} from 'react';
import ContentPanel from '../UI/ContentPanel';
import AncestryPanel from '../UI/AncestryPanel';

const Node = ({ 
  id,
  data, 
  onNodeClick, 
  activePath = [],
  depth = 0 
}) => {
  const childNodes = Object.entries(data).filter(([_, nodeData]) => 
    nodeData.parent_id === id
  );

  // Determine if this node is in the active path
  const isInPath = activePath.includes(id);
  
  // Determine if this node should be visible
  // Show if it's root, in active path, or is a direct child of a node in active path
  const parentId = data[id]?.parent_id;
  const shouldShow = depth === 0 || isInPath || (parentId && activePath.includes(parentId));

  if (!shouldShow) return null;

  return (
    <div className="flex flex-col items-center">
      {/* Node content */}
      <div className="flex flex-col items-center relative">
        {/* Vertical line from parent */}
        {depth > 0 && (
          <div className={`
            h-8 w-[2px] absolute -top-8
            ${isInPath ? 'bg-pink-400' : 'bg-blue-400'}
            transition-colors duration-300
          `}></div>
        )}
        
        {/* Node circle and label */}
        <div className="flex flex-col items-center">
          <div 
            className={`
              w-4 h-4 rounded-full border-2 cursor-pointer
              ${isInPath 
                ? 'border-pink-400 bg-pink-100' 
                : 'border-blue-400 bg-transparent border-dotted'}
              transition-all duration-300
            `}
            onClick={() => onNodeClick(id)}
          />
          {/* Only show label if node is in active path */}
          {isInPath && (
            <div className="mt-2 text-white text-sm text-center max-w-md px-4 transition-opacity duration-300">
              {data[id]?.summary || ''}
            </div>
          )}
        </div>
      </div>

      {/* Children container */}
      {childNodes.length > 0 && (
        <div className="mt-8 flex flex-col items-center">
          {/* Children nodes */}
          <div className="flex gap-12">
            {childNodes.map(([childId]) => (
              <Node
                key={childId}
                id={childId}
                data={data}
                onNodeClick={onNodeClick}
                activePath={activePath}
                depth={depth + 1}
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

  const getParentNode = (nodeId) => {
    const node = data[nodeId];
    return node?.parent_id ? data[node.parent_id] : null;
  };

  const getSiblings = (nodeId) => {
    const node = data[nodeId];
    if (!node) return [];
    
    return Object.entries(data)
      .filter(([_, n]) => n.parent_id === node.parent_id)
      .map(([id]) => id);
  };

  const getChildren = (nodeId) => {
    return Object.entries(data)
      .filter(([_, n]) => n.parent_id === nodeId)
      .map(([id]) => id);
  };

  const handleKeyNavigation = (e) => {
    if (!selectedNode) return;

    const currentId = Object.entries(data).find(([_, n]) => n === selectedNode)?.[0];
    if (!currentId) return;

    switch (e.key) {
      case 'ArrowUp': {
        const parent = getParentNode(currentId);
        if (parent) {
          const parentId = Object.entries(data).find(([_, n]) => n === parent)?.[0];
          handleNodeClick(parentId);
        }
        break;
      }
      case 'ArrowDown': {
        const children = getChildren(currentId);
        if (children.length > 0) {
          handleNodeClick(children[0]);
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const siblings = getSiblings(currentId);
        const currentIndex = siblings.indexOf(currentId);
        if (currentIndex === -1) break;
        
        const newIndex = e.key === 'ArrowLeft'
          ? (currentIndex - 1 + siblings.length) % siblings.length
          : (currentIndex + 1) % siblings.length;
        
        handleNodeClick(siblings[newIndex]);
        break;
      }
      case 'c':
      case 'C': {
        const rootNode = Object.entries(data).find(([_, n]) => n.parent_id === null);
        if (rootNode) handleNodeClick(rootNode[0]);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [selectedNode]);

  // Find root node
  const rootNode = Object.entries(data).find(([_, nodeData]) => 
    nodeData.parent_id === null
  );

  if (!rootNode) return null;

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 relative overflow-hidden">
        {/* Main graph visualization */}
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-full p-8">
            <h2 className="text-2xl font-semibold mb-8 text-white text-center">Knowledge Graph</h2>
            <div className="flex justify-center">
              <Node
                id={rootNode[0]}
                data={data}
                onNodeClick={handleNodeClick}
                activePath={activePath}
                depth={0}
              />
            </div>
          </div>
        </div>

        {/* Controls help panel */}
        <div className="absolute bottom-5 left-5 bg-black bg-opacity-50 text-gray-400 p-4 rounded-lg text-sm">
          <div>Click node to focus</div>
          <div>Arrow keys to navigate:</div>
          <div>↑ Parent | ↓ Child</div>
          <div>← → Between siblings</div>
          <div>Press 'C' to center on root</div>
        </div>
      </div>

      {/* Side panel */}
      {selectedNode && (
        <div className="w-1/3 border-l border-gray-800 overflow-auto bg-gray-900">
          <div className="p-4 flex flex-col gap-4">
            <AncestryPanel node={selectedNode} graphData={data} />
            <ContentPanel node={selectedNode} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Graph;