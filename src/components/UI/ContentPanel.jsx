import React from 'react';

const ContentPanel = ({ node }) => {
  if (!node) return (
    <div className="bg-neutral-800 rounded-lg p-6 text-neutral-400 font-serif">
      <p>Select a node to view its content</p>
    </div>
  );

  // Function to extract points from content
  const extractPoints = (content) => {
    const matches = content.match(/\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1).trim());
  };

  const points = node.content ? extractPoints(node.content) : [];

  return (
    <div className="bg-neutral-800 rounded-lg p-6 text-neutral-200 font-serif">
      <div>
        <h3 className="text-2xl font-semibold mb-4 pb-2 border-b border-neutral-600 text-neutral-100 leading-snug">
          {node.summary}
        </h3>
        <div className="space-y-4">
          {points.map((point, index) => (
            <div key={index} className="flex gap-4">
              <span className="text-neutral-400 font-semibold min-w-[1.5rem]">
                {index + 1}.
              </span>
              <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-lg">
                {point}
              </p>
            </div>
          ))}
        </div>
        <div className="text-sm text-neutral-400 mt-4 italic">
          Type: {node.node_type}
        </div>
      </div>
    </div>
  );
};

export default ContentPanel;