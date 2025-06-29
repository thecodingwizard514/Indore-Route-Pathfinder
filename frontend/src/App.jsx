import React, { useEffect, useState } from "react";
import {
  getStations,
  createStation,
  connectStations,
  getShortestPath,
} from "./api";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [firstLocation, setFirstLocation] = useState("");
  const [secondLocation, setSecondLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [shortestPath, setShortestPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    const data = await getStations();
    setLocations(data);
  }

  async function handleCreateLocation(e) {
    e.preventDefault();
    if (!newLocationName) return alert("Please enter location name");
    setLoading(true);
    await createStation(newLocationName);
    setNewLocationName("");
    await fetchLocations();
    setLoading(false);
  }

  async function handleConnectLocations(e) {
    e.preventDefault();
    if (!firstLocation || !secondLocation || !distance || !cost) {
      return alert("Please fill all fields to connect locations");
    }
    setLoading(true);
    await connectStations({
      firstStation: firstLocation,
      secondStation: secondLocation,
      distance: Number(distance),
      cost: Number(cost),
    });
    setFirstLocation("");
    setSecondLocation("");
    setDistance("");
    setCost("");
    await fetchLocations();
    setLoading(false);
  }

  async function handleFindShortestPath(e) {
    e.preventDefault();
    if (!fromLocation || !toLocation) return alert("Please select both locations");

    setPathLoading(true);
    setShortestPath(null);

    try {
      const res = await getShortestPath(fromLocation, toLocation);

      if (!res.success) {
        throw new Error(res.error || 'No path found');
      }

      const readablePath = res.pathDetails.map(loc => loc.name);

      setShortestPath({
        ...res,
        readablePath,
        locationDetails: res.pathDetails
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
        Indore Route Pathfinder
      </h1>

      {/* 🧭 Shortest Path Section */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>🧭 Find Best Route</h2>
        <form onSubmit={handleFindShortestPath} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <select
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 6 }}
          >
            <option value="">From Location</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>

          <select
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 6 }}
          >
            <option value="">To Location</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>

          <button type="submit" style={buttonStyle} disabled={pathLoading}>Find</button>
        </form>

        {shortestPath && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: "#004d40" }}>✅ Best Route</h3>
            <p><strong>Path:</strong> {shortestPath.readablePath.join(" → ")}</p>
            <p><strong>Total Distance:</strong> {shortestPath.totalDistance} km</p>
            <p><strong>Total Cost:</strong> ₹{shortestPath.totalCost}</p>
          </div>
        )}
      </section>

      {/* 📍 Add Location */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>📍 Add Location</h2>
        <form onSubmit={handleCreateLocation} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Location name"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            disabled={loading}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>Add</button>
        </form>
      </section>

      {/* 🔗 Connect Locations */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>🔗 Connect Locations</h2>
        <form onSubmit={handleConnectLocations} style={{ display: "grid", gap: 10 }}>
          <div>
            <label>Select first location: </label>
            <select
              value={firstLocation}
              onChange={(e) => setFirstLocation(e.target.value)}
              disabled={loading}
              style={{ padding: 8, borderRadius: 6, width: "100%" }}
            >
              <option value="">-- Select --</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Select second location: </label>
            <select
              value={secondLocation}
              onChange={(e) => setSecondLocation(e.target.value)}
              disabled={loading}
              style={{ padding: 8, borderRadius: 6, width: "100%" }}
            >
              <option value="">-- Select --</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
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

      {/* 📋 Location List */}
      <section style={cardStyle}>
        <h2 style={headingStyle}>📋 Locations</h2>
        {locations.length === 0 ? (
          <p>No locations added yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {locations.map((location) => (
              <li key={location._id} style={{ marginBottom: 20 }}>
                <strong style={{ color: "#004d40" }}>{location.name}</strong>
                {location.connections?.length > 0 ? (
                  <ul>
                    {location.connections.map((conn, idx) => (
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
