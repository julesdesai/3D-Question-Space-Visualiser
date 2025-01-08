// src/components/UI/ContentPanel.jsx
import React from 'react';

const ContentPanel = ({ node }) => {
  if (!node) return (
    <div style={{
      backgroundColor: '#262626',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      color: '#a3a3a3',
      fontFamily: 'Crimson Text, Georgia, serif'
    }}>
      <p>Select a node to view its content</p>
    </div>
  );
  
  return (
    <div style={{
      backgroundColor: '#262626',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      color: '#e5e5e5',
      fontFamily: 'Crimson Text, Georgia, serif'
    }}>
      <div>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #404040',
          color: '#f5f5f5',
          lineHeight: '1.3'
        }}>
          {node.summary}
        </h3>
        <p style={{
          color: '#d4d4d4',
          marginBottom: '1rem',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          fontSize: '1.125rem'
        }}>
          {node.content}
        </p>
        <div style={{
          fontSize: '0.875rem',
          color: '#a3a3a3',
          marginTop: '1rem',
          fontStyle: 'italic'
        }}>
          Type: {node.node_type}
        </div>
      </div>
    </div>
  );
};

export default ContentPanel;