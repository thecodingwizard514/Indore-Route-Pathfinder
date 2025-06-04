import express from 'express';
import cors from 'cors';
import Station from '../models/Station.js';

const router = express.Router();

// Enable CORS with configuration
router.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Debug endpoint to check database connectivity
router.get('/debug', async (req, res) => {
  try {
    const stationCount = await Station.countDocuments();
    res.json({
      status: 'ok',
      dbConnected: true,
      stationCount,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      dbConnected: false,
      error: error.message
    });
  }
});

// GET /api/shortest-path?from=<id1>&to=<id2>
router.get('/', async (req, res) => {
  console.log('Shortest path request received:', req.query);
  
  // Set timeout (10 seconds)
  req.setTimeout(10000, () => {
    console.warn(`Timeout occurred for request: ${req.originalUrl}`);
    res.status(504).json({ 
      error: 'Request timeout',
      suggestion: 'The operation took too long. Try with closer stations.'
    });
  });

  const { from, to } = req.query;

  // Validate inputs
  if (!from || !to) {
    console.error('Missing parameters:', { from, to });
    return res.status(400).json({ 
      error: 'Both from and to station IDs are required.',
      example: '/api/shortest-path?from=station1&to=station2',
      received: { from, to }
    });
  }

  try {
    console.log('Fetching stations from database...');
    const stations = await Station.find({}, '_id name connections').lean();
    console.log(`Found ${stations.length} stations`);

    // Build adjacency list with additional validation
    const graph = {};
    const stationIds = new Set();
    
    stations.forEach(station => {
      stationIds.add(station._id.toString());
      graph[station._id] = station.connections.map(conn => ({
        station: conn.station,
        distance: conn.distance || 1,  // Default distance if missing
        cost: conn.cost || 1          // Default cost if missing
      }));
    });

    // Validate station IDs exist in graph
    if (!stationIds.has(from) || !stationIds.has(to)) {
      const missing = [];
      if (!stationIds.has(from)) missing.push(`from: ${from}`);
      if (!stationIds.has(to)) missing.push(`to: ${to}`);
      
      console.error('Station not found:', { missing, available: Array.from(stationIds) });
      return res.status(404).json({ 
        error: 'Station not found',
        missing,
        availableStations: Array.from(stationIds).slice(0, 50), // Show first 50 to avoid huge response
        suggestion: 'Check /api/stations for complete list'
      });
    }

    console.log(`Computing path from ${from} to ${to}...`);
    // Dijkstra's algorithm implementation (optimized)
    const distances = {};
    const costs = {};
    const previous = {};
    const unvisited = new Set(stationIds);

    // Initialize
    stationIds.forEach(id => {
      distances[id] = Infinity;
      costs[id] = Infinity;
      previous[id] = null;
    });
    
    distances[from] = 0;
    costs[from] = 0;

    while (unvisited.size > 0) {
      // Find node with smallest distance (optimized)
      let current = null;
      let smallestDistance = Infinity;
      
      for (const node of unvisited) {
        if (distances[node] < smallestDistance) {
          smallestDistance = distances[node];
          current = node;
        }
      }

      // Exit conditions
      if (current === to || current === null) {
        console.log(`Breaking at current=${current}`);
        break;
      }
      unvisited.delete(current);

      // Update neighbors with null checks
      const neighbors = graph[current] || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.station)) continue;
        
        const altDistance = distances[current] + (neighbor.distance || 1);
        const altCost = costs[current] + (neighbor.cost || 1);
        
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
      console.error('No path exists between:', { from, to });
      return res.status(404).json({ 
        error: 'No path exists between these stations',
        possibleReasons: [
          'Stations are in disconnected networks',
          'All connections are one-way in the wrong direction'
        ],
        suggestion: 'Try different station combinations'
      });
    }

    console.log(`Path found with ${path.length} steps`);
    // Get detailed station information for path (optimized)
    const detailedPath = stations.filter(station => 
      path.includes(station._id.toString())
    ).map(station => ({
      _id: station._id,
      name: station.name,
      coordinates: station.coordinates
    }));

    // Sort by path order
    detailedPath.sort((a, b) => 
      path.indexOf(a._id.toString()) - path.indexOf(b._id.toString())
    );

    res.json({
      success: true,
      path: detailedPath,
      totalDistance: distances[to],
      totalCost: costs[to],
      steps: path.length - 1,
      computationTime: `${process.uptime().toFixed(2)}s`
    });

  } catch (error) {
    console.error('Full error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'production' ? 'See server logs' : error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      suggestion: 'Try again later or contact support'
    });
  }
});

export default router;