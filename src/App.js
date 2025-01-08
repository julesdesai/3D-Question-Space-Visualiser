// src/App.js
import React, { useState, useEffect } from 'react';
import Graph from './components/Graph/Graph';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGraphData = async () => {
      try {
        // Get the base URL for the current environment
        const baseUrl = process.env.PUBLIC_URL || '';
        const response = await fetch(`${baseUrl}/graph.json`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGraphData(data);
      } catch (err) {
        console.error('Error loading graph data:', err);
        setError(`Failed to load graph data. Error: ${err.message}`);
      }
    };

    loadGraphData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 font-semibold mb-2">Error Loading Graph</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600 flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading graph data...
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Graph data={graphData} />
    </div>
  );
}

export default App;