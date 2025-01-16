// src/components/Graph/IdenticalConnections.jsx
const IdenticalConnections = ({ connections, isActive }) => (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="4"
          markerHeight="4"
          refX="0"
          refY="2"
          orient="auto"
        >
          <polygon
            points="0 0, 4 2, 0 4"
            className="fill-pink-400 transition-colors duration-300"
          />
        </marker>
      </defs>
      {connections.map(({ from, to }, idx) => {
        // Calculate control point for the curve
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offset = distance * 0.2;
  
        // Create control point perpendicular to the line
        const controlX = midX - dy * offset / distance;
        const controlY = midY + dx * offset / distance;
  
        // Calculate stop point slightly before the target
        const stopDistance = 12;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const stopX = to.x - (stopDistance * Math.cos(angle));
        const stopY = to.y - (stopDistance * Math.sin(angle));
  
        return (
          <path
            key={idx}
            d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${stopX} ${stopY}`}
            fill="none"
            stroke="#ec4899"
            strokeWidth="1"
            strokeDasharray="3"
            markerEnd="url(#arrowhead)"
            className="transition-colors duration-300"
          />
        );
      })}
    </svg>
  );
  
  export default IdenticalConnections;