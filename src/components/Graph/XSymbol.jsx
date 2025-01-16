// src/components/Graph/XSymbol.jsx
const XSymbol = ({ isActive }) => (
    <svg className="w-4 h-4 node-circle" viewBox="0 0 16 16">
      <line 
        x1="4" y1="4" 
        x2="12" y2="12" 
        stroke={isActive ? '#ec4899' : '#4b5563'} 
        strokeWidth="2"
        className="transition-colors duration-300"
      />
      <line 
        x1="12" y1="4" 
        x2="4" y2="12" 
        stroke={isActive ? '#ec4899' : '#4b5563'} 
        strokeWidth="2"
        className="transition-colors duration-300"
      />
    </svg>
  );
  
  export default XSymbol;