import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import stationRoutes from './routes/stationRoutes.js';
import shortestPathRoutes from './routes/shortestPath.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  "https://indore-metro.vercel.app",
  "http://localhost:3000",
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true  
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Indore Metro Backend is running 🚆');
});

// MongoDB Connection (updated without deprecated options)
mongoose.set('strictQuery', true); // Optional: suppresses Mongoose deprecation warning

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/stations', stationRoutes);
app.use('/api/shortest-path', shortestPathRoutes);

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});