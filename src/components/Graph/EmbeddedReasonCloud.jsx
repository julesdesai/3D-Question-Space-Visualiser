// src/components/Graph/EmbeddedReasonCloud.jsx
import React from 'react';

const EmbeddedReasonCloud = ({ 
  data, 
  thesisId, 
  activePath, 
  onNodeClick 
}) => {
  // Check if this thesis is active or any of its reasons are active
  const isActive = activePath.includes(thesisId);
  const activeNodeId = activePath[activePath.length - 1];
  const activeNode = data[activeNodeId];
  const isReasonActive = activeNode?.node_type === 'reason' && activeNode.parent_id === thesisId;
  
  // Only show if this thesis or one of its reasons is active
  if (!isActive && !isReasonActive) return null;
  
  // Get reasons for this thesis
  const reasonNodes = Object.entries(data)
    .filter(([_, node]) => node.node_type === 'reason' && node.parent_id === thesisId)
    .map(([id, node]) => ({ id, ...node }));
  
  // Don't render if no reasons
  if (reasonNodes.length === 0) return null;
  
  return (
    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 -translate-y-full">
      <div className="bg-neutral-900 bg-opacity-95 p-3 rounded-lg shadow-lg border border-pink-800">
        <div className="text-center mb-2">
          <div className="text-pink-400 text-xs uppercase tracking-wider">Related Reasons</div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
          {reasonNodes.map(reason => (
            <div 
              key={reason.id}
              className={`
                cursor-pointer transition-colors duration-300 p-2 rounded
                ${activePath.includes(reason.id) 
                  ? 'bg-pink-900 bg-opacity-50 text-pink-100' 
                  : 'hover:bg-neutral-800 text-gray-300'}
              `}
              onClick={() => onNodeClick(reason.id)}
            >
              <div className="text-center text-xs max-w-xs">
                {reason.summary}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-px h-6 bg-pink-400"></div>
    </div>
  );
};

export default EmbeddedReasonCloud;