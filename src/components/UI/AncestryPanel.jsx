import React from 'react';

const AncestryPanel = ({ node, graphData }) => {
  if (!node) return (
    <div style={{
      backgroundColor: '#262626',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      color: '#a3a3a3',
      fontFamily: 'Crimson Text, Georgia, serif'
    }}>
      <p>Select a node to view its ancestry</p>
    </div>
  );
  
  const getAncestry = (currentNode) => {
    const ancestry = [currentNode];
    let parentId = currentNode.parent_id;
    
    while (parentId) {
      const parent = graphData[parentId];
      if (parent) {
        ancestry.unshift(parent);
        parentId = parent.parent_id;
      } else {
        break;
      }
    }
    
    return ancestry;
  };
  
  const ancestry = getAncestry(node);
  
  return (
    <div style={{
      backgroundColor: '#262626',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      color: '#e5e5e5',
      fontFamily: 'Crimson Text, Georgia, serif'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '1.5rem',
        color: '#f5f5f5',
        borderBottom: '1px solid #404040',
        paddingBottom: '0.5rem'
      }}>
        Dialectical Chain
      </h3>
      <div>
        {ancestry.map((ancestor, index) => (
          <div 
            key={index} 
            style={{
              position: 'relative',
              marginBottom: '1rem',
              paddingLeft: '1.5rem',
              borderLeft: `2px solid ${index === ancestry.length - 1 ? '#ec4899' : '#404040'}`
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#a3a3a3',
              marginBottom: '0.25rem',
              fontStyle: 'italic'
            }}>
              Level {index}
            </div>
            <div style={{
              color: '#f5f5f5',
              fontSize: '1.125rem',
              lineHeight: '1.4'
            }}>
              {ancestor.summary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AncestryPanel;