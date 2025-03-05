// src/components/Graph/GraphConnections.jsx
import React from 'react';

const GraphConnections = ({ connections = [] }) => {
  if (!connections || connections.length === 0) {
    return null;
  }

  return (
    <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ overflow: 'visible', position: 'absolute' }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L8,4 L0,8" fill="#4B5563" />
        </marker>
        
        <marker
          id="reason-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L8,4 L0,8" fill="#D97706" />
        </marker>
        
        <marker
          id="highlight-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L8,4 L0,8" fill="#EC4899" />
        </marker>
      </defs>
      
      {connections.map(({ from, to, sourceId, targetId, isReason }, idx) => {
        // Determine if this is a connection to a reason (upward) or regular (downward)
        const isUpwardConnection = to.y < from.y;
        
        // Create appropriate path based on connection type
        let pathD;
        
        if (isReason || isUpwardConnection) {
          // For reason connections (usually upward), use a curved path
          const controlX = (from.x + to.x) / 2;
          const controlY = isUpwardConnection ? 
            to.y - Math.abs(from.y - to.y) * 0.2 : 
            from.y - Math.abs(from.y - to.y) * 0.2;
          
          pathD = `M ${from.x},${from.y} Q ${controlX},${controlY} ${to.x},${to.y}`;
        } else {
          // For standard downward connections (vertical hierarchy), use a simple line
          pathD = `M ${from.x},${from.y} L ${to.x},${to.y}`;
        }
        
        // Determine connection style
        let strokeColor = isReason ? "#D97706" : "#4B5563";
        let arrowhead = isReason ? "url(#reason-arrowhead)" : "url(#arrowhead)";
        
        return (
          <g key={`${sourceId}-${targetId}-${idx}`}>
            {/* Shadow path */}
            <path
              d={pathD}
              fill="none"
              stroke="#111827"
              strokeWidth="3"
              strokeOpacity="0.5"
            />
            
            {/* Main path */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeOpacity="0.8"
              markerEnd={arrowhead}
              className="transition-all duration-300"
              strokeDasharray={isReason ? "5,5" : "none"}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default React.memo(GraphConnections);