// src/components/Graph/BasicReasonCloud.jsx
import React from 'react';

const BasicReasonCloud = ({ 
  data, 
  thesisId, 
  activePath, 
  onNodeClick 
}) => {
  // Get the currently selected node ID
  const activeNodeId = activePath[activePath.length - 1];
  
  // Check if this thesis is selected or any of its descendants are selected
  const isThesisSelected = thesisId === activeNodeId;
  const selectedNode = data[activeNodeId];
  
  // Check if selected node is a reason of this thesis
  const isReasonOfThisThesisSelected = 
    selectedNode?.node_type === 'reason' && 
    selectedNode.parent_id === thesisId;
    
  // Check if any descendant of this thesis is selected
  const isDescendantSelected = () => {
    let currentNode = selectedNode;
    let currentId = activeNodeId;
    
    // Traverse up the path until we hit the root or find the thesis
    while (currentNode && currentId !== thesisId) {
      const parentId = currentNode.parent_id;
      if (parentId === thesisId) {
        return true;
      }
      currentId = parentId;
      currentNode = data[parentId];
    }
    
    return false;
  };
  
  // Don't show anything if this thesis or its descendants aren't selected
  if (!isThesisSelected && !isReasonOfThisThesisSelected && !isDescendantSelected()) return null;
  
  // Find all reason nodes for this thesis
  const reasonNodes = [];
  for (const [id, node] of Object.entries(data)) {
    if (node.node_type === 'reason' && node.parent_id === thesisId) {
      reasonNodes.push({ id, ...node });
    }
  }
  
  // Don't render if no reasons
  if (reasonNodes.length === 0) return null;
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '20px',
        zIndex: 10
      }}
    >
      <div 
        style={{
          backgroundColor: 'rgba(17, 17, 17, 0.95)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #be185d',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          textAlign: 'center'
        }}
      >
        <div 
          style={{
            color: '#ec4899',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}
        >
        Reasons
        </div>
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            width: '600px',
            maxWidth: '80vw'
          }}
        >
          {reasonNodes.map(reason => (
            <div 
              key={reason.id}
              onClick={() => onNodeClick(reason.id)}
              style={{
                backgroundColor: activePath.includes(reason.id) 
                  ? 'rgba(131, 24, 67, 0.5)' // pink-900 with opacity
                  : 'transparent',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                color: activePath.includes(reason.id) ? '#fbcfe8' : '#d1d5db',
                transition: 'all 0.3s',
                maxWidth: '180px',
                textAlign: 'center',
                fontSize: '12px',
                fontFamily: 'serif',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
              onMouseOver={(e) => {
                if (!activePath.includes(reason.id)) {
                  e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!activePath.includes(reason.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {reason.summary}
            </div>
          ))}
        </div>
      </div>
      <div 
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '20px',
          backgroundColor: '#ec4899'
        }}
      />
    </div>
  );
};

export default BasicReasonCloud;