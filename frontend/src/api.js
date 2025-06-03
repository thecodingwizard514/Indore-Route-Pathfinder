// src/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getStations() {
  const res = await axios.get(`${BASE_URL}/stations`);
  return res.data;
}

export async function createStation(name) {
  const res = await axios.post(`${BASE_URL}/stations`, { name });
  return res.data;
}

export async function connectStations({ firstStation, secondStation, distance, cost }) {
  const res = await axios.post(`${BASE_URL}/stations/connect`, {
    firstStation,
    secondStation,
    distance,
    cost,
  });
  return res.data;
}
