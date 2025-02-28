// src/components/Graph/ReasonNode.jsx
import React, { useEffect, useRef } from 'react';

const ReasonNode = ({ 
  id, 
  data, 
  isActive,
  onNodeClick,
  onNodeRef
}) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (nodeRef.current && onNodeRef) {
      onNodeRef(id, nodeRef.current);
    }
  }, [id, onNodeRef]);

  // Get the node's summary text to display
  const summary = data[id]?.summary || '';

  return (
    <div 
      ref={nodeRef}
      className="flex flex-col items-center p-2" 
      data-node-id={id}
    >
      <div 
        className="cursor-pointer transition-all duration-300 flex flex-col items-center hover:bg-neutral-800 p-2 rounded-md"
        onClick={() => onNodeClick(id)}
      >
        <div className={`
          w-4 h-4 rounded-full border-2 node-circle mb-2
          ${isActive 
            ? 'border-pink-400 bg-pink-100' 
            : 'border-gray-600 bg-transparent'}
          hover:border-pink-300
        `} />
        
        {/* Display the reason summary */}
        <div className={`
          text-sm max-w-xs text-center font-serif
          ${isActive ? 'text-pink-300' : 'text-gray-400'}
          hover:text-pink-200 transition-colors duration-300
        `}>
          {summary}
        </div>
      </div>
    </div>
  );
};

export default ReasonNode;