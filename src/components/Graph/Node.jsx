// src/components/Graph/Node.jsx
import { useEffect, useRef } from 'react';
import XSymbol from './XSymbol';

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

export default Node;