const IdenticalConnections = ({ connections = [] }) => (
  <svg 
    className="absolute inset-0 pointer-events-none" 
    style={{ 
      overflow: 'visible',
      width: '100%',
      height: '100%'
    }}
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="3"
        orient="auto"
      >
        <polygon
          points="0 0, 6 3, 0 6"
          fill="#ec4899"
          className="transition-colors duration-300"
        />
      </marker>
    </defs>
    {connections.filter(conn => 
      conn?.from?.x != null && 
      conn?.from?.y != null && 
      conn?.to?.x != null && 
      conn?.to?.y != null
    ).map(({ from, to, sourceId, targetId }, idx) => {
      // Calculate curve control points
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Make curve more pronounced for longer distances
      const curveIntensity = Math.min(distance * 0.5, 200);
      
      // Calculate control points for a more pronounced curve
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      
      // Create control points perpendicular to the line
      const controlX = midX - dy * curveIntensity / distance;
      const controlY = midY + dx * curveIntensity / distance;

      return (
        <g key={`${sourceId}-${targetId}-${idx}`}>
          {/* Draw path shadow for better visibility */}
          <path
            d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
            fill="none"
            stroke="#262626"
            strokeWidth="3"
            className="transition-colors duration-300"
          />
          {/* Main path */}
          <path
            d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
            fill="none"
            stroke="#ec4899"
            strokeWidth="1.5"
            strokeDasharray="4"
            markerEnd="url(#arrowhead)"
            className="transition-colors duration-300"
          />
        </g>
      );
    })}
  </svg>
);

export default IdenticalConnections;