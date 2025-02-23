// src/components/Graph/ReasonNode.jsx
import React from 'react';

const ReasonNode = ({ 
  id, 
  data, 
  isActive,
  onNodeClick
}) => {
  return (
    <div 
      className="flex flex-col items-center" 
      data-node-id={id}
    >
      <div 
        className="cursor-pointer transition-all duration-300"
        onClick={() => onNodeClick(id)}
      >
        <div className={`
          w-3 h-3 rounded-full border-2 node-circle
          ${isActive 
            ? 'border-pink-400 bg-pink-100' 
            : 'border-gray-600 bg-transparent'}
          hover:border-pink-300
        `} />
      </div>
    </div>
  );
};

export default ReasonNode;