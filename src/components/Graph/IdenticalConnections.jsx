const IdenticalConnections = ({ connections = [], scale = 1, offset = { x: 0, y: 0 } }) => (
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
        id="arrowhead"
        markerWidth="6"
        markerHeight="6"
        refX="6"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path
          d="M0,0 L6,3 L0,6"
          fill="none"
          stroke="#ec4899"
          strokeWidth="1"
        />
      </marker>
    </defs>
    {connections.filter(conn => 
      conn?.from?.x != null && 
      conn?.from?.y != null && 
      conn?.to?.x != null && 
      conn?.to?.y != null
    ).map(({ from, to, sourceId, targetId, isReason }, idx) => {
      // Adjust positions for scale
      const fromX = (from.x - offset.x) / scale;
      const fromY = (from.y - offset.y) / scale;
      const toX = (to.x - offset.x) / scale;
      const toY = (to.y - offset.y) / scale;

      const dx = toX - fromX;
      const dy = toY - fromY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Make curve more pronounced for longer distances
      const curveIntensity = Math.min(distance * 0.3, 100);
      
      // Calculate control points perpendicular to the line
      const angle = Math.atan2(dy, dx);
      const perpX = -Math.sin(angle) * curveIntensity;
      const perpY = Math.cos(angle) * curveIntensity;
      
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      const controlX = midX + perpX;
      const controlY = midY + perpY;

      // Calculate the point slightly before the target for the arrow
      const arrowOffset = 10;
      const stopX = toX - (dx * arrowOffset / distance);
      const stopY = toY - (dy * arrowOffset / distance);

      return (
        <g key={`${sourceId}-${targetId}-${idx}`}>
          {/* Path shadow for better visibility */}
          <path
            d={`M ${fromX} ${fromY} 
                Q ${controlX} ${controlY} ${stopX} ${stopY}`}
            fill="none"
            stroke="#262626"
            strokeWidth="3"
            className="transition-colors duration-300"
          />
          {/* Main path */}
          <path
            d={`M ${fromX} ${fromY} 
                Q ${controlX} ${controlY} ${stopX} ${stopY}`}
            fill="none"
            stroke="#ec4899"
            strokeWidth="1"
            strokeDasharray={isReason ? "none" : "4"}
            markerEnd="url(#arrowhead)"
            className="transition-colors duration-300"
          />
        </g>
      );
    })}
  </svg>
);

export default IdenticalConnections;