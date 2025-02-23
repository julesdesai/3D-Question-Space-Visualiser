// src/components/Graph/ReasonsBand.jsx
import React from 'react';
import ReasonNode from './ReasonNode';

const ReasonsBand = ({ 
  data, 
  activePath, 
  onNodeClick 
}) => {
  // Get all reason nodes
  const reasonNodes = Object.entries(data)
    .filter(([_, node]) => node.node_type === 'reason')
    .map(([id]) => id);

  if (reasonNodes.length === 0) return null;

  return (
    <div className="w-full mb-16">
      <div className="flex justify-center gap-16">
        {reasonNodes.map(id => (
          <ReasonNode
            key={id}
            id={id}
            data={data}
            isActive={activePath.includes(id)}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ReasonsBand;