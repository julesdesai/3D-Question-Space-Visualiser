// src/components/Graph/ReasonCloud.jsx
import React from 'react';
import ReasonNode from './ReasonNode';

const ReasonCloud = ({ 
  data, 
  selectedNodeId,
  activePath, 
  onNodeClick,
  onNodeRef
}) => {
  // Get the currently selected thesis or parent of selected reason
  const activeNodeId = activePath[activePath.length - 1];
  const activeNode = data[activeNodeId];
  
  // Only show reasons if current thesis is the one this cloud belongs to
  // (selectedNodeId is the thesis ID that this ReasonCloud is attached to)
  
  let shouldShow = false;
  
  if (activeNode) {
    if (selectedNodeId === activeNodeId) {
      // If this thesis is the selected node
      shouldShow = true;
    } else if (activeNode.node_type === 'reason' && activeNode.parent_id === selectedNodeId) {
      // If a reason belonging to this thesis is selected
      shouldShow = true;
    }
  }
  
  // Don't render anything if we shouldn't show the cloud
  if (!shouldShow) return null;
  
  // Get all reason nodes that have this thesis as parent
  const connectedReasons = Object.entries(data)
    .filter(([_, node]) => node.node_type === 'reason' && node.parent_id === selectedNodeId)
    .map(([id]) => id);

  if (connectedReasons.length === 0) return null;

  // Get thesis summary to display in header
  const thesisSummary = data[selectedNodeId]?.summary || 'Selected Thesis';

  return (
    <div className="fixed top-20 left-0 right-0 z-50 flex justify-center mx-auto px-4">
      <div className="bg-neutral-900 bg-opacity-95 border border-neutral-700 rounded-lg shadow-lg p-4 max-w-3xl w-full">
        <div className="text-center mb-4">
          <div className="text-pink-400 text-sm uppercase tracking-wider mb-1">Related Reasons</div>
          <div className="text-gray-300 text-base font-serif">{thesisSummary}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 py-2">
          {connectedReasons.map(id => (
            <ReasonNode
              key={id}
              id={id}
              data={data}
              isActive={activePath.includes(id)}
              onNodeClick={onNodeClick}
              onNodeRef={onNodeRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReasonCloud;