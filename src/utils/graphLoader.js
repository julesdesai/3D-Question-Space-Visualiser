// src/utils/graphLoader.js
export const loadGraphManifest = async () => {
    try {
      const response = await fetch('/graphs/graph-manifest.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading graph manifest:', error);
      return { graphs: [] };
    }
  };
  
  export const loadGraphData = async (filename) => {
    try {
      const response = await fetch(`/graphs/${filename}`);
      return await response.json();
    } catch (error) {
      console.error('Error loading graph data:', error);
      return null;
    }
  };