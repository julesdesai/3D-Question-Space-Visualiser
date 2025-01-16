// src/App.js
import React, { useState, useEffect } from 'react';
import Graph from './components/Graph/Graph';
import './styles/App.css';

function App() {
  const [graphs, setGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Get the base URL dynamically
  const baseUrl = process.env.PUBLIC_URL || '/3D-Question-Space-Visualiser';

  // Load list of available graphs
  useEffect(() => {
    const loadGraphs = async () => {
      try {
        console.log('Loading from base URL:', baseUrl);
        const manifestResponse = await fetch(`${baseUrl}/graphs/graph-manifest.json`);
        
        if (!manifestResponse.ok) {
          throw new Error(`Manifest HTTP error! status: ${manifestResponse.status}`);
        }

        const manifestData = await manifestResponse.json();
        console.log('Loaded manifest:', manifestData);

        setGraphs(manifestData.graphs);
        if (manifestData.graphs.length > 0) {
          setSelectedGraph(manifestData.graphs[0].filename);
        }
      } catch (err) {
        console.error('Error loading graph list:', err);
        setError(`Failed to load graph list. Error: ${err.message}`);
      }
    };

    loadGraphs();
  }, [baseUrl]);

  // Load selected graph data
  useEffect(() => {
    const loadGraphData = async () => {
      if (!selectedGraph) return;
      
      setLoading(true);
      try {
        console.log('Loading graph:', selectedGraph);
        const graphResponse = await fetch(`${baseUrl}/graphs/${selectedGraph}`);
        
        if (!graphResponse.ok) {
          throw new Error(`Graph data HTTP error! status: ${graphResponse.status}`);
        }

        const data = await graphResponse.json();
        console.log('Successfully loaded graph data:', data);
        
        setGraphData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading graph data:', err);
        setError(`Failed to load graph data. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadGraphData();
  }, [selectedGraph, baseUrl]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!graphData || !selectedNode) return;

      const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'c', 'C'];
      
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();

        const currentId = Object.entries(graphData)
          .find(([_, n]) => n === selectedNode)?.[0];

        if (!currentId) return;

        let nextId = null;

        switch (e.key) {
          case 'ArrowUp': {
            const parent = graphData[currentId]?.parent_id;
            if (parent) {
              nextId = parent;
            }
            break;
          }
          case 'ArrowDown': {
            const children = Object.entries(graphData)
              .filter(([_, n]) => n.parent_id === currentId)
              .map(([id]) => id);
            if (children.length > 0) {
              nextId = children[0];
            }
            break;
          }
          case 'ArrowLeft':
          case 'ArrowRight': {
            const siblings = Object.entries(graphData)
              .filter(([_, n]) => n.parent_id === graphData[currentId]?.parent_id)
              .map(([id]) => id);
            const currentIndex = siblings.indexOf(currentId);
            if (currentIndex !== -1) {
              const newIndex = e.key === 'ArrowLeft'
                ? (currentIndex - 1 + siblings.length) % siblings.length
                : (currentIndex + 1) % siblings.length;
              nextId = siblings[newIndex];
            }
            break;
          }
          case 'c':
          case 'C': {
            const rootNode = Object.entries(graphData)
              .find(([_, n]) => n.parent_id === null);
            if (rootNode) {
              nextId = rootNode[0];
            }
            break;
          }
          default:
            break;
        }

        if (nextId) {
          setSelectedNode(graphData[nextId]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [graphData, selectedNode]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717]">
      {/* Graph selector */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex flex-col space-y-2 max-w-xl mx-auto">
          <select 
            value={selectedGraph || ''} 
            onChange={(e) => setSelectedGraph(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-md border border-gray-700 
                      hover:border-gray-600 focus:border-pink-500 focus:outline-none
                      transition-colors duration-200"
            style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
          >
            <option value="" disabled>Select a graph...</option>
            {graphs.map((graph) => (
              <option key={graph.id} value={graph.filename}>
                {graph.name}
              </option>
            ))}
          </select>
          
          {selectedGraph && (
            <div 
              className="text-gray-400 text-sm px-1"
              style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
            >
              {graphs.find(g => g.filename === selectedGraph)?.description}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-gray-400 flex items-center">
            <div>Loading graph data...</div>
            <svg className="animate-spin h-5 w-5 ml-3" viewBox="0 0 24 24">
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
          </div>
        </div>
      ) : (
        graphData && (
          <Graph 
            data={graphData} 
            onNodeSelect={setSelectedNode}
          />
        )
      )}
    </div>
  );
}

export default App;