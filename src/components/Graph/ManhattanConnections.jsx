// ManhattanConnections.jsx

import React from 'react';

const ManhattanConnections = ({ 
  connections = [], 
  scale = 1, 
  offset = { x: 0, y: 0 } 
}) => {
  return (
    <svg 
      className="absolute inset-0 w-full h-full" 
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="manhattan-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L6,3 L0,6" fill="#ec4899" />
        </marker>
      </defs>
      
      {connections.map(({ from, to, sourceId, targetId, isReason }, idx) => {
        const verticalFirst = Math.abs(to.y - from.y) > Math.abs(to.x - from.x);
        const midY = from.y + (to.y - from.y) / 2;
        const midX = from.x + (to.x - from.x) / 2;
        
        const pathPoints = verticalFirst
          ? `M ${from.x},${from.y} L ${from.x},${midY} L ${to.x},${midY} L ${to.x},${to.y}`
          : `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;

        return (
          <g key={`${sourceId}-${targetId}-${idx}`}>
            <path
              d={pathPoints}
              fill="none"
              stroke="#262626"
              strokeWidth={2}
              className="transition-colors duration-300"
            />
            <path
              d={pathPoints}
              fill="none"
              stroke="#ec4899"
              strokeWidth={1}
              strokeOpacity={0.8}
              strokeDasharray={isReason ? "none" : "4"}
              markerEnd="url(#manhattan-arrowhead)"
              className="transition-colors duration-300"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default React.memo(ManhattanConnections);