import express from 'express';
import Station from '../models/Station.js';

const router = express.Router();

// GET /api/shortest-path?from=<id1>&to=<id2>
router.get('/', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Both from and to station IDs are required.' });
  }

  try {
    const stations = await Station.find({});
    const graph = {};

    // Build adjacency list with distance and cost
    stations.forEach((station) => {
      graph[station._id.toString()] = station.connections.map((conn) => ({
        node: conn.station.toString(),
        distance: conn.distance,
        cost: conn.cost,
      }));
    });

    // Dijkstra’s algorithm
    const distances = {};
    const costs = {};
    const prev = {};
    const visited = new Set();
    const queue = new Set();

    Object.keys(graph).forEach((key) => {
      distances[key] = Infinity;
      costs[key] = Infinity;
      prev[key] = null;
      queue.add(key);
    });

    distances[from] = 0;
    costs[from] = 0;

    while (queue.size > 0) {
      let current = [...queue].reduce((minNode, node) =>
        distances[node] < distances[minNode] ? node : minNode
      );

      if (current === to) break;
      queue.delete(current);
      visited.add(current);

      for (const neighbor of graph[current]) {
        if (visited.has(neighbor.node)) continue;

        const newDist = distances[current] + neighbor.distance;
        const newCost = costs[current] + neighbor.cost;

        if (newDist < distances[neighbor.node]) {
          distances[neighbor.node] = newDist;
          costs[neighbor.node] = newCost;
          prev[neighbor.node] = current;
        }
      }
    }

    // Build path
    const path = [];
    let curr = to;
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    if (distances[to] === Infinity) {
      return res.status(404).json({ error: 'No path found between stations.' });
    }

    res.json({
      from,
      to,
      path,
      totalDistance: distances[to],
      totalCost: costs[to], // ✅ now included
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error calculating shortest path' });
  }
});

export default router;
