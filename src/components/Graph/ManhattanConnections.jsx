import React from 'react';

const CIRCLE_RADIUS = 8; // Diameter is 16px (w-4 h-4 in Tailwind)
const ARROW_OFFSET = 6; // Distance to pull back arrow from endpoint

const calculateManhattanPath = (from, to) => {
  const verticalFirst = Math.abs(to.y - from.y) > Math.abs(to.x - from.x);
  let points = [];
  
  // Calculate the actual endpoint, pulling back by ARROW_OFFSET
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ratio = (length - ARROW_OFFSET) / length;
  
  const endX = from.x + dx * ratio;
  const endY = from.y + dy * ratio;
  
  if (verticalFirst) {
    const midY = from.y + (endY - from.y) / 2;
    points = [
      [from.x, from.y],    // Start from circle center
      [from.x, midY],      // Vertical segment
      [endX, midY],        // Horizontal segment
      [endX, endY]         // End slightly before target circle
    ];
  } else {
    const midX = from.x + (endX - from.x) / 2;
    points = [
      [from.x, from.y],    // Start from circle center
      [midX, from.y],      // Horizontal segment
      [midX, endY],        // Vertical segment
      [endX, endY]         // End slightly before target circle
    ];
  }
  
  return points;
};

const generatePathString = (points) => {
  return `M ${points[0][0]} ${points[0][1]} ` + 
         points.slice(1).map(point => `L ${point[0]} ${point[1]}`).join(' ');
};

const ManhattanConnections = ({ 
  connections = [], 
  scale = 1, 
  offset = { x: 0, y: 0 } 
}) => {
  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ 
        overflow: 'visible',
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        transformOrigin: '0 0'
      }}
    >
      <defs>
        <marker
          id="manhattan-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="0"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L6,3 L0,6"
            fill="#ec4899"
            stroke="none"
          />
        </marker>
      </defs>
      
      {connections.filter(conn => 
        conn?.from?.x != null && 
        conn?.from?.y != null && 
        conn?.to?.x != null && 
        conn?.to?.y != null
      ).map(({ from, to, sourceId, targetId, isReason }, idx) => {
        // Adjust positions for scale and offset
        const fromX = (from.x - offset.x) / scale;
        const fromY = (from.y - offset.y) / scale;
        const toX = (to.x - offset.x) / scale;
        const toY = (to.y - offset.y) / scale;

        // Calculate Manhattan path points
        const points = calculateManhattanPath(
          { x: fromX, y: fromY },
          { x: toX, y: toY }
        );

        // Generate SVG path string
        const pathString = generatePathString(points);

        return (
          <g key={`${sourceId}-${targetId}-${idx}`}>
            {/* Path shadow for better visibility */}
            <path
              d={pathString}
              fill="none"
              stroke="#262626"
              strokeWidth="2"
              className="transition-colors duration-300"
            />
            {/* Main path */}
            <path
              d={pathString}
              fill="none"
              stroke="#ec4899"
              strokeWidth="1"
              strokeOpacity="0.8"
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

export default ManhattanConnections;