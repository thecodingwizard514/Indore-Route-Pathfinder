// api.js
import axios from "axios";

const BASE_URL = "http://localhost:5000/api"; // Note the /api here

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
