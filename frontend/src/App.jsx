import React, { useEffect, useState } from "react";
import {
  getStations,
  createStation,
  connectStations,
  getShortestPath,
} from "./api";

export default function App() {
  const [stations, setStations] = useState([]);
  const [newStationName, setNewStationName] = useState("");
  const [firstStation, setFirstStation] = useState("");
  const [secondStation, setSecondStation] = useState("");
  const [distance, setDistance] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [shortestPath, setShortestPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  async function fetchStations() {
    const data = await getStations();
    setStations(data);
  }

  async function handleCreateStation(e) {
    e.preventDefault();
    if (!newStationName) return alert("Please enter station name");
    setLoading(true);
    await createStation(newStationName);
    setNewStationName("");
    await fetchStations();
    setLoading(false);
  }

  async function handleConnectStations(e) {
    e.preventDefault();
    if (!firstStation || !secondStation || !distance || !cost) {
      return alert("Please fill all fields to connect stations");
    }
    setLoading(true);
    await connectStations({
      firstStation,
      secondStation,
      distance: Number(distance),
      cost: Number(cost),
    });
    setFirstStation("");
    setSecondStation("");
    setDistance("");
    setCost("");
    await fetchStations();
    setLoading(false);
  }

 async function handleFindShortestPath(e) {
  e.preventDefault();
  if (!fromStation || !toStation) return alert("Please select both stations");

  setPathLoading(true);
  setShortestPath(null);
  
  try {
    const res = await getShortestPath(fromStation, toStation);
    
    if (!res.success) {
      throw new Error(res.error || 'No path found');
    }

    // Use pathDetails from response
    const readablePath = res.pathDetails.map(station => station.name);

    setShortestPath({
      ...res,
      readablePath,
      stationDetails: res.pathDetails // Store full station details
    });
  } catch (error) {
    console.error('Path finding error:', error);
    alert(error.message || 'Failed to find path');
  } finally {
    setPathLoading(false);
  }
}

  const cardStyle = {
    background: "#ffffffdd",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "30px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    border: "1px solid #ddd",
  };

  const buttonStyle = {
    background: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "bold",
  };

  const headingStyle = {
    color: "#0056b3",
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: 20,
        background: "linear-gradient(to bottom right, #e0f7fa, #f1f8e9)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          marginBottom: 40,
          color: "#006064",
        }}
      >
        Indore Metro Network
      </h1>

      {/* 🧭 Shortest Path Section */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>🧭 Find Shortest Path</h2>
        <form onSubmit={handleFindShortestPath} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <select
            value={fromStation}
            onChange={(e) => setFromStation(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 6 }}
          >
            <option value="">From Station</option>
            {stations.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          <select
            value={toStation}
            onChange={(e) => setToStation(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 6 }}
          >
            <option value="">To Station</option>
            {stations.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          <button type="submit" style={buttonStyle} disabled={pathLoading}>Find</button>
        </form>

        {shortestPath && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: "#004d40" }}>✅ Shortest Path</h3>
            <p><strong>Stations:</strong> {shortestPath.readablePath.join(" → ")}</p>
            <p><strong>Total Distance:</strong> {shortestPath.totalDistance} km</p>
            <p><strong>Total Cost:</strong> ₹{shortestPath.totalCost}</p>
          </div>
        )}
      </section>

      {/* 🚉 Create Station */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>🚉 Create Station</h2>
        <form onSubmit={handleCreateStation} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Station name"
            value={newStationName}
            onChange={(e) => setNewStationName(e.target.value)}
            disabled={loading}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>Add</button>
        </form>
      </section>

      {/* 🔗 Connect Stations */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>🔗 Connect Stations</h2>
        <form onSubmit={handleConnectStations} style={{ display: "grid", gap: 10 }}>
          <div>
            <label>Select first station: </label>
            <select
              value={firstStation}
              onChange={(e) => setFirstStation(e.target.value)}
              disabled={loading}
              style={{ padding: 8, borderRadius: 6, width: "100%" }}
            >
              <option value="">-- Select --</option>
              {stations.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Select second station: </label>
            <select
              value={secondStation}
              onChange={(e) => setSecondStation(e.target.value)}
              disabled={loading}
              style={{ padding: 8, borderRadius: 6, width: "100%" }}
            >
              <option value="">-- Select --</option>
              {stations.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <input
            type="number"
            placeholder="Distance (km)"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
          />
          <input
            type="number"
            placeholder="Cost (₹)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>Connect</button>
        </form>
      </section>

      {/* 📋 Station List */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>📋 Stations</h2>
        {stations.length === 0 ? (
          <p>No stations created yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {stations.map((station) => (
              <li key={station._id} style={{ marginBottom: 20 }}>
                <strong style={{ color: "#004d40" }}>{station.name}</strong>
                {station.connections?.length > 0 ? (
                  <ul>
                    {station.connections.map((conn, idx) => (
                      <li key={idx}>
                        ➝ <strong>{conn.station?.name || "Unknown"}</strong> | {conn.distance} km | ₹{conn.cost}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ marginLeft: 20, color: "#777" }}>No connections</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
