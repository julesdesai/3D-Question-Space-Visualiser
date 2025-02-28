import { useEffect, useRef } from 'react';
import XSymbol from './XSymbol';

const getNodePrefix = (nodeType) => {
  switch (nodeType?.toLowerCase()) {
    case 'question': return '(Q) ';
    case 'thesis': return '(T) ';
    case 'antithesis': return '(A) ';
    case 'synthesis': return '(S) ';
    case 'reason': return '(R) ';
    default: return '';
  }
};

const FilteredNode = ({ 
  id,
  data, 
  onNodeClick, 
  activePath = [],
  depth = 0,
  onNodeRef = null,
  onIdenticalConnection = null
}) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (nodeRef.current && onNodeRef) {
      onNodeRef(id, nodeRef.current);
    }
  }, [id, onNodeRef]);

  useEffect(() => {
    if (activePath.includes(id) && data[id]?.identical_to && onIdenticalConnection) {
      const sourceElement = nodeRef.current?.querySelector('.node-circle');
      const targetElement = document.querySelector(`[data-node-id="${data[id].identical_to}"] .node-circle`);
      
      if (sourceElement && targetElement) {
        try {
          const fromRect = sourceElement.getBoundingClientRect();
          const toRect = targetElement.getBoundingClientRect();
          
          if (fromRect && toRect && 
              fromRect.width && fromRect.height && 
              toRect.width && toRect.height) {
            
            onIdenticalConnection({
              from: {
                x: fromRect.left + fromRect.width/2,
                y: fromRect.top + fromRect.height/2
              },
              to: {
                x: toRect.left + toRect.width/2,
                y: toRect.top + toRect.height/2
              },
              sourceId: id,
              targetId: data[id].identical_to
            });
          }
        } catch (error) {
          console.warn('Failed to calculate connection positions:', error);
        }
      }
    }
  }, [id, activePath, data, onIdenticalConnection]);

  // Skip rendering if this is a reason node
  if (data[id]?.node_type === 'reason') {
    return null;
  }

  // Get child nodes - EXCLUDING reason nodes
  const childNodes = Object.entries(data).filter(([_, node]) => 
    node.parent_id === id && node.node_type !== 'reason'
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
              className="mt-2 text-center max-w-md px-4 transition-opacity duration-300 font-serif text-lg leading-relaxed"
              style={{
                color: isNonsense ? '#ef4444' : '#e5e5e5'
              }}
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
              <FilteredNode
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

export default FilteredNode;