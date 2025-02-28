// src/components/Graph/SimpleReasonCloud.jsx
import React from 'react';

const SimpleReasonCloud = ({ 
  data, 
  activePath, 
  onNodeClick 
}) => {
  // Don't render if no active path
  if (!activePath || activePath.length === 0) return null;
  
  // Get the active node ID and node
  const activeNodeId = activePath[activePath.length - 1];
  const activeNode = data[activeNodeId];

  if (!activeNode) return null;
  
  // Determine which node's reasons to show
  let thesisNodeId = null;
  
  if (activeNode.node_type === 'thesis') {
    // If the active node is a thesis, show its reasons
    thesisNodeId = activeNodeId;
  } else if (activeNode.node_type === 'reason') {
    // If the active node is a reason, show reasons for its parent thesis
    thesisNodeId = activeNode.parent_id;
  }
  
  // If we don't have a thesis ID, don't render
  if (!thesisNodeId) return null;
  
  // Get all reasons for this thesis
  const relatedReasons = Object.entries(data)
    .filter(([_, node]) => 
      node.node_type === 'reason' && 
      node.parent_id === thesisNodeId
    )
    .map(([id, node]) => ({ id, ...node }));
  
  // If no related reasons, don't render
  if (relatedReasons.length === 0) return null;
  
  // Get thesis summary
  const thesisSummary = data[thesisNodeId]?.summary || '';
  
  return (
    <div className="fixed top-24 left-0 right-0 mx-auto z-50 px-4 flex justify-center pointer-events-auto">
      <div className="bg-neutral-900 bg-opacity-95 p-4 rounded-lg shadow-lg border border-pink-700 max-w-3xl">
        <div className="text-center mb-3">
          <div className="text-pink-400 text-xs uppercase tracking-wider mb-1">Related Reasons</div>
          <div className="text-gray-300 text-sm font-serif mb-2">{thesisSummary}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {relatedReasons.map(reason => (
            <div 
              key={reason.id}
              className={`
                p-3 rounded cursor-pointer transition-colors duration-300
                ${activePath.includes(reason.id) 
                  ? 'bg-pink-900 bg-opacity-50 text-pink-100' 
                  : 'bg-neutral-800 bg-opacity-50 text-gray-300 hover:bg-neutral-700'}
              `}
              onClick={() => onNodeClick(reason.id)}
            >
              <div className="text-center text-sm max-w-xs font-serif">
                {reason.summary}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleReasonCloud;