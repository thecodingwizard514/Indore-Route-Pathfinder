import express from 'express';
import Station from '../models/Station.js';

const router = express.Router();

// GET /api/shortest-path?from=<id1>&to=<id2>
router.get('/', async (req, res) => {
  const { from, to } = req.query;

  // Validate inputs
  if (!from || !to) {
    return res.status(400).json({ 
      error: 'Both from and to station IDs are required.',
      example: '/api/shortest-path?from=station1&to=station2'
    });
  }

  try {
    // Get all stations with only necessary fields
    const stations = await Station.find({}, '_id connections');
    
    // Build adjacency list
    const graph = {};
    stations.forEach(station => {
      graph[station._id] = station.connections.map(conn => ({
        station: conn.station,
        distance: conn.distance,
        cost: conn.cost
      }));
    });

    // Validate station IDs exist in graph
    if (!graph[from] || !graph[to]) {
      return res.status(404).json({ 
        error: 'One or both station IDs not found',
        availableStations: Object.keys(graph)
      });
    }

    // Dijkstra's algorithm implementation
    const distances = {};
    const costs = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));

    // Initialize
    Object.keys(graph).forEach(id => {
      distances[id] = Infinity;
      costs[id] = Infinity;
      previous[id] = null;
    });
    
    distances[from] = 0;
    costs[from] = 0;

    while (unvisited.size > 0) {
      // Find node with smallest distance
      let current = null;
      let smallestDistance = Infinity;
      
      for (const node of unvisited) {
        if (distances[node] < smallestDistance) {
          smallestDistance = distances[node];
          current = node;
        }
      }

      // Exit conditions
      if (current === to || current === null) break;
      unvisited.delete(current);

      // Update neighbors
      for (const neighbor of graph[current]) {
        const altDistance = distances[current] + neighbor.distance;
        const altCost = costs[current] + neighbor.cost;
        
        if (altDistance < distances[neighbor.station]) {
          distances[neighbor.station] = altDistance;
          costs[neighbor.station] = altCost;
          previous[neighbor.station] = current;
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = to;
    
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    // Check if path exists
    if (distances[to] === Infinity) {
      return res.status(404).json({ 
        error: 'No path exists between these stations',
        possibleReasons: [
          'Stations are in disconnected networks',
          'All connections are one-way in the wrong direction'
        ]
      });
    }

    // Get detailed station information for path
    const detailedPath = await Station.find(
      { _id: { $in: path } },
      'name coordinates'
    ).sort({ _id: 1 });

    res.json({
      success: true,
      path: detailedPath,
      totalDistance: distances[to],
      totalCost: costs[to],
      steps: path.length - 1
    });

  } catch (error) {
    console.error('Shortest path error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;